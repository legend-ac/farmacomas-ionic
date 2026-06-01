export interface Medicine {
  id: number;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  district: string;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  medicineId: number;
  medicineName: string;
  quantity: number;
  status: 'Pendiente' | 'Entregado';
  createdAt: string;
}

export interface AppData {
  medicines: Medicine[];
  customers: Customer[];
  orders: Order[];
}
