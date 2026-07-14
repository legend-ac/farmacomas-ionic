import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import type { AppData, Customer, Medicine, Order, Supplier, UnitType, PaymentMethod, OrderStatus } from '../core/models';

// ─────────────────────────────────────────────────────────────────
//  Firestore document interfaces
// ─────────────────────────────────────────────────────────────────
interface FirestoreMedicine {
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  precioVenta: number;
  laboratorio: string;
  codigoBarras?: string;
  fechaVencimiento: string;
  tipoUnidad: string;
  requiereReceta: boolean;
  descripcion?: string;
  actualizadoEn: string;
}

interface FirestoreCustomer {
  nombre: string;
  telefono: string;
  direccion: string;
  email?: string;
  domicilio?: string;
  fechaNacimiento?: string;
  puntosFidelidad: number;
  totalPedidos: number;
  creadoEn: string;
}

interface FirestoreOrder {
  clienteId: number;
  clienteNombre: string;
  medicamentoId: number;
  medicamentoNombre: string;
  cantidad: number;
  estado: string;
  creadoEn: string;
  precioTotal: number;
  metodoPago: string;
  notas?: string;
  entregadoEn?: string;
}

interface FirestoreSupplier {
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
  categoria: string;
  creadoEn: string;
}

type CollectionName = 'medicamentos' | 'clientes' | 'pedidos' | 'proveedores';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  private readonly app: FirebaseApp;
  private readonly db: Firestore;
  private userId: string | null = null;

  constructor() {
    this.app = getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  async testConnection(): Promise<void> {
    await getDocs(query(this.collectionRef('medicamentos')));
  }

  // ─── Getters ───────────────────────────────────────────────────

  async getMedicines(): Promise<Medicine[]> {
    const snapshot = await getDocs(this.collectionRef('medicamentos'));
    return snapshot.docs.map((item) => this.fromFirestoreMedicine(item.id, item.data() as FirestoreMedicine));
  }

  async getCustomers(): Promise<Customer[]> {
    const snapshot = await getDocs(this.collectionRef('clientes'));
    return snapshot.docs.map((item) => this.fromFirestoreCustomer(item.id, item.data() as FirestoreCustomer));
  }

  async getOrders(): Promise<Order[]> {
    const snapshot = await getDocs(this.collectionRef('pedidos'));
    return snapshot.docs
      .map((item) => this.fromFirestoreOrder(item.id, item.data() as FirestoreOrder))
      .sort((a, b) => b.id - a.id);
  }

  async getSuppliers(): Promise<Supplier[]> {
    const snapshot = await getDocs(this.collectionRef('proveedores'));
    return snapshot.docs.map((item) => this.fromFirestoreSupplier(item.id, item.data() as FirestoreSupplier));
  }

  // ─── Save ──────────────────────────────────────────────────────

  async saveMedicine(medicine: Medicine): Promise<void> {
    await setDoc(this.docRef('medicamentos', medicine.id), this.toFirestoreMedicine(medicine));
  }

  async saveCustomer(customer: Customer): Promise<void> {
    await setDoc(this.docRef('clientes', customer.id), this.toFirestoreCustomer(customer));
  }

  async saveOrder(order: Order): Promise<void> {
    await setDoc(this.docRef('pedidos', order.id), this.toFirestoreOrder(order));
  }

  async saveSupplier(supplier: Supplier): Promise<void> {
    await setDoc(this.docRef('proveedores', supplier.id), this.toFirestoreSupplier(supplier));
  }

  // ─── Delete ────────────────────────────────────────────────────

  async deleteMedicine(medicineId: number): Promise<void> {
    await deleteDoc(this.docRef('medicamentos', medicineId));
  }

  async deleteCustomer(customerId: number): Promise<void> {
    await deleteDoc(this.docRef('clientes', customerId));
  }

  async deleteOrder(orderId: number): Promise<void> {
    await deleteDoc(this.docRef('pedidos', orderId));
  }

  async deleteSupplier(supplierId: number): Promise<void> {
    await deleteDoc(this.docRef('proveedores', supplierId));
  }

  // ─── Batch / Compound ──────────────────────────────────────────

  async loadAll(): Promise<AppData> {
    const [medicines, customers, orders, suppliers] = await Promise.all([
      this.getMedicines(),
      this.getCustomers(),
      this.getOrders(),
      this.getSuppliers(),
    ]);
    return { medicines, customers, orders, suppliers };
  }

  async saveOrderAndUpdateStock(order: Order, medicine: Medicine): Promise<void> {
    const batch = writeBatch(this.db);
    batch.set(this.docRef('pedidos', order.id), this.toFirestoreOrder(order));
    batch.set(this.docRef('medicamentos', medicine.id), this.toFirestoreMedicine(medicine));
    await batch.commit();
  }

  async syncAll(medicines: Medicine[], customers: Customer[], orders: Order[], suppliers: Supplier[]): Promise<void> {
    // Firestore batch limit is 500 writes — chunk if needed
    const allWrites: (() => void)[] = [];
    const batches: ReturnType<typeof writeBatch>[] = [];
    let currentBatch = writeBatch(this.db);
    let count = 0;

    const flushBatch = () => {
      batches.push(currentBatch);
      currentBatch = writeBatch(this.db);
      count = 0;
    };

    const addWrite = (ref: Parameters<ReturnType<typeof writeBatch>['set']>[0], data: object) => {
      currentBatch.set(ref, data);
      count++;
      if (count >= 490) flushBatch();
    };

    medicines.forEach((m) => addWrite(this.docRef('medicamentos', m.id), this.toFirestoreMedicine(m)));
    customers.forEach((c) => addWrite(this.docRef('clientes', c.id), this.toFirestoreCustomer(c)));
    orders.forEach((o) => addWrite(this.docRef('pedidos', o.id), this.toFirestoreOrder(o)));
    suppliers.forEach((s) => addWrite(this.docRef('proveedores', s.id), this.toFirestoreSupplier(s)));

    if (count > 0) batches.push(currentBatch);
    await Promise.all(batches.map((b) => b.commit()));
    void allWrites;
  }

  /**
   * Seed initial data only if all collections are empty.
   * Returns true if seed was applied.
   */
  async seedIfEmpty(data: AppData): Promise<boolean> {
    const [medSnap, cusSnap] = await Promise.all([
      getDocs(query(this.collectionRef('medicamentos'))),
      getDocs(query(this.collectionRef('clientes'))),
    ]);

    if (medSnap.size > 0 || cusSnap.size > 0) {
      return false; // Already has data
    }

    await this.syncAll(data.medicines, data.customers, data.orders, data.suppliers);
    return true;
  }

  subscribeToUserData(onData: (data: AppData) => void, onError: () => void): Unsubscribe {
    const current: AppData = { medicines: [], customers: [], orders: [], suppliers: [] };

    const emit = () => {
      onData({
        medicines: [...current.medicines],
        customers: [...current.customers],
        orders: [...current.orders].sort((a, b) => b.id - a.id),
        suppliers: [...current.suppliers],
      });
    };

    const unsubscribers = [
      onSnapshot(
        this.collectionRef('medicamentos'),
        (snapshot) => {
          current.medicines = snapshot.docs.map((item) =>
            this.fromFirestoreMedicine(item.id, item.data() as FirestoreMedicine)
          );
          emit();
        },
        onError
      ),
      onSnapshot(
        this.collectionRef('clientes'),
        (snapshot) => {
          current.customers = snapshot.docs.map((item) =>
            this.fromFirestoreCustomer(item.id, item.data() as FirestoreCustomer)
          );
          emit();
        },
        onError
      ),
      onSnapshot(
        this.collectionRef('pedidos'),
        (snapshot) => {
          current.orders = snapshot.docs.map((item) =>
            this.fromFirestoreOrder(item.id, item.data() as FirestoreOrder)
          );
          emit();
        },
        onError
      ),
      onSnapshot(
        this.collectionRef('proveedores'),
        (snapshot) => {
          current.suppliers = snapshot.docs.map((item) =>
            this.fromFirestoreSupplier(item.id, item.data() as FirestoreSupplier)
          );
          emit();
        },
        onError
      ),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ─── Private helpers ───────────────────────────────────────────

  private collectionRef(name: CollectionName) {
    return collection(this.db, 'usuarios', this.requireUserId(), name);
  }

  private docRef(name: CollectionName, id: number) {
    return doc(this.db, 'usuarios', this.requireUserId(), name, String(id));
  }

  private requireUserId(): string {
    if (!this.userId) {
      throw new Error('No hay usuario autenticado.');
    }
    return this.userId;
  }

  // ─── Mappers: From Firestore ───────────────────────────────────

  private fromFirestoreMedicine(id: string, data: FirestoreMedicine): Medicine {
    return {
      id: Number(id),
      name: data.nombre ?? 'Sin nombre',
      category: data.categoria ?? 'General',
      stock: Number(data.stockActual ?? 0),
      minStock: Number(data.stockMinimo ?? 0),
      price: Number(data.precioVenta ?? 0),
      laboratoryName: data.laboratorio ?? 'Sin laboratorio',
      barcode: data.codigoBarras,
      expiryDate: data.fechaVencimiento ?? '',
      unitType: (data.tipoUnidad as UnitType) ?? 'tableta',
      requiresPrescription: Boolean(data.requiereReceta ?? false),
      description: data.descripcion,
    };
  }

  private fromFirestoreCustomer(id: string, data: FirestoreCustomer): Customer {
    return {
      id: Number(id),
      name: data.nombre ?? 'Sin nombre',
      phone: data.telefono ?? '',
      district: data.direccion ?? '',
      email: data.email,
      address: data.domicilio,
      birthDate: data.fechaNacimiento,
      loyaltyPoints: Number(data.puntosFidelidad ?? 0),
      totalOrders: Number(data.totalPedidos ?? 0),
      registeredAt: data.creadoEn ?? new Date().toISOString().slice(0, 10),
    };
  }

  private fromFirestoreOrder(id: string, data: FirestoreOrder): Order {
    return {
      id: Number(id),
      customerId: Number(data.clienteId ?? 0),
      customerName: data.clienteNombre ?? 'Cliente',
      medicineId: Number(data.medicamentoId ?? 0),
      medicineName: data.medicamentoNombre ?? 'Medicamento',
      quantity: Number(data.cantidad ?? 1),
      status: (data.estado as OrderStatus) === 'Entregado' ? 'Entregado' : (data.estado as OrderStatus) === 'Cancelado' ? 'Cancelado' : 'Pendiente',
      createdAt: data.creadoEn ?? new Date().toISOString().slice(0, 10),
      totalPrice: Number(data.precioTotal ?? 0),
      paymentMethod: (data.metodoPago as PaymentMethod) ?? 'efectivo',
      notes: data.notas,
      deliveredAt: data.entregadoEn,
    };
  }

  private fromFirestoreSupplier(id: string, data: FirestoreSupplier): Supplier {
    return {
      id: Number(id),
      name: data.nombre ?? 'Sin nombre',
      contact: data.contacto ?? '',
      phone: data.telefono ?? '',
      email: data.correo ?? '',
      city: data.ciudad ?? '',
      category: data.categoria ?? 'General',
      registeredAt: data.creadoEn ?? new Date().toISOString().slice(0, 10),
    };
  }

  // ─── Mappers: To Firestore ─────────────────────────────────────

  private toFirestoreMedicine(medicine: Medicine): FirestoreMedicine {
    return {
      nombre: medicine.name,
      categoria: medicine.category,
      stockActual: medicine.stock,
      stockMinimo: medicine.minStock,
      precioVenta: medicine.price,
      laboratorio: medicine.laboratoryName,
      codigoBarras: medicine.barcode || '',
      fechaVencimiento: medicine.expiryDate,
      tipoUnidad: medicine.unitType,
      requiereReceta: medicine.requiresPrescription,
      descripcion: medicine.description || '',
      actualizadoEn: new Date().toISOString(),
    };
  }

  private toFirestoreCustomer(customer: Customer): FirestoreCustomer {
    return {
      nombre: customer.name,
      telefono: customer.phone,
      direccion: customer.district,
      email: customer.email || '',
      domicilio: customer.address || '',
      fechaNacimiento: customer.birthDate || '',
      puntosFidelidad: customer.loyaltyPoints,
      totalPedidos: customer.totalOrders,
      creadoEn: customer.registeredAt,
    };
  }

  private toFirestoreOrder(order: Order): FirestoreOrder {
    return {
      clienteId: order.customerId,
      clienteNombre: order.customerName,
      medicamentoId: order.medicineId,
      medicamentoNombre: order.medicineName,
      cantidad: order.quantity,
      estado: order.status,
      creadoEn: order.createdAt,
      precioTotal: order.totalPrice,
      metodoPago: order.paymentMethod,
      notas: order.notes || '',
      entregadoEn: order.deliveredAt || '',
    };
  }

  private toFirestoreSupplier(supplier: Supplier): FirestoreSupplier {
    return {
      nombre: supplier.name,
      contacto: supplier.contact,
      telefono: supplier.phone || '',
      correo: supplier.email || '',
      ciudad: supplier.city || '',
      categoria: supplier.category || '',
      creadoEn: supplier.registeredAt,
    };
  }
}
