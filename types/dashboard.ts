export type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance?: number;
  isActive: boolean;
};

export type Customer = {
  id: string;
  macolaCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};

export type Vendor = {
  id: string;
  macolaCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};

export type ItemLot = {
  id: string;
  inventoryItemId: string;
  lotNumber: string;
  quantity: number;
  manufactureDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
};

export type ItemSerial = {
  id: string;
  inventoryItemId: string;
  serialNumber: string;
  status: string; // "DISPONIBLE" | "VENDIDO" | "RESERVADO" | "DEFECTUOSO"
  notes?: string | null;
};

export type InventoryItem = {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  trackingType?: string; // "NONE" | "LOT" | "SERIAL"
  imageUrl?: string | null;
  lots?: ItemLot[];
  serials?: ItemSerial[];
};

export type BankAccount = {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  currency: string;
  bankBalance: number;
  bookBalance: number;
  lastUpdated: string;
  status: string;
  color: string;
  pendingCount?: number;
};

export type BankTransaction = {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  payee: string;
  type: string;
  amount: number;
  suggestedAccount: string;
  ruleApplied: string | null;
  status: string;
  bankAccount?: {
    id: string;
    name: string;
    accountNumber: string;
    color: string;
  };
};

export type BankRule = {
  id: string;
  name: string;
  condition: string;
  targetAccount: string;
  autoConfirm: boolean;
  active: boolean;
};

export type CreditDebitNote = {
  id: string;
  noteNumber: string;
  type: "CREDIT" | "DEBIT";
  entityType: "CUSTOMER" | "VENDOR";
  entityId?: string | null;
  entityName: string;
  targetDocNum?: string | null;
  issueDate: string;
  reason: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: string; // "APLICADA" | "BORRADOR" | "ANULADA"
  notes?: string | null;
  createdAt?: string;
};

export type SalesRep = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  zone: string | null;
  commissionRate: number;
  commissionType: string;
  monthlyTarget: number;
  status: string;
  notes?: string | null;
  commissions?: CommissionRecord[];
};

export type CommissionRecord = {
  id: string;
  salesRepId: string;
  salesRepName: string;
  period: string;
  invoiceNumber: string | null;
  customerName: string | null;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  paidDate: string | null;
  notes?: string | null;
};

export type InvoiceLine = {
  id: string;
  serviceDate: string;
  productId: string;
  productName: string;
  sku: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type Invoice = {
  num: string;
  date: string;
  customer: string;
  due: string;
  total: number;
  status: string;
  paymentTerms?: string;
  customerEmail?: string;
  lines?: InvoiceLine[];
};

export type InvoiceFormData = {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  deliveredTo: string;
  deliveryAddress: string;
  currency: string;
  discount: number;
  importeExonerado: number;
  importeExento: number;
  impGravado15: number;
  impGravado18: number;
  showImpGravado15: boolean;
  applyIsv15: boolean;
  applyIsv18: boolean;
  isExonerated: boolean;
  isExempt: boolean;
  status: string;
  paymentTerms: string;
  invoiceDate: string;
  dueDate: string;
  paymentInstructions: string;
  customerNote: string;
  statementNote: string;
  lines: InvoiceLine[];
};

export type InvoiceDesign = {
  preset: string;
  template: "Moderno" | "Standard";
  color: string;
  font: string;
  printerFriendly: boolean;
  showTotal: boolean;
  showBankDeposit: boolean;
  showEarlyDiscount: boolean;
};

export type PurchaseInvoiceItem = {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  lotNumber?: string | null;
};

export type PurchaseInvoice = {
  id: string;
  invoiceNumber: string;
  purchaseOrderNumber?: string | null;
  vendorId?: string | null;
  vendorName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  inventoryStatus: string;
  notes?: string | null;
  items?: PurchaseInvoiceItem[];
  createdAt?: string;
};

export type PurchaseOrder = {
  id?: string;
  num: string;
  date: string;
  vendor: string;
  vendorId?: string;
  vendorEmail?: string;
  vendorAddress?: string;
  category: string;
  total: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  expectedDate?: string;
  paymentTerms?: string;
  status: string;
  notes?: string;
  items?: any[];
};

export type VendorReturnItem = {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  lotNumber: string;
  itemReason: string;
};

export type VendorReturnRecord = {
  id: string;
  returnNumber: string;
  vendorName: string;
  vendorId?: string;
  purchaseInvoiceNumber?: string;
  returnDate: string;
  reason: string;
  status: string;
  currency: string;
  subtotal: number;
  total: number;
  notes?: string;
  items: VendorReturnItem[];
  createdAt?: string;
};

export type CompanySettings = {
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
  sitioWeb?: string;
  sector?: string;
  nombreLegal?: string;
  taxId?: string;
  cai?: string;
  rangoAutorizado?: string;
  fechaLimiteEmision?: string;
  tipoEmpresa?: string;
  domicilioLegal?: string;
  emailCliente?: string;
  direccionCliente?: string;
  contadorNombre?: string;
  contadorTitulo?: string;
  contadorColegiacion?: string;
  contadorTelefono?: string;
  contadorEmail?: string;
};

export type NavItem =
  | "dashboard"
  | "plan-cuentas"
  | "transacciones"
  | "conciliacion-bancaria"
  | "macola-sync"
  | "caja-chica"
  | "clientes"
  | "cotizaciones"
  | "pedidos-venta"
  | "proveedores"
  | "vendedores"
  | "comisiones"
  | "inventario"
  | "lotes"
  | "series"
  | "notas-credito-debito"
  | "reportes"
  | "configuracion"
  | "factura-editor"
  | "lista-facturas"
  | "lista-ordenes-compra"
  | "orden-compra-editor"
  | "factura-compra-lista"
  | "factura-compra-editor"
  | "deposito-bancario"
  | "recibir-pago"
  | "agregar-gasto"
  | "pagar-proveedor"
  | "pagos-proveedores"
  | "devoluciones-proveedor"
  | "antiguedad-saldos"
  | "antiguedad-saldos-proveedores"
  | "estado-cuenta-cliente"
  | "retenciones-isv";
