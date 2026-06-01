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
  firebaseStatus = 'Conectando...';
  actionMessage = 'Listo para atender.';
  isOnline = true;
  editingMedicineId: number | null = null;
  editingCustomerId: number | null = null;

  searchMedicine = '';
  searchCustomer = '';

  medicines: Medicine[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];

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
      label: 'Inicio',
      description: 'Resumen del dia',
    },
    {
      id: 'inventory' as const,
      icon: 'medkit-outline',
      label: 'Inventario',
      description: 'Medicamentos',
    },
    {
      id: 'customers' as const,
      icon: 'people-outline',
      label: 'Clientes',
      description: 'Contactos',
    },
    {
      id: 'orders' as const,
      icon: 'receipt-outline',
      label: 'Pedidos',
      description: 'Atenciones',
    },
  ];

  constructor(private readonly firebaseDataService: FirebaseDataService) {
    this.loadData();
    void this.syncFromFirebase();
  }

  // ── Computed ──

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

  get deliveredOrdersCount(): number {
    return this.orders.filter((order) => order.status === 'Entregado').length;
  }

  get filteredMedicines(): Medicine[] {
    const term = this.searchMedicine.trim().toLowerCase();
    if (!term) return this.medicines;
    return this.medicines.filter(
      (m) => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
    );
  }

  get filteredCustomers(): Customer[] {
    const term = this.searchCustomer.trim().toLowerCase();
    if (!term) return this.customers;
    return this.customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.district.toLowerCase().includes(term)
    );
  }

  // ── Navigation ──

  selectSection(section: 'dashboard' | 'inventory' | 'customers' | 'orders'): void {
    this.selectedSegment = section;
  }

  // ── Medicine CRUD ──

  addMedicine(): void {
    if (!this.medicineForm.name.trim() || !this.medicineForm.category.trim()) {
      this.actionMessage = 'Ingresa el nombre y la categoria del medicamento.';
      return;
    }

    if (this.medicineForm.stock < 0 || this.medicineForm.minStock < 0 || this.medicineForm.price < 0) {
      this.actionMessage = 'Revisa los numeros: no pueden ser negativos.';
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
    this.actionMessage = 'Medicamento guardado.';
    this.saveData();
    void this.saveMedicineToCloud(medicine);
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
    this.actionMessage = 'Editando medicamento.';
  }

  // ── Customer CRUD ──

  addCustomer(): void {
    if (!this.customerForm.name.trim() || !this.customerForm.phone.trim()) {
      this.actionMessage = 'Ingresa el nombre y telefono del cliente.';
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
    this.actionMessage = 'Cliente guardado.';
    this.saveData();
    void this.saveCustomerToCloud(customer);
  }

  editCustomer(customer: Customer): void {
    this.editingCustomerId = customer.id;
    this.customerForm = {
      name: customer.name,
      phone: customer.phone,
      district: customer.district,
    };
    this.selectedSegment = 'customers';
    this.actionMessage = 'Editando cliente.';
  }

  // ── Order CRUD (atomic stock update) ──

  createOrder(): void {
    if (!this.orderForm.customerName || !this.orderForm.medicineName || this.orderForm.quantity < 1) {
      this.actionMessage = 'Selecciona cliente, medicamento y cantidad.';
      return;
    }

    const selectedMedicine = this.medicines.find((medicine) => medicine.name === this.orderForm.medicineName);

    if (!selectedMedicine || selectedMedicine.stock < this.orderForm.quantity) {
      this.actionMessage = 'No hay stock suficiente para este pedido.';
      return;
    }

    const order: Order = {
      id: Date.now(),
      customerName: this.orderForm.customerName,
      medicineName: this.orderForm.medicineName,
      quantity: Number(this.orderForm.quantity),
      status: 'Pendiente',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updatedMedicine = {
      ...selectedMedicine,
      stock: selectedMedicine.stock - Number(this.orderForm.quantity),
    };

    this.medicines = this.medicines.map((medicine) =>
      medicine.id === selectedMedicine.id ? updatedMedicine : medicine
    );

    this.orders = [order, ...this.orders];

    this.orderForm = { customerName: '', medicineName: '', quantity: 1 };
    this.actionMessage = 'Pedido creado y stock descontado.';
    this.saveData();
    void this.saveOrderWithStockAtomic(order, updatedMedicine);
  }

  completeOrder(orderId: number): void {
    let updatedOrder: Order | undefined;

    this.orders = this.orders.map((order) =>
      order.id === orderId ? (updatedOrder = { ...order, status: 'Entregado' }) : order
    );

    this.actionMessage = 'Pedido entregado.';
    this.saveData();

    if (updatedOrder) {
      void this.saveOrderToCloud(updatedOrder);
    }
  }

  deleteMedicine(medicineId: number): void {
    this.medicines = this.medicines.filter((medicine) => medicine.id !== medicineId);
    this.actionMessage = 'Medicamento eliminado.';
    this.saveData();
    void this.deleteMedicineFromCloud(medicineId);
  }

  deleteCustomer(customerId: number): void {
    this.customers = this.customers.filter((customer) => customer.id !== customerId);
    this.actionMessage = 'Cliente eliminado.';
    this.saveData();
    void this.deleteCustomerFromCloud(customerId);
  }

  deleteOrder(orderId: number): void {
    this.orders = this.orders.filter((order) => order.id !== orderId);
    this.actionMessage = 'Pedido eliminado.';
    this.saveData();
    void this.deleteOrderFromCloud(orderId);
  }

  async syncNow(): Promise<void> {
    this.actionMessage = 'Sincronizando...';
    await this.syncToCloud();
  }

  // ── Persistence ──

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

  // ── Cloud sync ──

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
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  private async syncToCloud(): Promise<void> {
    try {
      await this.firebaseDataService.syncAll(this.medicines, this.customers, this.orders);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
      this.actionMessage = 'Datos sincronizados correctamente.';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
      this.actionMessage = 'Cambios guardados localmente.';
    }
  }

  private async saveMedicineToCloud(medicine: Medicine): Promise<void> {
    try {
      await this.firebaseDataService.saveMedicine(medicine);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  private async saveCustomerToCloud(customer: Customer): Promise<void> {
    try {
      await this.firebaseDataService.saveCustomer(customer);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  private async saveOrderToCloud(order: Order): Promise<void> {
    try {
      await this.firebaseDataService.saveOrder(order);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  /** Atomic: saves order AND updates stock in a single Firestore batch */
  private async saveOrderWithStockAtomic(order: Order, medicine: Medicine): Promise<void> {
    try {
      await this.firebaseDataService.saveOrderAndUpdateStock(order, medicine);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
      this.actionMessage = 'Pedido guardado localmente.';
    }
  }

  private async deleteMedicineFromCloud(medicineId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteMedicine(medicineId);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  private async deleteCustomerFromCloud(customerId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteCustomer(customerId);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }

  private async deleteOrderFromCloud(orderId: number): Promise<void> {
    try {
      await this.firebaseDataService.deleteOrder(orderId);
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
    }
  }
}
