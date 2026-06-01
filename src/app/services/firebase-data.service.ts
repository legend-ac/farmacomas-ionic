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
import type { AppData, Customer, Medicine, Order } from '../core/models';

interface FirestoreMedicine {
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  precioVenta: number;
  actualizadoEn: string;
}

interface FirestoreCustomer {
  nombre: string;
  telefono: string;
  direccion: string;
  creadoEn: string;
}

interface FirestoreOrder {
  clienteId: number;
  clienteNombre: string;
  medicamentoId: number;
  medicamentoNombre: string;
  cantidad: number;
  estado: 'Pendiente' | 'Entregado';
  creadoEn: string;
}

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

  async saveMedicine(medicine: Medicine): Promise<void> {
    await setDoc(this.docRef('medicamentos', medicine.id), this.toFirestoreMedicine(medicine));
  }

  async saveCustomer(customer: Customer): Promise<void> {
    await setDoc(this.docRef('clientes', customer.id), this.toFirestoreCustomer(customer));
  }

  async saveOrder(order: Order): Promise<void> {
    await setDoc(this.docRef('pedidos', order.id), this.toFirestoreOrder(order));
  }

  async deleteMedicine(medicineId: number): Promise<void> {
    await deleteDoc(this.docRef('medicamentos', medicineId));
  }

  async deleteCustomer(customerId: number): Promise<void> {
    await deleteDoc(this.docRef('clientes', customerId));
  }

  async deleteOrder(orderId: number): Promise<void> {
    await deleteDoc(this.docRef('pedidos', orderId));
  }

  async loadAll(): Promise<AppData> {
    const [medicines, customers, orders] = await Promise.all([
      this.getMedicines(),
      this.getCustomers(),
      this.getOrders(),
    ]);

    return { medicines, customers, orders };
  }

  async saveOrderAndUpdateStock(order: Order, medicine: Medicine): Promise<void> {
    const batch = writeBatch(this.db);
    batch.set(this.docRef('pedidos', order.id), this.toFirestoreOrder(order));
    batch.set(this.docRef('medicamentos', medicine.id), this.toFirestoreMedicine(medicine));
    await batch.commit();
  }

  async syncAll(medicines: Medicine[], customers: Customer[], orders: Order[]): Promise<void> {
    const batch = writeBatch(this.db);

    medicines.forEach((medicine) => {
      batch.set(this.docRef('medicamentos', medicine.id), this.toFirestoreMedicine(medicine));
    });

    customers.forEach((customer) => {
      batch.set(this.docRef('clientes', customer.id), this.toFirestoreCustomer(customer));
    });

    orders.forEach((order) => {
      batch.set(this.docRef('pedidos', order.id), this.toFirestoreOrder(order));
    });

    await batch.commit();
  }

  subscribeToUserData(onData: (data: AppData) => void, onError: () => void): Unsubscribe {
    const current: AppData = { medicines: [], customers: [], orders: [] };
    const emit = () => {
      onData({
        medicines: [...current.medicines],
        customers: [...current.customers],
        orders: [...current.orders].sort((a, b) => b.id - a.id),
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
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  private collectionRef(name: 'medicamentos' | 'clientes' | 'pedidos') {
    return collection(this.db, 'usuarios', this.requireUserId(), name);
  }

  private docRef(name: 'medicamentos' | 'clientes' | 'pedidos', id: number) {
    return doc(this.db, 'usuarios', this.requireUserId(), name, String(id));
  }

  private requireUserId(): string {
    if (!this.userId) {
      throw new Error('No hay usuario autenticado.');
    }

    return this.userId;
  }

  private fromFirestoreMedicine(id: string, data: FirestoreMedicine): Medicine {
    return {
      id: Number(id),
      name: data.nombre ?? 'Sin nombre',
      category: data.categoria ?? 'General',
      stock: Number(data.stockActual ?? 0),
      minStock: Number(data.stockMinimo ?? 0),
      price: Number(data.precioVenta ?? 0),
    };
  }

  private fromFirestoreCustomer(id: string, data: FirestoreCustomer): Customer {
    return {
      id: Number(id),
      name: data.nombre ?? 'Sin nombre',
      phone: data.telefono ?? '',
      district: data.direccion ?? '',
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
      status: data.estado === 'Entregado' ? 'Entregado' : 'Pendiente',
      createdAt: data.creadoEn ?? new Date().toISOString().slice(0, 10),
    };
  }

  private toFirestoreMedicine(medicine: Medicine): FirestoreMedicine {
    return {
      nombre: medicine.name,
      categoria: medicine.category,
      stockActual: medicine.stock,
      stockMinimo: medicine.minStock,
      precioVenta: medicine.price,
      actualizadoEn: new Date().toISOString(),
    };
  }

  private toFirestoreCustomer(customer: Customer): FirestoreCustomer {
    return {
      nombre: customer.name,
      telefono: customer.phone,
      direccion: customer.district,
      creadoEn: new Date().toISOString(),
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
    };
  }
}
