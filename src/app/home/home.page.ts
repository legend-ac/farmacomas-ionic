import { Component, OnDestroy } from '@angular/core';
import { Unsubscribe, User } from 'firebase/auth';
import {
  AppData,
  Customer,
  Medicine,
  Order,
  OrderStatus,
  PaymentMethod,
  Supplier,
  UnitType,
} from '../core/models';
import { SEED_DATA } from '../core/seed-data';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';

type DataCollection = 'medicamentos' | 'clientes' | 'pedidos' | 'proveedores';

interface PendingDeletes {
  medicamentos: number[];
  clientes: number[];
  pedidos: number[];
  proveedores: number[];
}

interface LocalAppState extends AppData {
  pendingDeletes?: PendingDeletes;
  pendingChanges?: boolean;
}

interface TopMedicine {
  name: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnDestroy {
  selectedSegment: 'dashboard' | 'inventory' | 'customers' | 'orders' | 'suppliers' = 'dashboard';
  firebaseStatus = 'Conectando...';
  actionMessage = 'Inicia sesión para atender.';
  isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  authReady = false;
  pendingChanges = false;
  currentUser: User | null = null;
  authMode: 'login' | 'register' = 'login';
  authMessage = '';
  editingMedicineId: number | null = null;
  editingCustomerId: number | null = null;
  editingSupplierId: number | null = null;
  isSeeding = false;

  searchMedicine = '';
  searchCustomer = '';
  searchSupplier = '';

  medicines: Medicine[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];
  suppliers: Supplier[] = [];

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
    laboratoryName: '',
    expiryDate: '',
    unitType: 'tableta' as UnitType,
    requiresPrescription: false,
    description: '',
  };

  customerForm = {
    name: '',
    phone: '',
    district: '',
    email: '',
    address: '',
  };

  orderForm = {
    customerId: 0,
    medicineId: 0,
    quantity: 1,
    paymentMethod: 'efectivo' as PaymentMethod,
    notes: '',
  };

  supplierForm = {
    name: '',
    contact: '',
    phone: '',
    email: '',
    city: '',
    category: '',
  };

  readonly unitTypes: UnitType[] = ['tableta', 'cápsula', 'frasco', 'ampolla', 'crema', 'jarabe', 'solución', 'sobre'];
  readonly paymentMethods: PaymentMethod[] = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];

  readonly sections = [
    { id: 'dashboard' as const, icon: 'analytics-outline', label: 'Inicio', description: 'Resumen' },
    { id: 'inventory' as const, icon: 'medkit-outline', label: 'Inventario', description: 'Medicamentos' },
    { id: 'customers' as const, icon: 'people-outline', label: 'Clientes', description: 'Directorio' },
    { id: 'orders' as const, icon: 'receipt-outline', label: 'Pedidos', description: 'Ventas' },
    { id: 'suppliers' as const, icon: 'business-outline', label: 'Proveedores', description: 'Laboratorios' },
  ];

  private authUnsubscribe: Unsubscribe | null = null;
  private dataUnsubscribe: Unsubscribe | null = null;
  private syncTimer: ReturnType<typeof window.setInterval> | null = null;
  private isSyncing = false;
  private pendingDeletes: PendingDeletes = this.emptyPendingDeletes();

  private readonly handleOnline = () => {
    this.isOnline = true;
    this.updateStatus();
    void this.syncPendingChanges();
  };
  private readonly handleOffline = () => {
    this.isOnline = false;
    this.updateStatus();
    this.actionMessage = 'Sin internet. Los cambios quedan guardados aquí.';
  };

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly firebaseDataService: FirebaseDataService
  ) {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.syncTimer = window.setInterval(() => {
      void this.syncPendingChanges();
    }, 15000);

    this.authUnsubscribe = this.firebaseAuthService.onUserChanged((user) => {
      void this.handleAuthState(user);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.syncTimer) window.clearInterval(this.syncTimer);
    this.authUnsubscribe?.();
    this.dataUnsubscribe?.();
  }

  // ─── Getters ───────────────────────────────────────────────────

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get totalInventoryValue(): number {
    return this.medicines.reduce((total, m) => total + m.stock * m.price, 0);
  }

  get lowStockCount(): number {
    return this.medicines.filter((m) => m.stock <= m.minStock).length;
  }

  get pendingOrdersCount(): number {
    return this.orders.filter((o) => o.status === 'Pendiente').length;
  }

  get lowStockMedicines(): Medicine[] {
    return this.medicines.filter((m) => m.stock <= m.minStock);
  }

  get expiringMedicines(): Medicine[] {
    const soon = new Date();
    soon.setDate(soon.getDate() + 60);
    const soonStr = soon.toISOString().slice(0, 10);
    return this.medicines.filter((m) => m.expiryDate && m.expiryDate <= soonStr);
  }

  get deliveredOrdersCount(): number {
    return this.orders.filter((o) => o.status === 'Entregado').length;
  }

  get todaysSalesTotal(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.orders
      .filter((o) => o.createdAt === today && o.status !== 'Cancelado')
      .reduce((sum, o) => sum + o.totalPrice, 0);
  }

  get todaysSalesCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.orders.filter((o) => o.createdAt === today && o.status !== 'Cancelado').length;
  }

  get monthlySalesTotal(): number {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    return this.orders
      .filter((o) => o.createdAt.startsWith(month) && o.status !== 'Cancelado')
      .reduce((sum, o) => sum + o.totalPrice, 0);
  }

  get topMedicines(): TopMedicine[] {
    const tally: Record<string, number> = {};
    this.orders.forEach((o) => {
      if (o.status !== 'Cancelado') {
        tally[o.medicineName] = (tally[o.medicineName] ?? 0) + o.quantity;
      }
    });
    const sorted = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([name, total]) => ({
      name: name.length > 28 ? name.slice(0, 28) + '…' : name,
      total,
      percentage: Math.round((total / max) * 100),
    }));
  }

  get filteredMedicines(): Medicine[] {
    const term = this.searchMedicine.trim().toLowerCase();
    if (!term) return this.medicines;
    return this.medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term) ||
        m.laboratoryName.toLowerCase().includes(term)
    );
  }

  get filteredCustomers(): Customer[] {
    const term = this.searchCustomer.trim().toLowerCase();
    if (!term) return this.customers;
    return this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.district.toLowerCase().includes(term) ||
        (c.email?.toLowerCase().includes(term) ?? false)
    );
  }

  get filteredSuppliers(): Supplier[] {
    const term = this.searchSupplier.trim().toLowerCase();
    if (!term) return this.suppliers;
    return this.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term) ||
        s.city.toLowerCase().includes(term) ||
        s.contact.toLowerCase().includes(term)
    );
  }

  get recentOrders(): Order[] {
    return this.orders.slice(0, 5);
  }

  // ─── Section navigation ────────────────────────────────────────

  selectSection(section: typeof this.selectedSegment): void {
    this.selectedSegment = section;
  }

  // ─── Auth ──────────────────────────────────────────────────────

  async login(): Promise<void> {
    if (!this.authForm.email.trim() || !this.authForm.password) {
      this.authMessage = 'Ingresa correo y contraseña.';
      return;
    }
    try {
      this.authMessage = 'Ingresando...';
      await this.firebaseAuthService.login(this.authForm.email, this.authForm.password);
      this.authForm.password = '';
      this.authMessage = '';
    } catch {
      this.authMessage = 'No se pudo iniciar sesión. Revisa correo y contraseña.';
    }
  }

  async register(): Promise<void> {
    if (!this.authForm.email.trim() || this.authForm.password.length < 6) {
      this.authMessage = 'Usa un correo válido y mínimo 6 caracteres.';
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
      this.authMessage = 'Te enviamos un correo de recuperación.';
    } catch {
      this.authMessage = 'No se pudo enviar la recuperación. Revisa el correo.';
    }
  }

  async logout(): Promise<void> {
    await this.firebaseAuthService.logout();
  }

  // ─── Medicines ─────────────────────────────────────────────────

  addMedicine(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.medicineForm.name.trim() || !this.medicineForm.category.trim() || !this.medicineForm.laboratoryName.trim()) {
      this.actionMessage = 'Ingresa nombre, categoría y laboratorio del medicamento.';
      return;
    }
    if (this.medicineForm.stock < 0 || this.medicineForm.minStock < 0 || this.medicineForm.price < 0) {
      this.actionMessage = 'Revisa los números: no pueden ser negativos.';
      return;
    }

    const medicine: Medicine = {
      id: this.editingMedicineId ?? this.createId(),
      name: this.medicineForm.name.trim(),
      category: this.medicineForm.category.trim(),
      stock: Number(this.medicineForm.stock),
      minStock: Number(this.medicineForm.minStock),
      price: Number(this.medicineForm.price),
      laboratoryName: this.medicineForm.laboratoryName.trim(),
      expiryDate: this.medicineForm.expiryDate,
      unitType: this.medicineForm.unitType,
      requiresPrescription: this.medicineForm.requiresPrescription,
      description: this.medicineForm.description.trim() || undefined,
    };

    this.medicines = this.editingMedicineId
      ? this.medicines.map((item) => (item.id === this.editingMedicineId ? medicine : item))
      : [...this.medicines, medicine];

    this.orders = this.orders.map((o) =>
      o.medicineId === medicine.id ? { ...o, medicineName: medicine.name } : o
    );

    this.resetMedicineForm();
    this.actionMessage = 'Medicamento guardado correctamente.';
    this.markPendingChange();
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
      laboratoryName: medicine.laboratoryName,
      expiryDate: medicine.expiryDate,
      unitType: medicine.unitType,
      requiresPrescription: medicine.requiresPrescription,
      description: medicine.description ?? '',
    };
    this.selectedSegment = 'inventory';
    this.actionMessage = 'Editando medicamento — guarda los cambios.';
  }

  cancelEditMedicine(): void {
    this.resetMedicineForm();
    this.actionMessage = 'Edición cancelada.';
  }

  // ─── Customers ─────────────────────────────────────────────────

  addCustomer(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.customerForm.name.trim() || !this.customerForm.phone.trim()) {
      this.actionMessage = 'Ingresa el nombre y teléfono del cliente.';
      return;
    }

    const existing = this.editingCustomerId
      ? this.customers.find((c) => c.id === this.editingCustomerId)
      : undefined;

    const customer: Customer = {
      id: this.editingCustomerId ?? this.createId(),
      name: this.customerForm.name.trim(),
      phone: this.customerForm.phone.trim(),
      district: this.customerForm.district.trim(),
      email: this.customerForm.email.trim() || undefined,
      address: this.customerForm.address.trim() || undefined,
      loyaltyPoints: existing?.loyaltyPoints ?? 0,
      totalOrders: existing?.totalOrders ?? 0,
      registeredAt: existing?.registeredAt ?? new Date().toISOString().slice(0, 10),
    };

    this.customers = this.editingCustomerId
      ? this.customers.map((item) => (item.id === this.editingCustomerId ? customer : item))
      : [...this.customers, customer];

    this.orders = this.orders.map((o) =>
      o.customerId === customer.id ? { ...o, customerName: customer.name } : o
    );

    this.resetCustomerForm();
    this.actionMessage = 'Cliente guardado correctamente.';
    this.markPendingChange();
    void this.saveCustomerToCloud(customer);
  }

  editCustomer(customer: Customer): void {
    this.editingCustomerId = customer.id;
    this.customerForm = {
      name: customer.name,
      phone: customer.phone,
      district: customer.district,
      email: customer.email ?? '',
      address: customer.address ?? '',
    };
    this.selectedSegment = 'customers';
    this.actionMessage = 'Editando cliente — guarda los cambios.';
  }

  cancelEditCustomer(): void {
    this.resetCustomerForm();
    this.actionMessage = 'Edición cancelada.';
  }

  // ─── Orders ────────────────────────────────────────────────────

  createOrder(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.orderForm.customerId || !this.orderForm.medicineId || this.orderForm.quantity < 1) {
      this.actionMessage = 'Selecciona cliente, medicamento y cantidad.';
      return;
    }

    const selectedCustomer = this.customers.find((c) => c.id === Number(this.orderForm.customerId));
    const selectedMedicine = this.medicines.find((m) => m.id === Number(this.orderForm.medicineId));

    if (!selectedCustomer || !selectedMedicine) {
      this.actionMessage = 'Selecciona datos válidos para el pedido.';
      return;
    }
    if (selectedMedicine.stock < this.orderForm.quantity) {
      this.actionMessage = `Stock insuficiente. Disponible: ${selectedMedicine.stock} unidades.`;
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
      totalPrice: Number((selectedMedicine.price * this.orderForm.quantity).toFixed(2)),
      paymentMethod: this.orderForm.paymentMethod,
      notes: this.orderForm.notes.trim() || undefined,
    };

    const updatedMedicine: Medicine = {
      ...selectedMedicine,
      stock: selectedMedicine.stock - Number(this.orderForm.quantity),
    };

    this.medicines = this.medicines.map((m) => (m.id === selectedMedicine.id ? updatedMedicine : m));
    this.orders = [order, ...this.orders];

    // Award loyalty points (1 pt per sol spent)
    this.customers = this.customers.map((c) =>
      c.id === selectedCustomer.id
        ? { ...c, loyaltyPoints: c.loyaltyPoints + Math.floor(order.totalPrice), totalOrders: c.totalOrders + 1 }
        : c
    );

    this.orderForm = { customerId: 0, medicineId: 0, quantity: 1, paymentMethod: 'efectivo', notes: '' };
    this.actionMessage = `Pedido registrado — S/ ${order.totalPrice.toFixed(2)} por ${this.orderForm.paymentMethod}.`;
    this.markPendingChange();
    void this.saveOrderWithStockAtomic(order, updatedMedicine);
  }

  completeOrder(orderId: number): void {
    if (!this.ensureAuthenticated()) return;

    let updatedOrder: Order | undefined;
    this.orders = this.orders.map((o) =>
      o.id === orderId
        ? (updatedOrder = { ...o, status: 'Entregado', deliveredAt: new Date().toISOString().slice(0, 10) })
        : o
    );

    this.actionMessage = 'Pedido marcado como entregado.';
    this.markPendingChange();
    if (updatedOrder) void this.saveOrderToCloud(updatedOrder);
  }

  cancelOrder(orderId: number): void {
    if (!this.ensureAuthenticated()) return;

    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    // Restore stock
    this.medicines = this.medicines.map((m) =>
      m.id === order.medicineId ? { ...m, stock: m.stock + order.quantity } : m
    );

    let updatedOrder: Order | undefined;
    this.orders = this.orders.map((o) =>
      o.id === orderId ? (updatedOrder = { ...o, status: 'Cancelado' as OrderStatus }) : o
    );

    this.actionMessage = 'Pedido cancelado y stock restaurado.';
    this.markPendingChange();
    if (updatedOrder) void this.saveOrderToCloud(updatedOrder);
  }

  deleteMedicine(medicineId: number): void {
    if (!this.ensureAuthenticated()) return;

    const hasPendingOrder = this.orders.some(
      (o) => o.medicineId === medicineId && o.status === 'Pendiente'
    );
    if (hasPendingOrder) {
      this.actionMessage = 'No elimines un medicamento con pedidos pendientes.';
      return;
    }

    this.medicines = this.medicines.filter((m) => m.id !== medicineId);
    this.actionMessage = 'Medicamento eliminado.';
    this.queueDelete('medicamentos', medicineId);
    this.markPendingChange();
    void this.deleteMedicineFromCloud(medicineId);
  }

  deleteCustomer(customerId: number): void {
    if (!this.ensureAuthenticated()) return;

    const hasPendingOrder = this.orders.some(
      (o) => o.customerId === customerId && o.status === 'Pendiente'
    );
    if (hasPendingOrder) {
      this.actionMessage = 'No elimines un cliente con pedidos pendientes.';
      return;
    }

    this.customers = this.customers.filter((c) => c.id !== customerId);
    this.actionMessage = 'Cliente eliminado.';
    this.queueDelete('clientes', customerId);
    this.markPendingChange();
    void this.deleteCustomerFromCloud(customerId);
  }

  deleteOrder(orderId: number): void {
    if (!this.ensureAuthenticated()) return;
    this.orders = this.orders.filter((o) => o.id !== orderId);
    this.actionMessage = 'Pedido eliminado.';
    this.queueDelete('pedidos', orderId);
    this.markPendingChange();
    void this.deleteOrderFromCloud(orderId);
  }

  // ─── Suppliers ─────────────────────────────────────────────────

  addSupplier(): void {
    if (!this.ensureAuthenticated()) return;

    if (!this.supplierForm.name.trim() || !this.supplierForm.contact.trim()) {
      this.actionMessage = 'Ingresa el nombre y contacto del proveedor.';
      return;
    }

    const supplier: Supplier = {
      id: this.editingSupplierId ?? this.createId(),
      name: this.supplierForm.name.trim(),
      contact: this.supplierForm.contact.trim(),
      phone: this.supplierForm.phone.trim(),
      email: this.supplierForm.email.trim(),
      city: this.supplierForm.city.trim(),
      category: this.supplierForm.category.trim(),
      registeredAt: new Date().toISOString().slice(0, 10),
    };

    this.suppliers = this.editingSupplierId
      ? this.suppliers.map((s) => (s.id === this.editingSupplierId ? supplier : s))
      : [...this.suppliers, supplier];

    this.resetSupplierForm();
    this.actionMessage = 'Proveedor guardado correctamente.';
    this.markPendingChange();
    void this.saveSupplierToCloud(supplier);
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplierId = supplier.id;
    this.supplierForm = {
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      city: supplier.city,
      category: supplier.category,
    };
    this.actionMessage = 'Editando proveedor — guarda los cambios.';
  }

  cancelEditSupplier(): void {
    this.resetSupplierForm();
    this.actionMessage = 'Edición cancelada.';
  }

  deleteSupplier(supplierId: number): void {
    if (!this.ensureAuthenticated()) return;
    this.suppliers = this.suppliers.filter((s) => s.id !== supplierId);
    this.actionMessage = 'Proveedor eliminado.';
    this.queueDelete('proveedores', supplierId);
    this.markPendingChange();
    void this.deleteSupplierFromCloud(supplierId);
  }

  async syncNow(): Promise<void> {
    if (!this.ensureAuthenticated()) return;
    this.actionMessage = 'Sincronizando...';
    await this.syncToCloud();
  }

  // ─── Helpers UI ────────────────────────────────────────────────

  getExpiryClass(date: string): string {
    if (!date) return '';
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date();
    soon.setDate(soon.getDate() + 60);
    const soonStr = soon.toISOString().slice(0, 10);
    if (date < today) return 'expired';
    if (date <= soonStr) return 'expiring';
    return 'ok';
  }

  getPaymentIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      efectivo: 'cash-outline',
      yape: 'phone-portrait-outline',
      plin: 'phone-portrait-outline',
      transferencia: 'swap-horizontal-outline',
      tarjeta: 'card-outline',
    };
    return icons[method] ?? 'cash-outline';
  }

  getStatusClass(status: OrderStatus): string {
    if (status === 'Entregado') return 'ok';
    if (status === 'Cancelado') return 'err';
    return 'sky';
  }

  // ─── Private: Auth & Data Loading ─────────────────────────────

  private async handleAuthState(user: User | null): Promise<void> {
    this.authReady = true;
    this.currentUser = user;
    this.dataUnsubscribe?.();
    this.dataUnsubscribe = null;
    this.firebaseDataService.setUserId(user?.uid ?? null);

    if (!user) {
      this.resetData();
      this.isOnline = this.hasInternet();
      this.firebaseStatus = this.hasInternet() ? 'Acceso seguro' : 'Sin internet';
      this.actionMessage = 'Inicia sesión para atender.';
      return;
    }

    this.loadData(user.uid);
    await this.syncFromFirebase();
    this.startRealtimeSync();
  }

  private loadData(userId: string): void {
    const savedData =
      localStorage.getItem(this.localStorageKey(userId)) ?? localStorage.getItem('farmacomas-ionic-data');

    if (!savedData) return;

    let parsedData: LocalAppState;
    try {
      parsedData = JSON.parse(savedData) as LocalAppState;
    } catch {
      localStorage.removeItem(this.localStorageKey(userId));
      this.actionMessage = 'Se limpió una copia local inválida. El sistema sigue operativo.';
      return;
    }

    this.applyData(parsedData);
    this.pendingDeletes = parsedData.pendingDeletes ?? this.emptyPendingDeletes();
    this.pendingChanges = !!parsedData.pendingChanges;
    this.updateStatus();
  }

  private saveData(): void {
    if (!this.currentUser) return;
    localStorage.setItem(
      this.localStorageKey(this.currentUser.uid),
      JSON.stringify({
        medicines: this.medicines,
        customers: this.customers,
        orders: this.orders,
        suppliers: this.suppliers,
        pendingDeletes: this.pendingDeletes,
        pendingChanges: this.pendingChanges,
      })
    );
  }

  private async syncFromFirebase(): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');

      await this.firebaseDataService.testConnection();
      const remoteData = await this.firebaseDataService.loadAll();
      const hasRemoteData =
        remoteData.medicines.length > 0 ||
        remoteData.customers.length > 0 ||
        remoteData.orders.length > 0;

      if (hasRemoteData && !this.pendingChanges) {
        this.applyData(remoteData);
      } else if (
        this.pendingChanges ||
        this.medicines.length > 0 ||
        this.customers.length > 0 ||
        this.orders.length > 0
      ) {
        const uploaded = await this.syncToCloud();
        if (!uploaded) throw new Error('SYNC_FAILED');
      } else {
        // Empty remote + empty local → inject seed data
        await this.injectSeedData();
      }

      this.saveData();
      this.isOnline = true;
      this.updateStatus();
      if (!this.pendingChanges) {
        this.actionMessage = 'Listo para atender.';
      }
    } catch {
      this.isOnline = this.hasInternet();
      this.updateStatus();
      this.actionMessage = this.hasInternet()
        ? 'Datos locales activos. Se reintentará automáticamente.'
        : 'Sin internet. Los cambios quedan guardados aquí.';
    }
  }

  private async injectSeedData(): Promise<void> {
    try {
      this.isSeeding = true;
      this.actionMessage = 'Cargando base de datos inicial…';
      const seeded = await this.firebaseDataService.seedIfEmpty(SEED_DATA);
      if (seeded) {
        this.applyData(SEED_DATA);
        this.actionMessage = 'Base de datos cargada con datos de demostración. ¡Listo para atender!';
      }
      this.isSeeding = false;
    } catch {
      this.isSeeding = false;
      this.actionMessage = 'Se iniciará con base de datos vacía.';
    }
  }

  async forceSeedData(): Promise<void> {
    if (!this.ensureAuthenticated()) return;
    try {
      this.isSeeding = true;
      this.actionMessage = 'Inyectando base de datos real en la nube...';

      // Override/populate remote database with the 30 medicines, 15 customers, 20 orders, and 8 suppliers
      await this.firebaseDataService.syncAll(
        SEED_DATA.medicines,
        SEED_DATA.customers,
        SEED_DATA.orders,
        SEED_DATA.suppliers
      );

      // Sync local app state
      this.applyData(SEED_DATA);
      this.saveData();

      this.actionMessage = '¡Base de datos demo (30 medicamentos, 15 clientes, 20 pedidos, 8 proveedores) inyectada con éxito!';
      this.isSeeding = false;
      this.pendingChanges = false;
      this.updateStatus();
    } catch (error) {
      this.isSeeding = false;
      this.actionMessage = 'Error al inyectar datos: ' + (error as Error).message;
    }
  }

  private startRealtimeSync(): void {
    this.dataUnsubscribe = this.firebaseDataService.subscribeToUserData(
      (data) => {
        if (this.pendingChanges) return;
        this.applyData(data);
        this.saveData();
        this.isOnline = this.hasInternet();
        this.updateStatus();
      },
      () => {
        this.isOnline = this.hasInternet();
        this.updateStatus();
      }
    );
  }

  private async syncToCloud(): Promise<boolean> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      this.isSyncing = true;
      this.updateStatus();
      await this.flushPendingDeletes();
      await this.firebaseDataService.syncAll(this.medicines, this.customers, this.orders, this.suppliers);
      this.pendingChanges = false;
      this.isOnline = true;
      this.isSyncing = false;
      this.updateStatus();
      this.actionMessage = 'Datos sincronizados correctamente.';
      this.saveData();
      return true;
    } catch {
      this.isOnline = this.hasInternet();
      this.isSyncing = false;
      this.pendingChanges = true;
      this.updateStatus();
      this.actionMessage = this.hasInternet()
        ? 'Datos guardados localmente. Se reintentará automáticamente.'
        : 'Sin internet. Los cambios quedan guardados aquí.';
      this.saveData();
      return false;
    }
  }

  private async saveMedicineToCloud(medicine: Medicine): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.saveMedicine(medicine);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async saveCustomerToCloud(customer: Customer): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.saveCustomer(customer);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async saveOrderToCloud(order: Order): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.saveOrder(order);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async saveOrderWithStockAtomic(order: Order, medicine: Medicine): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.saveOrderAndUpdateStock(order, medicine);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
      this.actionMessage = 'Pedido guardado localmente.';
    }
  }

  private async saveSupplierToCloud(supplier: Supplier): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.saveSupplier(supplier);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async deleteMedicineFromCloud(medicineId: number): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.deleteMedicine(medicineId);
      this.removeQueuedDelete('medicamentos', medicineId);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async deleteCustomerFromCloud(customerId: number): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.deleteCustomer(customerId);
      this.removeQueuedDelete('clientes', customerId);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async deleteOrderFromCloud(orderId: number): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.deleteOrder(orderId);
      this.removeQueuedDelete('pedidos', orderId);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private async deleteSupplierFromCloud(supplierId: number): Promise<void> {
    try {
      if (!this.hasInternet()) throw new Error('OFFLINE');
      await this.firebaseDataService.deleteSupplier(supplierId);
      this.removeQueuedDelete('proveedores', supplierId);
      await this.syncPendingChanges();
    } catch {
      this.keepLocalPending();
    }
  }

  private applyData(data: AppData): void {
    this.medicines = data.medicines ?? [];
    this.customers = data.customers ?? [];
    this.orders = (data.orders ?? []).map((o) => ({
      ...o,
      customerId: o.customerId ?? this.findCustomerId(o.customerName),
      medicineId: o.medicineId ?? this.findMedicineId(o.medicineName),
      totalPrice: o.totalPrice ?? 0,
      paymentMethod: o.paymentMethod ?? 'efectivo',
    }));
    this.suppliers = data.suppliers ?? [];
  }

  private resetData(): void {
    this.medicines = [];
    this.customers = [];
    this.orders = [];
    this.suppliers = [];
    this.pendingChanges = false;
    this.pendingDeletes = this.emptyPendingDeletes();
    this.editingMedicineId = null;
    this.editingCustomerId = null;
    this.editingSupplierId = null;
    this.orderForm = { customerId: 0, medicineId: 0, quantity: 1, paymentMethod: 'efectivo', notes: '' };
  }

  private resetMedicineForm(): void {
    this.medicineForm = { name: '', category: '', stock: 0, minStock: 5, price: 0, laboratoryName: '', expiryDate: '', unitType: 'tableta', requiresPrescription: false, description: '' };
    this.editingMedicineId = null;
  }

  private resetCustomerForm(): void {
    this.customerForm = { name: '', phone: '', district: '', email: '', address: '' };
    this.editingCustomerId = null;
  }

  private resetSupplierForm(): void {
    this.supplierForm = { name: '', contact: '', phone: '', email: '', city: '', category: '' };
    this.editingSupplierId = null;
  }

  private ensureAuthenticated(): boolean {
    if (this.currentUser) return true;
    this.actionMessage = 'Inicia sesión para continuar.';
    return false;
  }

  private localStorageKey(userId: string): string {
    return `farmacomas-ionic-data-${userId}`;
  }

  private markPendingChange(): void {
    this.pendingChanges = true;
    this.updateStatus();
    this.saveData();
  }

  private keepLocalPending(): void {
    this.isOnline = this.hasInternet();
    this.pendingChanges = true;
    this.updateStatus();
    this.saveData();
  }

  private async syncPendingChanges(): Promise<void> {
    if (!this.currentUser || !this.pendingChanges || this.isSyncing || !this.hasInternet()) {
      this.updateStatus();
      return;
    }
    await this.syncToCloud();
  }

  private async flushPendingDeletes(): Promise<void> {
    const d = this.pendingDeletes;
    await Promise.all([
      ...d.medicamentos.map((id) => this.firebaseDataService.deleteMedicine(id)),
      ...d.clientes.map((id) => this.firebaseDataService.deleteCustomer(id)),
      ...d.pedidos.map((id) => this.firebaseDataService.deleteOrder(id)),
      ...d.proveedores.map((id) => this.firebaseDataService.deleteSupplier(id)),
    ]);
    this.pendingDeletes = this.emptyPendingDeletes();
  }

  private queueDelete(collection: DataCollection, id: number): void {
    if (!this.pendingDeletes[collection].includes(id)) {
      this.pendingDeletes[collection] = [...this.pendingDeletes[collection], id];
    }
  }

  private removeQueuedDelete(collection: DataCollection, id: number): void {
    this.pendingDeletes[collection] = this.pendingDeletes[collection].filter((item) => item !== id);
    this.saveData();
  }

  private emptyPendingDeletes(): PendingDeletes {
    return { medicamentos: [], clientes: [], pedidos: [], proveedores: [] };
  }

  private hasInternet(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }

  private updateStatus(): void {
    this.isOnline = this.hasInternet();
    if (!this.authReady) { this.firebaseStatus = 'Preparando...'; return; }
    if (!this.currentUser) { this.firebaseStatus = this.isOnline ? 'Acceso seguro' : 'Sin internet'; return; }
    if (!this.isOnline) { this.firebaseStatus = this.pendingChanges ? 'Guardado local' : 'Sin internet'; return; }
    if (this.isSyncing) { this.firebaseStatus = 'Sincronizando...'; return; }
    this.firebaseStatus = this.pendingChanges ? 'Pendiente de subir' : 'Datos actualizados';
  }

  private createId(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  private findCustomerId(name: string): number {
    return this.customers.find((c) => c.name === name)?.id ?? 0;
  }

  private findMedicineId(name: string): number {
    return this.medicines.find((m) => m.name === name)?.id ?? 0;
  }
}
