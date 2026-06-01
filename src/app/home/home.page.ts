import { Component } from '@angular/core';
import { AppData, Customer, Medicine, Order } from '../core/models';
import { FirebaseDataService } from '../services/firebase-data.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  selectedSegment: 'dashboard' | 'inventory' | 'customers' | 'orders' = 'dashboard';
  firebaseStatus = 'Conectando con Firebase...';
  actionMessage = 'Sistema listo para registrar operaciones.';
  editingMedicineId: number | null = null;
  editingCustomerId: number | null = null;

  medicines: Medicine[] = [
    { id: 1, name: 'Paracetamol 500 mg', category: 'Analgesico', stock: 24, minStock: 10, price: 1.5 },
    { id: 2, name: 'Amoxicilina 500 mg', category: 'Antibiotico', stock: 8, minStock: 12, price: 3.2 },
    { id: 3, name: 'Loratadina 10 mg', category: 'Antialergico', stock: 18, minStock: 8, price: 1.8 },
  ];

  customers: Customer[] = [
    { id: 1, name: 'Maria Torres', phone: '987654321', district: 'Los Olivos' },
    { id: 2, name: 'Carlos Ramos', phone: '956123478', district: 'Comas' },
  ];

  orders: Order[] = [
    {
      id: 1,
      customerName: 'Maria Torres',
      medicineName: 'Paracetamol 500 mg',
      quantity: 2,
      status: 'Pendiente',
      createdAt: '2026-05-31',
    },
  ];

  medicineForm = {
    name: '',
    category: '',
    stock: 0,
    minStock: 5,
    price: 0,
  };

  customerForm = {
    name: '',
    phone: '',
    district: '',
  };

  orderForm = {
    customerName: '',
    medicineName: '',
    quantity: 1,
  };

  readonly sections = [
    {
      id: 'dashboard' as const,
      icon: 'analytics-outline',
      label: 'Resumen',
      description: 'Indicadores y alertas',
    },
    {
      id: 'inventory' as const,
      icon: 'medkit-outline',
      label: 'Inventario',
      description: 'Stock y precios',
    },
    {
      id: 'customers' as const,
      icon: 'people-outline',
      label: 'Clientes',
      description: 'Datos de contacto',
    },
    {
      id: 'orders' as const,
      icon: 'receipt-outline',
      label: 'Pedidos',
      description: 'Ventas y entregas',
    },
  ];

  constructor(private readonly firebaseDataService: FirebaseDataService) {
    this.loadData();
    void this.syncFromFirebase();
  }

  get totalInventoryValue(): number {
    return this.medicines.reduce((total, medicine) => total + medicine.stock * medicine.price, 0);
  }

  get lowStockCount(): number {
    return this.medicines.filter((medicine) => medicine.stock <= medicine.minStock).length;
  }

  get pendingOrdersCount(): number {
    return this.orders.filter((order) => order.status === 'Pendiente').length;
  }

  get lowStockMedicines(): Medicine[] {
    return this.medicines.filter((medicine) => medicine.stock <= medicine.minStock);
  }

  selectSection(section: 'dashboard' | 'inventory' | 'customers' | 'orders'): void {
    this.selectedSegment = section;
  }

  addMedicine(): void {
    if (!this.medicineForm.name.trim() || !this.medicineForm.category.trim()) {
      this.actionMessage = 'Completa nombre y categoria para registrar el medicamento.';
      return;
    }

    if (this.medicineForm.stock < 0 || this.medicineForm.minStock < 0 || this.medicineForm.price < 0) {
      this.actionMessage = 'Stock, minimo y precio no pueden ser negativos.';
      return;
    }

    const medicine: Medicine = {
      id: this.editingMedicineId ?? Date.now(),
      name: this.medicineForm.name.trim(),
      category: this.medicineForm.category.trim(),
      stock: Number(this.medicineForm.stock),
      minStock: Number(this.medicineForm.minStock),
      price: Number(this.medicineForm.price),
    };

    this.medicines = this.editingMedicineId
      ? this.medicines.map((item) => (item.id === this.editingMedicineId ? medicine : item))
      : [...this.medicines, medicine];

    this.medicineForm = { name: '', category: '', stock: 0, minStock: 5, price: 0 };
    this.editingMedicineId = null;
    this.actionMessage = 'Medicamento guardado y stock actualizado.';
    this.persistChanges();
  }

  editMedicine(medicine: Medicine): void {
    this.editingMedicineId = medicine.id;
    this.medicineForm = {
      name: medicine.name,
      category: medicine.category,
      stock: medicine.stock,
      minStock: medicine.minStock,
      price: medicine.price,
    };
    this.selectedSegment = 'inventory';
    this.actionMessage = 'Editando medicamento seleccionado.';
  }

  addCustomer(): void {
    if (!this.customerForm.name.trim() || !this.customerForm.phone.trim()) {
      this.actionMessage = 'Completa nombre y telefono para registrar el cliente.';
      return;
    }

    const customer: Customer = {
      id: this.editingCustomerId ?? Date.now(),
      name: this.customerForm.name.trim(),
      phone: this.customerForm.phone.trim(),
      district: this.customerForm.district.trim(),
    };

    this.customers = this.editingCustomerId
      ? this.customers.map((item) => (item.id === this.editingCustomerId ? customer : item))
      : [...this.customers, customer];

    this.customerForm = { name: '', phone: '', district: '' };
    this.editingCustomerId = null;
    this.actionMessage = 'Cliente guardado correctamente.';
    this.persistChanges();
  }

  editCustomer(customer: Customer): void {
    this.editingCustomerId = customer.id;
    this.customerForm = {
      name: customer.name,
      phone: customer.phone,
      district: customer.district,
    };
    this.selectedSegment = 'customers';
    this.actionMessage = 'Editando cliente seleccionado.';
  }

  createOrder(): void {
    if (!this.orderForm.customerName || !this.orderForm.medicineName || this.orderForm.quantity < 1) {
      this.actionMessage = 'Selecciona cliente, medicamento y una cantidad valida.';
      return;
    }

    const selectedMedicine = this.medicines.find((medicine) => medicine.name === this.orderForm.medicineName);

    if (!selectedMedicine || selectedMedicine.stock < this.orderForm.quantity) {
      this.actionMessage = 'No hay stock suficiente para generar el pedido.';
      return;
    }

    this.medicines = this.medicines.map((medicine) =>
      medicine.id === selectedMedicine.id
        ? { ...medicine, stock: medicine.stock - Number(this.orderForm.quantity) }
        : medicine
    );

    this.orders = [
      {
        id: Date.now(),
        customerName: this.orderForm.customerName,
        medicineName: this.orderForm.medicineName,
        quantity: Number(this.orderForm.quantity),
        status: 'Pendiente',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...this.orders,
    ];

    this.orderForm = { customerName: '', medicineName: '', quantity: 1 };
    this.actionMessage = 'Pedido generado y stock descontado automaticamente.';
    this.persistChanges();
  }

  completeOrder(orderId: number): void {
    this.orders = this.orders.map((order) =>
      order.id === orderId ? { ...order, status: 'Entregado' } : order
    );
    this.actionMessage = 'Pedido marcado como entregado.';
    this.persistChanges();
  }

  deleteMedicine(medicineId: number): void {
    this.medicines = this.medicines.filter((medicine) => medicine.id !== medicineId);
    this.actionMessage = 'Medicamento eliminado del inventario local.';
    this.persistChanges();
    void this.deleteMedicineFromFirebase(medicineId);
  }

  deleteCustomer(customerId: number): void {
    this.customers = this.customers.filter((customer) => customer.id !== customerId);
    this.actionMessage = 'Cliente eliminado del registro local.';
    this.persistChanges();
    void this.deleteCustomerFromFirebase(customerId);
  }

  deleteOrder(orderId: number): void {
    this.orders = this.orders.filter((order) => order.id !== orderId);
    this.actionMessage = 'Pedido eliminado del historial local.';
    this.persistChanges();
    void this.deleteOrderFromFirebase(orderId);
  }

  async syncNow(): Promise<void> {
    await this.syncToFirebase();
  }

  private loadData(): void {
    const savedData = localStorage.getItem('farmacomas-ionic-data');

    if (!savedData) {
      return;
    }

    let parsedData: AppData;

    try {
      parsedData = JSON.parse(savedData) as AppData;
    } catch {
      localStorage.removeItem('farmacomas-ionic-data');
      this.actionMessage = 'Se limpio una copia local invalida. El sistema sigue operativo.';
      return;
    }

    this.medicines = parsedData.medicines ?? this.medicines;
    this.customers = parsedData.customers ?? this.customers;
    this.orders = parsedData.orders ?? this.orders;
  }

  private saveData(): void {
    localStorage.setItem(
      'farmacomas-ionic-data',
      JSON.stringify({
        medicines: this.medicines,
        customers: this.customers,
        orders: this.orders,
      })
    );
  }

  private persistChanges(): void {
    this.saveData();
    void this.syncToFirebase();
  }

  private async syncFromFirebase(): Promise<void> {
    try {
      await this.firebaseDataService.testConnection();

      const { medicines, customers, orders } = await this.firebaseDataService.loadAll();

      if (medicines.length > 0) {
        this.medicines = medicines;
      }

      if (customers.length > 0) {
        this.customers = customers;
      }

      if (orders.length > 0) {
        this.orders = orders;
      }

      this.saveData();
      this.firebaseStatus = 'Firebase conectado';
    } catch {
      this.firebaseStatus = 'Modo local activo. Revisa internet o reglas de Firestore.';
    }
  }

  private async syncToFirebase(): Promise<void> {
    try {
      await this.firebaseDataService.syncAll(this.medicines, this.customers, this.orders);
      this.firebaseStatus = 'Firebase sincronizado';
    } catch {
      this.firebaseStatus = 'Datos guardados localmente. Firebase no acepto la sincronizacion.';
    }
  }

  private async deleteMedicineFromFirebase(medicineId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteMedicine(medicineId);
      this.firebaseStatus = 'Medicamento eliminado en Firebase';
    } catch {
      this.firebaseStatus = 'Medicamento eliminado localmente. Firebase no acepto el cambio.';
    }
  }

  private async deleteCustomerFromFirebase(customerId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteCustomer(customerId);
      this.firebaseStatus = 'Cliente eliminado en Firebase';
    } catch {
      this.firebaseStatus = 'Cliente eliminado localmente. Firebase no acepto el cambio.';
    }
  }

  private async deleteOrderFromFirebase(orderId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteOrder(orderId);
      this.firebaseStatus = 'Pedido eliminado en Firebase';
    } catch {
      this.firebaseStatus = 'Pedido eliminado localmente. Firebase no acepto el cambio.';
    }
  }
}
