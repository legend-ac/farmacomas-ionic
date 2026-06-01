import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
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
  clienteNombre: string;
  medicamentoNombre: string;
  cantidad: number;
  estado: 'Pendiente' | 'Entregado';
  creadoEn: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  private readonly db: Firestore;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.db = getFirestore(app);
  }

  async testConnection(): Promise<void> {
    await getDocs(query(collection(this.db, 'medicamentos'), limit(1)));
  }

  async getMedicines(): Promise<Medicine[]> {
    const snapshot = await getDocs(collection(this.db, 'medicamentos'));

    return snapshot.docs.map((item) => {
      const data = item.data() as FirestoreMedicine;

      return {
        id: Number(item.id) || Date.now(),
        name: data.nombre,
        category: data.categoria,
        stock: data.stockActual,
        minStock: data.stockMinimo,
        price: data.precioVenta,
      };
    });
  }

  async getCustomers(): Promise<Customer[]> {
    const snapshot = await getDocs(collection(this.db, 'clientes'));

    return snapshot.docs.map((item) => {
      const data = item.data() as FirestoreCustomer;

      return {
        id: Number(item.id) || Date.now(),
        name: data.nombre,
        phone: data.telefono,
        district: data.direccion,
      };
    });
  }

  async getOrders(): Promise<Order[]> {
    const snapshot = await getDocs(collection(this.db, 'pedidos'));

    return snapshot.docs.map((item) => {
      const data = item.data() as FirestoreOrder;

      return {
        id: Number(item.id) || Date.now(),
        customerName: data.clienteNombre,
        medicineName: data.medicamentoNombre,
        quantity: data.cantidad,
        status: data.estado,
        createdAt: data.creadoEn,
      };
    });
  }

  async saveMedicine(medicine: Medicine): Promise<void> {
    await setDoc(doc(this.db, 'medicamentos', String(medicine.id)), this.toFirestoreMedicine(medicine));
  }

  async saveCustomer(customer: Customer): Promise<void> {
    await setDoc(doc(this.db, 'clientes', String(customer.id)), this.toFirestoreCustomer(customer));
  }

  async saveOrder(order: Order): Promise<void> {
    await setDoc(doc(this.db, 'pedidos', String(order.id)), this.toFirestoreOrder(order));
  }

  async deleteMedicine(medicineId: number): Promise<void> {
    await deleteDoc(doc(this.db, 'medicamentos', String(medicineId)));
  }

  async deleteCustomer(customerId: number): Promise<void> {
    await deleteDoc(doc(this.db, 'clientes', String(customerId)));
  }

  async deleteOrder(orderId: number): Promise<void> {
    await deleteDoc(doc(this.db, 'pedidos', String(orderId)));
  }

  async loadAll(): Promise<AppData> {
    const [medicines, customers, orders] = await Promise.all([
      this.getMedicines(),
      this.getCustomers(),
      this.getOrders(),
    ]);

    return { medicines, customers, orders };
  }

  async syncAll(medicines: Medicine[], customers: Customer[], orders: Order[]): Promise<void> {
    const batch = writeBatch(this.db);

    medicines.forEach((medicine) => {
      batch.set(doc(this.db, 'medicamentos', String(medicine.id)), this.toFirestoreMedicine(medicine));
    });

    customers.forEach((customer) => {
      batch.set(doc(this.db, 'clientes', String(customer.id)), this.toFirestoreCustomer(customer));
    });

    orders.forEach((order) => {
      batch.set(doc(this.db, 'pedidos', String(order.id)), this.toFirestoreOrder(order));
    });

    await batch.commit();
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
      clienteNombre: order.customerName,
      medicamentoNombre: order.medicineName,
      cantidad: order.quantity,
      estado: order.status,
      creadoEn: order.createdAt,
    };
  }
}
