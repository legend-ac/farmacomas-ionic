import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FirebaseDataService } from '../services/firebase-data.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  const firebaseDataServiceMock = {
    testConnection: jasmine.createSpy('testConnection').and.resolveTo(),
    getMedicines: jasmine.createSpy('getMedicines').and.resolveTo([]),
    getCustomers: jasmine.createSpy('getCustomers').and.resolveTo([]),
    getOrders: jasmine.createSpy('getOrders').and.resolveTo([]),
    loadAll: jasmine.createSpy('loadAll').and.resolveTo({ medicines: [], customers: [], orders: [] }),
    syncAll: jasmine.createSpy('syncAll').and.resolveTo(),
    deleteMedicine: jasmine.createSpy('deleteMedicine').and.resolveTo(),
    deleteCustomer: jasmine.createSpy('deleteCustomer').and.resolveTo(),
    deleteOrder: jasmine.createSpy('deleteOrder').and.resolveTo(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [FormsModule, IonicModule.forRoot()],
      providers: [{ provide: FirebaseDataService, useValue: firebaseDataServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register a medicine', () => {
    component.medicineForm = {
      name: 'Naproxeno 550 mg',
      category: 'Antiinflamatorio',
      stock: 15,
      minStock: 5,
      price: 2.5,
    };

    component.addMedicine();

    expect(component.medicines.some((medicine) => medicine.name === 'Naproxeno 550 mg')).toBeTrue();
    expect(component.actionMessage).toContain('Medicamento guardado');
  });

  it('should register a customer', () => {
    component.customerForm = {
      name: 'Ana Lopez',
      phone: '999888777',
      district: 'Comas',
    };

    component.addCustomer();

    expect(component.customers.some((customer) => customer.name === 'Ana Lopez')).toBeTrue();
    expect(component.actionMessage).toContain('Cliente guardado');
  });

  it('should create an order and discount stock', () => {
    const originalStock = component.medicines[0].stock;

    component.orderForm = {
      customerName: component.customers[0].name,
      medicineName: component.medicines[0].name,
      quantity: 3,
    };

    component.createOrder();

    expect(component.orders[0].quantity).toBe(3);
    expect(component.medicines[0].stock).toBe(originalStock - 3);
    expect(component.actionMessage).toContain('stock descontado');
  });
});
