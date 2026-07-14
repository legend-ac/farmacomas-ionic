import type { AppData, Customer, Medicine, Order, Supplier } from './models';

// ─────────────────────────────────────────────────────────────────
//  PROVEEDORES — 8 laboratorios / distribuidoras peruanas
// ─────────────────────────────────────────────────────────────────
const suppliers: Supplier[] = [
  { id: 1001, name: 'Medifarma S.A.', contact: 'Carlos Mendoza', phone: '014517890', email: 'ventas@medifarma.com.pe', city: 'Lima', category: 'General', registeredAt: '2024-01-10' },
  { id: 1002, name: 'Laboratorios Bagó Perú', contact: 'Ana Villanueva', phone: '014323000', email: 'pedidos@bago.com.pe', city: 'Lima', category: 'Antibióticos', registeredAt: '2024-01-15' },
  { id: 1003, name: 'Farmaindustria S.A.C.', contact: 'Roberto Cáceres', phone: '014210560', email: 'comercial@farmaindustria.pe', city: 'Lima', category: 'Antiinflamatorios', registeredAt: '2024-02-01' },
  { id: 1004, name: 'Hersil S.A.', contact: 'Lucía Paredes', phone: '014349900', email: 'info@hersil.com.pe', city: 'Lima', category: 'Vitaminas', registeredAt: '2024-02-10' },
  { id: 1005, name: 'Teva Perú S.A.C.', contact: 'Miguel Flores', phone: '014562100', email: 'teva@teva.com.pe', city: 'Lima', category: 'Genéricos', registeredAt: '2024-03-05' },
  { id: 1006, name: 'Roche Perú S.A.', contact: 'Patricia Quispe', phone: '016116100', email: 'roche@roche.com.pe', city: 'Lima', category: 'Especialidades', registeredAt: '2024-03-20' },
  { id: 1007, name: 'Droguería San Martín', contact: 'José Huamán', phone: '017800042', email: 'sanmartin@drogueria.pe', city: 'Callao', category: 'Distribución', registeredAt: '2024-04-01' },
  { id: 1008, name: 'DECO Distribuciones', contact: 'Sandra Llerena', phone: '013401789', email: 'deco@decodist.pe', city: 'Lima', category: 'Suplementos', registeredAt: '2024-04-15' },
];

// ─────────────────────────────────────────────────────────────────
//  MEDICAMENTOS — 30 productos con datos reales peruanos
// ─────────────────────────────────────────────────────────────────
const medicines: Medicine[] = [
  // ── Analgésicos / Antipiréticos ──
  { id: 2001, name: 'Paracetamol 500 mg x 20 tab', category: 'Analgésico', stock: 180, minStock: 30, price: 2.50, laboratoryName: 'Medifarma', barcode: '7750260011001', expiryDate: '2026-08-31', unitType: 'tableta', requiresPrescription: false, description: 'Tabletas para alivio del dolor y fiebre' },
  { id: 2002, name: 'Ibuprofeno 400 mg x 20 tab', category: 'Antiinflamatorio', stock: 140, minStock: 25, price: 4.80, laboratoryName: 'Farmaindustria', barcode: '7750260012002', expiryDate: '2026-12-31', unitType: 'tableta', requiresPrescription: false, description: 'Antiinflamatorio no esteroideo' },
  { id: 2003, name: 'Naproxeno 550 mg x 10 tab', category: 'Antiinflamatorio', stock: 80, minStock: 15, price: 6.50, laboratoryName: 'Teva', barcode: '7750260013003', expiryDate: '2026-10-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2004, name: 'Metamizol 500 mg x 10 tab', category: 'Analgésico', stock: 95, minStock: 20, price: 5.20, laboratoryName: 'Hersil', barcode: '7750260014004', expiryDate: '2027-03-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2005, name: 'Ketorolaco 10 mg x 10 tab', category: 'Analgésico', stock: 45, minStock: 10, price: 8.90, laboratoryName: 'Bagó', barcode: '7750260015005', expiryDate: '2026-06-30', unitType: 'tableta', requiresPrescription: true },

  // ── Antibióticos ──
  { id: 2006, name: 'Amoxicilina 500 mg x 21 cap', category: 'Antibiótico', stock: 90, minStock: 20, price: 12.00, laboratoryName: 'Bagó', barcode: '7750260016006', expiryDate: '2026-09-30', unitType: 'cápsula', requiresPrescription: true, description: 'Antibiótico penicilínico de amplio espectro' },
  { id: 2007, name: 'Azitromicina 500 mg x 3 tab', category: 'Antibiótico', stock: 60, minStock: 15, price: 18.50, laboratoryName: 'Medifarma', barcode: '7750260017007', expiryDate: '2027-01-31', unitType: 'tableta', requiresPrescription: true },
  { id: 2008, name: 'Ciprofloxacino 500 mg x 14 tab', category: 'Antibiótico', stock: 55, minStock: 12, price: 15.80, laboratoryName: 'Teva', barcode: '7750260018008', expiryDate: '2026-11-30', unitType: 'tableta', requiresPrescription: true },
  { id: 2009, name: 'Clindamicina 300 mg x 10 cap', category: 'Antibiótico', stock: 40, minStock: 10, price: 22.00, laboratoryName: 'Roche', barcode: '7750260019009', expiryDate: '2027-02-28', unitType: 'cápsula', requiresPrescription: true },
  { id: 2010, name: 'Trimetoprim/Sulfametoxazol 160/800 x 14 tab', category: 'Antibiótico', stock: 70, minStock: 15, price: 9.90, laboratoryName: 'Hersil', barcode: '7750260020010', expiryDate: '2026-07-31', unitType: 'tableta', requiresPrescription: true },

  // ── Gastrointestinales ──
  { id: 2011, name: 'Omeprazol 20 mg x 14 cap', category: 'Gastrointestinal', stock: 160, minStock: 30, price: 7.50, laboratoryName: 'Medifarma', barcode: '7750260021011', expiryDate: '2027-05-31', unitType: 'cápsula', requiresPrescription: false },
  { id: 2012, name: 'Ranitidina 150 mg x 20 tab', category: 'Gastrointestinal', stock: 110, minStock: 20, price: 5.80, laboratoryName: 'Farmaindustria', barcode: '7750260022012', expiryDate: '2026-12-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2013, name: 'Metoclopramida 10 mg x 20 tab', category: 'Gastrointestinal', stock: 85, minStock: 15, price: 4.90, laboratoryName: 'Hersil', barcode: '7750260023013', expiryDate: '2027-01-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2014, name: 'Suero Oral Rehidratación x 5 sobres', category: 'Gastrointestinal', stock: 200, minStock: 40, price: 3.50, laboratoryName: 'DECO', barcode: '7750260024014', expiryDate: '2027-06-30', unitType: 'sobre', requiresPrescription: false },
  { id: 2015, name: 'Loperamida 2 mg x 12 cap', category: 'Gastrointestinal', stock: 120, minStock: 20, price: 6.20, laboratoryName: 'Bagó', barcode: '7750260025015', expiryDate: '2027-04-30', unitType: 'cápsula', requiresPrescription: false },

  // ── Vitaminas / Suplementos ──
  { id: 2016, name: 'Vitamina C 500 mg x 20 tab', category: 'Vitamina', stock: 250, minStock: 50, price: 3.90, laboratoryName: 'Hersil', barcode: '7750260026016', expiryDate: '2027-08-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2017, name: 'Vitamina D3 2000 UI x 30 cap', category: 'Vitamina', stock: 130, minStock: 25, price: 14.50, laboratoryName: 'DECO', barcode: '7750260027017', expiryDate: '2027-06-30', unitType: 'cápsula', requiresPrescription: false },
  { id: 2018, name: 'Complejo B x 30 tab', category: 'Vitamina', stock: 175, minStock: 30, price: 8.00, laboratoryName: 'Farmaindustria', barcode: '7750260028018', expiryDate: '2027-07-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2019, name: 'Zinc 20 mg x 30 tab', category: 'Suplemento', stock: 90, minStock: 20, price: 11.00, laboratoryName: 'DECO', barcode: '7750260029019', expiryDate: '2027-05-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2020, name: 'Hierro 325 mg x 30 tab', category: 'Suplemento', stock: 70, minStock: 15, price: 9.50, laboratoryName: 'Medifarma', barcode: '7750260030020', expiryDate: '2027-03-31', unitType: 'tableta', requiresPrescription: false },

  // ── Cardiovasculares / Hipertensión ──
  { id: 2021, name: 'Enalapril 10 mg x 20 tab', category: 'Cardiovascular', stock: 95, minStock: 20, price: 5.50, laboratoryName: 'Teva', barcode: '7750260031021', expiryDate: '2027-02-28', unitType: 'tableta', requiresPrescription: true },
  { id: 2022, name: 'Losartán 50 mg x 28 tab', category: 'Cardiovascular', stock: 80, minStock: 15, price: 12.00, laboratoryName: 'Roche', barcode: '7750260032022', expiryDate: '2027-01-31', unitType: 'tableta', requiresPrescription: true },
  { id: 2023, name: 'Metformina 850 mg x 30 tab', category: 'Antidiabético', stock: 60, minStock: 12, price: 8.70, laboratoryName: 'Bagó', barcode: '7750260033023', expiryDate: '2027-04-30', unitType: 'tableta', requiresPrescription: true },

  // ── Sistema Respiratorio ──
  { id: 2024, name: 'Salbutamol Jarabe 2 mg/5 ml 100 ml', category: 'Broncodilatador', stock: 50, minStock: 10, price: 9.80, laboratoryName: 'Farmaindustria', barcode: '7750260034024', expiryDate: '2026-10-31', unitType: 'jarabe', requiresPrescription: false },
  { id: 2025, name: 'Loratadina 10 mg x 10 tab', category: 'Antihistamínico', stock: 145, minStock: 25, price: 4.50, laboratoryName: 'Medifarma', barcode: '7750260035025', expiryDate: '2027-07-31', unitType: 'tableta', requiresPrescription: false },
  { id: 2026, name: 'Ambroxol Jarabe 15 mg/5 ml 120 ml', category: 'Expectorante', stock: 75, minStock: 15, price: 7.20, laboratoryName: 'Hersil', barcode: '7750260036026', expiryDate: '2027-05-31', unitType: 'jarabe', requiresPrescription: false },

  // ── Dermatología / Tópicos ──
  { id: 2027, name: 'Clotrimazol Crema 1% 20 g', category: 'Antifúngico', stock: 65, minStock: 12, price: 7.90, laboratoryName: 'Farmaindustria', barcode: '7750260037027', expiryDate: '2027-09-30', unitType: 'crema', requiresPrescription: false },
  { id: 2028, name: 'Diclofenaco Gel 1% 60 g', category: 'Antiinflamatorio Tópico', stock: 88, minStock: 18, price: 10.50, laboratoryName: 'Teva', barcode: '7750260038028', expiryDate: '2027-11-30', unitType: 'crema', requiresPrescription: false },

  // ── Vías urinarias ──
  { id: 2029, name: 'Fosfomicina 3 g Sobres x 2', category: 'Antibiótico Urinario', stock: 35, minStock: 8, price: 24.00, laboratoryName: 'Roche', barcode: '7750260039029', expiryDate: '2027-02-28', unitType: 'sobre', requiresPrescription: true },

  // ── Neurológico ──
  { id: 2030, name: 'Carbamazepina 200 mg x 20 tab', category: 'Neurológico', stock: 30, minStock: 8, price: 16.00, laboratoryName: 'Bagó', barcode: '7750260040030', expiryDate: '2026-09-30', unitType: 'tableta', requiresPrescription: true },
];

// ─────────────────────────────────────────────────────────────────
//  CLIENTES — 15 pacientes de Lima Norte / Lima Este
// ─────────────────────────────────────────────────────────────────
const customers: Customer[] = [
  { id: 3001, name: 'María Elena García Ríos', phone: '943210001', district: 'Comas', email: 'maria.garcia@gmail.com', address: 'Av. Belaúnde 1234, Urb. El Retablo', birthDate: '1980-05-12', loyaltyPoints: 320, totalOrders: 14, registeredAt: '2024-01-20' },
  { id: 3002, name: 'Juan Carlos López Huamán', phone: '952310002', district: 'Los Olivos', email: 'jclopez@outlook.com', address: 'Jr. Las Camelias 456, Los Olivos', birthDate: '1975-09-23', loyaltyPoints: 180, totalOrders: 8, registeredAt: '2024-02-05' },
  { id: 3003, name: 'Rosa Pilar Quispe Mamani', phone: '961450003', district: 'San Juan de Lurigancho', email: '', address: 'Av. Gran Chimú 789, SJL', birthDate: '1992-03-14', loyaltyPoints: 75, totalOrders: 4, registeredAt: '2024-02-18' },
  { id: 3004, name: 'Carlos Alberto Mendoza Torres', phone: '970560004', district: 'Independencia', email: 'cmendoza@hotmail.com', address: 'Calle Los Pinos 321, Independencia', birthDate: '1968-11-07', loyaltyPoints: 540, totalOrders: 22, registeredAt: '2024-01-08' },
  { id: 3005, name: 'Ana Sofía Vargas Chávez', phone: '989670005', district: 'Comas', email: 'avargas@gmail.com', address: 'Psje. Las Flores 100, Comas', birthDate: '1988-07-30', loyaltyPoints: 210, totalOrders: 9, registeredAt: '2024-03-01' },
  { id: 3006, name: 'Pedro Antonio Flores Ramos', phone: '912780006', district: 'Carabayllo', email: '', address: 'Av. Túpac Amaru Km 22, Carabayllo', birthDate: '1955-01-18', loyaltyPoints: 420, totalOrders: 18, registeredAt: '2024-01-25' },
  { id: 3007, name: 'Lucía Fernanda Herrera Salinas', phone: '921890007', district: 'Puente Piedra', email: 'lherrera@gmail.com', address: 'Jr. San Martín 567, Puente Piedra', birthDate: '1995-04-22', loyaltyPoints: 90, totalOrders: 5, registeredAt: '2024-03-15' },
  { id: 3008, name: 'Miguel Ángel Castillo Díaz', phone: '930900008', district: 'Los Olivos', email: 'm.castillo@empresa.pe', address: 'Av. Naranjal 890, Los Olivos', birthDate: '1970-12-05', loyaltyPoints: 650, totalOrders: 27, registeredAt: '2024-01-12' },
  { id: 3009, name: 'Gloria Patricia Reyes Vega', phone: '948010009', district: 'San Juan de Lurigancho', email: '', address: 'Av. Próceres 1010, SJL', birthDate: '1983-08-16', loyaltyPoints: 130, totalOrders: 6, registeredAt: '2024-04-02' },
  { id: 3010, name: 'Roberto Enrique Sánchez Cruz', phone: '957120010', district: 'Comas', email: 'rsanchez@gmail.com', address: 'Jr. Los Sauces 234, Comas', birthDate: '1978-02-28', loyaltyPoints: 290, totalOrders: 12, registeredAt: '2024-02-20' },
  { id: 3011, name: 'Elena Beatriz Torres Paredes', phone: '966230011', district: 'Independencia', email: 'e.torres@live.com', address: 'Calle Miraflores 678, Independencia', birthDate: '1990-06-10', loyaltyPoints: 160, totalOrders: 7, registeredAt: '2024-03-08' },
  { id: 3012, name: 'Fernando José Medina Llanos', phone: '975340012', district: 'Carabayllo', email: '', address: 'Av. Carabayllo 345, Carabayllo', birthDate: '1960-10-20', loyaltyPoints: 380, totalOrders: 16, registeredAt: '2024-02-14' },
  { id: 3013, name: 'Carmen Rosa Alvarado Meza', phone: '984450013', district: 'Comas', email: 'calvarado@yahoo.com', address: 'Urb. El Pinar Mz. C Lt. 12, Comas', birthDate: '1972-03-25', loyaltyPoints: 460, totalOrders: 20, registeredAt: '2024-01-30' },
  { id: 3014, name: 'Víctor Hugo Ramírez León', phone: '993560014', district: 'Los Olivos', email: 'vramirez@gmail.com', address: 'Av. Los Alisos 1212, Los Olivos', birthDate: '1985-09-03', loyaltyPoints: 200, totalOrders: 9, registeredAt: '2024-03-22' },
  { id: 3015, name: 'Isabel Concepción Gutiérrez Paz', phone: '902670015', district: 'Puente Piedra', email: '', address: 'Jr. Huánuco 543, Puente Piedra', birthDate: '1948-12-15', loyaltyPoints: 710, totalOrders: 30, registeredAt: '2024-01-05' },
];

// ─────────────────────────────────────────────────────────────────
//  PEDIDOS — 20 ventas históricas
// ─────────────────────────────────────────────────────────────────
const orders: Order[] = [
  { id: 4001, customerId: 3015, customerName: 'Isabel Concepción Gutiérrez Paz', medicineId: 2021, medicineName: 'Enalapril 10 mg x 20 tab', quantity: 2, status: 'Entregado', createdAt: '2026-06-01', totalPrice: 11.00, paymentMethod: 'efectivo', deliveredAt: '2026-06-01' },
  { id: 4002, customerId: 3008, customerName: 'Miguel Ángel Castillo Díaz', medicineId: 2006, medicineName: 'Amoxicilina 500 mg x 21 cap', quantity: 1, status: 'Entregado', createdAt: '2026-06-03', totalPrice: 12.00, paymentMethod: 'yape', deliveredAt: '2026-06-03' },
  { id: 4003, customerId: 3001, customerName: 'María Elena García Ríos', medicineId: 2001, medicineName: 'Paracetamol 500 mg x 20 tab', quantity: 3, status: 'Entregado', createdAt: '2026-06-05', totalPrice: 7.50, paymentMethod: 'efectivo', deliveredAt: '2026-06-05' },
  { id: 4004, customerId: 3004, customerName: 'Carlos Alberto Mendoza Torres', medicineId: 2022, medicineName: 'Losartán 50 mg x 28 tab', quantity: 2, status: 'Entregado', createdAt: '2026-06-07', totalPrice: 24.00, paymentMethod: 'transferencia', deliveredAt: '2026-06-07' },
  { id: 4005, customerId: 3013, customerName: 'Carmen Rosa Alvarado Meza', medicineId: 2011, medicineName: 'Omeprazol 20 mg x 14 cap', quantity: 2, status: 'Entregado', createdAt: '2026-06-08', totalPrice: 15.00, paymentMethod: 'plin', deliveredAt: '2026-06-08' },
  { id: 4006, customerId: 3010, customerName: 'Roberto Enrique Sánchez Cruz', medicineId: 2016, medicineName: 'Vitamina C 500 mg x 20 tab', quantity: 4, status: 'Entregado', createdAt: '2026-06-10', totalPrice: 15.60, paymentMethod: 'efectivo', deliveredAt: '2026-06-10' },
  { id: 4007, customerId: 3006, customerName: 'Pedro Antonio Flores Ramos', medicineId: 2023, medicineName: 'Metformina 850 mg x 30 tab', quantity: 2, status: 'Entregado', createdAt: '2026-06-12', totalPrice: 17.40, paymentMethod: 'yape', deliveredAt: '2026-06-12' },
  { id: 4008, customerId: 3002, customerName: 'Juan Carlos López Huamán', medicineId: 2007, medicineName: 'Azitromicina 500 mg x 3 tab', quantity: 1, status: 'Entregado', createdAt: '2026-06-13', totalPrice: 18.50, paymentMethod: 'tarjeta', deliveredAt: '2026-06-13' },
  { id: 4009, customerId: 3005, customerName: 'Ana Sofía Vargas Chávez', medicineId: 2025, medicineName: 'Loratadina 10 mg x 10 tab', quantity: 2, status: 'Entregado', createdAt: '2026-06-15', totalPrice: 9.00, paymentMethod: 'efectivo', deliveredAt: '2026-06-15' },
  { id: 4010, customerId: 3012, customerName: 'Fernando José Medina Llanos', medicineId: 2002, medicineName: 'Ibuprofeno 400 mg x 20 tab', quantity: 3, status: 'Entregado', createdAt: '2026-06-17', totalPrice: 14.40, paymentMethod: 'yape', deliveredAt: '2026-06-17' },
  { id: 4011, customerId: 3003, customerName: 'Rosa Pilar Quispe Mamani', medicineId: 2014, medicineName: 'Suero Oral Rehidratación x 5 sobres', quantity: 5, status: 'Entregado', createdAt: '2026-06-18', totalPrice: 17.50, paymentMethod: 'efectivo', deliveredAt: '2026-06-18' },
  { id: 4012, customerId: 3014, customerName: 'Víctor Hugo Ramírez León', medicineId: 2018, medicineName: 'Complejo B x 30 tab', quantity: 2, status: 'Entregado', createdAt: '2026-06-20', totalPrice: 16.00, paymentMethod: 'plin', deliveredAt: '2026-06-20' },
  { id: 4013, customerId: 3011, customerName: 'Elena Beatriz Torres Paredes', medicineId: 2027, medicineName: 'Clotrimazol Crema 1% 20 g', quantity: 1, status: 'Entregado', createdAt: '2026-06-22', totalPrice: 7.90, paymentMethod: 'efectivo', deliveredAt: '2026-06-22' },
  { id: 4014, customerId: 3007, customerName: 'Lucía Fernanda Herrera Salinas', medicineId: 2026, medicineName: 'Ambroxol Jarabe 15 mg/5 ml 120 ml', quantity: 1, status: 'Entregado', createdAt: '2026-06-24', totalPrice: 7.20, paymentMethod: 'yape', deliveredAt: '2026-06-24' },
  { id: 4015, customerId: 3009, customerName: 'Gloria Patricia Reyes Vega', medicineId: 2015, medicineName: 'Loperamida 2 mg x 12 cap', quantity: 2, status: 'Entregado', createdAt: '2026-06-25', totalPrice: 12.40, paymentMethod: 'efectivo', deliveredAt: '2026-06-25' },
  { id: 4016, customerId: 3001, customerName: 'María Elena García Ríos', medicineId: 2017, medicineName: 'Vitamina D3 2000 UI x 30 cap', quantity: 1, status: 'Entregado', createdAt: '2026-06-27', totalPrice: 14.50, paymentMethod: 'yape', deliveredAt: '2026-06-27' },
  { id: 4017, customerId: 3004, customerName: 'Carlos Alberto Mendoza Torres', medicineId: 2011, medicineName: 'Omeprazol 20 mg x 14 cap', quantity: 3, status: 'Entregado', createdAt: '2026-06-28', totalPrice: 22.50, paymentMethod: 'transferencia', deliveredAt: '2026-06-28' },
  { id: 4018, customerId: 3008, customerName: 'Miguel Ángel Castillo Díaz', medicineId: 2028, medicineName: 'Diclofenaco Gel 1% 60 g', quantity: 2, status: 'Pendiente', createdAt: '2026-06-30', totalPrice: 21.00, paymentMethod: 'yape' },
  { id: 4019, customerId: 3013, customerName: 'Carmen Rosa Alvarado Meza', medicineId: 2008, medicineName: 'Ciprofloxacino 500 mg x 14 tab', quantity: 1, status: 'Pendiente', createdAt: '2026-06-30', totalPrice: 15.80, paymentMethod: 'efectivo' },
  { id: 4020, customerId: 3015, customerName: 'Isabel Concepción Gutiérrez Paz', medicineId: 2022, medicineName: 'Losartán 50 mg x 28 tab', quantity: 2, status: 'Pendiente', createdAt: '2026-06-30', totalPrice: 24.00, paymentMethod: 'yape' },
];

export const SEED_DATA: AppData = {
  medicines,
  customers,
  orders,
  suppliers,
};
