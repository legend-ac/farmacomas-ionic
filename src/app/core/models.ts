export type UnitType = 'tableta' | 'cápsula' | 'frasco' | 'ampolla' | 'crema' | 'jarabe' | 'solución' | 'sobre';
export type PaymentMethod = 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';
export type OrderStatus = 'Pendiente' | 'Entregado' | 'Cancelado';

export interface Medicine {
  id: number;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  // Campos enriquecidos
  laboratoryName: string;
  barcode?: string;
  expiryDate: string;       // ISO date YYYY-MM-DD
  unitType: UnitType;
  requiresPrescription: boolean;
  description?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  district: string;
  // Campos enriquecidos
  email?: string;
  address?: string;
  birthDate?: string;
  loyaltyPoints: number;
  totalOrders: number;
  registeredAt: string;     // ISO date
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  medicineId: number;
  medicineName: string;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
  // Campos enriquecidos
  totalPrice: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  deliveredAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  category: string;         // e.g. "Antibióticos", "Vitaminas", "General"
  registeredAt: string;
}

export interface AppData {
  medicines: Medicine[];
  customers: Customer[];
  orders: Order[];
  suppliers: Supplier[];
}
