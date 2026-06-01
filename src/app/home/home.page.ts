import { Component, OnDestroy } from '@angular/core';
import { Unsubscribe, User } from 'firebase/auth';
import { AppData, Customer, Medicine, Order } from '../core/models';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnDestroy {
  selectedSegment: 'dashboard' | 'inventory' | 'customers' | 'orders' = 'dashboard';
  firebaseStatus = 'Conectando...';
  actionMessage = 'Inicia sesion para atender.';
  isOnline = false;
  authReady = false;
  currentUser: User | null = null;
  authMode: 'login' | 'register' = 'login';
  authMessage = '';
  editingMedicineId: number | null = null;
  editingCustomerId: number | null = null;

  searchMedicine = '';
  searchCustomer = '';

  medicines: Medicine[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];

  authForm = {
    email: '',
    password: '',
  };

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
    customerId: 0,
    medicineId: 0,
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

  private authUnsubscribe: Unsubscribe | null = null;
  private dataUnsubscribe: Unsubscribe | null = null;

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly firebaseDataService: FirebaseDataService
  ) {
    this.authUnsubscribe = this.firebaseAuthService.onUserChanged((user) => {
      void this.handleAuthState(user);
    });
  }

  ngOnDestroy(): void {
    this.authUnsubscribe?.();
    this.dataUnsubscribe?.();
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
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

  get deliveredOrdersCount(): number {
    return this.orders.filter((order) => order.status === 'Entregado').length;
  }

  get filteredMedicines(): Medicine[] {
    const term = this.searchMedicine.trim().toLowerCase();
    if (!term) return this.medicines;
    return this.medicines.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(term) || medicine.category.toLowerCase().includes(term)
    );
  }

  get filteredCustomers(): Customer[] {
    const term = this.searchCustomer.trim().toLowerCase();
    if (!term) return this.customers;
    return this.customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.district.toLowerCase().includes(term)
    );
  }

  selectSection(section: 'dashboard' | 'inventory' | 'customers' | 'orders'): void {
    this.selectedSegment = section;
  }

  async login(): Promise<void> {
    if (!this.authForm.email.trim() || !this.authForm.password) {
      this.authMessage = 'Ingresa correo y contrasena.';
      return;
    }

    try {
      this.authMessage = 'Ingresando...';
      await this.firebaseAuthService.login(this.authForm.email, this.authForm.password);
      this.authForm.password = '';
      this.authMessage = '';
    } catch {
      this.authMessage = 'No se pudo iniciar sesion. Revisa correo y contrasena.';
    }
  }

  async register(): Promise<void> {
    if (!this.authForm.email.trim() || this.authForm.password.length < 6) {
      this.authMessage = 'Usa un correo valido y minimo 6 caracteres.';
      return;
    }

    try {
      this.authMessage = 'Creando usuario...';
      await this.firebaseAuthService.register(this.authForm.email, this.authForm.password);
      this.authForm.password = '';
      this.authMessage = '';
    } catch {
      this.authMessage = 'No se pudo crear el usuario. Verifica si el correo ya existe.';
    }
  }

  async recoverPassword(): Promise<void> {
    if (!this.authForm.email.trim()) {
      this.authMessage = 'Ingresa tu correo para recuperar acceso.';
      return;
    }

    try {
      await this.firebaseAuthService.recoverPassword(this.authForm.email);
      this.authMessage = 'Te enviamos un correo de recuperacion.';
    } catch {
      this.authMessage = 'No se pudo enviar la recuperacion. Revisa el correo.';
    }
  }

  async logout(): Promise<void> {
    await this.firebaseAuthService.logout();
  }

  addMedicine(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.medicineForm.name.trim() || !this.medicineForm.category.trim()) {
      this.actionMessage = 'Ingresa el nombre y la categoria del medicamento.';
      return;
    }

    if (this.medicineForm.stock < 0 || this.medicineForm.minStock < 0 || this.medicineForm.price < 0) {
      this.actionMessage = 'Revisa los numeros: no pueden ser negativos.';
      return;
    }

    const medicine: Medicine = {
      id: this.editingMedicineId ?? this.createId(),
      name: this.medicineForm.name.trim(),
      category: this.medicineForm.category.trim(),
      stock: Number(this.medicineForm.stock),
      minStock: Number(this.medicineForm.minStock),
      price: Number(this.medicineForm.price),
    };

    this.medicines = this.editingMedicineId
      ? this.medicines.map((item) => (item.id === this.editingMedicineId ? medicine : item))
      : [...this.medicines, medicine];

    this.orders = this.orders.map((order) =>
      order.medicineId === medicine.id ? { ...order, medicineName: medicine.name } : order
    );

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

  addCustomer(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.customerForm.name.trim() || !this.customerForm.phone.trim()) {
      this.actionMessage = 'Ingresa el nombre y telefono del cliente.';
      return;
    }

    const customer: Customer = {
      id: this.editingCustomerId ?? this.createId(),
      name: this.customerForm.name.trim(),
      phone: this.customerForm.phone.trim(),
      district: this.customerForm.district.trim(),
    };

    this.customers = this.editingCustomerId
      ? this.customers.map((item) => (item.id === this.editingCustomerId ? customer : item))
      : [...this.customers, customer];

    this.orders = this.orders.map((order) =>
      order.customerId === customer.id ? { ...order, customerName: customer.name } : order
    );

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

  createOrder(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.orderForm.customerId || !this.orderForm.medicineId || this.orderForm.quantity < 1) {
      this.actionMessage = 'Selecciona cliente, medicamento y cantidad.';
      return;
    }

    const selectedCustomer = this.customers.find((customer) => customer.id === Number(this.orderForm.customerId));
    const selectedMedicine = this.medicines.find((medicine) => medicine.id === Number(this.orderForm.medicineId));

    if (!selectedCustomer || !selectedMedicine) {
      this.actionMessage = 'Selecciona datos validos para el pedido.';
      return;
    }

    if (selectedMedicine.stock < this.orderForm.quantity) {
      this.actionMessage = 'No hay stock suficiente para este pedido.';
      return;
    }

    const order: Order = {
      id: this.createId(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
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

    this.orderForm = { customerId: 0, medicineId: 0, quantity: 1 };
    this.actionMessage = 'Pedido creado y stock descontado.';
    this.saveData();
    void this.saveOrderWithStockAtomic(order, updatedMedicine);
  }

  completeOrder(orderId: number): void {
    if (!this.ensureAuthenticated()) return;

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
    if (!this.ensureAuthenticated()) return;

    const hasPendingOrder = this.orders.some(
      (order) => order.medicineId === medicineId && order.status === 'Pendiente'
    );

    if (hasPendingOrder) {
      this.actionMessage = 'No elimines un medicamento con pedidos pendientes.';
      return;
    }

    this.medicines = this.medicines.filter((medicine) => medicine.id !== medicineId);
    this.actionMessage = 'Medicamento eliminado.';
    this.saveData();
    void this.deleteMedicineFromCloud(medicineId);
  }

  deleteCustomer(customerId: number): void {
    if (!this.ensureAuthenticated()) return;

    const hasPendingOrder = this.orders.some(
      (order) => order.customerId === customerId && order.status === 'Pendiente'
    );

    if (hasPendingOrder) {
      this.actionMessage = 'No elimines un cliente con pedidos pendientes.';
      return;
    }

    this.customers = this.customers.filter((customer) => customer.id !== customerId);
    this.actionMessage = 'Cliente eliminado.';
    this.saveData();
    void this.deleteCustomerFromCloud(customerId);
  }

  deleteOrder(orderId: number): void {
    if (!this.ensureAuthenticated()) return;

    this.orders = this.orders.filter((order) => order.id !== orderId);
    this.actionMessage = 'Pedido eliminado.';
    this.saveData();
    void this.deleteOrderFromCloud(orderId);
  }

  async syncNow(): Promise<void> {
    if (!this.ensureAuthenticated()) return;

    this.actionMessage = 'Sincronizando...';
    await this.syncToCloud();
  }

  private async handleAuthState(user: User | null): Promise<void> {
    this.authReady = true;
    this.currentUser = user;
    this.dataUnsubscribe?.();
    this.dataUnsubscribe = null;
    this.firebaseDataService.setUserId(user?.uid ?? null);

    if (!user) {
      this.resetData();
      this.isOnline = false;
      this.firebaseStatus = 'Sin sesion';
      this.actionMessage = 'Inicia sesion para atender.';
      return;
    }

    this.loadData(user.uid);
    await this.syncFromFirebase();
    this.startRealtimeSync();
  }

  private loadData(userId: string): void {
    const savedData =
      localStorage.getItem(this.localStorageKey(userId)) ?? localStorage.getItem('farmacomas-ionic-data');

    if (!savedData) {
      return;
    }

    let parsedData: AppData;

    try {
      parsedData = JSON.parse(savedData) as AppData;
    } catch {
      localStorage.removeItem(this.localStorageKey(userId));
      this.actionMessage = 'Se limpio una copia local invalida. El sistema sigue operativo.';
      return;
    }

    this.applyData(parsedData);
  }

  private saveData(): void {
    if (!this.currentUser) return;

    localStorage.setItem(
      this.localStorageKey(this.currentUser.uid),
      JSON.stringify({
        medicines: this.medicines,
        customers: this.customers,
        orders: this.orders,
      })
    );
  }

  private async syncFromFirebase(): Promise<void> {
    try {
      await this.firebaseDataService.testConnection();
      const remoteData = await this.firebaseDataService.loadAll();
      const hasRemoteData =
        remoteData.medicines.length > 0 || remoteData.customers.length > 0 || remoteData.orders.length > 0;

      if (hasRemoteData) {
        this.applyData(remoteData);
      } else if (this.medicines.length > 0 || this.customers.length > 0 || this.orders.length > 0) {
        await this.firebaseDataService.syncAll(this.medicines, this.customers, this.orders);
      }

      this.saveData();
      this.isOnline = true;
      this.firebaseStatus = 'Datos actualizados';
      this.actionMessage = 'Listo para atender.';
    } catch {
      this.isOnline = false;
      this.firebaseStatus = 'Sin conexion';
      this.actionMessage = 'Cambios guardados localmente.';
    }
  }

  private startRealtimeSync(): void {
    this.dataUnsubscribe = this.firebaseDataService.subscribeToUserData(
      (data) => {
        this.applyData(data);
        this.saveData();
        this.isOnline = true;
        this.firebaseStatus = 'Datos actualizados';
      },
      () => {
        this.isOnline = false;
        this.firebaseStatus = 'Sin conexion';
      }
    );
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
      await this.syncChangedOrderNames();
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
      await this.syncChangedOrderNames();
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

  private async syncChangedOrderNames(): Promise<void> {
    const updatedOrders = this.orders.map((order) => {
      const customer = this.customers.find((item) => item.id === order.customerId);
      const medicine = this.medicines.find((item) => item.id === order.medicineId);
      return {
        ...order,
        customerName: customer?.name ?? order.customerName,
        medicineName: medicine?.name ?? order.medicineName,
      };
    });

    const changedOrders = updatedOrders.filter((updatedOrder) => {
      const previousOrder = this.orders.find((order) => order.id === updatedOrder.id);
      return (
        previousOrder &&
        (previousOrder.customerName !== updatedOrder.customerName ||
          previousOrder.medicineName !== updatedOrder.medicineName)
      );
    });

    this.orders = updatedOrders;

    await Promise.all(changedOrders.map((order) => this.firebaseDataService.saveOrder(order)));
  }

  private applyData(data: AppData): void {
    this.medicines = data.medicines ?? [];
    this.customers = data.customers ?? [];
    this.orders = (data.orders ?? []).map((order) => ({
      ...order,
      customerId: order.customerId ?? this.findCustomerId(order.customerName),
      medicineId: order.medicineId ?? this.findMedicineId(order.medicineName),
    }));
  }

  private resetData(): void {
    this.medicines = [];
    this.customers = [];
    this.orders = [];
    this.editingMedicineId = null;
    this.editingCustomerId = null;
    this.orderForm = { customerId: 0, medicineId: 0, quantity: 1 };
  }

  private ensureAuthenticated(): boolean {
    if (this.currentUser) return true;

    this.actionMessage = 'Inicia sesion para continuar.';
    return false;
  }

  private localStorageKey(userId: string): string {
    return `farmacomas-ionic-data-${userId}`;
  }

  private createId(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  private findCustomerId(name: string): number {
    return this.customers.find((customer) => customer.name === name)?.id ?? 0;
  }

  private findMedicineId(name: string): number {
    return this.medicines.find((medicine) => medicine.name === name)?.id ?? 0;
  }
}
