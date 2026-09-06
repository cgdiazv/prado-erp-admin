"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Factory, Package, Tag, Boxes, AlertCircle, Clock, CheckCircle2, ShieldAlert, Layers, Hash, BookOpen, Download, Upload, FileSpreadsheet, ArrowRight, ArrowLeft, RefreshCw, X, FileText, Calendar, CreditCard, Printer, Database, ArrowUpDown, FileUp, FolderOpen, HelpCircle, Receipt, Check } from "lucide-react";
import CajaChicaModule from "@/components/CajaChicaModule";
import AccountingBooksModule from "@/components/AccountingBooksModule";
import CustomerAgingReportModule from "@/components/CustomerAgingReportModule";
import CustomerStatementModule from "@/components/CustomerStatementModule";
import VendorAgingReportModule from "@/components/VendorAgingReportModule";
import QuotesModule from "@/components/QuotesModule";
import TaxRetentionsModule from "@/components/TaxRetentionsModule";
import VendorPaymentsModule from "@/components/VendorPaymentsModule";
import BankReconciliationModule from "@/components/BankReconciliationModule";
import SalesOrdersModule from "@/components/SalesOrdersModule";
import CustomersModule from "@/components/CustomersModule";
import VendorsModule from "@/components/VendorsModule";
import InventoryModule from "@/components/InventoryModule";
import CommissionsModule from "@/components/CommissionsModule";
import { Skeleton, CardSkeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { InvoicesModule, numberToWordsSpanish } from "@/components/InvoicesModule";
import { PurchasesModule } from "@/components/PurchasesModule";
import { VendorReturnRecord } from "@/types/dashboard";
import { CashMovementsModule } from "@/components/CashMovementsModule";
import CreditDebitNotesModule from "@/components/CreditDebitNotesModule";



type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance?: number;
  isActive: boolean;
};

type Customer = {
  id: string;
  macolaCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};

type Vendor = {
  id: string;
  macolaCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};

type ItemLot = {
  id: string;
  inventoryItemId: string;
  lotNumber: string;
  quantity: number;
  manufactureDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
};

type ItemSerial = {
  id: string;
  inventoryItemId: string;
  serialNumber: string;
  status: string; // "DISPONIBLE" | "VENDIDO" | "RESERVADO" | "DEFECTUOSO"
  notes?: string | null;
};

type InventoryItem = {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  trackingType?: string; // "NONE" | "LOT" | "SERIAL"
  lots?: ItemLot[];
  serials?: ItemSerial[];
};


type BankAccount = {
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

type BankTransaction = {
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

type BankRule = {
  id: string;
  name: string;
  condition: string;
  targetAccount: string;
  autoConfirm: boolean;
  active: boolean;
};

type CreditDebitNote = {
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

type SalesRep = {

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

type CommissionRecord = {
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

type PurchaseInvoiceItem = {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  lotNumber?: string | null;
};

type PurchaseInvoice = {
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

type NavItem = "dashboard" | "plan-cuentas" | "transacciones" | "conciliacion-bancaria" | "macola-sync" | "caja-chica" | "clientes" | "cotizaciones" | "pedidos-venta" | "proveedores" | "vendedores" | "comisiones" | "inventario" | "lotes" | "series" | "notas-credito-debito" | "reportes" | "configuracion" | "factura-editor" | "lista-facturas" | "lista-ordenes-compra" | "orden-compra-editor" | "factura-compra-lista" | "factura-compra-editor" | "deposito-bancario" | "recibir-pago" | "agregar-gasto" | "pagar-proveedor" | "pagos-proveedores" | "devoluciones-proveedor" | "antiguedad-saldos" | "antiguedad-saldos-proveedores" | "estado-cuenta-cliente" | "retenciones-isv";






export default function AdminDashboard() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<NavItem>("dashboard");
  const [previousInvoiceView, setPreviousInvoiceView] = useState<NavItem>("dashboard");
  const [selectedStatementCustomerId, setSelectedStatementCustomerId] = useState<string>("");
  const [selectedPaymentVendor, setSelectedPaymentVendor] = useState<string>("");

  const openCustomerStatement = (customerIdOrName: string) => {
    setSelectedStatementCustomerId(customerIdOrName);
    setCurrentView("estado-cuenta-cliente");
  };

  const closeInvoiceEditor = () => {
    setEditingInvoice(null);
    setCurrentView(previousInvoiceView || "dashboard");
  };

  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<{
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
  } | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<Array<{
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
  }>>([]);

  const [invoicesList, setInvoicesList] = useState<Array<{
    num: string;
    date: string;
    customer: string;
    due: string;
    total: number;
    status: string;
    paymentTerms?: string;
    customerEmail?: string;
    lines?: Array<{
      id: string;
      serviceDate: string;
      productId: string;
      productName: string;
      sku: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  }>>([]);

  const loadPurchaseOrders = async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPurchaseOrders(
          json.data.map((po: any) => ({
            id: po.id,
            num: po.orderNumber,
            date: po.issueDate,
            vendor: po.vendorName,
            vendorId: po.vendorId,
            vendorEmail: po.vendorEmail,
            vendorAddress: po.vendorAddress,
            category: po.category,
            total: Number(po.total) || 0,
            subtotal: Number(po.subtotal) || 0,
            tax: Number(po.tax) || 0,
            currency: po.currency || "USD",
            expectedDate: po.expectedDate,
            paymentTerms: po.paymentTerms,
            status: po.status,
            notes: po.notes,
            items: po.items || [],
          }))
        );
      }
    } catch (err) {
      console.error("Error loading purchase orders:", err);
    }
  };

  const handleUpdatePOStatus = async (poNum: string, newStatus: string) => {
    // Optimistic UI update
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.num === poNum ? { ...po, status: newStatus } : po))
    );
    if (selectedPurchaseOrder && selectedPurchaseOrder.num === poNum) {
      setSelectedPurchaseOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/purchase-orders/${encodeURIComponent(poNum)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Error al actualizar estado de orden en BD:", data.error);
        await loadPurchaseOrders();
      }
    } catch (err) {
      console.error("Error al sincronizar estado de orden con el servidor:", err);
      await loadPurchaseOrders();
    }
  };

  const handleUpdateInvoiceStatus = (num: string, newStatus: string) => {
    setInvoicesList((prev) =>
      prev.map((inv) => (inv.num === num ? { ...inv, status: newStatus } : inv))
    );
  };

  // Dynamic Facturas Statistics
  const totalFacturado = invoicesList.reduce((acc, item) => acc + item.total, 0);
  const facturasCobradas = invoicesList.filter((item) => item.status === "Cobrada");
  const totalCobradas = facturasCobradas.reduce((acc, item) => acc + item.total, 0);
  const facturasPendientes = invoicesList.filter((item) => item.status === "Pendiente");
  const totalPendientes = facturasPendientes.reduce((acc, item) => acc + item.total, 0);

  // Dynamic Purchase Orders Statistics
  const totalPO = purchaseOrders.reduce((acc, item) => acc + item.total, 0);
  const poRecibidas = purchaseOrders.filter((item) => item.status === "Recibida");
  const totalPORecibidas = poRecibidas.reduce((acc, item) => acc + item.total, 0);
  const poPendientes = purchaseOrders.filter((item) => item.status === "Pendiente" || item.status === "Aprobada");
  const totalPOPendientes = poPendientes.reduce((acc, item) => acc + item.total, 0);

  const [recibirPagoCustomerId, setRecibirPagoCustomerId] = useState<string | null>(null);
  const openRecibirPagoView = (initialCustomerId?: string) => {
    setRecibirPagoCustomerId(initialCustomerId || null);
    setCurrentView("recibir-pago");
  };

  const [contabilidadOpen, setContabilidadOpen] = useState(false);
  const [ventasOpen, setVentasOpen] = useState(false);
  const [comprasOpen, setComprasOpen] = useState(false);
  const [inventarioOpen, setInventarioOpen] = useState(false);

  // Credit & Debit Notes State
  const [creditDebitNotes, setCreditDebitNotes] = useState<CreditDebitNote[]>([]);


  // Vendedores & Comisiones State
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  // Purchase Invoices (Facturas de Compra & Entradas de Inventario) State
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [vendorReturns, setVendorReturns] = useState<VendorReturnRecord[]>([]);

  const loadVendorReturns = async () => {
    try {
      const res = await fetch("/api/vendor-returns");
      if (res.ok) setVendorReturns(await res.json());
    } catch (e) {
      console.error("Error loading vendor returns:", e);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false);
  const accionesDropdownRef = useRef<HTMLDivElement>(null);


  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPnL, setShowPnL] = useState(true);
  const [showGastos, setShowGastos] = useState(true);



  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);



  // Plan de cuentas dedicated states
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsTypeFilter, setAccountsTypeFilter] = useState("Todo");
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newAccountForm, setNewAccountForm] = useState({
    code: "",
    name: "",
    type: "Efectivo y equivalentes de efectivo",
    detailType: "Banco",
    isSubAccount: false,
    parentAccountId: "",
    description: "",
    isLocked: false,
    currency: "USD",
    balance: 0,
    isActive: true,
  });
  const [accountModalLoading, setAccountModalLoading] = useState(false);
  const [accountModalError, setAccountModalError] = useState("");
  const [accountModalSuccess, setAccountModalSuccess] = useState("");
  const [showBlockTooltip, setShowBlockTooltip] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showAccountTypeTooltip, setShowAccountTypeTooltip] = useState(false);

  // Banking & Automation State
  const [bankSubTab, setBankSubTab] = useState<"porRevisar" | "categorizadas" | "excluidas" | "reglas">("porRevisar");
  const [selectedBankId, setSelectedBankId] = useState<string>("all");
  const [showConnectBankModal, setShowConnectBankModal] = useState(false);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankSyncing, setBankSyncing] = useState(false);
  const [bankToastNotification, setBankToastNotification] = useState("");

  const [connectedBanks, setConnectedBanks] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [automationRules, setAutomationRules] = useState<BankRule[]>([]);

  // Register bank modal form state
  const [connectBankForm, setConnectBankForm] = useState({
    institution: "Banco Ficohsa",
    accountType: "Cuenta de cheques empresarial",
    accountNumber: "",
    currency: "USD",
  });
  const [connectBankLoading, setConnectBankLoading] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  const handleDeleteBank = async (bankId: string) => {
    try {
      const res = await fetch(`/api/bank-accounts/${bankId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setConnectedBanks((prev) => prev.filter((b) => b.id !== bankId));
        setBankToastNotification("Cuenta bancaria eliminada de la base de datos.");
        setTimeout(() => setBankToastNotification(""), 4000);
      }
    } catch (err) {
      console.error("Error deleting bank account:", err);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;
    try {
      const res = await fetch(`/api/bank-accounts/${editingBank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBank),
      });
      const data = await res.json();
      if (data.success) {
        setConnectedBanks((prev) => prev.map((b) => (b.id === editingBank.id ? data.data : b)));
        setBankToastNotification("Cuenta bancaria actualizada correctamente.");
        setTimeout(() => setBankToastNotification(""), 4000);
        setEditingBank(null);
      }
    } catch (err) {
      console.error("Error updating bank account:", err);
    }
  };

  // New rule modal form state
  const [newRuleForm, setNewRuleForm] = useState({
    name: "",
    condition: "",
    targetAccount: "5000 - Cost of Goods Sold (Costo de Ventas)",
    autoConfirm: false,
  });

  // Logo upload state & ref
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Check local storage for instant initial display
    try {
      const savedLogo = localStorage.getItem("wayne_company_logo");
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }
    } catch {
      // ignore storage error
    }

    // 2. Load persistent company data from PostgreSQL database
    fetch("/api/company")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCompanySettings({
            nombre: res.data.nombre ?? "",
            direccion: res.data.direccion ?? "",
            email: res.data.email ?? "",
            telefono: res.data.telefono ?? "",
            sitioWeb: res.data.sitioWeb || "Ninguno indicado",
            sector: res.data.sector || "General",
            nombreLegal: res.data.nombreLegal ?? "",
            taxId: res.data.taxId ?? "",
            cai: res.data.cai || "Ninguno indicado",
            rangoAutorizado: res.data.rangoAutorizado || "Ninguno indicado",
            fechaLimiteEmision: res.data.fechaLimiteEmision || "Ninguno indicado",
            tipoEmpresa: res.data.tipoEmpresa || "Ninguno indicado",
            domicilioLegal: res.data.domicilioLegal ?? "",
            emailCliente: res.data.emailCliente ?? "",
            direccionCliente: res.data.direccionCliente || "Ninguno indicado",
            contadorNombre: res.data.contadorNombre || "",
            contadorTitulo: res.data.contadorTitulo || "Contador General",
            contadorColegiacion: res.data.contadorColegiacion || "Ninguno indicado",
            contadorTelefono: res.data.contadorTelefono || "Ninguno indicado",
            contadorEmail: res.data.contadorEmail || "Ninguno indicado",
          });

          if (res.data.logoUrl) {
            setCompanyLogo(res.data.logoUrl);
            try {
              localStorage.setItem("wayne_company_logo", res.data.logoUrl);
            } catch {
              // ignore
            }
          }
        }
      })
      .catch((err) => console.error("Error loading company settings from DB:", err));

    // 3. Load inventory items from database
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setInventory(res.data);
        }
      })
      .catch((err) => console.error("Error loading inventory items from DB:", err));

    // 4. Load credit and debit notes from database
    fetch("/api/credit-debit-notes")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCreditDebitNotes(res.data);
        }
      })
      .catch((err) => console.error("Error loading credit debit notes from DB:", err));

    // 5. Load sales reps from database
    fetch("/api/sales-reps")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSalesReps(res.data);
        }
      })
      .catch((err) => console.error("Error loading sales reps from DB:", err));

    // 6. Load commissions from database
    fetch("/api/commissions")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCommissionRecords(res.data);
        }
      })
      .catch((err) => console.error("Error loading commissions from DB:", err));

    // 7. Load purchase invoices from database
    fetch("/api/purchase-invoices")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setPurchaseInvoices(res.data);
        }
      })
      .catch((err) => console.error("Error loading purchase invoices from DB:", err));
  }, []);




  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo excede el tamaño máximo permitido de 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCompanyLogo(result);
        try {
          localStorage.setItem("wayne_company_logo", result);
        } catch {
          // ignore
        }

        // Persist logo to PostgreSQL database
        try {
          await fetch("/api/company", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoUrl: result }),
          });
        } catch (err) {
          console.error("Error saving logo in DB:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setCompanyLogo(null);
    try {
      localStorage.removeItem("wayne_company_logo");
    } catch {
      // ignore
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Persist removal in PostgreSQL database
    try {
      await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
    } catch (err) {
      console.error("Error removing logo from DB:", err);
    }
  };

  // Configuration module states (Matching screenshot)
  const COMPANY_TYPE_OPTIONS = [
    "Propietario único",
    "Sociedad colectiva o empresa privada de responsabilidad limitada",
    "Sociedad anónima (pequeña empresa) con dos o más propietarios",
    "Sociedad anónima con uno o más accionistas",
    "Organización sin fines de lucro",
    "Responsabilidad limitada",
    "Tengo dudas/otro/ninguno",
  ];

  const BUSINESS_SECTOR_OPTIONS = [
    "Manufactura y Producción Industrial (Manufacturing)",
    "Imprenta, Empaque y Artes Gráficas (Printing & Packaging)",
    "Maquila, Textil y Confección",
    "Comercio Mayorista y Distribución",
    "Comercio Minorista (Retail) y Tiendas",
    "Transporte, Logística y Almacenamiento",
    "Construcción, Ingeniería e Inmobiliaria",
    "Agricultura, Agroindustria, Silvicultura y Pesca",
    "Tecnología, Desarrollo de Software y Telecomunicaciones",
    "Servicios Profesionales, Científicos y Técnicos",
    "Servicios Financieros, Seguros y Contabilidad",
    "Salud, Farmacéutica y Equipos Médicos",
    "Hotelería, Turismo, Restaurantes y Catering",
    "Educación, Capacitación y Formación",
    "Energía, Minería, Petróleo, Gas y Renovables",
    "Medios de Comunicación, Publicidad y Marketing",
    "Servicios Administrativos, Seguridad y Apoyo Operativo",
    "Arte, Entretenimiento y Recreación",
    "Organizaciones Sin Fines de Lucro y Asociaciones",
    "Otro sector / No especificado",
  ];

  const [configSubTab, setConfigSubTab] = useState<
    "empresa" | "reportes" | "contabilidad" | "ventas" | "gastos" | "horas" | "monedas" | "avanzadas" | "listas" | "importar"
  >("empresa");

  const [companySettings, setCompanySettings] = useState({
    nombre: "",
    direccion: "",
    email: "",
    telefono: "",
    sitioWeb: "Ninguno indicado",
    sector: "General",
    // Legal
    nombreLegal: "",
    taxId: "",
    cai: "Ninguno indicado",
    rangoAutorizado: "Ninguno indicado",
    fechaLimiteEmision: "Ninguno indicado",
    tipoEmpresa: "Ninguno indicado",
    domicilioLegal: "",
    // Contacto del cliente
    emailCliente: "",
    direccionCliente: "Ninguno indicado",
    // Información del Contador General
    contadorNombre: "",
    contadorTitulo: "Contador General",
    contadorColegiacion: "Ninguno indicado",
    contadorTelefono: "Ninguno indicado",
    contadorEmail: "Ninguno indicado",
  });

  // Report customization state (Configuración -> Reportes)
  const [showReportBanner, setShowReportBanner] = useState(true);
  const [reportAccordions, setReportAccordions] = useState<{ [key: string]: boolean }>({
    encabezado: true,
    piePagina: false,
    filasAgrupadas: false,
    celdasVacias: false,
    lineasCuadricula: false,
    numero: false,
    ver: false,
  });
  // Encabezado controls
  const [reportHeaderLogo, setReportHeaderLogo] = useState(false);
  const [reportHeaderPeriod, setReportHeaderPeriod] = useState(false);
  const [reportHeaderLegalName, setReportHeaderLegalName] = useState(false);
  const [reportHeaderAlignment, setReportHeaderAlignment] = useState<"Izquierda" | "Centro" | "Derecha">("Centro");

  // Pie de página controls
  const [reportFooterDate, setReportFooterDate] = useState(false);
  const [reportFooterTime, setReportFooterTime] = useState(false);
  const [reportFooterMethod, setReportFooterMethod] = useState(false);
  const [reportFooterAlignment, setReportFooterAlignment] = useState<"Izquierda" | "Centro" | "Derecha">("Centro");

  // Número controls matching screenshot
  const [reportDivideBy1000, setReportDivideBy1000] = useState(false);
  const [reportHideZeroAmounts, setReportHideZeroAmounts] = useState(false);
  const [reportHideCurrencySymbol, setReportHideCurrencySymbol] = useState(false);
  const [reportNegativeNumberFormat, setReportNegativeNumberFormat] = useState<string>("-100");
  const [reportNegativeInRed, setReportNegativeInRed] = useState(false);
  const [reportDecimalMode, setReportDecimalMode] = useState<"round" | "decimals">("decimals");
  const [reportDecimalPlaces, setReportDecimalPlaces] = useState<number>(2);

  const [gridBorderSetting, setGridBorderSetting] = useState<string>("Predeterminado");
  const [reportEmptyCellFormat, setReportEmptyCellFormat] = useState<string>("hyphen");
  const [reportExpandSubaccounts, setReportExpandSubaccounts] = useState(true);
  const [reportShowGroupTotals, setReportShowGroupTotals] = useState(true);
  const [reportCompactView, setReportCompactView] = useState(true);
  const [reportWrapText, setReportWrapText] = useState(true);
  const [reportSavedNotification, setReportSavedNotification] = useState(false);

  const formatReportAmount = (amount: number) => {
    if (amount === 0) {
      if (reportHideZeroAmounts) {
        return "";
      }
      if (reportEmptyCellFormat === "hyphen") {
        return "-";
      }
      if (reportEmptyCellFormat === "blank") {
        return "";
      }
      // If "zero", fallthrough to format as 0.00 according to currency/decimal settings
    }
    let val = amount;
    if (reportDivideBy1000) {
      val = val / 1000;
    }
    const isNegative = val < 0;
    const absVal = Math.abs(val);

    const formattedNumber =
      reportDecimalMode === "round"
        ? Math.round(absVal).toLocaleString("en-US")
        : absVal.toLocaleString("en-US", {
          minimumFractionDigits: reportDecimalPlaces,
          maximumFractionDigits: reportDecimalPlaces,
        });

    const curr = reportHideCurrencySymbol ? "" : "$";

    if (!isNegative) {
      return `${curr}${formattedNumber}`;
    }

    if (reportNegativeNumberFormat === "(100)") {
      return `(${curr}${formattedNumber})`;
    } else if (reportNegativeNumberFormat === "-$100") {
      return `-${curr}${formattedNumber}`;
    } else if (reportNegativeNumberFormat === "100-") {
      return `${curr}${formattedNumber}-`;
    } else {
      return `${curr}-${formattedNumber}`;
    }
  };

  const getReportAmountClass = (amount: number) => {
    if (amount < 0 && reportNegativeInRed) {
      return "font-mono text-rose-600 font-semibold";
    }
    return "font-mono text-slate-900";
  };

  const toggleReportAccordion = (key: string) => {
    setReportAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Configuración de Ventas states matching screenshot
  interface SalesSettingsState {
    preferidofacturaCondiciones: string;
    metodoEntregaPreferido: string;
    envio: boolean;
    numerosTransaccionesPersonalizados: boolean;
    fechaServicio: boolean;
    descuento: boolean;
    deposito: boolean;
    etiquetas: boolean;
    mostrarColumnaProductoServicio: boolean;
    mostrarColumnaSku: boolean;
    activarReglasPrecios: boolean;
    seguimientoCantidadPrecio: boolean;
    seguimientoExistenciasInventario: boolean;
    metodoValoracionInventario: string;
    metodoRecepcionInventario: string;
    reconocimientoIngresos: boolean;
    facturacionProgresiva: boolean;
    mensajePredeterminado: string;
    recordatoriosConfig: string;
    solicitarSolicitudTrabajo: boolean;
    solicitarResenas: boolean;
    solicitarReferencia: boolean;
    frecuenciaEncuesta: string;
    entregaEnLineaOpciones: string;
    mostrarTablaAntiguedad: boolean;
    // Impuesto Sobre Ventas (ISV SAR)
    isvPredeterminado: boolean;
    tasaIsvGeneral: number;
    permitirIsv18: boolean;
    preciosIncluyenIsv: boolean;
  }

  const [salesSettings, setSalesSettings] = useState<SalesSettingsState>(() => {
    const defaultSales: SalesSettingsState = {
      preferidofacturaCondiciones: "Net 30",
      metodoEntregaPreferido: "Ninguno",
      envio: false,
      numerosTransaccionesPersonalizados: true,
      fechaServicio: true,
      descuento: false,
      deposito: false,
      etiquetas: true,
      mostrarColumnaProductoServicio: true,
      mostrarColumnaSku: false,
      activarReglasPrecios: false,
      seguimientoCantidadPrecio: true,
      seguimientoExistenciasInventario: true,
      metodoValoracionInventario: "Seleccionar método",
      metodoRecepcionInventario: "Facturas de proveedores y gastos",
      reconocimientoIngresos: true,
      facturacionProgresiva: false,
      mensajePredeterminado: "Mensaje de correo electrónico predeterminado que se envía con los formularios de ventas",
      recordatoriosConfig: "Configurar mensajes de correo electrónico de recordatorios",
      solicitarSolicitudTrabajo: false,
      solicitarResenas: false,
      solicitarReferencia: false,
      frecuenciaEncuesta: "90 días",
      entregaEnLineaOpciones: "Opciones de envío por correo electrónico de los formularios de ventas",
      mostrarTablaAntiguedad: true,
      // Impuestos SAR
      isvPredeterminado: true,
      tasaIsvGeneral: 15,
      permitirIsv18: true,
      preciosIncluyenIsv: false,
    };

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("wayne_sales_settings");
        if (saved) return { ...defaultSales, ...JSON.parse(saved) };
      } catch { }
    }
    return defaultSales;
  });

  useEffect(() => {
    try {
      localStorage.setItem("wayne_sales_settings", JSON.stringify(salesSettings));
    } catch { }
  }, [salesSettings]);

  const [editingSalesSection, setEditingSalesSection] = useState<string | null>(null);
  const [salesSavedNotification, setSalesSavedNotification] = useState(false);

  // Configuración de Gastos states matching screenshot
  const [expenseSettings, setExpenseSettings] = useState({
    // Facturas y gastos
    mostrarTablaArticulosGasto: false,
    mostrarCampoEtiquetas: true,
    seguimientoGastosArticulosCliente: false,
    hacerGastosArticulosFacturables: false,
    condicionesPagoProveedores: "Net 30",

    // Órdenes de compra
    usarOrdenesCompra: true,

    // Mensajes
    mensajeOrdenesCompra: "Mensaje de correo electrónico predeterminado que se envía con las órdenes de compra",
  });

  const [editingExpenseSection, setEditingExpenseSection] = useState<string | null>(null);
  const [expenseSavedNotification, setExpenseSavedNotification] = useState(false);

  // Subtabs state (Contabilidad, Horas, Monedas, Avanzadas)
  const [contabilidadSettings, setContabilidadSettings] = useState({
    primerMesFiscal: "Enero",
    primerMesImpuesto: "Igual que el ejercicio fiscal (Enero)",
    metodoContabilidad: "Criterio de devengo",
    cierreLibros: "Desactivado (Periodo 2026 abierto)",
    numerosCuenta: "Activado",
  });

  const [horasSettings, setHorasSettings] = useState({
    primerDia: "Lunes",
    jornadaMaxima: "8 horas / día (44 horas semanales)",
    aprobacionHorasExtra: "Requiere visto bueno de supervisión",
  });

  interface MonedasSettingsState {
    monedaPrincipal: string;
    multidivisa: string;
    bancoPrincipal: string;
    transferenciasAch: string;
  }

  const [monedasSettings, setMonedasSettings] = useState<MonedasSettingsState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("wayne_monedas_settings");
        if (saved) return JSON.parse(saved) as MonedasSettingsState;
      } catch { }
    }
    return {
      monedaPrincipal: "USD ($) Dólar estadounidense",
      multidivisa: "Activado (USD, HNL)",
      bancoPrincipal: "Ninguno indicado",
      transferenciasAch: "Habilitadas",
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem("wayne_monedas_settings", JSON.stringify(monedasSettings));
    } catch { }
  }, [monedasSettings]);

  const defaultCurrencySymbol = useMemo(() => {
    const main = monedasSettings?.monedaPrincipal || "";
    if (main.includes("HNL") || main.includes("(L)") || main.includes("Lempira")) return "L";
    if (main.includes("EUR") || main.includes("(€)") || main.includes("Euro")) return "€";
    if (main.includes("USD") || main.includes("($)") || main.includes("Dólar")) return "$";
    return "$";
  }, [monedasSettings?.monedaPrincipal]);

  const [avanzadasSettings, setAvanzadasSettings] = useState({
    zonaHoraria: "(GMT-06:00) Hora estándar central (Honduras)",
    idioma: "Español (Latinoamérica)",
    cierreSesionInactividad: "3 horas",
  });

  // Generic Edit Modal State for parameter subtabs
  const [paramEditModal, setParamEditModal] = useState<{
    title: string;
    label: string;
    value: string;
    options?: string[];
    onSave: (val: string) => void;
  } | null>(null);

  // Hub de Listas State
  const [activeListModal, setActiveListModal] = useState<string | null>(null);

  // Advanced Import / Export Data Wizard State
  const [dataExchangeMode, setDataExchangeMode] = useState<"import" | "export">("import");
  const [selectedImportCategory, setSelectedImportCategory] = useState<
    "clientes" | "proveedores" | "productos" | "cuentas" | "facturas_venta" | "facturas_compra"
  >("clientes");
  const [selectedExportCategory, setSelectedExportCategory] = useState<
    "clientes" | "proveedores" | "productos" | "cuentas" | "facturas_venta" | "facturas_compra" | "pedidos_venta" | "cotizaciones" | "asientos"
  >("clientes");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "json">("csv");
  const [exportDelimiter, setExportDelimiter] = useState<"," | ";" | "\t">(",");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Advanced Import Wizard Specific State
  const [importInputMethod, setImportInputMethod] = useState<"file" | "paste">("file");
  const [importFileName, setImportFileName] = useState<string>("");
  const [importHasHeaders, setImportHasHeaders] = useState<boolean>(true);
  const [importPasteText, setImportPasteText] = useState<string>("");
  const [importRawRows, setImportRawRows] = useState<string[][]>([]);
  const [importDetectedHeaders, setImportDetectedHeaders] = useState<string[]>([]);
  const [importColumnMapping, setImportColumnMapping] = useState<Record<string, number>>({});
  const [importNotification, setImportNotification] = useState<string>("");
  const [importNotificationType, setImportNotificationType] = useState<"success" | "error" | "info">("info");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importIsDragging, setImportIsDragging] = useState<boolean>(false);
  const [importResultReport, setImportResultReport] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Import schemas definition for all supported master entities
  const importCategorySchemas = useMemo(() => ({
    clientes: {
      title: "Clientes",
      desc: "Nombres, RTN, correos, teléfonos y direcciones de entrega",
      endpoint: "/api/customers",
      fields: [
        { key: "name", label: "Nombre / Razón Social", required: true, hint: "Ej: Textiles Búfalo S.A." },
        { key: "macolaCode", label: "Código Macola / Cliente", required: false, hint: "Ej: CLI-001" },
        { key: "rtn", label: "RTN / ID Fiscal", required: false, hint: "Ej: 08019012345678" },
        { key: "email", label: "Correo Electrónico", required: false, hint: "Ej: compras@bufalo.hn" },
        { key: "phone", label: "Teléfono", required: false, hint: "Ej: +504 2550-1122" },
        { key: "address", label: "Dirección", required: false, hint: "Ej: Zip Búfalo Nave 4" },
        { key: "currency", label: "Moneda (USD / HNL)", required: false, hint: "USD o HNL" },
      ],
      sampleCsv: "Nombre,RTN,Correo,Telefono,Dirección,Moneda\nTextiles Búfalo S.A.,08019012345678,compras@bufalo.hn,+504 2550-1122,Zip Búfalo Nave 4,USD\nEmpaques del Norte S. de R.L.,05019009876543,ventas@empaques.hn,+504 9988-7766,San Pedro Sula,USD",
      mapRowToPayload: (m: Record<string, string>) => ({
        name: m.name?.trim(),
        macolaCode: m.macolaCode?.trim() || null,
        rtn: m.rtn?.trim() || null,
        email: m.email?.trim() || null,
        phone: m.phone?.trim() || null,
        address: m.address?.trim() || null,
        currency: m.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
      }),
    },
    proveedores: {
      title: "Proveedores",
      desc: "Proveedores de insumos, materias primas y servicios",
      endpoint: "/api/vendors",
      fields: [
        { key: "name", label: "Nombre / Razón Social", required: true, hint: "Ej: Insumos Flexográficos S.A." },
        { key: "macolaCode", label: "Código Macola / Proveedor", required: false, hint: "Ej: PROV-001" },
        { key: "rtn", label: "RTN / ID Fiscal", required: false, hint: "Ej: 08019998877665" },
        { key: "email", label: "Correo Electrónico", required: false, hint: "Ej: contacto@insumosflexo.com" },
        { key: "phone", label: "Teléfono", required: false, hint: "Ej: +504 2233-4455" },
        { key: "address", label: "Dirección", required: false, hint: "Ej: Tegucigalpa M.D.C." },
        { key: "currency", label: "Moneda (USD / HNL)", required: false, hint: "USD o HNL" },
      ],
      sampleCsv: "Nombre,RTN,Correo,Telefono,Dirección,Moneda\nInsumos Flexográficos S.A.,08019998877665,contacto@insumosflexo.com,+504 2233-4455,Tegucigalpa,USD\nPapelera Hondureña S.A.,05018887766554,pedidos@papelera.hn,+504 2550-9900,San Pedro Sula,USD",
      mapRowToPayload: (m: Record<string, string>) => ({
        name: m.name?.trim(),
        macolaCode: m.macolaCode?.trim() || null,
        rtn: m.rtn?.trim() || null,
        email: m.email?.trim() || null,
        phone: m.phone?.trim() || null,
        address: m.address?.trim() || null,
        currency: m.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
      }),
    },
    productos: {
      title: "Productos e Inventario",
      desc: "Catálogo de artículos, SKU, stock inicial, costo y precios",
      endpoint: "/api/inventory",
      fields: [
        { key: "sku", label: "Código SKU / Artículo", required: true, hint: "Ej: FLEX-1001" },
        { key: "description", label: "Descripción del Producto", required: true, hint: "Ej: Cajas Flexográficas 12x12" },
        { key: "quantity", label: "Stock Inicial", required: false, hint: "Ej: 500" },
        { key: "cost", label: "Costo Unitario", required: false, hint: "Ej: 1.25" },
        { key: "price", label: "Precio de Venta", required: false, hint: "Ej: 2.10" },
        { key: "trackingType", label: "Tipo Seguimiento (NONE / LOT / SERIAL)", required: false, hint: "NONE, LOT o SERIAL" },
      ],
      sampleCsv: "SKU,Descripcion,Cantidad,Costo,Precio,Seguimiento\nFLEX-1001,Cajas Flexográficas Flauta B 12x12,500,1.25,2.10,NONE\nETIQ-2002,Etiquetas BOPP Termoencogibles Rollo,1200,4.50,8.75,LOT",
      mapRowToPayload: (m: Record<string, string>) => ({
        sku: m.sku?.trim(),
        description: m.description?.trim(),
        quantity: m.quantity ? Number(m.quantity.replace(/[^0-9.-]/g, "")) || 0 : 0,
        cost: m.cost ? Number(m.cost.replace(/[^0-9.-]/g, "")) || 0 : 0,
        price: m.price ? Number(m.price.replace(/[^0-9.-]/g, "")) || 0 : 0,
        trackingType: ["LOT", "SERIAL"].includes(m.trackingType?.trim().toUpperCase()) ? m.trackingType.trim().toUpperCase() : "NONE",
      }),
    },
    cuentas: {
      title: "Catálogo Contable",
      desc: "Plan de cuentas, código contable, tipo de cuenta y saldo",
      endpoint: "/api/accounts",
      fields: [
        { key: "code", label: "Código Contable", required: true, hint: "Ej: 1101" },
        { key: "name", label: "Nombre de Cuenta", required: true, hint: "Ej: Caja General" },
        { key: "type", label: "Tipo (Activo, Pasivo, Capital, Ingreso, Gasto)", required: true, hint: "Activo, Pasivo, etc." },
        { key: "currency", label: "Moneda", required: false, hint: "USD o HNL" },
        { key: "balance", label: "Saldo Inicial", required: false, hint: "Ej: 0.00" },
      ],
      sampleCsv: "Codigo,Nombre,Tipo,Moneda,Saldo\n1101,Caja General,Activo,USD,0\n1102,Banco Ficohsa Corriente,Activo,USD,0\n2101,Cuentas por Pagar Comerciales,Pasivo,USD,0\n4101,Ingresos por Ventas Empaque,Ingreso,USD,0",
      mapRowToPayload: (m: Record<string, string>) => ({
        code: m.code?.trim(),
        name: m.name?.trim(),
        type: m.type?.trim() || "Activo",
        currency: m.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
        balance: m.balance ? Number(m.balance.replace(/[^0-9.-]/g, "")) || 0 : 0,
        isActive: true,
      }),
    },
    facturas_venta: {
      title: "Facturas de Venta",
      desc: "Historial de facturación de clientes para migración",
      endpoint: "/api/invoices",
      fields: [
        { key: "invoiceNumber", label: "Número de Factura", required: true, hint: "Ej: FAC-2026-001" },
        { key: "customerName", label: "Nombre del Cliente", required: true, hint: "Ej: Textiles Búfalo S.A." },
        { key: "total", label: "Monto Total", required: true, hint: "Ej: 1500.00" },
        { key: "invoiceDate", label: "Fecha Emisión (YYYY-MM-DD)", required: false, hint: "2026-08-15" },
        { key: "dueDate", label: "Fecha Vencimiento (YYYY-MM-DD)", required: false, hint: "2026-09-15" },
        { key: "currency", label: "Moneda (USD / HNL)", required: false, hint: "USD o HNL" },
      ],
      sampleCsv: "NumeroFactura,Cliente,Total,FechaEmision,FechaVencimiento,Moneda\nFAC-2026-001,Textiles Búfalo S.A.,1500.00,2026-08-15,2026-09-15,USD\nFAC-2026-002,Empaques del Norte,2850.50,2026-08-20,2026-09-20,USD",
      mapRowToPayload: (m: Record<string, string>) => ({
        invoiceNumber: m.invoiceNumber?.trim(),
        customerName: m.customerName?.trim(),
        total: Number(m.total?.replace(/[^0-9.-]/g, "")) || 0,
        subtotal: Number(m.total?.replace(/[^0-9.-]/g, "")) || 0,
        invoiceDate: m.invoiceDate?.trim() || new Date().toISOString().split("T")[0],
        dueDate: m.dueDate?.trim() || new Date().toISOString().split("T")[0],
        currency: m.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
        status: "Emitida",
      }),
    },
    facturas_compra: {
      title: "Facturas de Compra",
      desc: "Historial de facturas de proveedores y cuentas por pagar",
      endpoint: "/api/purchase-invoices",
      fields: [
        { key: "invoiceNumber", label: "Número Factura Proveedor", required: true, hint: "Ej: FPROV-2026-01" },
        { key: "vendorName", label: "Nombre del Proveedor", required: true, hint: "Ej: Insumos Flexográficos S.A." },
        { key: "total", label: "Monto Total", required: true, hint: "Ej: 950.00" },
        { key: "issueDate", label: "Fecha Emisión (YYYY-MM-DD)", required: false, hint: "2026-08-10" },
        { key: "dueDate", label: "Fecha Vencimiento (YYYY-MM-DD)", required: false, hint: "2026-09-10" },
        { key: "currency", label: "Moneda (USD / HNL)", required: false, hint: "USD o HNL" },
      ],
      sampleCsv: "NumeroFactura,Proveedor,Total,FechaEmision,FechaVencimiento,Moneda\nFPROV-2026-01,Insumos Flexográficos S.A.,950.00,2026-08-10,2026-09-10,USD\nFPROV-2026-02,Papelera Hondureña,3200.00,2026-08-18,2026-09-18,USD",
      mapRowToPayload: (m: Record<string, string>) => ({
        invoiceNumber: m.invoiceNumber?.trim(),
        vendorName: m.vendorName?.trim(),
        total: Number(m.total?.replace(/[^0-9.-]/g, "")) || 0,
        subtotal: Number(m.total?.replace(/[^0-9.-]/g, "")) || 0,
        issueDate: m.issueDate?.trim() || new Date().toISOString().split("T")[0],
        dueDate: m.dueDate?.trim() || new Date().toISOString().split("T")[0],
        currency: m.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
        paymentStatus: "PENDIENTE",
        inventoryStatus: "INGRESADO",
      }),
    },
  }), []);

  // Smart CSV/TSV string parser supporting quotes & delimiters
  const parseRawCsv = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const delim = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === delim && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    });
  };

  // Auto-map file column headers to system fields based on keywords
  const autoMapHeaders = (
    headers: string[],
    fields: Array<{ key: string; label: string; required: boolean }>
  ): Record<string, number> => {
    const mapping: Record<string, number> = {};
    const norm = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

    fields.forEach((field) => {
      const keyNorm = norm(field.key);
      const labelNorm = norm(field.label);
      let matchIndex = -1;

      headers.forEach((h, idx) => {
        if (matchIndex !== -1) return;
        const hNorm = norm(h);
        if (!hNorm) return;

        if (hNorm === keyNorm || hNorm === labelNorm) {
          matchIndex = idx;
          return;
        }

        if (field.key === "name" && (hNorm.includes("nom") || hNorm.includes("client") || hNorm.includes("razon") || hNorm.includes("prov"))) matchIndex = idx;
        else if (field.key === "rtn" && (hNorm.includes("rtn") || hNorm.includes("nit") || hNorm.includes("tax") || hNorm.includes("fiscal") || hNorm.includes("cai"))) matchIndex = idx;
        else if (field.key === "sku" && (hNorm.includes("sku") || hNorm.includes("cod") || hNorm.includes("art"))) matchIndex = idx;
        else if (field.key === "description" && (hNorm.includes("desc") || hNorm.includes("prod") || hNorm.includes("item"))) matchIndex = idx;
        else if (field.key === "email" && (hNorm.includes("mail") || hNorm.includes("correo"))) matchIndex = idx;
        else if (field.key === "phone" && (hNorm.includes("tel") || hNorm.includes("cel") || hNorm.includes("phone"))) matchIndex = idx;
        else if (field.key === "address" && (hNorm.includes("dir") || hNorm.includes("address") || hNorm.includes("ubic"))) matchIndex = idx;
        else if (field.key === "price" && (hNorm.includes("prec") || hNorm.includes("price") || hNorm.includes("vent"))) matchIndex = idx;
        else if (field.key === "cost" && (hNorm.includes("cost") || hNorm.includes("comp"))) matchIndex = idx;
        else if (field.key === "quantity" && (hNorm.includes("cant") || hNorm.includes("stock") || hNorm.includes("qty"))) matchIndex = idx;
        else if (field.key === "total" && (hNorm.includes("tot") || hNorm.includes("mont") || hNorm.includes("imp"))) matchIndex = idx;
        else if (field.key === "code" && (hNorm.includes("cod") || hNorm.includes("num") || hNorm.includes("code"))) matchIndex = idx;
        else if (field.key === "type" && (hNorm.includes("tip") || hNorm.includes("type") || hNorm.includes("cat"))) matchIndex = idx;
        else if (field.key === "invoiceNumber" && (hNorm.includes("fact") || hNorm.includes("num") || hNorm.includes("inv"))) matchIndex = idx;
        else if (field.key === "currency" && (hNorm.includes("mon") || hNorm.includes("curr") || hNorm.includes("div"))) matchIndex = idx;
      });

      if (matchIndex !== -1) {
        mapping[field.key] = matchIndex;
      }
    });

    return mapping;
  };

  const handleProcessImportText = (text: string, fileName = "", hasHeaders = importHasHeaders) => {
    setImportPasteText(text);
    if (fileName) setImportFileName(fileName);
    setImportResultReport(null);

    const parsed = parseRawCsv(text);
    if (parsed.length === 0) {
      setImportRawRows([]);
      setImportDetectedHeaders([]);
      setImportColumnMapping({});
      return;
    }

    const schema = (importCategorySchemas as any)[selectedImportCategory];
    if (hasHeaders && parsed.length > 0) {
      const headers = parsed[0];
      const data = parsed.slice(1);
      setImportDetectedHeaders(headers);
      setImportRawRows(data);
      if (schema) {
        const auto = autoMapHeaders(headers, schema.fields);
        setImportColumnMapping(auto);
      }
    } else {
      const colCount = Math.max(...parsed.map((r) => r.length));
      const dummyHeaders = Array.from({ length: colCount }, (_, i) => `Columna ${i + 1}`);
      setImportDetectedHeaders(dummyHeaders);
      setImportRawRows(parsed);
      const seqMapping: Record<string, number> = {};
      schema?.fields.forEach((f: any, idx: number) => {
        if (idx < colCount) seqMapping[f.key] = idx;
      });
      setImportColumnMapping(seqMapping);
    }
  };

  const handleExecuteRealImport = async () => {
    const schema = (importCategorySchemas as any)[selectedImportCategory];
    if (!schema || importRawRows.length === 0) return;

    setIsImporting(true);
    setImportNotification("");
    setImportResultReport(null);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < importRawRows.length; i++) {
      const row = importRawRows[i];
      const mappedRecord: Record<string, string> = {};

      Object.entries(importColumnMapping).forEach(([fieldKey, colIdx]) => {
        if (colIdx >= 0 && colIdx < row.length) {
          mappedRecord[fieldKey] = row[colIdx];
        }
      });

      const missingRequired = schema.fields.find(
        (f: any) => f.required && (!mappedRecord[f.key] || mappedRecord[f.key].trim() === "")
      );

      if (missingRequired) {
        errorCount++;
        errors.push(`Fila ${i + 1}: El campo '${missingRequired.label}' es obligatorio y está vacío.`);
        continue;
      }

      try {
        const payload = schema.mapRowToPayload(mappedRecord);
        const res = await fetch(schema.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && (json.success || json.id || json.data)) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`Fila ${i + 1}: ${json.error || "Error al registrar en la base de datos."}`);
        }
      } catch (err: any) {
        errorCount++;
        errors.push(`Fila ${i + 1}: Error de red o conexión: ${err.message || "Error desconocido"}`);
      }
    }

    setIsImporting(false);
    setImportResultReport({ successCount, errorCount, errors });

    if (successCount > 0) {
      setImportNotificationType("success");
      setImportNotification(
        `¡Importación completada! Se crearon exitosamente ${successCount} registros en ${schema.title}.${errorCount > 0 ? ` (${errorCount} filas omitidas con observaciones)` : ""
        }`
      );

      // Refresh relevant data in background
      if (selectedImportCategory === "productos") {
        fetch("/api/inventory").then((r) => r.json()).then((j) => {
          if (j.success && Array.isArray(j.data)) setInventory(j.data);
        });
      } else if (selectedImportCategory === "facturas_compra") {
        fetch("/api/purchase-invoices").then((r) => r.json()).then((j) => {
          if (j.success && Array.isArray(j.data)) setPurchaseInvoices(j.data);
        });
      }
    } else {
      setImportNotificationType("error");
      setImportNotification(`No se pudo importar ningún registro. Revisa las observaciones detalladas.`);
    }
  };

  const currentImportSchema = (importCategorySchemas as any)[selectedImportCategory];
  const importRequiredFields = useMemo(() => {
    return currentImportSchema?.fields.filter((f: any) => f.required) || [];
  }, [currentImportSchema]);

  const validatedImportRows = useMemo(() => {
    if (!currentImportSchema || importRawRows.length === 0) return [];
    return importRawRows.map((row, idx) => {
      const missing = importRequiredFields.filter((rf: any) => {
        const colIdx = importColumnMapping[rf.key];
        if (colIdx === undefined || colIdx < 0) return true;
        const cellVal = row[colIdx];
        return !cellVal || cellVal.trim().length === 0;
      });
      return {
        idx,
        row,
        isValid: missing.length === 0,
        missingFields: missing.map((m: any) => m.label),
      };
    });
  }, [currentImportSchema, importRawRows, importColumnMapping, importRequiredFields]);

  const handleExportData = async (catOverride?: string) => {
    const targetCat = catOverride || selectedExportCategory;
    setIsExporting(true);
    setImportNotification("");
    try {
      let endpoint = "";
      let filename = "";
      let columnHeaders: string[] = [];
      let extractRow: (item: any) => string[] = () => [];

      switch (targetCat) {
        case "clientes":
          endpoint = "/api/customers";
          filename = "Clientes";
          columnHeaders = ["Código Macola", "Nombre", "RTN", "Correo", "Teléfono", "Dirección", "Moneda"];
          extractRow = (c) => [c.macolaCode || "", c.name || "", c.rtn || "", c.email || "", c.phone || "", c.address || "", c.currency || "USD"];
          break;
        case "proveedores":
          endpoint = "/api/vendors";
          filename = "Proveedores";
          columnHeaders = ["Código Macola", "Nombre / Razón Social", "RTN", "Correo", "Teléfono", "Dirección", "Moneda"];
          extractRow = (v) => [v.macolaCode || "", v.name || "", v.rtn || "", v.email || "", v.phone || "", v.address || "", v.currency || "USD"];
          break;
        case "productos":
          endpoint = "/api/inventory";
          filename = "Productos_Inventario";
          columnHeaders = ["SKU", "Descripción", "Cantidad Stock", "Costo Unitario", "Precio Venta", "Tipo Seguimiento"];
          extractRow = (p) => [p.sku || "", p.description || "", String(p.quantity ?? 0), String(p.cost ?? 0), String(p.price ?? 0), p.trackingType || "NONE"];
          break;
        case "cuentas":
          endpoint = "/api/accounts";
          filename = "Catalogo_Cuentas";
          columnHeaders = ["Código", "Nombre de Cuenta", "Tipo", "Moneda", "Saldo", "Estado"];
          extractRow = (a) => [a.code || "", a.name || "", a.type || "", a.currency || "USD", String(a.balance ?? 0), a.isActive ? "Activa" : "Inactiva"];
          break;
        case "facturas_venta":
          endpoint = "/api/invoices";
          filename = "Facturas_Venta";
          columnHeaders = ["Número Factura", "Fecha", "Cliente", "Vencimiento", "Subtotal", "Impuesto", "Total", "Estado", "Estado Pago"];
          extractRow = (f) => [f.invoiceNumber || f.num || "", f.invoiceDate || f.date || "", f.customerName || f.customer || "", f.dueDate || f.due || "", String(f.subtotal ?? 0), String(f.tax ?? 0), String(f.total ?? 0), f.status || "", f.paymentStatus || ""];
          break;
        case "facturas_compra":
          endpoint = "/api/purchase-invoices";
          filename = "Facturas_Compra";
          columnHeaders = ["Número Factura", "Orden de Compra", "Proveedor", "Fecha Emisión", "Vencimiento", "Subtotal", "Impuesto", "Total", "Estado Pago", "Estado Inventario"];
          extractRow = (pi) => [pi.invoiceNumber || "", pi.purchaseOrderNumber || "", pi.vendorName || "", pi.issueDate || "", pi.dueDate || "", String(pi.subtotal ?? 0), String(pi.tax ?? 0), String(pi.total ?? 0), pi.paymentStatus || "", pi.inventoryStatus || ""];
          break;
        case "pedidos_venta":
          endpoint = "/api/sales-orders";
          filename = "Pedidos_Venta";
          columnHeaders = ["Número Pedido", "O.C. Cliente", "Cliente", "Fecha Pedido", "Fecha Entrega", "Subtotal", "Total", "Estado"];
          extractRow = (so) => [so.orderNumber || "", so.customerPoNumber || "", so.customerName || "", so.orderDate || "", so.expectedDeliveryDate || "", String(so.subtotal ?? 0), String(so.total ?? 0), so.status || ""];
          break;
        case "cotizaciones":
          endpoint = "/api/quotes";
          filename = "Cotizaciones";
          columnHeaders = ["Número Cotización", "Cliente", "Fecha Emisión", "Válida Hasta", "Términos", "Moneda", "Vendedor", "Subtotal", "Total", "Estado"];
          extractRow = (q) => [q.quoteNumber || "", q.customerName || "", q.quoteDate || "", q.validUntil || "", q.paymentTerms || "", q.currency || "USD", q.salesRepName || "", String(q.subtotal ?? 0), String(q.total ?? 0), q.status || ""];
          break;
        case "asientos":
          endpoint = "/api/journal-entries";
          filename = "Asientos_Contables";
          columnHeaders = ["Número Asiento", "Fecha", "Concepto / Descripción", "Estado", "Referencia"];
          extractRow = (je) => [je.entryNumber || "", je.date || "", je.description || "", je.status || "", je.reference || ""];
          break;
      }

      const res = await fetch(endpoint);
      const json = await res.json();
      let records: any[] = [];
      if (Array.isArray(json)) {
        records = json;
      } else if (json.data && Array.isArray(json.data)) {
        records = json.data;
      } else if (json.invoices && Array.isArray(json.invoices)) {
        records = json.invoices;
      } else if (json.quotes && Array.isArray(json.quotes)) {
        records = json.quotes;
      } else if (json.orders && Array.isArray(json.orders)) {
        records = json.orders;
      }

      const escapeVal = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes(";") || str.includes("\t") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const dateStr = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}_${dateStr}`;

      if (exportFormat === "json") {
        const jsonString = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fullFilename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const delim = exportFormat === "excel" ? "\t" : exportDelimiter;
        const extension = exportFormat === "excel" ? "xls" : "csv";
        const mime = exportFormat === "excel" ? "application/vnd.ms-excel;charset=utf-8;" : "text/csv;charset=utf-8;";

        const headerLine = columnHeaders.map(escapeVal).join(delim);
        const dataLines = records.map((r) => extractRow(r).map(escapeVal).join(delim));
        const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
        const blob = new Blob([csvContent], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fullFilename}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setImportNotification(`¡Se exportaron exitosamente ${records.length} registros de ${filename.replace(/_/g, " ")}!`);
    } catch (err: any) {
      console.error("Export error:", err);
      setImportNotification(`Error al exportar datos: ${err.message || "Error de conexión"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const [productCategoriesList, setProductCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryActionError, setCategoryActionError] = useState("");

  const loadProductCategories = async () => {
    try {
      const res = await fetch("/api/product-categories");
      const json = await res.json();
      if (json.success) setProductCategoriesList(json.data || []);
    } catch (err) {
      console.error("Error loading product categories:", err);
    }
  };

  const handleAddProductCategory = async (name: string) => {
    setCategoryActionError("");
    try {
      const res = await fetch("/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al crear la categoría");
      setProductCategoriesList((prev) =>
        [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    } catch (err: any) {
      setCategoryActionError(err.message || "Error al crear la categoría");
      return false;
    }
  };

  const handleRenameProductCategory = async (id: string, name: string) => {
    setCategoryActionError("");
    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al renombrar la categoría");
      setProductCategoriesList((prev) =>
        prev
          .map((c) => (c.id === id ? json.data : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingCategory(null);
    } catch (err: any) {
      setCategoryActionError(err.message || "Error al renombrar la categoría");
    }
  };

  const handleDeleteProductCategory = async (id: string) => {
    setCategoryActionError("");
    try {
      const res = await fetch(`/api/product-categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al eliminar la categoría");
      setProductCategoriesList((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setCategoryActionError(err.message || "Error al eliminar la categoría");
    }
  };

  const [physicalLocationsList, setPhysicalLocationsList] = useState<{ id: string; name: string; address: string }[]>([]);

  const [paymentMethodsList, setPaymentMethodsList] = useState<{ id: string; name: string; type: string }[]>([
    { id: "1", name: "Efectivo Disponible", type: "Efectivo" },
    { id: "2", name: "Cheque Bancario", type: "Cheque" },
    { id: "3", name: "Transferencia Interbancaria ACH", type: "Transferencia" },
    { id: "4", name: "Tarjeta de Crédito / Débito", type: "Tarjeta" },
  ]);

  const [paymentTermsList, setPaymentTermsList] = useState<{ id: string; name: string; days: number }[]>([
    { id: "1", name: "Contado (Inmediato)", days: 0 },
    { id: "2", name: "Neto 15 Días", days: 15 },
    { id: "3", name: "Neto 30 Días", days: 30 },
    { id: "4", name: "Neto 60 Días", days: 60 },
  ]);

  const [recurringTransactionsList, setRecurringTransactionsList] = useState<{ id: string; name: string; type: string; frequency: string; amount: number }[]>([]);

  const [accountingClassesList, setAccountingClassesList] = useState<{ id: string; name: string; description: string }[]>([]);

  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null);
  const [editingConfigLabel, setEditingConfigLabel] = useState<string>("");
  const [editingConfigValue, setEditingConfigValue] = useState<string>("");
  const [rangoPrefijo, setRangoPrefijo] = useState<string>("000-001-01-");
  const [rangoDesde, setRangoDesde] = useState<string>("00000661");
  const [rangoHasta, setRangoHasta] = useState<string>("00000760");

  const startEditConfig = (key: keyof typeof companySettings, label: string) => {
    setEditingConfigKey(key);
    setEditingConfigLabel(label);
    setEditingConfigValue(companySettings[key] === "Ninguno indicado" ? "" : companySettings[key]);

    if (key === "rangoAutorizado") {
      const current = companySettings.rangoAutorizado || "";
      const match = current.match(/DEL\s+([0-9]{3}-[0-9]{3}-[0-9]{2}-)\s*([0-9]{1,8})\s+AL\s+([0-9]{3}-[0-9]{3}-[0-9]{2}-)?\s*([0-9]{1,8})/i);
      if (match) {
        setRangoPrefijo(match[1]);
        setRangoDesde(match[2].padStart(8, "0"));
        setRangoHasta(match[4].padStart(8, "0"));
      } else {
        setRangoPrefijo("000-001-01-");
        setRangoDesde("00000661");
        setRangoHasta("00000760");
      }
    }

    if (key === "fechaLimiteEmision") {
      const current = companySettings.fechaLimiteEmision || "";
      const matchDmy = current.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
      if (matchDmy) {
        setEditingConfigValue(`${matchDmy[1].padStart(2, "0")} / ${matchDmy[2].padStart(2, "0")} / ${matchDmy[3]}`);
      } else {
        const matchYmd = current.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (matchYmd) {
          setEditingConfigValue(`${matchYmd[3].padStart(2, "0")} / ${matchYmd[2].padStart(2, "0")} / ${matchYmd[1]}`);
        } else if (current && current !== "Ninguno indicado") {
          setEditingConfigValue(current);
        } else {
          setEditingConfigValue("");
        }
      }
    }
  };

  const formatFechaLimite = (val: string): string => {
    if (!val || val === "Ninguno indicado") return "Ninguno indicado";
    const partsYmd = val.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (partsYmd) {
      return `${partsYmd[3].padStart(2, "0")}/${partsYmd[2].padStart(2, "0")}/${partsYmd[1]}`;
    }
    const partsDmy = val.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
    if (partsDmy) {
      return `${partsDmy[1].padStart(2, "0")}/${partsDmy[2].padStart(2, "0")}/${partsDmy[3]}`;
    }
    return val.replace(/\s*\/\s*/g, "/");
  };

  const saveConfigField = async () => {
    if (editingConfigKey) {
      let updatedValue = editingConfigValue.trim() || "Ninguno indicado";
      const fieldKey = editingConfigKey;

      if (fieldKey === "rangoAutorizado") {
        const cleanDesde = (rangoDesde.replace(/\D/g, "") || "0").padStart(8, "0");
        const cleanHasta = (rangoHasta.replace(/\D/g, "") || "0").padStart(8, "0");
        const cleanPrefijo = rangoPrefijo.trim() || "000-001-01-";
        const prefWithDash = cleanPrefijo.endsWith("-") ? cleanPrefijo : cleanPrefijo + "-";
        updatedValue = `DEL ${prefWithDash}${cleanDesde} AL ${prefWithDash}${cleanHasta}`;
      }

      if (fieldKey === "fechaLimiteEmision") {
        const partsYmd = updatedValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (partsYmd) {
          updatedValue = `${partsYmd[3].padStart(2, "0")}/${partsYmd[2].padStart(2, "0")}/${partsYmd[1]}`;
        } else {
          const partsDmy = updatedValue.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
          if (partsDmy) {
            updatedValue = `${partsDmy[1].padStart(2, "0")}/${partsDmy[2].padStart(2, "0")}/${partsDmy[3]}`;
          } else {
            const digits = updatedValue.replace(/\D/g, "");
            if (digits.length === 8) {
              updatedValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
            } else {
              updatedValue = updatedValue.replace(/\s*\/\s*/g, "/");
            }
          }
        }
      }

      // Optimistic update in UI
      setCompanySettings((prev) => ({
        ...prev,
        [fieldKey]: updatedValue,
      }));
      setEditingConfigKey(null);

      // Persist in PostgreSQL database
      try {
        await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [fieldKey]: updatedValue }),
        });
      } catch (err) {
        console.error("Error updating company setting in DB:", err);
      }
    }
  };

  // Invoice Editor & PO Generation State
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const openInvoiceEditor = (invoiceToEdit?: any) => {
    if (currentView !== "factura-editor") {
      setPreviousInvoiceView(currentView);
    }
    setEditingInvoice(invoiceToEdit || null);
    setCurrentView("factura-editor");
  };



  // Plan de cuentas personalization sidebar states (Matching screenshot)
  const [showConfigSidebar, setShowConfigSidebar] = useState(false);
  const [pageSize, setPageSize] = useState<number>(75);
  const [rowDensity, setRowDensity] = useState<"espacioso" | "acogedor" | "compacto">("acogedor");
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    rows: false,
    columns: false,
    preferences: false,
  });
  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    code: true, // N.º
    type: true, // Tipo de cuenta
    detailType: true, // Tipo de detalles
    description: true, // Descripción
    currency: true, // Moneda
    bookBalance: true, // Saldo en libros
    bankBalance: true, // Saldo bancario
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "code",
    "type",
    "detailType",
    "description",
    "currency",
    "bookBalance",
    "bankBalance",
  ]);
  const [activateAccountNumbers, setActivateAccountNumbers] = useState(true);
  const [alternateRowColor, setAlternateRowColor] = useState(false);
  const [showInactiveAccounts, setShowInactiveAccounts] = useState(true);
  const [showReportBadges, setShowReportBadges] = useState(false);
  const [quotesAutoOpenCreate, setQuotesAutoOpenCreate] = useState(false);
  const [customersAutoOpenCreate, setCustomersAutoOpenCreate] = useState(false);
  const [vendorsAutoOpenCreate, setVendorsAutoOpenCreate] = useState(false);
  const [inventoryAutoOpenCreate, setInventoryAutoOpenCreate] = useState(false);

  // Quick Actions Bar State & Config
  const quickActions = [
    { id: "crear-cotizacion", label: "Crear Cotización" },
    { id: "crear-factura", label: "Crear Factura de Venta" },
    { id: "registrar-pago", label: "Registrar Cobro a Cliente" },
    { id: "crear-factura-compra", label: "Registrar Factura de Compra" },
    { id: "crear-orden-compra", label: "Crear Orden de Compra" },
    { id: "crear-producto", label: "Crear Producto / Insumo" },
    { id: "agregar-cliente", label: "Agregar Cliente" },
    { id: "agregar-proveedor", label: "Agregar Proveedor" },
    { id: "agregar-deposito", label: "Agregar Depósito Bancario" },
    { id: "registrar-gasto", label: "Registrar Gasto" },
  ];

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [customerForm, setCustomerForm] = useState({
    name: "",
    macolaCode: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
  });

  const [vendorForm, setVendorForm] = useState({
    name: "",
    macolaCode: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
  });

  const handleQuickAction = (id: string) => {
    setShowAccionesDropdown(false);
    setModalError("");
    setModalSuccess("");
    if (id === "crear-cotizacion") {
      setQuotesAutoOpenCreate(true);
      setCurrentView("cotizaciones");
      return;
    }
    if (id === "crear-producto") {
      setInventoryAutoOpenCreate(true);
      setCurrentView("inventario");
      return;
    }
    if (id === "agregar-cliente") {
      setCustomersAutoOpenCreate(true);
      setCurrentView("clientes");
      return;
    }
    if (id === "crear-factura") {
      openInvoiceEditor();
      return;
    }
    if (id === "registrar-pago") {
      openRecibirPagoView();
      return;
    }
    if (id === "crear-factura-compra") {
      setCurrentView("factura-compra-editor");
      return;
    }
    if (id === "crear-orden-compra") {
      openPurchaseOrderEditor();
      return;
    }
    if (id === "agregar-proveedor") {
      setVendorsAutoOpenCreate(true);
      setCurrentView("proveedores");
      return;
    }
    if (id === "agregar-deposito") {
      openDepositoBancarioView();
      return;
    }
    if (id === "registrar-gasto" || id === "agregar-gasto") {
      openGastoView();
      return;
    }
    if (id === "pagar-facturas" || id === "pagar-proveedor") {
      openPagarProveedorView();
      return;
    }
    setActiveModal(id);
  };


  // Purchase Orders State
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<any | null>(null);
  const openPurchaseOrderEditor = (poToEdit?: any) => {
    setEditingPurchaseOrder(poToEdit || null);
    setCurrentView("orden-compra-editor");
  };

  // Cash Movements Navigation Helpers
  const openDepositoBancarioView = () => {
    setCurrentView("deposito-bancario");
  };

  const openGastoView = () => {
    setCurrentView("agregar-gasto");
  };

  const [pagarProveedorVendorFilter, setPagarProveedorVendorFilter] = useState<string | null>(null);
  const openPagarProveedorView = (vendorFilter?: string | React.MouseEvent) => {
    setPagarProveedorVendorFilter(typeof vendorFilter === "string" ? vendorFilter : null);
    setCurrentView("pagar-proveedor");
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear cliente");
      }
      setModalSuccess("¡Cliente agregado exitosamente a la base de datos!");
      setCustomerForm({ name: "", macolaCode: "", email: "", phone: "", address: "", currency: "USD" });
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al registrar cliente");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear proveedor");
      }
      setModalSuccess("¡Proveedor agregado exitosamente a la base de datos!");
      setVendorForm({ name: "", macolaCode: "", email: "", phone: "", address: "", currency: "USD" });
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al registrar proveedor");
    } finally {
      setModalLoading(false);
    }
  };

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name || "",
      macolaCode: c.macolaCode || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      currency: c.currency || "USD",
    });
    setModalError("");
    setModalSuccess("");
    setActiveModal("editar-cliente");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar cliente");
      }
      setModalSuccess("¡Cliente actualizado exitosamente!");
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setEditingCustomer(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al actualizar cliente");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!editingCustomer) return;
    if (!confirm(`¿Eliminar al cliente "${editingCustomer.name}"?`)) return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar cliente");
      }
      setModalSuccess("¡Cliente eliminado!");
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setEditingCustomer(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al eliminar cliente");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name || "",
      macolaCode: v.macolaCode || "",
      email: v.email || "",
      phone: v.phone || "",
      address: v.address || "",
      currency: v.currency || "USD",
    });
    setModalError("");
    setModalSuccess("");
    setActiveModal("editar-proveedor");
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`/api/vendors/${editingVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar proveedor");
      }
      setModalSuccess("¡Proveedor actualizado exitosamente!");
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setEditingVendor(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al actualizar proveedor");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!editingVendor) return;
    if (!confirm(`¿Eliminar al proveedor "${editingVendor.name}"?`)) return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`/api/vendors/${editingVendor.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar proveedor");
      }
      setModalSuccess("¡Proveedor eliminado!");
      await loadDashboardData();
      setTimeout(() => {
        setActiveModal(null);
        setEditingVendor(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al eliminar proveedor");
    } finally {
      setModalLoading(false);
    }
  };

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Fetch all live data from Next.js API routes
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [accRes, cusRes, venRes, invRes, bankRes, txRes, ruleRes, noteRes, invcRes, poRes] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/vendors").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json()),
        fetch("/api/bank-accounts").then((r) => r.json()),
        fetch("/api/bank-transactions").then((r) => r.json()),
        fetch("/api/bank-rules").then((r) => r.json()),
        fetch("/api/credit-debit-notes").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/invoices").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/purchase-orders").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      loadProductCategories();

      if (accRes.success) setAccounts(accRes.data || []);
      if (cusRes.success) setCustomers(cusRes.data || []);
      if (venRes.success) setVendors(venRes.data || []);
      if (invRes.success) {
        setInventory(Array.isArray(invRes.data) ? invRes.data : []);
      }

      if (bankRes.success) setConnectedBanks(bankRes.data || []);
      if (txRes.success) setBankTransactions(txRes.data || []);
      if (ruleRes.success) setAutomationRules(ruleRes.data || []);
      if (noteRes && noteRes.success) setCreditDebitNotes(noteRes.data || []);
      if (invcRes && invcRes.success && Array.isArray(invcRes.data)) {
        setInvoicesList(
          invcRes.data.map((inv: any) => ({
            num: inv.invoiceNumber,
            date: inv.invoiceDate,
            customer: inv.customerName,
            due: inv.dueDate || "",
            total: inv.total,
            status: inv.status,
            paymentTerms: inv.paymentTerms,
            customerEmail: inv.customerEmail || "",
            lines: inv.lines || [],
          }))
        );
      }

      if (poRes && poRes.success && Array.isArray(poRes.data)) {
        setPurchaseOrders(
          poRes.data.map((po: any) => ({
            id: po.id,
            num: po.orderNumber,
            date: po.issueDate,
            vendor: po.vendorName,
            vendorId: po.vendorId,
            vendorEmail: po.vendorEmail,
            vendorAddress: po.vendorAddress,
            category: po.category,
            total: Number(po.total) || 0,
            subtotal: Number(po.subtotal) || 0,
            tax: Number(po.tax) || 0,
            currency: po.currency || "USD",
            expectedDate: po.expectedDate,
            paymentTerms: po.paymentTerms,
            status: po.status,
            notes: po.notes,
            items: po.items || [],
          }))
        );
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBankingData = async () => {
    try {
      const [bankRes, txRes, ruleRes] = await Promise.all([
        fetch("/api/bank-accounts").then((r) => r.json()),
        fetch("/api/bank-transactions").then((r) => r.json()),
        fetch("/api/bank-rules").then((r) => r.json()),
      ]);
      if (bankRes.success) setConnectedBanks(bankRes.data || []);
      if (txRes.success) setBankTransactions(txRes.data || []);
      if (ruleRes.success) setAutomationRules(ruleRes.data || []);
    } catch (err) {
      console.error("Error loading banking data:", err);
    }
  };

  const handleUpdateTransactionStatus = async (txId: string, newStatus: string, toastMsg?: string) => {
    setBankTransactions((prev) =>
      prev.map((item) => (item.id === txId ? { ...item, status: newStatus } : item))
    );
    try {
      await fetch(`/api/bank-transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (toastMsg) {
        setBankToastNotification(toastMsg);
        setTimeout(() => setBankToastNotification(""), 4000);
      }
      loadBankingData();
    } catch (err) {
      console.error("Error updating transaction in DB:", err);
    }
  };

  const handleToggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: newActive } : r))
    );
    try {
      await fetch(`/api/bank-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
    } catch (err) {
      console.error("Error toggling rule in DB:", err);
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    setAutomationRules((prev) => prev.filter((r) => r.id !== ruleId));
    try {
      await fetch(`/api/bank-rules/${ruleId}`, { method: "DELETE" });
      setBankToastNotification(`Regla "${ruleName}" eliminada de la base de datos.`);
      setTimeout(() => setBankToastNotification(""), 3500);
    } catch (err) {
      console.error("Error deleting rule in DB:", err);
    }
  };

  const [currentAdminUser, setCurrentAdminUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentAdminUser(data.user);
        }
      }
    } catch (e) {
      console.error("Error loading current user:", e);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadVendorReturns();
    loadCurrentUser();
    loadPettyCashData();
  }, []);

  // ==========================================
  // CAJA CHICA & CONTROL DE ARQUEOS STATE
  // ==========================================
  const [pettyCashFunds, setPettyCashFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>("");
  const [pettyCashLoading, setPettyCashLoading] = useState<boolean>(false);
  const [cajaChicaActiveTab, setCajaChicaActiveTab] = useState<"movimientos" | "arqueo" | "historial" | "vales" | "reposicion">("movimientos");
  const [pettyCashAudits, setPettyCashAudits] = useState<any[]>([]);
  const [pettyCashVouchers, setPettyCashVouchers] = useState<any[]>([]);

  // Modales
  const [showNewExpenseModal, setShowNewExpenseModal] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    type: "EXPENSE",
    category: "Alimentación y refrigerios",
    concept: "",
    beneficiary: "",
    voucherNumber: "",
    invoiceNumber: "",
    cai: "",
    amount: "",
    taxDeductible: true,
  });
  const [submittingExpense, setSubmittingExpense] = useState<boolean>(false);

  const [showNewVoucherModal, setShowNewVoucherModal] = useState<boolean>(false);
  const [voucherForm, setVoucherForm] = useState({
    beneficiary: "",
    department: "Producción",
    concept: "",
    amount: "",
    expectedLiquidationDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  });
  const [submittingVoucher, setSubmittingVoucher] = useState<boolean>(false);

  const [liquidatingVoucher, setLiquidatingVoucher] = useState<any | null>(null);
  const [liquidateForm, setLiquidateForm] = useState({
    actualExpense: "",
    returnedCash: "",
    receiptNumber: "",
    notes: "",
  });
  const [submittingLiquidation, setSubmittingLiquidation] = useState<boolean>(false);

  // Arqueo Interactivo Denominaciones
  const [cashCountHNL, setCashCountHNL] = useState<Record<string, number>>({
    "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0,
    "0.50": 0, "0.20": 0, "0.10": 0, "0.05": 0,
  });
  const [cashCountUSD, setCashCountUSD] = useState<Record<string, number>>({
    "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "1": 0,
    "0.25": 0, "0.10": 0, "0.05": 0, "0.01": 0,
  });
  const [auditAuditorName, setAuditAuditorName] = useState<string>("Lic. Auditoría Interna");
  const [auditObservations, setAuditObservations] = useState<string>("");
  const [savingAudit, setSavingAudit] = useState<boolean>(false);
  const [selectedAuditForPrint, setSelectedAuditForPrint] = useState<any | null>(null);
  const [pettyCashToast, setPettyCashToast] = useState<string>("");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("TODOS");

  const showPettyCashToast = (msg: string) => {
    setPettyCashToast(msg);
    setTimeout(() => setPettyCashToast(""), 4000);
  };

  const loadPettyCashData = async (fundIdToSelect?: string) => {
    setPettyCashLoading(true);
    try {
      const [fundsRes, auditsRes, vouchersRes] = await Promise.all([
        fetch("/api/caja-chica/funds").then((r) => r.json()),
        fetch("/api/caja-chica/audits").then((r) => r.json()),
        fetch("/api/caja-chica/vouchers").then((r) => r.json()),
      ]);
      if (fundsRes.success && Array.isArray(fundsRes.data)) {
        setPettyCashFunds(fundsRes.data);
        if (!selectedFundId || fundIdToSelect) {
          const target = fundIdToSelect || fundsRes.data[0]?.id || "";
          setSelectedFundId(target);
        }
      }
      if (auditsRes.success && Array.isArray(auditsRes.data)) {
        setPettyCashAudits(auditsRes.data);
      }
      if (vouchersRes.success && Array.isArray(vouchersRes.data)) {
        setPettyCashVouchers(vouchersRes.data);
      }
    } catch (err) {
      console.error("Error loading petty cash data:", err);
    } finally {
      setPettyCashLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId) {
      alert("Por favor seleccione un fondo de caja chica");
      return;
    }
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Por favor ingrese un monto válido mayor a cero");
      return;
    }
    if (!expenseForm.concept.trim()) {
      alert("Por favor ingrese el concepto del gasto");
      return;
    }

    setSubmittingExpense(true);
    try {
      const res = await fetch("/api/caja-chica/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundId: selectedFundId,
          type: expenseForm.type,
          category: expenseForm.category,
          concept: expenseForm.concept.trim(),
          beneficiary: expenseForm.beneficiary.trim() || undefined,
          voucherNumber: expenseForm.voucherNumber.trim() || undefined,
          invoiceNumber: expenseForm.invoiceNumber.trim() || undefined,
          cai: expenseForm.cai.trim() || undefined,
          amount: amt,
          taxDeductible: expenseForm.taxDeductible,
          registeredBy: currentAdminUser?.name || "Administrador",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showPettyCashToast(expenseForm.type === "EXPENSE" ? "Gasto registrado exitosamente en Caja Chica" : "Reembolso / Ingreso registrado exitosamente");
        setShowNewExpenseModal(false);
        setExpenseForm({
          type: "EXPENSE",
          category: "Alimentación y refrigerios",
          concept: "",
          beneficiary: "",
          voucherNumber: "",
          invoiceNumber: "",
          cai: "",
          amount: "",
          taxDeductible: true,
        });
        await loadPettyCashData(selectedFundId);
      } else {
        alert(data.error || "Error al registrar movimiento");
      }
    } catch (err: any) {
      alert(err.message || "Error de red al registrar movimiento");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId) {
      alert("Por favor seleccione un fondo de caja chica");
      return;
    }
    const amt = parseFloat(voucherForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Por favor ingrese un monto válido");
      return;
    }
    if (!voucherForm.beneficiary.trim() || !voucherForm.concept.trim()) {
      alert("Complete el beneficiario y el concepto del vale provisional");
      return;
    }

    setSubmittingVoucher(true);
    try {
      const res = await fetch("/api/caja-chica/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundId: selectedFundId,
          beneficiary: voucherForm.beneficiary.trim(),
          department: voucherForm.department.trim() || undefined,
          concept: voucherForm.concept.trim(),
          amount: amt,
          expectedLiquidationDate: voucherForm.expectedLiquidationDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showPettyCashToast(`Vale Provisional ${data.data.voucherNumber} emitido correctamente`);
        setShowNewVoucherModal(false);
        setVoucherForm({
          beneficiary: "",
          department: "Producción",
          concept: "",
          amount: "",
          expectedLiquidationDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        });
        await loadPettyCashData(selectedFundId);
      } else {
        alert(data.error || "Error al emitir vale provisional");
      }
    } catch (err: any) {
      alert(err.message || "Error al emitir vale");
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handleLiquidateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidatingVoucher) return;
    const actual = parseFloat(liquidateForm.actualExpense);
    const returned = parseFloat(liquidateForm.returnedCash || "0");
    if (isNaN(actual) || actual < 0) {
      alert("Ingrese un gasto real válido");
      return;
    }

    setSubmittingLiquidation(true);
    try {
      const res = await fetch("/api/caja-chica/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LIQUIDATE",
          voucherId: liquidatingVoucher.id,
          actualExpense: actual,
          returnedCash: isNaN(returned) ? 0 : returned,
          receiptNumber: liquidateForm.receiptNumber.trim() || undefined,
          notes: liquidateForm.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showPettyCashToast(`Vale ${liquidatingVoucher.voucherNumber} liquidado exitosamente`);
        setLiquidatingVoucher(null);
        setLiquidateForm({ actualExpense: "", returnedCash: "", receiptNumber: "", notes: "" });
        await loadPettyCashData(selectedFundId);
      } else {
        alert(data.error || "Error al liquidar vale");
      }
    } catch (err: any) {
      alert(err.message || "Error al liquidar vale");
    } finally {
      setSubmittingLiquidation(false);
    }
  };

  const handleSaveAudit = async (currentFund: any, calculatedCash: number, pendingReceipts: number, activeVales: number, diff: number, auditStatus: string) => {
    if (!currentFund) return;
    setSavingAudit(true);
    try {
      const res = await fetch("/api/caja-chica/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundId: currentFund.id,
          theoreticalBalance: currentFund.fixedAmount - pendingReceipts - activeVales,
          physicalCashTotal: calculatedCash,
          pendingReceiptsTotal: pendingReceipts,
          activeVouchersTotal: activeVales,
          difference: diff,
          status: auditStatus,
          denominations: currentFund.currency === "USD" ? cashCountUSD : cashCountHNL,
          observations: auditObservations.trim() || undefined,
          auditorName: auditAuditorName.trim() || "Auditoría Interna",
          custodianName: currentFund.custodianName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showPettyCashToast(`Acta de Arqueo ${data.data.auditNumber} registrada con éxito`);
        setSelectedAuditForPrint({
          ...data.data,
          fund: currentFund,
          unreimbursedTransactions: currentFund.transactions?.filter((t: any) => !t.isReimbursed && t.type === "EXPENSE") || [],
          activeVouchersList: currentFund.vouchers?.filter((v: any) => v.status === "ACTIVE") || [],
        });
        await loadPettyCashData(selectedFundId);
        setCajaChicaActiveTab("historial");
      } else {
        alert(data.error || "Error al guardar arqueo");
      }
    } catch (err: any) {
      alert(err.message || "Error al guardar acta de arqueo");
    } finally {
      setSavingAudit(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // Currency Formatter: $0,000.00
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Official Account Types and Subtypes Hierarchy
  const ACCOUNT_CATEGORIES: Record<string, string[]> = {
    ACTIVO: [
      "Efectivo y equivalentes de efectivo",
      "Cuentas por cobrar (C/C)",
      "Activos corrientes",
      "Activos fijos",
      "Activos no corrientes",
    ],
    RESPONSABILIDAD: [
      "Tarjeta de crédito",
      "Cuentas por pagar (C/P)",
      "Pasivos corrientes",
      "Pasivos no corrientes",
    ],
    "FONDOS PROPIOS": [
      "Fondos propios del propietario",
    ],
    INGRESOS: [
      "Ingresos",
      "Otros ingresos",
    ],
    GASTO: [
      "Costo de las ventas",
      "Gastos",
      "Otros gastos",
    ],
  };

  const DETAIL_TYPES_MAP: Record<string, string[]> = {
    "Efectivo y equivalentes de efectivo": [
      "Ahorros",
      "Alquileres de propiedad fiduciaria",
      "Banco",
      "Caja chica",
      "Cuenta de anticipos de clientes",
      "Dinero en efectivo",
      "Dinero recibido sin depositar",
      "Efectivo disponible",
      "Efectivo y equivalentes de efectivo",
      "Mercado monetario",
    ],
    "Cuentas por cobrar (C/C)": [
      "Cuentas por cobrar",
    ],
    "Activos corrientes": [
      "Inventario",
      "Pagos anticipados",
      "Gastos pagados por adelantado",
      "Otros activos corrientes",
    ],
    "Activos fijos": [
      "Maquinaria y equipo",
      "Mobiliario y enseres",
      "Vehículos",
      "Edificios",
      "Terrenos",
      "Depreciación acumulada",
    ],
    "Activos no corrientes": [
      "Activos intangibles",
      "Depósitos de garantía",
      "Inversiones a largo plazo",
      "Otros activos no corrientes",
    ],
    "Tarjeta de crédito": [
      "Tarjeta de crédito",
    ],
    "Cuentas por pagar (C/P)": [
      "Cuentas por pagar",
    ],
    "Pasivos corrientes": [
      "Nómina por pagar",
      "Impuestos sobre ventas por pagar",
      "Préstamos a corto plazo",
      "Otros pasivos corrientes",
    ],
    "Pasivos no corrientes": [
      "Hipotecas por pagar",
      "Préstamos a largo plazo",
      "Otros pasivos a largo plazo",
    ],
    "Fondos propios del propietario": [
      "Capital del propietario",
      "Aportaciones del propietario",
      "Retiros del propietario",
      "Ganancias retenidas",
    ],
    "Ingresos": [
      "Ventas de productos",
      "Ingresos por servicios",
      "Descuentos sobre ventas",
    ],
    "Otros ingresos": [
      "Ingresos por intereses",
      "Dividendos",
      "Ganancias cambiarias",
      "Otros ingresos varios",
    ],
    "Costo de las ventas": [
      "Costo de mercancía vendida",
      "Mano de obra directa",
      "Suministros y materiales",
    ],
    "Gastos": [
      "Publicidad y promoción",
      "Alquiler de oficinas",
      "Reparación y mantenimiento",
      "Sueldos y salarios",
      "Servicios públicos",
      "Seguros",
      "Gastos de viaje",
    ],
    "Otros gastos": [
      "Gastos por intereses",
      "Pérdidas cambiarias",
      "Cargos bancarios",
      "Otros gastos varios",
    ],
  };

  const getAccountClassification = (type: string, name: string) => {
    const t = (type || "").trim();
    const n = (name || "").toLowerCase();

    for (const [cat, subTypes] of Object.entries(ACCOUNT_CATEGORIES)) {
      if (subTypes.includes(t)) {
        return { category: cat, accountType: t };
      }
    }

    const upper = t.toUpperCase();
    if (upper === "ASSET" || upper === "ACTIVO") {
      if (n.includes("cash") || n.includes("checking") || n.includes("banco") || n.includes("caja")) {
        return { category: "ACTIVO", accountType: "Efectivo y equivalentes de efectivo" };
      }
      if (n.includes("receivable") || n.includes("cobrar") || n.includes("cliente")) {
        return { category: "ACTIVO", accountType: "Cuentas por cobrar (C/C)" };
      }
      if (n.includes("fijo") || n.includes("equipment") || n.includes("building") || n.includes("machinery")) {
        return { category: "ACTIVO", accountType: "Activos fijos" };
      }
      if (n.includes("non-current") || n.includes("largo plazo") || n.includes("no corriente")) {
        return { category: "ACTIVO", accountType: "Activos no corrientes" };
      }
      return { category: "ACTIVO", accountType: "Activos corrientes" };
    }

    if (upper === "LIABILITY" || upper === "PASIVO" || upper === "RESPONSABILIDAD") {
      if (n.includes("credit card") || n.includes("tarjeta")) {
        return { category: "RESPONSABILIDAD", accountType: "Tarjeta de crédito" };
      }
      if (n.includes("payable") || n.includes("pagar") || n.includes("proveedor")) {
        return { category: "RESPONSABILIDAD", accountType: "Cuentas por pagar (C/P)" };
      }
      if (n.includes("non-current") || n.includes("largo plazo") || n.includes("no corriente") || n.includes("mortgage")) {
        return { category: "RESPONSABILIDAD", accountType: "Pasivos no corrientes" };
      }
      return { category: "RESPONSABILIDAD", accountType: "Pasivos corrientes" };
    }

    if (upper === "EQUITY" || upper === "CAPITAL" || upper === "PATRIMONIO" || upper === "FONDOS PROPIOS") {
      return { category: "FONDOS PROPIOS", accountType: "Fondos propios del propietario" };
    }

    if (upper === "INCOME" || upper === "REVENUE" || upper === "INGRESO" || upper === "INGRESOS") {
      if (n.includes("other") || n.includes("otro") || n.includes("interest") || n.includes("interes")) {
        return { category: "INGRESOS", accountType: "Otros ingresos" };
      }
      return { category: "INGRESOS", accountType: "Ingresos" };
    }

    if (upper === "EXPENSE" || upper === "GASTO" || upper === "GASTOS") {
      if (n.includes("cost of") || n.includes("costo") || n.includes("cogs")) {
        return { category: "GASTO", accountType: "Costo de las ventas" };
      }
      if (n.includes("other") || n.includes("otro")) {
        return { category: "GASTO", accountType: "Otros gastos" };
      }
      return { category: "GASTO", accountType: "Gastos" };
    }

    return { category: "ACTIVO", accountType: "Activos corrientes" };
  };

  // Calculations
  const totalInventoryUnits = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalInventoryValuation = inventory.reduce((sum, item) => sum + (item.quantity || 0) * (item.cost || 0), 0);

  // Dynamic Income and Expenses from DB Accounts
  const incomeAccounts = accounts.filter((a) => {
    if (!a.isActive) return false;
    const t = (a.type || "").toLowerCase();
    const { category } = getAccountClassification(a.type, a.name);
    return t.includes("income") || t.includes("ingreso") || category === "INGRESOS";
  });
  const totalIncome = incomeAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const expenseAccounts = accounts.filter((a) => {
    if (!a.isActive) return false;
    const t = (a.type || "").toLowerCase();
    const { category } = getAccountClassification(a.type, a.name);
    return t.includes("expense") || t.includes("gasto") || category === "GASTO";
  });
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // Proportions for Pérdidas y Ganancias bar chart
  const maxPnL = Math.max(totalIncome, totalExpenses, 1);
  const incomePercent = totalIncome > 0 ? Math.min(100, Math.max(8, (totalIncome / maxPnL) * 100)) : 0;
  const expensePercent = totalExpenses > 0 ? Math.min(100, Math.max(8, (totalExpenses / maxPnL) * 100)) : 0;

  // Donut chart color palette
  const expenseChartColors = ["#2563eb", "#0097a7", "#6b21a8", "#b91c1c", "#ea580c", "#10b981", "#6366f1", "#d97706"];

  // Calculate dynamic slices for Gastos Donut Chart
  let cumulativeExpenseOffset = 0;
  const expenseSlices = expenseAccounts.map((acc, index) => {
    const bal = Number(acc.balance) || 0;
    const pct = totalExpenses > 0 ? (bal / totalExpenses) * 100 : 0;
    const slice = {
      ...acc,
      color: expenseChartColors[index % expenseChartColors.length],
      percentage: pct,
      offset: cumulativeExpenseOffset,
    };
    cumulativeExpenseOffset += pct;
    return slice;
  });

  // Filters
  const filteredAccounts = accounts.filter((a) => {
    if (!showInactiveAccounts && !a.isActive) return false;
    const term = accountsSearch ? accountsSearch.toLowerCase() : search.toLowerCase();
    const matchesSearch = !term || a.code.toLowerCase().includes(term) || a.name.toLowerCase().includes(term);
    const { category, accountType } = getAccountClassification(a.type, a.name);
    const matchesType =
      accountsTypeFilter === "Todo" ||
      category === accountsTypeFilter ||
      accountType === accountsTypeFilter;
    return matchesSearch && matchesType;
  });

  const displayedAccounts = filteredAccounts.slice(0, pageSize);

  const getDetailType = (type: string, name: string): string => {
    const n = (name || "").toLowerCase();
    const { accountType } = getAccountClassification(type, name);
    const list = DETAIL_TYPES_MAP[accountType] || [accountType];
    const match = list.find((item) => n.includes(item.toLowerCase()));
    return match || list[0];
  };

  const handleExportAccounts = () => {
    const headers = ["Codigo,Nombre,Tipo,Moneda,Estado"];
    const rows = filteredAccounts.map(
      (a) => `"${a.code}","${a.name.replace(/"/g, '""')}","${a.type}","${a.currency}","${a.isActive ? "Activa" : "Inactiva"}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plan_de_cuentas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAccounts = () => {
    window.print();
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setNewAccountForm({
      code: acc.code || "",
      name: acc.name || "",
      type: acc.type || "Efectivo y equivalentes de efectivo",
      detailType: getDetailType(acc.type, acc.name) || "Banco",
      isSubAccount: false,
      parentAccountId: "",
      description: acc.name || "",
      isLocked: false,
      currency: acc.currency || "USD",
      balance: acc.balance || 0,
      isActive: acc.isActive ?? true,
    });
    setAccountModalError("");
    setAccountModalSuccess("");
    setShowNewAccountModal(true);
  };

  const handleSaveAccount = async (
    e?: React.FormEvent,
    keepOpenAndNew: boolean = false
  ) => {
    if (e) e.preventDefault();
    setAccountModalLoading(true);
    setAccountModalError("");
    setAccountModalSuccess("");

    try {
      if (editingAccountId) {
        // Mode: EDIT / UPDATE existing account
        const res = await fetch(`/api/accounts/${editingAccountId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: newAccountForm.code.trim(),
            name: newAccountForm.name.trim(),
            type: newAccountForm.type,
            currency: newAccountForm.currency || "USD",
            balance: Number(newAccountForm.balance) || 0,
            isActive: newAccountForm.isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al actualizar la cuenta contable");
        }

        setAccounts((prev) =>
          prev
            .map((a) => (a.id === editingAccountId ? data.data : a))
            .sort((a, b) => a.code.localeCompare(b.code))
        );
        setAccountModalSuccess("Cuenta contable actualizada exitosamente");

        setTimeout(() => {
          setShowNewAccountModal(false);
          setEditingAccountId(null);
          setAccountModalSuccess("");
        }, 700);
      } else {
        // Mode: CREATE new account
        const { category } = getAccountClassification(newAccountForm.type, newAccountForm.name);
        const assignedCode =
          newAccountForm.code.trim() ||
          (category === "ACTIVO"
            ? `1${100 + accounts.length}`
            : category === "RESPONSABILIDAD"
              ? `2${100 + accounts.length}`
              : category === "FONDOS PROPIOS"
                ? `3${100 + accounts.length}`
                : category === "INGRESOS"
                  ? `4${100 + accounts.length}`
                  : `5${100 + accounts.length}`);

        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: assignedCode,
            name: newAccountForm.name.trim(),
            type: newAccountForm.type,
            currency: newAccountForm.currency || "USD",
            balance: Number(newAccountForm.balance) || 0,
            isActive: newAccountForm.isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al crear la cuenta contable");
        }

        setAccounts((prev) => [...prev, data.data].sort((a, b) => a.code.localeCompare(b.code)));
        setAccountModalSuccess("Cuenta contable creada exitosamente");

        if (keepOpenAndNew) {
          setTimeout(() => {
            setAccountModalSuccess("");
            setNewAccountForm({
              code: "",
              name: "",
              type: "Efectivo y equivalentes de efectivo",
              detailType: "Banco",
              isSubAccount: false,
              parentAccountId: "",
              description: "",
              isLocked: false,
              currency: "USD",
              balance: 0,
              isActive: true,
            });
          }, 600);
        } else {
          setTimeout(() => {
            setShowNewAccountModal(false);
            setAccountModalSuccess("");
            setNewAccountForm({
              code: "",
              name: "",
              type: "Efectivo y equivalentes de efectivo",
              detailType: "Banco",
              isSubAccount: false,
              parentAccountId: "",
              description: "",
              isLocked: false,
              currency: "USD",
              balance: 0,
              isActive: true,
            });
          }, 700);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setAccountModalError(msg);
    } finally {
      setAccountModalLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.macolaCode && c.macolaCode.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.macolaCode && v.macolaCode.toLowerCase().includes(search.toLowerCase()))
  );

  const allLots = useMemo(() => {

    const list: {
      lot: ItemLot;
      item: InventoryItem;
      daysLeft: number | null;
      status: "vencido" | "por-vencer" | "vigente" | "sin-fecha";
    }[] = [];

    inventory.forEach((item) => {
      if (item.lots && item.lots.length > 0) {
        item.lots.forEach((lot) => {
          const expDate = lot.expirationDate ? new Date(lot.expirationDate) : null;
          const today = new Date();
          const daysLeft = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;

          let status: "vencido" | "por-vencer" | "vigente" | "sin-fecha" = "sin-fecha";
          if (daysLeft !== null) {
            if (daysLeft < 0) status = "vencido";
            else if (daysLeft <= 30) status = "por-vencer";
            else status = "vigente";
          }

          list.push({ lot, item, daysLeft, status });
        });
      }
    });

    return list;
  }, [inventory]);

  const allSerials = useMemo(() => {
    const list: {
      serial: ItemSerial;
      item: InventoryItem;
    }[] = [];

    inventory.forEach((item) => {
      if (item.serials && item.serials.length > 0) {
        item.serials.forEach((serial) => {
          list.push({ serial, item });
        });
      }
    });

    return list;
  }, [inventory]);

  // Próximos pagos de la semana (Upcoming Payments of the Week)
  const upcomingWeeklyPayments = useMemo(() => {
    const list: Array<{
      id: string;
      payee: string;
      concept: string;
      dueDate: string;
      daysLeft: string;
      amount: number;
      currency: string;
      status: "URGENTE" | "PROXIMO" | "PROGRAMADO";
    }> = [];

    // 1. Pending purchase invoices from database/state
    purchaseInvoices
      .filter((pi) => pi.paymentStatus === "PENDIENTE")
      .forEach((pi) => {
        list.push({
          id: `pi-${pi.id}`,
          payee: pi.vendorName,
          concept: `Factura ${pi.invoiceNumber}`,
          dueDate: pi.dueDate ? new Date(pi.dueDate).toLocaleDateString("es-HN", { day: "2-digit", month: "short" }) : "05 Sep",
          daysLeft: "Por vencer",
          amount: pi.total,
          currency: pi.currency || "USD",
          status: "URGENTE",
        });
      });

    // 2. Pending purchase orders
    purchaseOrders
      .filter((po) => po.status === "Pendiente" || po.status === "Aprobada")
      .forEach((po) => {
        list.push({
          id: `po-${po.num}`,
          payee: po.vendor,
          concept: `OC ${po.num} • ${po.category}`,
          dueDate: po.date ? new Date(po.date).toLocaleDateString("es-HN", { day: "2-digit", month: "short" }) : "08 Sep",
          daysLeft: po.status === "Aprobada" ? "Aprobada" : "En 3 días",
          amount: po.total,
          currency: "USD",
          status: po.status === "Aprobada" ? "PROGRAMADO" : "PROXIMO",
        });
      });

    return list.slice(0, 3);
  }, [purchaseInvoices, purchaseOrders]);

  // Global click-outside handler: closes ALL open dropdowns when clicking outside them
  useEffect(() => {
    const anyOpen =
      showAccionesDropdown ||
      showSaveDropdown;

    if (!anyOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Close Acciones if click is outside its ref'd container
      if (accionesDropdownRef.current && !accionesDropdownRef.current.contains(e.target as Node)) {
        setShowAccionesDropdown(false);
      }
      // For split-button dropdowns: close when clicking outside any [data-dropdown] wrapper
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowSaveDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [
    showAccionesDropdown,
    showSaveDropdown,
  ]);

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">


      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`${sidebarCollapsed ? "w-20" : "w-64"
          } shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30 sticky top-0 h-screen`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1.5 shrink-0 shadow-xs overflow-hidden">
              <img src="/logo.webp" alt="Prado ERP" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h1 className="font-bold text-sm text-slate-900 leading-tight">Prado ERP</h1>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition hidden md:block"
            title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-medium">
          {/* Dashboard Item */}
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${currentView === "dashboard"
                ? "bg-[#fff7ed] text-[#1b426e] font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {/* Contabilidad Section (Collapsible Dropdown matching screenshot) */}
          <div className="pt-2">
            <button
              onClick={() => setContabilidadOpen(!contabilidadOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-100 ${currentView.includes("cuentas") || currentView === "transacciones" || currentView === "macola-sync" || currentView === "caja-chica" || currentView === "conciliacion-bancaria"
                  ? "font-semibold text-slate-900"
                  : ""
                }`}
            >
              <div className="flex items-center gap-3 truncate">
                <svg className="w-4 h-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {!sidebarCollapsed && <span>Contabilidad</span>}
              </div>
              {!sidebarCollapsed && (
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${contabilidadOpen ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Sub-items */}
            {contabilidadOpen && !sidebarCollapsed && (
              <div className="pl-9 pr-2 py-1 space-y-0.5 border-l-2 border-slate-100 ml-5 mt-1">
                <button
                  onClick={() => setCurrentView("plan-cuentas")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "plan-cuentas"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  Plan de cuentas
                </button>
                <button
                  onClick={() => setCurrentView("transacciones")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "transacciones"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  Transacciones bancarias
                </button>
                <button
                  onClick={() => setCurrentView("conciliacion-bancaria")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "conciliacion-bancaria"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Conciliación extractos</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">NIIF</span>
                </button>
                <button
                  onClick={() => setCurrentView("macola-sync")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "macola-sync"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  Transacciones de integración
                </button>
                <button
                  onClick={() => setCurrentView("caja-chica")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "caja-chica"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  Caja Chica &amp; Arqueos
                </button>
              </div>
            )}
          </div>

          {/* Ventas Collapsible Group */}
          <div className="pt-1">
            <button
              onClick={() => setVentasOpen(!ventasOpen)}
              title={sidebarCollapsed ? "Ventas" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-100 ${currentView === "clientes" ||
                  currentView === "cotizaciones" ||
                  currentView === "lista-facturas" ||
                  currentView === "factura-editor" ||
                  currentView === "notas-credito-debito" ||
                  currentView === "vendedores" ||
                  currentView === "comisiones" ||
                  currentView === "antiguedad-saldos"
                  ? "font-semibold text-slate-900"
                  : ""
                }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Tag className="w-4 h-4 shrink-0 text-slate-600" />
                {!sidebarCollapsed && <span>Ventas</span>}
              </div>
              {!sidebarCollapsed && (
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${ventasOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {ventasOpen && !sidebarCollapsed && (
              <div className="ml-7 mt-1 pl-2 border-l border-slate-200 space-y-1 text-xs">
                {/* 1. Clientes */}
                <button
                  onClick={() => setCurrentView("clientes")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "clientes"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Clientes</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {customers.length}
                  </span>
                </button>

                {/* 2. Cotizaciones */}
                <button
                  onClick={() => setCurrentView("cotizaciones")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "cotizaciones"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Cotizaciones</span>
                </button>

                {/* 2.1 Pedidos de Venta */}
                <button
                  onClick={() => setCurrentView("pedidos-venta")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "pedidos-venta"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Pedidos de Venta</span>
                </button>

                {/* 3. Facturas */}
                <button
                  onClick={() => setCurrentView("lista-facturas")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "lista-facturas" || currentView === "factura-editor"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Facturas</span>
                </button>

                {/* 3. Notas de Crédito & Débito */}
                <button
                  onClick={() => setCurrentView("notas-credito-debito")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "notas-credito-debito"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Notas Crédito / Débito</span>
                </button>

                {/* 4. Vendedores */}
                <button
                  onClick={() => setCurrentView("vendedores")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "vendedores"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Vendedores</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {salesReps.length}
                  </span>
                </button>

                {/* 5. Comisiones */}
                <button
                  onClick={() => setCurrentView("comisiones")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "comisiones"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Comisiones</span>
                </button>

                {/* 6. Antigüedad de Saldos */}
                <button
                  onClick={() => setCurrentView("antiguedad-saldos")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "antiguedad-saldos"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Antigüedad de Saldos</span>
                </button>
              </div>
            )}
          </div>



          {/* Compras Collapsible Group */}
          <div className="pt-1">
            <button
              onClick={() => setComprasOpen(!comprasOpen)}
              title={sidebarCollapsed ? "Compras" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-100 ${currentView === "proveedores" ||
                  currentView === "lista-ordenes-compra" ||
                  currentView === "orden-compra-editor" ||
                  currentView === "factura-compra-lista" ||
                  currentView === "factura-compra-editor" ||
                  currentView === "devoluciones-proveedor" ||
                  currentView === "antiguedad-saldos-proveedores" ||
                  currentView === "retenciones-isv"
                  ? "font-semibold text-slate-900"
                  : ""
                }`}
            >
              <div className="flex items-center gap-3 truncate">
                <svg className="w-4 h-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="flex items-center gap-1.5">
                    Compras
                    {vendorReturns.filter((r) => r.status === "BORRADOR").length > 0 && !comprasOpen && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 rounded-full">
                        {vendorReturns.filter((r) => r.status === "BORRADOR").length}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${comprasOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {comprasOpen && !sidebarCollapsed && (
              <div className="ml-7 mt-1 pl-2 border-l border-slate-200 space-y-1 text-xs">
                {/* 1. Proveedores */}
                <button
                  onClick={() => setCurrentView("proveedores")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "proveedores"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Proveedores</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {vendors.length}
                  </span>
                </button>

                {/* 2. Órdenes de compra */}
                <button
                  onClick={() => setCurrentView("lista-ordenes-compra")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "lista-ordenes-compra" || currentView === "orden-compra-editor"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Órdenes de compra</span>
                </button>

                {/* 3. Facturas de compra */}
                <button
                  onClick={() => setCurrentView("factura-compra-lista")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "factura-compra-lista" || currentView === "factura-compra-editor"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Facturas de compra</span>
                </button>

                {/* 4. Pagos a Proveedores */}
                <button
                  onClick={() => { setSelectedPaymentVendor(""); setCurrentView("pagos-proveedores"); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "pagos-proveedores" || currentView === "pagar-proveedor"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Pagos a Proveedores</span>
                </button>

                {/* 5. Devoluciones a proveedores */}
                <button
                  onClick={() => { setCurrentView("devoluciones-proveedor"); loadVendorReturns(); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "devoluciones-proveedor"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Devoluciones a Prov.</span>
                  {vendorReturns.filter((r) => r.status === "BORRADOR").length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 rounded-full">
                      {vendorReturns.filter((r) => r.status === "BORRADOR").length}
                    </span>
                  )}
                </button>

                {/* 5. Antigüedad Proveedores */}
                <button
                  onClick={() => setCurrentView("antiguedad-saldos-proveedores")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "antiguedad-saldos-proveedores"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Antigüedad Proveedores</span>
                </button>

                {/* 6. Retenciones ISV / SAR */}
                <button
                  onClick={() => setCurrentView("retenciones-isv")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "retenciones-isv"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Retenciones ISV / SAR</span>
                </button>
              </div>
            )}
          </div>


          {/* Inventario Collapsible Group */}
          <div className="pt-1">
            <button
              onClick={() => setInventarioOpen(!inventarioOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-100 ${currentView === "inventario" || currentView === "lotes" || currentView === "series"
                  ? "font-semibold text-slate-900"
                  : ""
                }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Package className="w-4 h-4 shrink-0 text-slate-600" />
                {!sidebarCollapsed && <span>Inventario ({inventory.length})</span>}
              </div>
              {!sidebarCollapsed && (
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${inventarioOpen ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {inventarioOpen && !sidebarCollapsed && (
              <div className="ml-7 mt-1 pl-2 border-l border-slate-200 space-y-1 text-xs">
                <button
                  onClick={() => setCurrentView("inventario")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${currentView === "inventario"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Catálogo de Productos</span>
                </button>
                <button
                  onClick={() => setCurrentView("lotes")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "lotes"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Control de Lotes</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {allLots.length}
                  </span>
                </button>
                <button
                  onClick={() => setCurrentView("series")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-between ${currentView === "series"
                      ? "bg-[#fff7ed] text-[#1b426e] font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span>Números de Serie</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {allSerials.length}
                  </span>
                </button>
              </div>
            )}
          </div>


        </nav>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
            {!sidebarCollapsed ? (
              <>
                <div className="truncate min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 text-xs truncate">
                    {currentAdminUser?.name || "Administrador"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentAdminUser?.email || "admin"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ===================== MAIN WORKSPACE ===================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 capitalize">
                  {currentView === "dashboard" && "Resumen Ejecutivo"}
                  {currentView === "plan-cuentas" && "Contabilidad / Plan de Cuentas"}
                  {currentView === "transacciones" && "Contabilidad / Transacciones Bancarias"}
                  {currentView === "macola-sync" && "Contabilidad / Transacciones de Integración"}
                  {currentView === "caja-chica" && "Contabilidad / Arqueo & Control de Caja Chica"}
                  {currentView === "conciliacion-bancaria" && "Contabilidad / Conciliación de Extracto Mensual"}
                  {currentView === "clientes" && "Directorio de Clientes"}
                  {currentView === "cotizaciones" && "Ventas / Cotizaciones & Presupuestos"}
                  {currentView === "pedidos-venta" && "Ventas / Pedidos de Venta (Sales Orders)"}
                  {currentView === "lista-facturas" && "Gestión de Facturas"}
                  {currentView === "notas-credito-debito" && "Notas de Crédito / Débito"}
                  {currentView === "proveedores" && "Directorio de Proveedores"}
                  {currentView === "lista-ordenes-compra" && "Gestión de Órdenes de Compra"}
                  {currentView === "factura-compra-lista" && "Facturas de Compra & Entradas"}
                  {(currentView === "pagos-proveedores" || currentView === "pagar-proveedor") && "Cuentas por Pagar / Pagos a Proveedores"}
                  {currentView === "devoluciones-proveedor" && "Devoluciones a Proveedores"}
                  {currentView === "vendedores" && "Fuerza de Ventas"}
                  {currentView === "comisiones" && "Control de Comisiones"}
                  {currentView === "inventario" && "Control Maestro de Inventario"}
                  {currentView === "lotes" && "Control de Lotes"}
                  {currentView === "series" && "Control de Números de Serie"}
                  {currentView === "reportes" && "Centro de Reportes"}
                  {currentView === "antiguedad-saldos" && "Reportes / Antigüedad de Saldos Clientes"}
                  {currentView === "antiguedad-saldos-proveedores" && "Reportes / Antigüedad de Saldos Proveedores"}
                  {currentView === "estado-cuenta-cliente" && "Clientes / Estado de Cuenta Individual"}
                  {currentView === "retenciones-isv" && "Compras / Comprobantes de Retención SAR"}
                  {currentView === "configuracion" && "Configuración del Sistema"}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-56 hidden md:block">
              <input
                type="text"
                placeholder="Buscar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 shadow-xs"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sync Button */}
            <button
              onClick={loadDashboardData}
              title="Sincronizar datos"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer text-xs font-medium flex items-center gap-1.5 shadow-xs"
            >
              <svg className={`w-3.5 h-3.5 text-[#1b426e] ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Sync</span>
            </button>

            {/* Acciones Dropdown Button (Al lado derecho de Sync) */}
            <div className="relative" ref={accionesDropdownRef}>
              <button
                type="button"
                onClick={() => setShowAccionesDropdown(!showAccionesDropdown)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20"
              >
                <span>Acciones</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${showAccionesDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Acciones Dropdown Menu */}
              {showAccionesDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-0.5">
                  <div className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Acciones Rápidas
                  </div>
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer flex items-center justify-between group"
                    >
                      <span>{action.label}</span>
                      <span className="text-[#1b426e] font-bold text-sm group-hover:scale-110 transition-transform">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reportes Button */}
            <button
              onClick={() => setCurrentView("reportes")}
              title="Centro de Reportes"
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs ${currentView === "reportes"
                  ? "bg-[#fff7ed] text-[#1b426e] border-[#1b426e]/40"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Reportes</span>
            </button>

            {/* Configuración Button */}
            <button
              onClick={() => setCurrentView("configuracion")}
              title="Configuración del Sistema"
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs ${currentView === "configuracion"
                  ? "bg-[#fff7ed] text-[#1b426e] border-[#1b426e]/40"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configuración</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 w-full">
          {/* ================= VIEW: DASHBOARD ================= */}
          {currentView === "dashboard" && (
            <>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {loading ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : (
                  <>
                    {/* Plan de cuentas */}
                    <div
                      onClick={() => setCurrentView("plan-cuentas")}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-[#1b426e]/50 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Plan de Cuentas</span>
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#1b426e] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{accounts.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Cuentas contables activas</p>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1b426e]" />
                    </div>

                    {/* Clientes */}
                    <div
                      onClick={() => setCurrentView("clientes")}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Clientes</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{customers.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Con códigos de Macola</p>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                    </div>

                    {/* Proveedores */}
                    <div
                      onClick={() => setCurrentView("proveedores")}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Proveedores</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{vendors.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Socios comerciales registrados</p>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
                    </div>

                    {/* Valoración Inventario */}
                    <div
                      onClick={() => setCurrentView("inventario")}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Valoración Inventario</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                          {formatCurrency(totalInventoryValuation)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{totalInventoryUnits} unidades en stock</p>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                    </div>
                  </>
                )}
              </div>

              {/* ================= SECTION: RESUMEN DE LA EMPRESA ================= */}
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Resumen de la empresa</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Pérdidas y Ganancias */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="mb-2">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">PÉRDIDAS Y GANANCIAS</span>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 leading-snug mb-8">
                        Consulta lo que ganas y lo que gastas en todas tus cuentas
                      </h3>

                      {showPnL && (
                        <div className="space-y-6 my-4">
                          <div>
                            <div className="text-xl font-bold text-slate-900 mb-1">{formatCurrency(totalIncome)}</div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-600 font-medium w-16">Ingreso</span>
                              <div className="flex-1">
                                <div
                                  className="h-6 rounded-sm bg-[#00c853] transition-all duration-500"
                                  style={{ width: `${incomePercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xl font-bold text-slate-900 mb-1">{formatCurrency(totalExpenses)}</div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-600 font-medium w-16">Gastos</span>
                              <div className="flex-1">
                                <div
                                  className="h-6 rounded-sm bg-[#00796b] transition-all duration-500"
                                  style={{ width: `${expensePercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Card 2: Gastos */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="mb-2">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">GASTOS</span>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 leading-snug mb-4">
                        Ve a dónde va tu dinero
                      </h3>

                      {showGastos && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
                          {/* Dynamic Donut Chart */}
                          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                              {/* Background Base Track */}
                              <circle
                                cx="21"
                                cy="21"
                                r="15.9155"
                                fill="none"
                                stroke="#f1f5f9"
                                strokeWidth="7"
                              />
                              {totalExpenses > 0 ? (
                                expenseSlices.map((slice) => {
                                  const pct = slice.percentage;
                                  const dash = Math.max(0, pct > 2 ? pct - 1.5 : pct);
                                  const gap = 100 - dash;
                                  return (
                                    <circle
                                      key={slice.id}
                                      cx="21"
                                      cy="21"
                                      r="15.9155"
                                      fill="none"
                                      stroke={slice.color}
                                      strokeWidth="7"
                                      strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
                                      strokeDashoffset={(-slice.offset).toFixed(2)}
                                      className="transition-all duration-500"
                                    />
                                  );
                                })
                              ) : (
                                <circle
                                  cx="21"
                                  cy="21"
                                  r="15.9155"
                                  fill="none"
                                  stroke="#cbd5e1"
                                  strokeWidth="7"
                                />
                              )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                              <span className="text-[10px] text-slate-400 font-medium leading-none">Total</span>
                              <span className="text-xs font-bold text-slate-900 mt-0.5">{formatCurrency(totalExpenses)}</span>
                            </div>
                          </div>

                          {/* Dynamic Legend with real categories from database */}
                          <div className="space-y-2 text-xs text-slate-700 font-medium w-full max-w-md max-h-52 overflow-y-auto pr-1">
                            {expenseSlices.length > 0 ? (
                              expenseSlices.map((slice) => (
                                <div key={slice.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: slice.color }}
                                    ></span>
                                    <span className="truncate max-w-[140px]" title={slice.name}>
                                      {slice.name}
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-semibold text-slate-900">
                                      {formatCurrency(slice.balance || 0)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-1.5">
                                      ({slice.percentage.toFixed(0)}%)
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-400 text-xs italic">
                                No hay cuentas de gasto registradas en la base de datos.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Quick Navigation Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Próximos Pagos de la Semana</h2>
                    <span
                      className="text-xs text-[#1b426e] font-medium cursor-pointer hover:underline"
                      onClick={() => setCurrentView("factura-compra-lista")}
                    >
                      Ver todo →
                    </span>
                  </div>

                  {/* Payments List */}
                  <div className="space-y-2">
                    {upcomingWeeklyPayments.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No hay pagos programados para esta semana
                      </div>
                    ) : (
                      upcomingWeeklyPayments.map((item) => (
                        <div
                          key={item.id}
                          onClick={openPagarProveedorView}
                          className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#1b426e]/50 hover:bg-orange-50/20 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Date Box */}
                            <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 group-hover:bg-orange-100/60 transition-colors text-center shrink-0 min-w-[54px]">
                              <span className="block font-bold text-slate-800 text-[11px] leading-tight">
                                {item.dueDate}
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium block leading-none mt-0.5">
                                {item.daysLeft}
                              </span>
                            </div>

                            {/* Payee Info */}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#1b426e] transition-colors">
                                {item.payee}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.concept}
                              </p>
                            </div>
                          </div>

                          {/* Amount and Status */}
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-bold text-slate-900 font-mono">
                              ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.status === "URGENTE"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : item.status === "PROXIMO"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                            >
                              {item.status === "URGENTE" ? "Por vencer" : item.status === "PROXIMO" ? "Pendiente" : "Programado"}
                            </span>
                          </div>
                        </div>
                      )))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Infraestructura del Sistema</h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Motor de Base de Datos</span>
                      <span className="text-emerald-700 font-mono font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">PostgreSQL 17.6</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Cliente ORM</span>
                      <span className="text-[#1b426e] font-mono font-medium bg-[#fff7ed] px-2 py-0.5 rounded border border-[#fed7aa]">Prisma 6.19.3</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Organización</span>
                      <span className="text-slate-800 font-medium">{companySettings.nombreLegal || companySettings.nombre || "Prado ERP"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= VIEW: PLAN DE CUENTAS & LIBROS CONTABLES ================= */}
          {currentView === "plan-cuentas" && (
            <AccountingBooksModule
              accounts={accounts}
              onRefreshAccounts={async () => {
                const res = await fetch("/api/accounts").then((r) => r.json());
                if (res.success) setAccounts(res.data || []);
              }}
              onOpenNewAccount={() => {
                setEditingAccountId(null);
                setNewAccountForm({
                  code: "",
                  name: "",
                  type: "Efectivo y equivalentes de efectivo",
                  detailType: "Banco",
                  isSubAccount: false,
                  parentAccountId: "",
                  description: "",
                  isLocked: false,
                  currency: "USD",
                  balance: 0,
                  isActive: true,
                });
                setAccountModalError("");
                setAccountModalSuccess("");
                setShowNewAccountModal(true);
              }}
              onOpenEditAccount={(acc) => handleOpenEditAccount(acc)}
              onBackToDashboard={() => setCurrentView("dashboard")}
              formatCurrency={formatCurrency}
            />
          )}

          {/* ================= VIEW: TRANSACCIONES BANCARIAS & FEEDS ================= */}
          {currentView === "transacciones" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Toast Notification */}
              {bankToastNotification && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    <span className="font-semibold">{bankToastNotification}</span>
                  </div>
                  <button
                    onClick={() => setBankToastNotification("")}
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Top Breadcrumb & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView("dashboard")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar a Dashboard</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-900">Transacciones Bancarias &amp; Conciliación</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBankSubTab("reglas")}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${bankSubTab === "reglas"
                        ? "bg-[#1b426e] text-white border-[#1b426e] shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
                      }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${bankSubTab === "reglas" ? "text-white" : "text-[#1b426e]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Reglas de automatización</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentView("conciliacion-bancaria")}
                    className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cierre & Conciliación Extractos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConnectBankModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>+ Registrar cuenta bancaria</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setBankSyncing(true);
                      await loadBankingData();
                      setTimeout(() => {
                        setBankSyncing(false);
                        setBankToastNotification("Lista de cuentas y movimientos actualizada.");
                        setTimeout(() => setBankToastNotification(""), 4000);
                      }, 600);
                    }}
                    disabled={bankSyncing}
                    title="Recargar datos bancarios"
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${bankSyncing ? "animate-spin text-[#1b426e]" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Connected Bank Accounts Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card: Todas las cuentas */}
                <div
                  onClick={() => setSelectedBankId("all")}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${selectedBankId === "all"
                      ? "bg-white border-[#1b426e] ring-2 ring-[#1b426e]/20 shadow-sm text-slate-900"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs"
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Visión General
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1 text-slate-900">Todas las Cuentas</h3>
                    <div className="text-xl font-extrabold mb-1 text-slate-900">
                      {formatCurrency(connectedBanks.reduce((sum, b) => sum + (b.bankBalance || 0), 0))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {bankTransactions.filter((t) => t.status === "porRevisar").length} transacciones por revisar
                    </p>
                  </div>
                </div>

                {/* Individual Bank Cards */}
                {connectedBanks.map((bank) => {
                  const isSelected = selectedBankId === bank.id;
                  const pending = bankTransactions.filter(
                    (t) => (t.bankAccountId === bank.id || (t as unknown as { bankId?: string }).bankId === bank.id) && t.status === "porRevisar"
                  ).length;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${isSelected
                          ? "bg-white border-[#1b426e] ring-2 ring-[#1b426e]/20 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: bank.color }}
                          ></span>
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[120px]">{bank.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{bank.accountNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBank(bank);
                            }}
                            title="Editar cuenta bancaria"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Seguro que deseas eliminar la cuenta bancaria ${bank.name}?`)) {
                                handleDeleteBank(bank.id);
                              }
                            }}
                            title="Eliminar cuenta bancaria"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 my-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-slate-500">Saldo Banco:</span>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(bank.bankBalance)}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="text-[10px] text-slate-400">En Libros:</span>
                          <span className="font-medium text-slate-600">{formatCurrency(bank.bookBalance)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{bank.lastUpdated}</span>
                        {pending > 0 ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-[#fff7ed] text-[#1b426e] border border-[#fed7aa]">
                            {pending} por revisar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                            Al día ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
                <button
                  onClick={() => setBankSubTab("porRevisar")}
                  className={`pb-3 transition flex items-center gap-2 cursor-pointer border-b-2 ${bankSubTab === "porRevisar"
                      ? "border-[#1b426e] text-[#1b426e]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <span>Por revisar</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bankSubTab === "porRevisar" ? "bg-[#fff7ed] text-[#1b426e]" : "bg-slate-100 text-slate-600"
                    }`}>
                    {bankTransactions.filter(
                      (t) => t.status === "porRevisar" && (selectedBankId === "all" || t.bankAccountId === selectedBankId || (t as unknown as { bankId?: string }).bankId === selectedBankId)
                    ).length}
                  </span>
                </button>

                <button
                  onClick={() => setBankSubTab("categorizadas")}
                  className={`pb-3 transition flex items-center gap-2 cursor-pointer border-b-2 ${bankSubTab === "categorizadas"
                      ? "border-[#1b426e] text-[#1b426e]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <span>Categorizadas</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bankSubTab === "categorizadas" ? "bg-[#fff7ed] text-[#1b426e]" : "bg-slate-100 text-slate-600"
                    }`}>
                    {bankTransactions.filter(
                      (t) => t.status === "categorizadas" && (selectedBankId === "all" || t.bankAccountId === selectedBankId || (t as unknown as { bankId?: string }).bankId === selectedBankId)
                    ).length}
                  </span>
                </button>

                <button
                  onClick={() => setBankSubTab("excluidas")}
                  className={`pb-3 transition flex items-center gap-2 cursor-pointer border-b-2 ${bankSubTab === "excluidas"
                      ? "border-[#1b426e] text-[#1b426e]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <span>Excluidas</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bankSubTab === "excluidas" ? "bg-[#fff7ed] text-[#1b426e]" : "bg-slate-100 text-slate-600"
                    }`}>
                    {bankTransactions.filter(
                      (t) => t.status === "excluidas" && (selectedBankId === "all" || t.bankAccountId === selectedBankId || (t as unknown as { bankId?: string }).bankId === selectedBankId)
                    ).length}
                  </span>
                </button>

                <button
                  onClick={() => setBankSubTab("reglas")}
                  className={`pb-3 transition flex items-center gap-2 cursor-pointer border-b-2 ${bankSubTab === "reglas"
                      ? "border-[#1b426e] text-[#1b426e]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <span>Reglas de automatización</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bankSubTab === "reglas" ? "bg-[#fff7ed] text-[#1b426e]" : "bg-slate-100 text-slate-600"
                    }`}>
                    {automationRules.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: POR REVISAR */}
              {bankSubTab === "porRevisar" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3">
                  {/* Search & Filter bar */}
                  <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="text"
                        placeholder="Buscar por descripción, proveedor o cliente..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e]"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        Mostrando transacciones de: <strong className="text-slate-800">{selectedBankId === "all" ? "Todas las cuentas" : connectedBanks.find(b => b.id === selectedBankId)?.name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Descripción en Extracto Bancario</th>
                          <th className="py-3 px-4">Beneficiario / Pagador</th>
                          <th className="py-3 px-4 text-right">Cobrado (+)</th>
                          <th className="py-3 px-4 text-right">Pagado (-)</th>
                          <th className="py-3 px-4">Cuenta Sugerida / Regla</th>
                          <th className="py-3 px-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <TableRowsSkeleton rows={6} cols={7} />
                        ) : (
                          <>
                            {bankTransactions
                              .filter((t) => t.status === "porRevisar")
                              .filter((t) => selectedBankId === "all" || t.bankAccountId === selectedBankId || (t as unknown as { bankId?: string }).bankId === selectedBankId)
                              .filter((t) => !bankSearch || t.description.toLowerCase().includes(bankSearch.toLowerCase()) || t.payee.toLowerCase().includes(bankSearch.toLowerCase()))
                              .map((tx) => {
                                const matchedBank = connectedBanks.find((b) => b.id === (tx.bankAccountId || (tx as unknown as { bankId?: string }).bankId));
                                return (
                                  <tr key={tx.id} className="hover:bg-[#fff7ed]/40 transition">
                                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{tx.date}</td>
                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-slate-900">{tx.description}</div>
                                      <div className="text-[11px] text-slate-400">
                                        {tx.bankAccount?.name || matchedBank?.name || "Banco"} ({tx.bankAccount?.accountNumber || matchedBank?.accountNumber || ""})
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-700">{tx.payee}</td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                                      {tx.type === "deposit" ? `+${formatCurrency(tx.amount)}` : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                                      {tx.type === "expense" ? `-${formatCurrency(tx.amount)}` : "—"}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="space-y-1">
                                        <span className="font-medium text-slate-800 block">{tx.suggestedAccount}</span>
                                        {tx.ruleApplied ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                            ⚡ {tx.ruleApplied}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 italic">Sugerencia inteligente</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateTransactionStatus(
                                              tx.id,
                                              "categorizadas",
                                              `Transacción "${tx.description.slice(0, 28)}..." coincidente y registrada en DB.`
                                            );
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition shadow-2xs cursor-pointer whitespace-nowrap"
                                        >
                                          Coincidir / Agregar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateTransactionStatus(
                                              tx.id,
                                              "excluidas",
                                              "Transacción excluida del feed bancario."
                                            );
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
                                        >
                                          Excluir
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                            {bankTransactions.filter((t) => t.status === "porRevisar" && (selectedBankId === "all" || t.bankAccountId === selectedBankId || (t as unknown as { bankId?: string }).bankId === selectedBankId)).length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400">
                                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                                    ✓
                                  </div>
                                  <p className="font-semibold text-slate-700 text-sm">¡Estás al día!</p>
                                  <p className="text-xs text-slate-500 mt-1">No hay transacciones bancarias pendientes de revisión.</p>
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: CATEGORIZADAS */}
              {bankSubTab === "categorizadas" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Transacciones Conciliadas &amp; Registradas</h3>
                    <span className="text-xs text-slate-500">
                      {bankTransactions.filter((t) => t.status === "categorizadas").length} registradas
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Descripción</th>
                          <th className="py-3 px-4">Beneficiario</th>
                          <th className="py-3 px-4 text-right">Importe</th>
                          <th className="py-3 px-4">Cuenta Contable</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                          <th className="py-3 px-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bankTransactions
                          .filter((t) => t.status === "categorizadas")
                          .map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 text-slate-800 whitespace-nowrap">{tx.date}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{tx.description}</td>
                              <td className="py-3 px-4 text-slate-700">{tx.payee}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {tx.type === "deposit" ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-800">{tx.suggestedAccount}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Añadida al libro
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTransactionStatus(
                                      tx.id,
                                      "porRevisar",
                                      "Transacción devuelta a 'Por revisar'."
                                    );
                                  }}
                                  className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                >
                                  Deshacer
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXCLUIDAS */}
              {bankSubTab === "excluidas" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Transacciones Excluidas</h3>
                    <span className="text-xs text-slate-500">
                      {bankTransactions.filter((t) => t.status === "excluidas").length} excluidas
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Descripción</th>
                          <th className="py-3 px-4 text-right">Importe</th>
                          <th className="py-3 px-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bankTransactions
                          .filter((t) => t.status === "excluidas")
                          .map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 text-slate-800">{tx.date}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{tx.description}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(tx.amount)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTransactionStatus(
                                      tx.id,
                                      "porRevisar",
                                      "Transacción restaurada a 'Por revisar'."
                                    );
                                  }}
                                  className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                >
                                  Restaurar
                                </button>
                              </td>
                            </tr>
                          ))}
                        {bankTransactions.filter((t) => t.status === "excluidas").length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                              No hay transacciones excluidas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: REGLAS DE AUTOMATIZACIÓN */}
              {bankSubTab === "reglas" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Reglas de Automatización de Feeds</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Categoriza y concilia automáticamente depósitos y cobros recurrentes sin intervención manual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewRuleModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Crear regla de automatización</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Nombre de la Regla</th>
                          <th className="py-3 px-4">Condición de Detección</th>
                          <th className="py-3 px-4">Cuenta Asignada Automáticamente</th>
                          <th className="py-3 px-4 text-center">Auto-Confirmar</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                          <th className="py-3 px-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {automationRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">{rule.name}</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{rule.condition}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{rule.targetAccount}</td>
                            <td className="py-3 px-4 text-center">
                              {rule.autoConfirm ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ⚡ Automático
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  Sugerencia
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRuleActive(rule.id, rule.active)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${rule.active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}
                              >
                                {rule.active ? "Activa" : "Pausada"}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id, rule.name)}
                                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW: TRANSACCIONES DE INTEGRACIÓN ================= */}
          {currentView === "macola-sync" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setCurrentView("dashboard")}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Regresar a Dashboard</span>
              </button>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-slate-900">Transacciones de Integración Macola</h2>
                    <p className="text-xs text-slate-500">Historial y estado de sincronización de datos con Macola</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sincronización Habilitada
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Sincronización de Clientes Macola</span>
                      <span className="text-slate-500 text-[11px]">{customers.length} registros con código tracking</span>
                    </div>
                    <span className="text-emerald-700 font-medium">Sincronizado</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Sincronización de Proveedores Macola</span>
                      <span className="text-slate-500 text-[11px]">{vendors.length} registros con código tracking</span>
                    </div>
                    <span className="text-emerald-700 font-medium">Sincronizado</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Catálogo Maestro de SKUs</span>
                      <span className="text-slate-500 text-[11px]">{inventory.length} artículos enlazados</span>
                    </div>
                    <span className="text-emerald-700 font-medium">Sincronizado</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: CAJA CHICA & CONTROL DE ARQUEOS ================= */}
          {currentView === "caja-chica" && (
            <CajaChicaModule
              funds={pettyCashFunds}
              selectedFundId={selectedFundId}
              setSelectedFundId={setSelectedFundId}
              loading={pettyCashLoading}
              audits={pettyCashAudits}
              vouchers={pettyCashVouchers}
              activeTab={cajaChicaActiveTab}
              setActiveTab={setCajaChicaActiveTab}
              onRefresh={loadPettyCashData}
              currentAdminUser={currentAdminUser}
              showToast={showPettyCashToast}
              onBackToDashboard={() => setCurrentView("dashboard")}
              connectedBanks={connectedBanks}
              accounts={accounts}
              companySettings={companySettings}
            />
          )}

          {/* ================= VIEW: CONCILIACIÓN DE EXTRACTO MENSUAL ================= */}
          {currentView === "conciliacion-bancaria" && (
            <BankReconciliationModule
              onBack={() => setCurrentView("transacciones")}
              formatCurrency={formatCurrency}
              companySettings={companySettings}
            />
          )}

          {/* ================= VIEW: CLIENTES ================= */}
          {currentView === "clientes" && (
            <div className="animate-in fade-in duration-150 p-6">
              <CustomersModule
                customers={customers}
                loading={loading}
                onRefreshCustomers={loadDashboardData}
                onBack={() => setCurrentView("dashboard")}
                onOpenCustomerStatement={openCustomerStatement}
                autoOpenCreate={customersAutoOpenCreate}
                onAutoOpenCreateConsumed={() => setCustomersAutoOpenCreate(false)}
              />
            </div>
          )}

          {/* ================= VIEW: PROVEEDORES ================= */}
          {currentView === "proveedores" && (
            <div className="animate-in fade-in duration-150 p-6">
              <VendorsModule
                vendors={vendors}
                loading={loading}
                onRefreshVendors={loadDashboardData}
                onBack={() => setCurrentView("dashboard")}
                onNavigateToAging={() => setCurrentView("antiguedad-saldos-proveedores")}
                onNavigateToPayments={() => {
                  setSelectedPaymentVendor("");
                  setCurrentView("pagos-proveedores");
                }}
                onPayVendor={(vendorName) => openPagarProveedorView(vendorName)}
                autoOpenCreate={vendorsAutoOpenCreate}
                onAutoOpenCreateConsumed={() => setVendorsAutoOpenCreate(false)}
              />
            </div>
          )}

          {/* ================= VIEW: INVENTARIO, LOTES Y SERIES ================= */}
          {(currentView === "inventario" || currentView === "lotes" || currentView === "series") && (
            <div className="animate-in fade-in duration-150 p-6">
              <InventoryModule
                inventory={inventory}
                loading={loading}
                onRefreshInventory={loadDashboardData}
                accounts={accounts}
                productCategories={productCategoriesList.map((c) => c.name)}
                currentSubView={currentView}
                onChangeSubView={(tab) => setCurrentView(tab)}
                onBack={() => setCurrentView("dashboard")}
                autoOpenCreate={inventoryAutoOpenCreate}
                onAutoOpenCreateConsumed={() => setInventoryAutoOpenCreate(false)}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

          {/* ================= VIEW: NOTAS DE CRÉDITO Y DÉBITO ================= */}
          {/* ================= VIEW: NOTAS DE CRÉDITO Y DÉBITO ================= */}
          {currentView === "notas-credito-debito" && (
            <CreditDebitNotesModule
              creditDebitNotes={creditDebitNotes}
              customers={customers}
              vendors={vendors}
              companySettings={companySettings}
              loading={loading}
              onNavigateToDashboard={() => setCurrentView("dashboard")}
              onRefreshNotes={loadDashboardData}
            />
          )}

          {/* ================= VIEW: VENDEDORES & COMISIONES ================= */}
          {(currentView === "vendedores" || currentView === "comisiones") && (
            <div className="animate-in fade-in duration-150 p-6">
              <CommissionsModule
                salesReps={salesReps}
                commissions={commissionRecords}
                onRefreshSalesReps={async () => {
                  const res = await fetch("/api/sales-reps").then((r) => r.json());
                  if (res.success && Array.isArray(res.data)) setSalesReps(res.data);
                }}
                onRefreshCommissions={async () => {
                  const res = await fetch("/api/commissions").then((r) => r.json());
                  if (res.success && Array.isArray(res.data)) setCommissionRecords(res.data);
                }}
                currentSubView={currentView}
                onChangeSubView={(tab) => setCurrentView(tab)}
                onBack={() => setCurrentView("dashboard")}
                loading={loading}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

          {/* ================= VIEW: REPORTES ================= */}
          {currentView === "reportes" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setCurrentView("dashboard")}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Regresar a Dashboard</span>
              </button>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="font-bold text-base text-slate-900">Centro de Reportes</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Informes financieros, contables y operativos de la empresa</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Período fiscal:</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                      Año 2026 (Actual)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-5">
                  {/* Reporte 1: Pérdidas y Ganancias */}
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e]/50 hover:shadow-xs transition bg-white flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Estado de Pérdidas y Ganancias</h3>
                      <p className="text-xs text-slate-500 mt-1">Desglose de ingresos brutos, gastos operacionales e ingresos netos del período.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">Actualizado hoy</span>
                      <button className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer">Descargar PDF</button>
                    </div>
                  </div>

                  {/* Reporte 2: Balance General */}
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e]/50 hover:shadow-xs transition bg-white flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Balance de Situación</h3>
                      <p className="text-xs text-slate-500 mt-1">Resumen patrimonial clasificado: Activos, Pasivos y Capital Contable.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">Mensual</span>
                      <button className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer">Descargar PDF</button>
                    </div>
                  </div>

                  {/* Reporte 3: Valoración de Inventario */}
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e]/50 hover:shadow-xs transition bg-white flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Valoración de Inventario</h3>
                      <p className="text-xs text-slate-500 mt-1">Existencias físicas, valor total en libros ({formatCurrency(totalInventoryValuation)}) y costos unitarios.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">En tiempo real</span>
                      <button className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer">Descargar Excel</button>
                    </div>
                  </div>

                  {/* Reporte 4: Cuentas por Cobrar (Clientes) */}
                  <div
                    onClick={() => setCurrentView("antiguedad-saldos")}
                    className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e] hover:shadow-md transition bg-white flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Antigüedad de Saldos Clientes</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">30/60/90</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Monitoreo de cuentas por cobrar por tramos de vencimiento, morosidad y detalle por factura.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">{customers.length} clientes</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentView("antiguedad-saldos");
                        }}
                        className="text-xs font-bold text-[#1b426e] hover:text-[#143355] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver Reporte</span>
                        <span className="text-sm">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Reporte 5: Cuentas por Pagar (Proveedores) */}
                  <div
                    onClick={() => setCurrentView("antiguedad-saldos-proveedores")}
                    className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e] hover:shadow-md transition bg-white flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Antigüedad de Saldos Proveedores</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Cuentas por Pagar</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Estratificación de cuentas por pagar a crédito, facturas de compra y compromisos por vencer.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">{vendors.length} proveedores</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentView("antiguedad-saldos-proveedores");
                        }}
                        className="text-xs font-bold text-[#1b426e] hover:text-[#143355] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver Reporte</span>
                        <span className="text-sm">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Reporte 6: Libro Mayor y Plan de Cuentas */}
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-[#1b426e]/50 hover:shadow-xs transition bg-white flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#1b426e] transition">Libro Mayor / Catálogo Contable</h3>
                      <p className="text-xs text-slate-500 mt-1">Estructura completa del catálogo contable y saldos acumulados por cuenta.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">{accounts.length} cuentas activas</span>
                      <button className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer">Descargar Excel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: ANTIGÜEDAD DE SALDOS (AGING CLIENTES) ================= */}
          {currentView === "antiguedad-saldos" && (
            <CustomerAgingReportModule
              companySettings={companySettings}
              onBack={() => setCurrentView("reportes")}
              onNavigateToInvoice={(invNum) => {
                setCurrentView("lista-facturas");
              }}
              onNavigateToPayment={(custName) => {
                const found = customers.find((c) => c.name.toLowerCase() === custName.toLowerCase());
                openRecibirPagoView(found?.id);
              }}
              onNavigateToStatement={(cust) => {
                openCustomerStatement(cust);
              }}
              formatCurrency={formatCurrency}
            />
          )}

          {/* ================= VIEW: ANTIGÜEDAD DE SALDOS (AGING PROVEEDORES) ================= */}
          {currentView === "antiguedad-saldos-proveedores" && (
            <VendorAgingReportModule
              companySettings={companySettings}
              onBack={() => setCurrentView("proveedores")}
              onNavigateToPayment={(vendorName) => {
                openPagarProveedorView(vendorName);
              }}
              onNavigateToBill={() => {
                setCurrentView("factura-compra-lista");
              }}
              formatCurrency={formatCurrency}
            />
          )}

          {/* ================= VIEW: RETENCIONES FISCALES ISV / SAR ================= */}
          {currentView === "retenciones-isv" && (
            <TaxRetentionsModule
              onBack={() => setCurrentView("proveedores")}
              formatCurrency={formatCurrency}
              companySettings={companySettings}
              vendorsList={vendors.map((v) => ({
                id: v.id,
                name: v.name,
                macolaCode: v.macolaCode,
                email: v.email,
                phone: v.phone,
                address: v.address,
                currency: v.currency,
              }))}
              purchaseInvoicesList={purchaseInvoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                vendorId: inv.vendorId,
                vendorName: inv.vendorName,
                subtotal: inv.subtotal,
                tax: inv.tax,
                total: inv.total,
                issueDate: inv.issueDate,
                paymentStatus: inv.paymentStatus,
                currency: inv.currency,
              }))}
              onNavigateToBill={() => {
                setCurrentView("factura-compra-lista");
              }}
            />
          )}

          {/* ================= VIEW: ESTADO DE CUENTA INDIVIDUAL DE CLIENTE ================= */}
          {currentView === "estado-cuenta-cliente" && (
            <CustomerStatementModule
              initialCustomerId={selectedStatementCustomerId}
              customersList={customers.map((c) => ({
                id: c.id,
                name: c.name,
                macolaCode: c.macolaCode,
                email: c.email,
              }))}
              onBack={() => setCurrentView("clientes")}
              onNavigateToInvoice={(invNum) => {
                setCurrentView("lista-facturas");
              }}
              onNavigateToPayment={(custName) => {
                const found = customers.find((c) => c.name.toLowerCase() === custName.toLowerCase());
                openRecibirPagoView(found?.id);
              }}
              formatCurrency={formatCurrency}
              companySettings={companySettings}
            />
          )}

          {/* ================= VIEW: PAGOS A PROVEEDORES (CUENTAS POR PAGAR) ================= */}
          {(currentView === "pagos-proveedores" || currentView === "pagar-proveedor") && (
            <VendorPaymentsModule
              onBack={() => setCurrentView("proveedores")}
              formatCurrency={formatCurrency}
              companySettings={companySettings}
              initialVendorFilter={selectedPaymentVendor}
            />
          )}

          {/* ================= VIEW: CONFIGURACIÓN ================= */}
          {currentView === "configuracion" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setCurrentView("dashboard")}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Regresar a Dashboard</span>
              </button>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Main Body with Left Nav & Content */}
                <div className="flex flex-col md:flex-row min-h-[720px]">
                  {/* Left Submenu Navigation matching screenshot */}
                  <div className="w-full md:w-56 bg-slate-50/60 border-r border-slate-200 py-3 text-xs shrink-0">
                    <div className="space-y-0.5">
                      {[
                        { id: "empresa", label: "Empresa" },
                        { id: "reportes", label: "Reportes" },
                        { id: "contabilidad", label: "Contabilidad" },
                        { id: "ventas", label: "Ventas" },
                        { id: "gastos", label: "Gastos" },
                        { id: "horas", label: "Horas trabajadas" },
                        { id: "monedas", label: "Monedas" },
                        { id: "listas", label: "Todas las listas" },
                        { id: "importar", label: "Importar / Exportar" },
                        { id: "avanzadas", label: "Opciones avanzadas" },
                      ].map((tab) => {
                        const isActive = configSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setConfigSubTab(tab.id as any)}
                            className={`w-full text-left px-5 py-3 transition font-medium cursor-pointer ${isActive
                                ? "bg-[#fff7ed] text-[#1b426e] font-semibold border-l-4 border-[#1b426e]"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-4 border-transparent"
                              }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Content Panel */}
                  <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
                    {/* SUBTAB 1: EMPRESA */}
                    {configSubTab === "empresa" && (
                      <div className="max-w-3xl space-y-6">
                        {/* Hidden File Input for Logo Upload */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />

                        {/* Company Logo Header with Generic Fallback - Left Aligned */}
                        <div className="flex flex-col items-start justify-start pb-4">
                          {companyLogo ? (
                            /* Uploaded Custom Logo Display - Left Aligned */
                            <div className="flex flex-col items-start">
                              <div className="p-3 border border-slate-200 rounded-2xl bg-white shadow-xs max-w-xs flex items-center justify-center">
                                <img
                                  src={companyLogo}
                                  alt="Logotipo de la empresa"
                                  className="max-h-20 max-w-[260px] object-contain"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-2.5">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition"
                                  title="Cambiar logotipo"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Cambiar logo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium cursor-pointer transition border border-red-200"
                                  title="Eliminar logotipo personalizado"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Generic Fallback Box - Left Aligned */
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1b426e] bg-slate-50/80 hover:bg-[#fff7ed]/50 cursor-pointer transition group max-w-sm"
                              title="Haz clic para subir el logotipo oficial de la empresa"
                            >
                              <div className="w-12 h-12 rounded-xl bg-slate-200/80 group-hover:bg-[#1b426e]/10 text-slate-500 group-hover:text-[#1b426e] flex items-center justify-center shrink-0 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-[#1b426e] transition">
                                  + Agregar logotipo
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5">
                                  PNG, JPG o SVG (máx. 2 MB)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card 1: Información de la empresa */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <div className="mb-4">
                            <h2 className="font-bold text-sm text-slate-900">Información de la empresa</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Esta información puede usarse con fines de facturación.</p>
                          </div>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Nombre</span>
                              <span className={`flex-1 font-medium ${!companySettings.nombre || companySettings.nombre === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.nombre || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("nombre", "Nombre de la empresa")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Dirección</span>
                              <span className={`flex-1 font-medium whitespace-pre-line ${!companySettings.direccion || companySettings.direccion === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.direccion || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("direccion", "Dirección de la empresa")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Correo electrónico</span>
                              <span className={`flex-1 font-medium ${!companySettings.email || companySettings.email === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.email || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("email", "Correo electrónico")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Teléfono</span>
                              <span className={`flex-1 font-medium font-mono ${!companySettings.telefono || companySettings.telefono === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.telefono || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("telefono", "Teléfono de contacto")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Sitio web</span>
                              <span className={`flex-1 font-medium ${!companySettings.sitioWeb || companySettings.sitioWeb === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.sitioWeb || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("sitioWeb", "Sitio web")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Moneda predeterminada */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Moneda predeterminada</span>
                              <span className="flex-1 text-slate-700 font-medium">{monedasSettings.monedaPrincipal}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Moneda Principal",
                                    label: "Moneda principal del sistema",
                                    value: monedasSettings.monedaPrincipal,
                                    options: ["USD ($) Dólar estadounidense", "HNL (L) Lempira hondureño", "EUR (€) Euro"],
                                    onSave: (val) => setMonedasSettings((prev) => ({ ...prev, monedaPrincipal: val })),
                                  })
                                }
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Sector Row with Inline Dropdown Editor */}
                            {editingConfigKey === "sector" ? (
                              <div className="py-4 px-4 my-2 border border-slate-300 rounded-xl bg-white shadow-xs animate-in fade-in duration-150">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="w-48 shrink-0">
                                    <span className="font-semibold text-xs text-slate-800 block">Sector</span>
                                    <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">
                                      Actividad o industria principal de tu negocio.
                                    </span>
                                  </div>
                                  <div className="flex-1 max-w-md">
                                    <select
                                      value={editingConfigValue || companySettings.sector}
                                      onChange={(e) => setEditingConfigValue(e.target.value)}
                                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border-2 border-[#1b426e] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b426e] cursor-pointer shadow-xs font-medium"
                                    >
                                      {BUSINESS_SECTOR_OPTIONS.map((sec) => (
                                        <option key={sec} value={sec}>
                                          {sec}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setEditingConfigKey(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveConfigField}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1b426e] hover:bg-[#143355] transition cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-3 flex items-start justify-between gap-4">
                                <span className="w-40 font-semibold text-slate-800 shrink-0">Sector</span>
                                <span className="flex-1 text-slate-700 font-medium">{companySettings.sector}</span>
                                <button
                                  onClick={() => startEditConfig("sector", "Sector de la empresa")}
                                  className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                                >
                                  Editar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card 2: Información legal */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <div className="mb-4">
                            <h2 className="font-bold text-sm text-slate-900">Información legal</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Esta es la información que tu empresa utiliza para fines fiscales.</p>
                          </div>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Nombre legal de la empresa</span>
                              <span className={`flex-1 font-medium ${!companySettings.nombreLegal || companySettings.nombreLegal === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.nombreLegal || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("nombreLegal", "Nombre legal")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Tipo de empresa - Interactive matching screenshot */}
                            {editingConfigKey === "tipoEmpresa" ? (
                              <div className="py-4 px-4 my-2 border border-slate-300 rounded-xl bg-white shadow-xs animate-in fade-in duration-150">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="w-48 shrink-0">
                                    <span className="font-semibold text-xs text-slate-800 block">Tipo de empresa</span>
                                    <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">
                                      Cómo está estructurado tu negocio.
                                    </span>
                                  </div>
                                  <div className="flex-1 max-w-md">
                                    <select
                                      value={editingConfigValue || companySettings.tipoEmpresa}
                                      onChange={(e) => setEditingConfigValue(e.target.value)}
                                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border-2 border-[#1b426e] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b426e] cursor-pointer shadow-xs font-medium"
                                    >
                                      {COMPANY_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setEditingConfigKey(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveConfigField}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1b426e] hover:bg-[#143355] transition cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-3 flex items-start justify-between gap-4">
                                <span className="w-40 font-semibold text-slate-800 shrink-0">Tipo de empresa</span>
                                <span className={`flex-1 font-medium ${!companySettings.tipoEmpresa || companySettings.tipoEmpresa === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                  {companySettings.tipoEmpresa || "Ninguno indicado"}
                                </span>
                                <button
                                  onClick={() => startEditConfig("tipoEmpresa", "Tipo de empresa")}
                                  className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                                >
                                  Editar
                                </button>
                              </div>
                            )}

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Domicilio legal</span>
                              <span className={`flex-1 font-medium whitespace-pre-line ${!companySettings.domicilioLegal || companySettings.domicilioLegal === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.domicilioLegal || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("domicilioLegal", "Domicilio legal")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">RTN / TAX ID No.</span>
                              <span className={`flex-1 font-mono font-medium ${!companySettings.taxId || companySettings.taxId === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.taxId || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("taxId", "Número de Identificación Fiscal (RTN / TAX ID No.)")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">CAI</span>
                              <span className={`flex-1 font-mono font-medium ${!companySettings.cai || companySettings.cai === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.cai || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("cai", "Código de Autorización de Impresión (CAI)")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Rango Autorizado</span>
                              <span className={`flex-1 font-mono font-medium ${!companySettings.rangoAutorizado || companySettings.rangoAutorizado === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.rangoAutorizado || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("rangoAutorizado", "Rango de Facturación Autorizado")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Fecha Límite de Emisión</span>
                              <span className={`flex-1 font-mono font-medium ${!companySettings.fechaLimiteEmision || companySettings.fechaLimiteEmision === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {formatFechaLimite(companySettings.fechaLimiteEmision)}
                              </span>
                              <button
                                onClick={() => startEditConfig("fechaLimiteEmision", "Fecha Límite de Emisión")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Información de contacto del cliente */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <div className="mb-4">
                            <h2 className="font-bold text-sm text-slate-900">Información de contacto del cliente</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Así es como los clientes se ponen en contacto contigo.</p>
                          </div>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Correo electrónico del cliente</span>
                              <span className={`flex-1 font-medium ${!companySettings.emailCliente || companySettings.emailCliente === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.emailCliente || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("emailCliente", "Correo de contacto del cliente")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-40 font-semibold text-slate-800 shrink-0">Dirección del cliente</span>
                              <span className={`flex-1 font-medium ${!companySettings.direccionCliente || companySettings.direccionCliente === "Ninguno indicado" ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.direccionCliente || "Ninguno indicado"}
                              </span>
                              <button
                                onClick={() => startEditConfig("direccionCliente", "Dirección del cliente")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 2: REPORTES */}
                    {configSubTab === "reportes" && (
                      <div className="space-y-6">
                        {/* Top Info Banner */}
                        {showReportBanner && (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                i
                              </div>
                              <span className="font-medium">
                                Estas personalizaciones se aplican a los informes estándar y personalizados.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowReportBanner(false)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold px-1"
                              title="Cerrar aviso"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Main Two-Column Layout: Controls on Left, Live Sheet Preview on Right */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                          {/* LEFT COLUMN: CUSTOMIZATION CONTROLS */}
                          <div className="xl:col-span-5 space-y-6 text-xs">
                            {/* SECTION: Objeto visual */}
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 mb-2">Objeto visual</h3>
                              <div className="border-t border-slate-200 divide-y divide-slate-200">
                                {/* Encabezado */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("encabezado")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Encabezado</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.encabezado ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.encabezado && (
                                    <div className="mt-3.5 space-y-3.5 pl-1 text-slate-700 text-xs animate-in fade-in duration-150">
                                      {/* 3 Checkboxes horizontally matching screenshot */}
                                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportHeaderLogo}
                                            onChange={(e) => setReportHeaderLogo(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Logotipo de la empresa</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportHeaderPeriod}
                                            onChange={(e) => setReportHeaderPeriod(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Período del informe</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportHeaderLegalName}
                                            onChange={(e) => setReportHeaderLegalName(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Razón social</span>
                                        </label>
                                      </div>

                                      {/* Alineación de encabezado matching screenshot */}
                                      <div className="pt-1">
                                        <label className="block text-xs text-slate-700 font-normal mb-1.5">
                                          Alineación de encabezado
                                        </label>
                                        <div className="relative inline-block w-40">
                                          <select
                                            value={reportHeaderAlignment}
                                            onChange={(e) => setReportHeaderAlignment(e.target.value as any)}
                                            className="w-full appearance-none pr-8 pl-3 py-1.5 text-xs rounded-lg border-2 border-emerald-800 text-slate-800 bg-white focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e] cursor-pointer font-medium shadow-2xs"
                                          >
                                            <option value="Izquierda">Izquierda</option>
                                            <option value="Centro">Centro</option>
                                            <option value="Derecha">Derecha</option>
                                          </select>
                                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Pie de página */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("piePagina")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Pie de página</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.piePagina ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.piePagina && (
                                    <div className="mt-3.5 space-y-3.5 pl-1 text-slate-700 text-xs animate-in fade-in duration-150">
                                      {/* 3 Checkboxes horizontally matching screenshot */}
                                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportFooterDate}
                                            onChange={(e) => setReportFooterDate(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Fecha de preparación</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportFooterTime}
                                            onChange={(e) => setReportFooterTime(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Hora de preparación</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={reportFooterMethod}
                                            onChange={(e) => setReportFooterMethod(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-700">Método de contabilización de los informes</span>
                                        </label>
                                      </div>

                                      {/* Alineación del pie de página matching screenshot */}
                                      <div className="pt-1">
                                        <label className="block text-xs text-slate-700 font-normal mb-1.5">
                                          Alineación del pie de página
                                        </label>
                                        <div className="relative inline-block w-40">
                                          <select
                                            value={reportFooterAlignment}
                                            onChange={(e) => setReportFooterAlignment(e.target.value as any)}
                                            className="w-full appearance-none pr-8 pl-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e] cursor-pointer font-medium shadow-2xs"
                                          >
                                            <option value="Izquierda">Izquierda</option>
                                            <option value="Centro">Centro</option>
                                            <option value="Derecha">Derecha</option>
                                          </select>
                                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>


                                {/* Filas agrupadas */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("filasAgrupadas")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Filas agrupadas</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.filasAgrupadas ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.filasAgrupadas && (
                                    <div className="mt-3 space-y-2.5 pl-2 text-slate-600 text-[11px]">
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={reportExpandSubaccounts}
                                          onChange={(e) => setReportExpandSubaccounts(e.target.checked)}
                                          className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                        />
                                        <span>Expandir subcuentas de primer nivel</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={reportShowGroupTotals}
                                          onChange={(e) => setReportShowGroupTotals(e.target.checked)}
                                          className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                        />
                                        <span>Mostrar totales de agrupación</span>
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {/* Celdas vacías (Con badge NUEVO) */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("celdasVacias")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Celdas vacías</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.celdasVacias ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.celdasVacias && (
                                    <div className="mt-3 space-y-2 pl-2 text-slate-600 text-[11px]">
                                      <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="emptyCellOption"
                                            value="hyphen"
                                            checked={reportEmptyCellFormat === "hyphen"}
                                            onChange={(e) => setReportEmptyCellFormat(e.target.value)}
                                            className="text-[#1b426e] focus:ring-[#1b426e]"
                                          />
                                          <span>Guion (-)</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="emptyCellOption"
                                            value="zero"
                                            checked={reportEmptyCellFormat === "zero"}
                                            onChange={(e) => setReportEmptyCellFormat(e.target.value)}
                                            className="text-[#1b426e] focus:ring-[#1b426e]"
                                          />
                                          <span>$0.00</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="emptyCellOption"
                                            value="blank"
                                            checked={reportEmptyCellFormat === "blank"}
                                            onChange={(e) => setReportEmptyCellFormat(e.target.value)}
                                            className="text-[#1b426e] focus:ring-[#1b426e]"
                                          />
                                          <span>En blanco</span>
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Líneas de cuadrícula (Abierto por defecto matching screenshot) */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("lineasCuadricula")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Líneas de cuadrícula</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.lineasCuadricula ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.lineasCuadricula && (
                                    <div className="mt-3.5 pt-1 pl-1 flex items-center justify-between gap-4">
                                      <span className="text-xs text-slate-700 font-medium shrink-0">
                                        Informar de bordes
                                      </span>
                                      <div className="relative flex-1 max-w-[200px]">
                                        <select
                                          value={gridBorderSetting}
                                          onChange={(e) => setGridBorderSetting(e.target.value)}
                                          className="w-full appearance-none pr-8 pl-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e] cursor-pointer font-medium shadow-2xs"
                                        >
                                          <option value="Predeterminado">Predeterminado</option>
                                          <option value="Líneas horizontales">Líneas horizontales</option>
                                          <option value="Líneas verticales">Líneas verticales</option>
                                          <option value="Cuadrícula completa">Cuadrícula completa</option>
                                          <option value="Sin líneas">Sin líneas</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* SECTION: Formateo */}
                            <div className="pt-2">
                              <h3 className="font-bold text-sm text-slate-900 mb-2">Formateo</h3>
                              <div className="border-t border-slate-200 divide-y divide-slate-200">
                                {/* Número matching screenshot */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("numero")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Número</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.numero ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.numero && (
                                    <div className="mt-3.5 space-y-4 pl-1 text-slate-700 text-xs animate-in fade-in duration-150">
                                      {/* Row 1 & 2 Checkboxes matching screenshot */}
                                      <div className="space-y-2.5">
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                          <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={reportDivideBy1000}
                                              onChange={(e) => setReportDivideBy1000(e.target.checked)}
                                              className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">Dividir por 1000</span>
                                          </label>
                                          <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={reportHideZeroAmounts}
                                              onChange={(e) => setReportHideZeroAmounts(e.target.checked)}
                                              className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">No mostrar importes en cero</span>
                                          </label>
                                        </div>
                                        <div>
                                          <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={reportHideCurrencySymbol}
                                              onChange={(e) => setReportHideCurrencySymbol(e.target.checked)}
                                              className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">No mostrar símbolo de divisa</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Subsection: Números negativos */}
                                      <div className="pt-1">
                                        <span className="block text-xs font-medium text-slate-700 mb-1.5">
                                          Números negativos
                                        </span>
                                        <div className="flex items-center gap-4">
                                          <div className="relative w-28">
                                            <select
                                              value={reportNegativeNumberFormat}
                                              onChange={(e) => setReportNegativeNumberFormat(e.target.value)}
                                              className="w-full appearance-none pr-7 pl-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e] cursor-pointer font-medium shadow-2xs"
                                            >
                                              <option value="-100">-100</option>
                                              <option value="(100)">(100)</option>
                                              <option value="-$100">-$100</option>
                                              <option value="100-">100-</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </div>
                                          </div>
                                          <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={reportNegativeInRed}
                                              onChange={(e) => setReportNegativeInRed(e.target.checked)}
                                              className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">Mostrar en rojo</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Subsection: Decimales */}
                                      <div className="pt-1 space-y-2">
                                        <span className="block text-xs font-medium text-slate-700">
                                          Decimales
                                        </span>
                                        <div className="space-y-2.5">
                                          <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="radio"
                                              name="reportDecimalOption"
                                              checked={reportDecimalMode === "round"}
                                              onChange={() => setReportDecimalMode("round")}
                                              className="w-4 h-4 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">Redondea al número entero más cercano</span>
                                          </label>

                                          <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                              <input
                                                type="radio"
                                                name="reportDecimalOption"
                                                checked={reportDecimalMode === "decimals"}
                                                onChange={() => setReportDecimalMode("decimals")}
                                                className="w-4 h-4 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                                              />
                                              <span className="text-xs text-slate-700">Mostrar decimales hasta</span>
                                            </label>
                                            <div className="relative w-16">
                                              <select
                                                value={reportDecimalPlaces}
                                                onChange={(e) => {
                                                  setReportDecimalPlaces(Number(e.target.value));
                                                  setReportDecimalMode("decimals");
                                                }}
                                                className="w-full appearance-none pr-6 pl-2.5 py-1 text-xs rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-[#1b426e] cursor-pointer font-medium text-center shadow-2xs"
                                              >
                                                <option value={0}>0</option>
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                                <option value={4}>4</option>
                                              </select>
                                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </div>
                                            </div>
                                            <span className="text-xs text-slate-700">lugares</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Ver */}
                                <div className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleReportAccordion("ver")}
                                    className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                                  >
                                    <span>Ver</span>
                                    <svg
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${reportAccordions.ver ? "rotate-180" : ""
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {reportAccordions.ver && (
                                    <div className="mt-3 space-y-2.5 pl-2 text-slate-600 text-[11px]">
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={reportCompactView}
                                          onChange={(e) => setReportCompactView(e.target.checked)}
                                          className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                        />
                                        <span>Diseño compacto</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={reportWrapText}
                                          onChange={(e) => setReportWrapText(e.target.checked)}
                                          className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                        />
                                        <span>Ajuste automático de texto largo</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: DARK CONTAINER WITH LIVE SAMPLE REPORT SHEET */}
                          <div className="xl:col-span-7 bg-[#2d3748] rounded-2xl p-4 sm:p-6 flex items-center justify-center min-h-[540px] shadow-inner overflow-hidden">
                            {/* Paper Sheet */}
                            <div className="bg-white text-slate-900 shadow-2xl rounded-sm p-5 sm:p-7 w-full max-w-xl text-[11px] font-sans relative overflow-hidden border border-slate-200">
                              {/* Watermark: SAMPLE REPORT */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                                <span className="text-2xl sm:text-4xl font-extrabold text-amber-700/25 tracking-[0.2em] uppercase transform -rotate-35 border-2 border-dashed border-amber-700/20 py-2.5 px-6 sm:px-10 rounded-xl">
                                  SAMPLE REPORT
                                </span>
                              </div>

                              {/* Report Header Title and Details according to user customization */}
                              <div
                                className={`mb-6 ${reportHeaderAlignment === "Izquierda"
                                    ? "text-left"
                                    : reportHeaderAlignment === "Derecha"
                                      ? "text-right"
                                      : "text-center"
                                  }`}
                              >
                                {reportHeaderLogo && (
                                  <div
                                    className={`mb-2 flex ${reportHeaderAlignment === "Izquierda"
                                        ? "justify-start"
                                        : reportHeaderAlignment === "Derecha"
                                          ? "justify-end"
                                          : "justify-center"
                                      }`}
                                  >
                                    {companyLogo ? (
                                      <img src={companyLogo} alt="Logo" className="h-9 object-contain" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-[#fff7ed] border border-[#1b426e]/30 flex items-center justify-center font-bold text-[#1b426e] text-sm shadow-xs">
                                        W
                                      </div>
                                    )}
                                  </div>
                                )}
                                {reportHeaderLegalName && (
                                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-0.5">
                                    {companySettings.nombreLegal}
                                  </div>
                                )}
                                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                                  Profit and Loss
                                </h3>
                                {reportHeaderPeriod && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    Enero - Diciembre 2026
                                  </div>
                                )}
                              </div>

                              {/* Styling helpers calculated from all active settings */}
                              {(() => {
                                const showVerticalGrid = gridBorderSetting === "Líneas verticales" || gridBorderSetting === "Cuadrícula completa";
                                const showHorizontalGrid = gridBorderSetting === "Líneas horizontales" || gridBorderSetting === "Cuadrícula completa";
                                const isFullGrid = gridBorderSetting === "Cuadrícula completa";
                                const isBorderless = gridBorderSetting === "Sin líneas";
                                const rowPadding = reportCompactView ? "py-0.5" : "py-1.5";
                                const tableTextSize = reportCompactView ? "text-[11px]" : "text-xs";
                                const labelWrap = reportWrapText ? "break-words" : "whitespace-nowrap truncate max-w-[210px] sm:max-w-[310px]";
                                const cellVBorder = showVerticalGrid ? "border-r border-slate-200 pr-3" : "";
                                const cellVAmtBorder = showVerticalGrid ? "pl-3 text-right shrink-0 min-w-[90px]" : "text-right shrink-0 min-w-[90px]";
                                const rowHBorder = showHorizontalGrid ? "border-b border-slate-100" : "";

                                return (
                                  <div className={`transition-all ${isFullGrid ? "border border-slate-300 rounded-sm p-2 bg-white" : ""}`}>
                                    {/* Columns Header */}
                                    <div
                                      className={`pb-1.5 flex justify-between font-bold text-slate-900 ${tableTextSize} ${isBorderless ? "" : "border-b border-slate-300"
                                        }`}
                                    >
                                      <div className={`flex items-center gap-1.5 flex-1 ${showVerticalGrid ? "border-r border-slate-300 pr-3" : ""}`}>
                                        <span className="text-slate-400 text-[10px]">◊</span>
                                        <span>Account</span>
                                      </div>
                                      <div className={`flex items-center gap-1.5 ${cellVAmtBorder}`}>
                                        <span className="text-slate-400 text-[10px]">◊</span>
                                        <span>Total</span>
                                      </div>
                                    </div>

                                    {/* Report Table Body */}
                                    <div
                                      className={`divide-y ${tableTextSize} ${showHorizontalGrid
                                          ? "divide-slate-200"
                                          : isBorderless
                                            ? "divide-transparent"
                                            : "divide-slate-100"
                                        }`}
                                    >
                                      {/* Group: Income */}
                                      <div className="pt-2 pb-1">
                                        <div className={`flex items-center justify-between font-bold text-slate-900 ${rowPadding}`}>
                                          <div className={`flex items-center gap-1.5 flex-1 ${cellVBorder}`}>
                                            <span className="text-[9px] text-slate-400">∨</span>
                                            <span className={labelWrap}>Income</span>
                                          </div>
                                          <div className={cellVAmtBorder}></div>
                                        </div>
                                        <div className="pl-5 text-slate-700">
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Design Income</span>
                                            <span className={`${getReportAmountClass(0)} ${cellVAmtBorder}`}>
                                              {formatReportAmount(0)}
                                            </span>
                                          </div>
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Discounts given</span>
                                            <span className={`${getReportAmountClass(-89.50)} ${cellVAmtBorder}`}>
                                              {formatReportAmount(-89.50)}
                                            </span>
                                          </div>

                                          {/* Subgroup: Job Materials */}
                                          <div className="pl-3 py-0.5">
                                            <div className={`font-semibold text-slate-800 flex justify-between ${rowPadding}`}>
                                              <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Job Materials</span>
                                              <div className={cellVAmtBorder}></div>
                                            </div>
                                            {reportExpandSubaccounts && (
                                              <div className="pl-3 text-slate-600">
                                                <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                                  <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Fountains and Exterior Garden Lighting Systems</span>
                                                  <span className={`${getReportAmountClass(2246.50)} ${cellVAmtBorder}`}>{formatReportAmount(2246.50)}</span>
                                                </div>
                                                <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                                  <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Plants and Soil</span>
                                                  <span className={`${getReportAmountClass(2351.97)} ${cellVAmtBorder}`}>{formatReportAmount(2351.97)}</span>
                                                </div>
                                              </div>
                                            )}
                                            {reportShowGroupTotals && (
                                              <div className={`flex justify-between font-medium text-slate-900 ${rowPadding} ${isBorderless ? "" : "border-t border-slate-100"}`}>
                                                <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Total for Job Materials</span>
                                                <span className={`${getReportAmountClass(4598.47)} ${cellVAmtBorder}`}>{formatReportAmount(4598.47)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {reportShowGroupTotals && (
                                          <div className={`flex justify-between font-bold text-slate-900 mt-1 ${rowPadding} ${isBorderless ? "" : "border-t border-slate-200"}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Total for Income</span>
                                            <span className={`${getReportAmountClass(6068.97)} ${cellVAmtBorder}`}>{formatReportAmount(6068.97)}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Group: Cost of Goods Sold */}
                                      <div className="pt-1.5 pb-1">
                                        <div className={`flex items-center justify-between font-bold text-slate-900 ${rowPadding}`}>
                                          <div className={`flex items-center gap-1.5 flex-1 ${cellVBorder}`}>
                                            <span className="text-[9px] text-slate-400">∨</span>
                                            <span className={labelWrap}>Cost of Goods Sold</span>
                                          </div>
                                          <div className={cellVAmtBorder}></div>
                                        </div>
                                        <div className="pl-5 text-slate-700">
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Supplies & Materials</span>
                                            <span className={`${getReportAmountClass(405.00)} ${cellVAmtBorder}`}>{formatReportAmount(405.00)}</span>
                                          </div>
                                        </div>
                                        {reportShowGroupTotals && (
                                          <div className={`flex justify-between font-bold text-slate-900 mt-1 ${rowPadding} ${isBorderless ? "" : "border-t border-slate-200"}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Total for Cost of Goods Sold</span>
                                            <span className={`${getReportAmountClass(405.00)} ${cellVAmtBorder}`}>{formatReportAmount(405.00)}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Gross Profit */}
                                      <div className={`flex justify-between font-bold text-slate-900 ${rowPadding} ${isBorderless ? "" : "border-t border-b border-slate-300"}`}>
                                        <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Gross Profit</span>
                                        <span className={`${getReportAmountClass(5663.97)} ${cellVAmtBorder}`}>{formatReportAmount(5663.97)}</span>
                                      </div>

                                      {/* Group: Expenses */}
                                      <div className="pt-1.5 pb-1">
                                        <div className={`flex items-center justify-between font-bold text-slate-900 ${rowPadding}`}>
                                          <div className={`flex items-center gap-1.5 flex-1 ${cellVBorder}`}>
                                            <span className="text-[9px] text-slate-400">∨</span>
                                            <span className={labelWrap}>Expenses</span>
                                          </div>
                                          <div className={cellVAmtBorder}></div>
                                        </div>
                                        <div className="pl-5 text-slate-700">
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Advertising</span>
                                            <span className={`${getReportAmountClass(74.86)} ${cellVAmtBorder}`}>{formatReportAmount(74.86)}</span>
                                          </div>
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Automobile & Fuel</span>
                                            <span className={`${getReportAmountClass(349.41)} ${cellVAmtBorder}`}>{formatReportAmount(349.41)}</span>
                                          </div>
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Equipment Rental & Insurance</span>
                                            <span className={`${getReportAmountClass(353.23)} ${cellVAmtBorder}`}>{formatReportAmount(353.23)}</span>
                                          </div>
                                          <div className={`flex justify-between ${rowPadding} ${rowHBorder}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Legal, Professional & Accounting Fees</span>
                                            <span className={`${getReportAmountClass(640.00)} ${cellVAmtBorder}`}>{formatReportAmount(640.00)}</span>
                                          </div>
                                        </div>
                                        {reportShowGroupTotals && (
                                          <div className={`flex justify-between font-bold text-slate-900 mt-1 ${rowPadding} ${isBorderless ? "" : "border-t border-slate-200"}`}>
                                            <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Total for Expenses</span>
                                            <span className={`${getReportAmountClass(1417.50)} ${cellVAmtBorder}`}>{formatReportAmount(1417.50)}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Total / Net Income */}
                                      <div className={`mt-1 flex justify-between font-extrabold text-slate-950 ${rowPadding} ${isBorderless ? "" : "border-t-2 border-b-2 border-slate-800"
                                        }`}>
                                        <span className={`flex-1 ${cellVBorder} ${labelWrap}`}>Total</span>
                                        <span className={`${getReportAmountClass(4246.47)} ${cellVAmtBorder}`}>{formatReportAmount(4246.47)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Live Footer */}
                              {(reportFooterDate || reportFooterTime || reportFooterMethod) && (
                                <div
                                  className={`mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5 ${reportFooterAlignment === "Izquierda"
                                      ? "text-left"
                                      : reportFooterAlignment === "Derecha"
                                        ? "text-right"
                                        : "text-center"
                                    }`}
                                >
                                  {(reportFooterDate || reportFooterTime) && (
                                    <div>
                                      {reportFooterDate && <span>Fecha de preparación: 02/09/2026</span>}
                                      {reportFooterDate && reportFooterTime && <span> | </span>}
                                      {reportFooterTime && <span>Hora de preparación: 21:46:34</span>}
                                    </div>
                                  )}
                                  {reportFooterMethod && (
                                    <div>Método de contabilización: Criterio de devengo (Acumulación)</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Bar matching screenshot with Guardar */}
                        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
                          <div>
                            {reportSavedNotification && (
                              <span className="text-xs font-semibold text-emerald-600 animate-in fade-in">
                                ✓ Configuración de reportes guardada
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReportSavedNotification(true);
                              setTimeout(() => setReportSavedNotification(false), 3000);
                            }}
                            className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-[#1b426e] hover:bg-[#143355] transition cursor-pointer shadow-xs"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 4: CONTABILIDAD */}
                    {configSubTab === "contabilidad" && (
                      <div className="max-w-3xl space-y-6">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <h2 className="font-bold text-sm text-slate-900 mb-1">Ejercicio Fiscal y Parámetros Contables</h2>
                          <p className="text-xs text-slate-500 mb-4">Definición de periodos, cierre de libros y codificación de cuentas.</p>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Primer mes del ejercicio fiscal</span>
                              <span className="flex-1 text-slate-700 text-left">{contabilidadSettings.primerMesFiscal}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Ejercicio Fiscal",
                                    label: "Primer mes del ejercicio fiscal",
                                    value: contabilidadSettings.primerMesFiscal,
                                    options: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                                    onSave: (val) => setContabilidadSettings((prev) => ({ ...prev, primerMesFiscal: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Primer mes del año del impuesto sobre la renta</span>
                              <span className="flex-1 text-slate-700 text-left">{contabilidadSettings.primerMesImpuesto}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Año Fiscal / ISR",
                                    label: "Primer mes del año del impuesto sobre la renta",
                                    value: contabilidadSettings.primerMesImpuesto,
                                    options: ["Igual que el ejercicio fiscal (Enero)", "Enero", "Julio", "Octubre"],
                                    onSave: (val) => setContabilidadSettings((prev) => ({ ...prev, primerMesImpuesto: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Método de contabilidad</span>
                              <span className="flex-1 text-slate-700 text-left">{contabilidadSettings.metodoContabilidad}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Método de Contabilidad",
                                    label: "Método de contabilidad",
                                    value: contabilidadSettings.metodoContabilidad,
                                    options: ["Criterio de devengo", "Base de efectivo"],
                                    onSave: (val) => setContabilidadSettings((prev) => ({ ...prev, metodoContabilidad: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Cierre de los libros</span>
                              <span className="flex-1 text-slate-500 text-left">{contabilidadSettings.cierreLibros}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Cierre de Libros",
                                    label: "Estado de cierre de libros",
                                    value: contabilidadSettings.cierreLibros,
                                    options: ["Desactivado (Periodo 2026 abierto)", "Activado (Periodo cerrado)"],
                                    onSave: (val) => setContabilidadSettings((prev) => ({ ...prev, cierreLibros: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Activar números de cuenta contable</span>
                              <span className="flex-1 text-emerald-700 font-semibold text-left">{contabilidadSettings.numerosCuenta}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Números de Cuenta",
                                    label: "Activar números de cuenta contable",
                                    value: contabilidadSettings.numerosCuenta,
                                    options: ["Activado", "Desactivado"],
                                    onSave: (val) => setContabilidadSettings((prev) => ({ ...prev, numerosCuenta: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Información del Contador General */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <div className="mb-4">
                            <h2 className="font-bold text-sm text-slate-900">Información del Contador General</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Datos oficiales del responsable contable y financiero utilizados para firmas de cierres, conciliaciones y cédulas fiscales.
                            </p>
                          </div>

                          <div className="divide-y divide-slate-100 text-xs">
                            {/* Nombre del Contador */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Nombre del Contador General</span>
                              <span className={`flex-1 font-medium ${!companySettings.contadorNombre ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.contadorNombre || "Sin asignar (Haga clic en editar para registrar)"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditConfig("contadorNombre", "Nombre del Contador General")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Cargo / Título Profesional */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Cargo / Título Profesional</span>
                              <span className="flex-1 text-slate-700 font-medium">{companySettings.contadorTitulo || "Contador General"}</span>
                              <button
                                type="button"
                                onClick={() => startEditConfig("contadorTitulo", "Cargo o Título Profesional del Contador")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* N.º de Colegiación */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">N.º de Colegiación / Registro</span>
                              <span className={`flex-1 font-medium font-mono ${companySettings.contadorColegiacion === "Ninguno indicado" || !companySettings.contadorColegiacion ? "text-slate-400 italic font-sans" : "text-slate-700"}`}>
                                {companySettings.contadorColegiacion || "Ninguno indicado"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditConfig("contadorColegiacion", "Número de Colegiación / Registro Profesional")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Teléfono */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Teléfono del Contador</span>
                              <span className={`flex-1 font-medium font-mono ${companySettings.contadorTelefono === "Ninguno indicado" || !companySettings.contadorTelefono ? "text-slate-400 italic font-sans" : "text-slate-700"}`}>
                                {companySettings.contadorTelefono || "Ninguno indicado"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditConfig("contadorTelefono", "Teléfono de contacto del Contador")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>

                            {/* Correo Electrónico */}
                            <div className="py-3 flex items-start justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Correo Electrónico del Contador</span>
                              <span className={`flex-1 font-medium ${companySettings.contadorEmail === "Ninguno indicado" || !companySettings.contadorEmail ? "text-slate-400 italic" : "text-slate-700"}`}>
                                {companySettings.contadorEmail || "Ninguno indicado"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditConfig("contadorEmail", "Correo electrónico del Contador")}
                                className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 5: VENTAS */}
                    {configSubTab === "ventas" && (
                      <div className="max-w-4xl space-y-4">
                        {/* Notification banner */}
                        {salesSavedNotification && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                              <span className="font-semibold">Configuración de ventas actualizada correctamente</span>
                            </div>
                            <button
                              onClick={() => setSalesSavedNotification(false)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden divide-y divide-slate-200 text-xs">
                          {/* 1. Contenido del formulario de ventas */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "contenidoFormulario" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar contenido del formulario de ventas</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferidofactura condiciones</label>
                                    <select
                                      value={salesSettings.preferidofacturaCondiciones}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, preferidofacturaCondiciones: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                    >
                                      <option value="Net 30">Net 30</option>
                                      <option value="Net 15">Net 15</option>
                                      <option value="Net 60">Net 60</option>
                                      <option value="Al recibo (Due on receipt)">Al recibo (Due on receipt)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Método de entrega preferido</label>
                                    <select
                                      value={salesSettings.metodoEntregaPreferido}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, metodoEntregaPreferido: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                    >
                                      <option value="Ninguno">Ninguno</option>
                                      <option value="Imprimir más tarde">Imprimir más tarde</option>
                                      <option value="Enviar más tarde">Enviar más tarde</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.envio}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, envio: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="font-semibold text-slate-800">Envío</span>
                                  </label>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <span className="font-bold text-slate-800 block text-[11px]">Campos personalizados</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.numerosTransaccionesPersonalizados}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, numerosTransaccionesPersonalizados: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span>Números de transacciones personalizados</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.fechaServicio}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, fechaServicio: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span>Fecha del servicio</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.descuento}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, descuento: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span>Descuento</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.deposito}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, deposito: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span>Depósito</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.etiquetas}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, etiquetas: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span>Etiquetas</span>
                                    </label>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Contenido del formulario de ventas
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Preferidofactura condiciones</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.preferidofacturaCondiciones}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Método de entrega preferido</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.metodoEntregaPreferido}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Envío</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.envio ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="pt-2 font-semibold text-slate-800 text-[11px]">
                                    Campos personalizados
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Números de transacciones personalizados</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.numerosTransaccionesPersonalizados ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Fecha del servicio</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.fechaServicio ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Descuento</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.descuento ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Depósito</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.deposito ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Etiquetas</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.etiquetas ? "Activado" : "Desactivado"}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("contenidoFormulario")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Impuesto Sobre Ventas (I.S.V. SAR) */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "impuestosIsv" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar Impuesto Sobre Ventas (I.S.V. SAR)</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tasa general de I.S.V. (%)</label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={salesSettings.tasaIsvGeneral}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, tasaIsvGeneral: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none pr-8"
                                      />
                                      <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-bold">%</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 block">Tasa tributaria general oficial del SAR de Honduras (15%).</span>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Modalidad de cálculo</label>
                                    <select
                                      value={salesSettings.preciosIncluyenIsv ? "incluido" : "excluido"}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, preciosIncluyenIsv: e.target.value === "incluido" }))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                    >
                                      <option value="excluido">No incluido en precios (Se agrega a la base gravada)</option>
                                      <option value="incluido">Incluido en precios unitarios</option>
                                    </select>
                                    <span className="text-[10px] text-slate-400 mt-1 block">Determina si los precios de productos ya contemplan el I.S.V.</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.isvPredeterminado}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, isvPredeterminado: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="font-semibold text-slate-800">Aplicar I.S.V. por defecto en facturas nuevas</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.permitirIsv18}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, permitirIsv18: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Habilitar opción de I.S.V. 18% (Tasa especial para licores, boletos de primera clase, etc.)</span>
                                  </label>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Impuesto Sobre Ventas (I.S.V. SAR)
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Tasa general de I.S.V.</span>
                                    <span className="text-slate-900 font-semibold">{salesSettings.tasaIsvGeneral}%</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Aplicar I.S.V. por defecto</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.isvPredeterminado ? `Activado (${salesSettings.tasaIsvGeneral}%)` : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Tasa especial 18%</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.permitirIsv18 ? "Habilitada" : "Deshabilitada"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Modalidad de precios</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.preciosIncluyenIsv ? "I.S.V. Incluido" : "No incluido (Gravado al subtotal)"}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("impuestosIsv")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Productos y servicios */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "productosServicios" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar productos y servicios</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="space-y-2.5">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.mostrarColumnaProductoServicio}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, mostrarColumnaProductoServicio: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="font-medium text-slate-800">Mostrar la columna Producto/Servicio en los formularios de ventas</span>
                                  </label>
                                  <div className="pl-6">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={salesSettings.mostrarColumnaSku}
                                        onChange={(e) => setSalesSettings((prev) => ({ ...prev, mostrarColumnaSku: e.target.checked }))}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                      />
                                      <span className="text-slate-700">Mostrar columna de SKU</span>
                                    </label>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.activarReglasPrecios}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, activarReglasPrecios: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Activar reglas de precios</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.seguimientoCantidadPrecio}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, seguimientoCantidadPrecio: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Hacer un seguimiento de la cantidad y el precio/tarifa</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.seguimientoExistenciasInventario}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, seguimientoExistenciasInventario: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Realizar seguimiento de las existencias del inventario</span>
                                  </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Método de valoración del inventario</label>
                                    <select
                                      value={salesSettings.metodoValoracionInventario}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, metodoValoracionInventario: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                    >
                                      <option value="Seleccionar método">Seleccionar método</option>
                                      <option value="FIFO (PEPS - Primero en entrar, primero en salir)">FIFO (PEPS)</option>
                                      <option value="Costo promedio ponderado">Costo promedio ponderado</option>
                                      <option value="LIFO (UEPS)">LIFO (UEPS)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Método de recepción del inventario</label>
                                    <select
                                      value={salesSettings.metodoRecepcionInventario}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, metodoRecepcionInventario: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                    >
                                      <option value="Facturas de proveedores y gastos">Facturas de proveedores y gastos</option>
                                      <option value="Órdenes de compra y recepción">Órdenes de compra y recepción</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.reconocimientoIngresos}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, reconocimientoIngresos: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="font-semibold text-slate-800">Reconocimiento de ingresos</span>
                                  </label>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Productos y servicios
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Mostrar la columna Producto/Servicio en los formularios de ventas</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.mostrarColumnaProductoServicio ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Mostrar columna de SKU</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.mostrarColumnaSku ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Activar reglas de precios</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.activarReglasPrecios ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Hacer un seguimiento de la cantidad y el precio/tarifa</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.seguimientoCantidadPrecio ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Realizar seguimiento de las existencias del inventario</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.seguimientoExistenciasInventario ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-700">Método de valoración del inventario</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.metodoValoracionInventario}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Método de recepción del inventario</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.metodoRecepcionInventario}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Reconocimiento de ingresos</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.reconocimientoIngresos ? "Activado" : "Desactivado"}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("productosServicios")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Facturación progresiva */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "facturacionProgresiva" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar facturación progresiva</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={salesSettings.facturacionProgresiva}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, facturacionProgresiva: e.target.checked }))}
                                    className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                  />
                                  <span className="text-slate-800">Crea varias facturas parciales a partir de una sola cotización</span>
                                </label>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Facturación progresiva
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Crea varias facturas parciales a partir de una sola cotización</span>
                                  <span className="text-slate-600 font-medium">{salesSettings.facturacionProgresiva ? "Activado" : "Desactivado"}</span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("facturacionProgresiva")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 4. Mensajes */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "mensajes" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar mensajes de ventas</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Mensaje de correo electrónico predeterminado que se envía con los formularios de ventas
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={salesSettings.mensajePredeterminado}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, mensajePredeterminado: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Mensajes
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Mensaje de correo electrónico predeterminado que se envía con los formularios de ventas</span>
                                  <span className="text-slate-400"></span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("mensajes")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 5. Recordatorios */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "recordatorios" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar recordatorios automáticos</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Configurar mensajes de correo electrónico de recordatorios
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={salesSettings.recordatoriosConfig}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, recordatoriosConfig: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Recordatorios
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Configurar mensajes de correo electrónico de recordatorios</span>
                                  <span className="text-slate-400"></span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("recordatorios")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 6. Encuesta posterior a la factura/comentarios */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "encuestaComentarios" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar encuesta y comentarios</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="space-y-2.5">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.solicitarSolicitudTrabajo}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, solicitarSolicitudTrabajo: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Solicitar una solicitud de trabajo</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.solicitarResenas}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, solicitarResenas: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Solicitar reseñas, comentarios o testimonios</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={salesSettings.solicitarReferencia}
                                      onChange={(e) => setSalesSettings((prev) => ({ ...prev, solicitarReferencia: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Solicitar una referencia</span>
                                  </label>
                                </div>
                                <div className="pt-2 border-t border-slate-100 max-w-xs">
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Frecuencia</label>
                                  <select
                                    value={salesSettings.frecuenciaEncuesta}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, frecuenciaEncuesta: e.target.value }))}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  >
                                    <option value="30 días">30 días</option>
                                    <option value="60 días">60 días</option>
                                    <option value="90 días">90 días</option>
                                    <option value="180 días">180 días</option>
                                  </select>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Encuesta posterior a la factura/comentarios
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Solicitar una solicitud de trabajo</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.solicitarSolicitudTrabajo ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Solicitar reseñas, comentarios o testimonios</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.solicitarResenas ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Solicitar una referencia</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.solicitarReferencia ? "Activado" : "Desactivado"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Frecuencia</span>
                                    <span className="text-slate-600 font-medium">{salesSettings.frecuenciaEncuesta}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("encuestaComentarios")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 7. Entrega en línea */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "entregaEnLinea" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar entrega en línea</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Opciones de envío por correo electrónico de los formularios de ventas
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={salesSettings.entregaEnLineaOpciones}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, entregaEnLineaOpciones: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Entrega en línea
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Opciones de envío por correo electrónico de los formularios de ventas</span>
                                  <span className="text-slate-400"></span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("entregaEnLinea")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 8. Resúmenes */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingSalesSection === "resumenes" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar resúmenes</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={salesSettings.mostrarTablaAntiguedad}
                                    onChange={(e) => setSalesSettings((prev) => ({ ...prev, mostrarTablaAntiguedad: e.target.checked }))}
                                    className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                  />
                                  <span className="text-slate-800">Mostrar tabla de antigüedad en la parte inferior del extracto</span>
                                </label>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSalesSection(null);
                                      setSalesSavedNotification(true);
                                      setTimeout(() => setSalesSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Resúmenes
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Mostrar tabla de antigüedad en la parte inferior del extracto</span>
                                  <span className="text-slate-600 font-medium">{salesSettings.mostrarTablaAntiguedad ? "Activado" : "Desactivado"}</span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSalesSection("resumenes")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 6: GASTOS */}
                    {configSubTab === "gastos" && (
                      <div className="max-w-4xl space-y-4">
                        {/* Notification banner */}
                        {expenseSavedNotification && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                              <span className="font-semibold">Configuración de gastos actualizada correctamente</span>
                            </div>
                            <button
                              onClick={() => setExpenseSavedNotification(false)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden divide-y divide-slate-200 text-xs">
                          {/* Header */}
                          <div className="p-5 pb-3">
                            <h2 className="text-base font-bold text-slate-900">Gastos</h2>
                          </div>

                          {/* 1. Facturas y gastos */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingExpenseSection === "facturasGastos" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar facturas y gastos</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={expenseSettings.mostrarTablaArticulosGasto}
                                      onChange={(e) => setExpenseSettings((prev) => ({ ...prev, mostrarTablaArticulosGasto: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Mostrar tabla de artículos el gasto y formularios de compra</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={expenseSettings.mostrarCampoEtiquetas}
                                      onChange={(e) => setExpenseSettings((prev) => ({ ...prev, mostrarCampoEtiquetas: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Mostrar campo Etiquetas en los formularios de compras y gastos</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={expenseSettings.seguimientoGastosArticulosCliente}
                                      onChange={(e) => setExpenseSettings((prev) => ({ ...prev, seguimientoGastosArticulosCliente: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Realizar seguimiento gastos y artículos por cliente</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={expenseSettings.hacerGastosArticulosFacturables}
                                      onChange={(e) => setExpenseSettings((prev) => ({ ...prev, hacerGastosArticulosFacturables: e.target.checked }))}
                                      className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                    />
                                    <span className="text-slate-800">Hacer gastos y artículos facturables</span>
                                  </label>
                                </div>

                                <div className="pt-2 border-t border-slate-100 max-w-sm">
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Condiciones de pago de facturas de proveedores predeterminadas
                                  </label>
                                  <select
                                    value={expenseSettings.condicionesPagoProveedores}
                                    onChange={(e) => setExpenseSettings((prev) => ({ ...prev, condicionesPagoProveedores: e.target.value }))}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  >
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 60">Net 60</option>
                                    <option value="Al recibo (Due on receipt)">Al recibo (Due on receipt)</option>
                                  </select>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExpenseSection(null);
                                      setExpenseSavedNotification(true);
                                      setTimeout(() => setExpenseSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Facturas y gastos
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Mostrar tabla de artículos el gasto y formularios de compra</span>
                                    <span className="text-slate-600 font-medium">
                                      {expenseSettings.mostrarTablaArticulosGasto ? "Activado" : "Desactivado"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Mostrar campo Etiquetas en los formularios de compras y gastos</span>
                                    <span className="text-slate-600 font-medium">
                                      {expenseSettings.mostrarCampoEtiquetas ? "Activado" : "Desactivado"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Realizar seguimiento gastos y artículos por cliente</span>
                                    <span className="text-slate-600 font-medium">
                                      {expenseSettings.seguimientoGastosArticulosCliente ? "Activado" : "Desactivado"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Hacer gastos y artículos facturables</span>
                                    <span className="text-slate-600 font-medium">
                                      {expenseSettings.hacerGastosArticulosFacturables ? "Activado" : "Desactivado"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Condiciones de pago de facturas de proveedores predeterminadas</span>
                                    <span className="text-slate-600 font-medium">
                                      {expenseSettings.condicionesPagoProveedores}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection("facturasGastos")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Órdenes de compra */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingExpenseSection === "ordenesCompra" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar órdenes de compra</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={expenseSettings.usarOrdenesCompra}
                                    onChange={(e) => setExpenseSettings((prev) => ({ ...prev, usarOrdenesCompra: e.target.checked }))}
                                    className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer"
                                  />
                                  <span className="text-slate-800">Usar órdenes de compra</span>
                                </label>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExpenseSection(null);
                                      setExpenseSavedNotification(true);
                                      setTimeout(() => setExpenseSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Órdenes de compra
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">Usar órdenes de compra</span>
                                  <span className="text-slate-600 font-medium">
                                    {expenseSettings.usarOrdenesCompra ? "Activado" : "Desactivado"}
                                  </span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection("ordenesCompra")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Mensajes */}
                          <div className="p-5 hover:bg-slate-50/60 transition group">
                            {editingExpenseSection === "mensajes" ? (
                              <div className="space-y-4 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-bold text-slate-900 text-sm">Editar mensajes de órdenes de compra</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Mensaje de correo electrónico predeterminado que se envía con las órdenes de compra
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={expenseSettings.mensajeOrdenesCompra}
                                    onChange={(e) => setExpenseSettings((prev) => ({ ...prev, mensajeOrdenesCompra: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:border-[#1b426e] focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection(null)}
                                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExpenseSection(null);
                                      setExpenseSavedNotification(true);
                                      setTimeout(() => setExpenseSavedNotification(false), 3000);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-xs"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="w-56 sm:w-64 font-semibold text-slate-800 shrink-0">
                                  Mensajes
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-slate-700">
                                    Mensaje de correo electrónico predeterminado que se envía con las órdenes de compra
                                  </span>
                                  <span className="text-slate-400"></span>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpenseSection("mensajes")}
                                    className="text-xs font-semibold text-[#1b426e] hover:underline cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 7: HORAS */}
                    {configSubTab === "horas" && (
                      <div className="max-w-3xl space-y-6">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <h2 className="font-bold text-sm text-slate-900 mb-1">Jornada Laboral y Control de Tiempos</h2>
                          <p className="text-xs text-slate-500 mb-4">Parámetros de turnos y hojas de tiempo en planta.</p>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Primer día de la semana laboral</span>
                              <span className="flex-1 text-slate-700 text-left">{horasSettings.primerDia}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Semana Laboral",
                                    label: "Primer día de la semana laboral",
                                    value: horasSettings.primerDia,
                                    options: ["Lunes", "Domingo", "Sábado"],
                                    onSave: (val) => setHorasSettings((prev) => ({ ...prev, primerDia: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Jornada ordinaria máxima</span>
                              <span className="flex-1 text-slate-700 text-left">{horasSettings.jornadaMaxima}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Jornada Laboral",
                                    label: "Jornada ordinaria máxima",
                                    value: horasSettings.jornadaMaxima,
                                    options: ["8 horas / día (44 horas semanales)", "8 horas / día (48 horas semanales)", "7.5 horas / día (40 horas semanales)"],
                                    onSave: (val) => setHorasSettings((prev) => ({ ...prev, jornadaMaxima: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Aprobación de horas extraordinarias</span>
                              <span className="flex-1 text-emerald-700 font-semibold text-left">{horasSettings.aprobacionHorasExtra}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Horas Extraordinarias",
                                    label: "Aprobación de horas extraordinarias",
                                    value: horasSettings.aprobacionHorasExtra,
                                    options: ["Requiere visto bueno de supervisión", "Aprobación automática", "Desactivado"],
                                    onSave: (val) => setHorasSettings((prev) => ({ ...prev, aprobacionHorasExtra: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 8: MONEDAS */}
                    {configSubTab === "monedas" && (
                      <div className="max-w-3xl space-y-6">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <h2 className="font-bold text-sm text-slate-900 mb-1">Cuentas Bancarias y Monedas</h2>
                          <p className="text-xs text-slate-500 mb-4">Gestión de cuentas institucionales y multidivisa.</p>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Moneda principal del sistema</span>
                              <span className="flex-1 text-slate-700 font-semibold text-left">{monedasSettings.monedaPrincipal}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Moneda Principal",
                                    label: "Moneda principal del sistema",
                                    value: monedasSettings.monedaPrincipal,
                                    options: ["USD ($) Dólar estadounidense", "HNL (L) Lempira hondureño", "EUR (€) Euro"],
                                    onSave: (val) => setMonedasSettings((prev) => ({ ...prev, monedaPrincipal: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Multidivisa</span>
                              <span className="flex-1 text-emerald-700 font-semibold text-left">{monedasSettings.multidivisa}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Multidivisa",
                                    label: "Configuración multidivisa",
                                    value: monedasSettings.multidivisa,
                                    options: ["Activado (USD, HNL)", "Desactivado"],
                                    onSave: (val) => setMonedasSettings((prev) => ({ ...prev, multidivisa: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Banco de operaciones principal</span>
                              <span className="flex-1 text-slate-700 text-left">{monedasSettings.bancoPrincipal}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const bankOptions =
                                    connectedBanks.length > 0
                                      ? connectedBanks.map((b) => `${b.name} (${b.accountNumber}) ${b.currency}`)
                                      : ["Ninguna cuenta bancaria conectada"];
                                  setParamEditModal({
                                    title: "Banco Operativo",
                                    label: "Banco de operaciones principal",
                                    value: monedasSettings.bancoPrincipal,
                                    options: bankOptions,
                                    onSave: (val) => setMonedasSettings((prev) => ({ ...prev, bancoPrincipal: val })),
                                  });
                                }}
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Transferencias ACH Interbancarias</span>
                              <span className="flex-1 text-emerald-700 font-semibold text-left">{monedasSettings.transferenciasAch}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Transferencias ACH",
                                    label: "Transferencias ACH Interbancarias",
                                    value: monedasSettings.transferenciasAch,
                                    options: ["Habilitadas", "Deshabilitadas"],
                                    onSave: (val) => setMonedasSettings((prev) => ({ ...prev, transferenciasAch: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB: TODAS LAS LISTAS */}
                    {configSubTab === "listas" && (
                      <div className="max-w-5xl space-y-6 animate-in fade-in duration-150">
                        <div>
                          <h2 className="font-bold text-lg text-slate-900">Listas</h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Catálogos del sistema para clasificar, organizar y automatizar transacciones contables y operativas.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-2">
                          {/* Columna 1 */}
                          <div className="space-y-7">
                            {/* Item: Importar / Exportar datos */}
                            <div className="p-3.5 rounded-xl bg-orange-50/70 border border-[#1b426e]/30">
                              <button
                                type="button"
                                onClick={() => setConfigSubTab("importar")}
                                className="font-bold text-sm text-[#1b426e] hover:underline cursor-pointer text-left mb-1 flex items-center gap-2"
                              >
                                <ArrowUpDown className="w-4 h-4 text-[#1b426e] shrink-0" />
                                <span>Importar / Exportar datos (Clientes, Proveedores, Inventario, Catálogo)</span>
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Permite importar o exportar de forma masiva tablas de clientes, proveedores, catálogo de productos/inventario, facturación y catálogo de cuentas contables desde y hacia archivos CSV, Excel o JSON.
                              </p>
                            </div>

                            {/* Item: Plan de cuentas */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setCurrentView("plan-cuentas")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Plan de cuentas
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra tus cuentas. Las cuentas de balances realizan un seguimiento de tus activos y pasivos, y las cuentas de ingresos y gastos clasifican las transacciones. Desde aquí, puedes agregar o editar cuentas.
                              </p>
                            </div>

                            {/* Item: Transacciones recurrentes */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("recurrentes")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Transacciones recurrentes
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra una lista de las transacciones guardadas para volver a usarlas. Desde aquí, puedes programar las transacciones para que tengan lugar automáticamente o a través de recordatorios. También puedes guardar transacciones no programadas para usarlas en cualquier momento.
                              </p>
                            </div>

                            {/* Item: Productos y servicios */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setCurrentView("inventario")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Productos y servicios
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra los productos y servicios que vendes. Desde aquí, puedes editar la información sobre un producto o servicio, como la descripción o la tarifa que cobras.
                              </p>
                            </div>

                            {/* Item: Categorías de productos */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("categorias")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Categorías de productos
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Una forma de clasificar los artículos que vendes a clientes. Proporciona una forma de organizar rápidamente lo que vendes y ahorra tiempo al rellenar formularios de transacciones de ventas.
                              </p>
                            </div>

                            {/* Item: Ubicaciones (Locales Físicos) */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("ubicaciones")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Ubicaciones (Locales Físicos)
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Puedes usar las ubicaciones físicas para clasificar y organizar las diferentes plantas, sucursales o locales de la empresa.
                              </p>
                            </div>

                            {/* Item: Monedas */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setConfigSubTab("monedas")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Monedas
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Gestiona las divisas y los tipos de cambio de tus clientes y proveedores.
                              </p>
                            </div>
                          </div>

                          {/* Columna 2 */}
                          <div className="space-y-7">
                            {/* Item: Métodos de pago */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("metodosPago")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Métodos de pago
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra los modos en los que clasificas los pagos que recibes de los clientes, como Efectivo, Cheque o Transferencia. De ese modo, puedes imprimir comprobantes de depósito cuando depositas los pagos que recibes.
                              </p>
                            </div>

                            {/* Item: Condiciones */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("condiciones")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Condiciones
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra la lista de condiciones que determinan las fechas de vencimiento de los pagos de clientes o pagos a proveedores. Las condiciones también pueden especificar los descuentos aplicables por pagos anticipados. Desde aquí, puedes agregar o editar las condiciones.
                              </p>
                            </div>

                            {/* Item: Clases */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveListModal("clases")}
                                className="font-bold text-sm text-[#0066cc] hover:underline cursor-pointer text-left block mb-1"
                              >
                                Clases
                              </button>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Muestra las clases que puedes usar para clasificar y segmentar las transacciones contables según las líneas de producción o departamentos de la empresa.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 9: AVANZADAS */}
                    {configSubTab === "avanzadas" && (
                      <div className="max-w-3xl space-y-6">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                          <h2 className="font-bold text-sm text-slate-900 mb-1">Parámetros Avanzados del Sistema</h2>
                          <p className="text-xs text-slate-500 mb-4">Configuraciones de seguridad, regionalización e infraestructura.</p>

                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Zona horaria</span>
                              <span className="flex-1 text-slate-700 text-left">{avanzadasSettings.zonaHoraria}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Zona Horaria",
                                    label: "Zona horaria",
                                    value: avanzadasSettings.zonaHoraria,
                                    options: ["(GMT-06:00) Hora estándar central (Honduras)", "(GMT-05:00) Hora estándar del este (US)", "(GMT+00:00) UTC"],
                                    onSave: (val) => setAvanzadasSettings((prev) => ({ ...prev, zonaHoraria: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Idioma del sistema</span>
                              <span className="flex-1 text-slate-700 text-left">{avanzadasSettings.idioma}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Idioma del Sistema",
                                    label: "Idioma del sistema",
                                    value: avanzadasSettings.idioma,
                                    options: ["Español (Latinoamérica)", "English (US)"],
                                    onSave: (val) => setAvanzadasSettings((prev) => ({ ...prev, idioma: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Cierre de sesión por inactividad</span>
                              <span className="flex-1 text-slate-700 text-left">{avanzadasSettings.cierreSesionInactividad}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setParamEditModal({
                                    title: "Inactividad",
                                    label: "Cierre de sesión por inactividad",
                                    value: avanzadasSettings.cierreSesionInactividad,
                                    options: ["30 minutos", "1 hora", "3 horas", "8 horas"],
                                    onSave: (val) => setAvanzadasSettings((prev) => ({ ...prev, cierreSesionInactividad: val })),
                                  })
                                }
                                className="text-[#1b426e] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-4">
                              <span className="w-80 font-semibold text-slate-800 shrink-0 text-left">Base de datos empresarial</span>
                              <span className="flex-1 font-mono text-emerald-700 font-semibold text-left">PostgreSQL 17.6 Enterprise</span>
                              <span className="text-slate-400 text-[11px] shrink-0">Conectada</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-red-200 rounded-xl p-5 bg-red-50/40">
                          <h2 className="font-bold text-sm text-red-900 mb-1">Sesión Administrativa</h2>
                          <p className="text-xs text-red-700 mb-4">
                            Administrador activo: {currentAdminUser?.email || "admin"} ({currentAdminUser?.role || "ADMIN"})
                          </p>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB: IMPORTAR / EXPORTAR DATOS */}
                    {configSubTab === "importar" && (
                      <div className="max-w-4xl space-y-6 animate-in fade-in duration-150">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                              <ArrowUpDown className="w-5 h-5 text-[#1b426e]" />
                              <span>Importar / Exportar Datos</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Carga masiva y descarga de tablas maestras, catálogos y transacciones de {companySettings.nombreLegal || companySettings.nombre || "Prado ERP"}.
                            </p>
                          </div>

                          {/* Mode Switcher Tabs */}
                          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDataExchangeMode("import");
                                setImportNotification("");
                              }}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${dataExchangeMode === "import"
                                  ? "bg-white text-[#1b426e] shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Importar Datos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDataExchangeMode("export");
                                setImportNotification("");
                              }}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${dataExchangeMode === "export"
                                  ? "bg-white text-[#1b426e] shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Exportar Datos</span>
                            </button>
                          </div>
                        </div>

                        {importNotification && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                            <span>{importNotification}</span>
                            <button
                              type="button"
                              onClick={() => setImportNotification("")}
                              className="text-emerald-600 hover:text-emerald-900 font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* ================= MODE: IMPORTAR ================= */}
                        {dataExchangeMode === "import" && (
                          <div className="space-y-6 animate-in fade-in duration-150">
                            {/* 1. Entity Selection Cards */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-700">
                                  1. Selecciona la tabla o catálogo a importar:
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Entidad destino: <strong className="text-[#1b426e] capitalize">{currentImportSchema?.title || selectedImportCategory}</strong>
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {[
                                  {
                                    id: "clientes",
                                    title: "Clientes",
                                    desc: "Nombres, RTN, correos, teléfonos y direcciones de entrega",
                                    Icon: Users,
                                    color: "bg-blue-50 text-blue-700 border-blue-200",
                                  },
                                  {
                                    id: "proveedores",
                                    title: "Proveedores",
                                    desc: "Proveedores de insumos, materias primas y servicios",
                                    Icon: Factory,
                                    color: "bg-amber-50 text-amber-700 border-amber-200",
                                  },
                                  {
                                    id: "productos",
                                    title: "Productos e Inventario",
                                    desc: "Catálogo de artículos, SKU, existencias iniciales y precios",
                                    Icon: Package,
                                    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  },
                                  {
                                    id: "cuentas",
                                    title: "Catálogo Contable",
                                    desc: "Plan contable general, código contable, tipo y saldo inicial",
                                    Icon: BookOpen,
                                    color: "bg-purple-50 text-purple-700 border-purple-200",
                                  },
                                  {
                                    id: "facturas_venta",
                                    title: "Facturas de Venta",
                                    desc: "Historial de facturación de clientes y cuentas por cobrar",
                                    Icon: FileText,
                                    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
                                  },
                                  {
                                    id: "facturas_compra",
                                    title: "Facturas de Compra",
                                    desc: "Facturas de proveedores recibidas y cuentas por pagar",
                                    Icon: Receipt,
                                    color: "bg-teal-50 text-teal-700 border-teal-200",
                                  },
                                ].map((cat) => {
                                  const isSelected = selectedImportCategory === cat.id;
                                  const IconComp = cat.Icon;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedImportCategory(cat.id as any);
                                        setImportPasteText("");
                                        setImportFileName("");
                                        setImportRawRows([]);
                                        setImportDetectedHeaders([]);
                                        setImportColumnMapping({});
                                        setImportResultReport(null);
                                        if (importFileInputRef.current) importFileInputRef.current.value = "";
                                      }}
                                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-32 ${isSelected
                                          ? `${cat.color} ring-2 ring-[#1b426e] font-semibold shadow-xs`
                                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                        }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <IconComp className="w-5 h-5 stroke-[2]" />
                                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />}
                                        </div>
                                        <h3 className="font-bold text-xs text-slate-900">{cat.title}</h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{cat.desc}</p>
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                                        {isSelected ? "Seleccionada" : "Seleccionar"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 2. Data Source Switcher (File Upload vs Excel Paste) */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-5 shadow-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                                <div>
                                  <h3 className="font-bold text-sm text-slate-900">
                                    2. Carga de Datos ({currentImportSchema?.title || selectedImportCategory})
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Sube un archivo delimitado o pega las celdas copiadas directamente de tu hoja de cálculo.
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!currentImportSchema?.sampleCsv) return;
                                      const blob = new Blob([currentImportSchema.sampleCsv], { type: "text/csv;charset=utf-8;" });
                                      const url = URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.setAttribute("href", url);
                                      link.setAttribute("download", `Plantilla_Importacion_${selectedImportCategory}.csv`);
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                                    title="Descargar plantilla CSV oficial con los nombres de columna esperados"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Descargar Plantilla CSV</span>
                                  </button>
                                </div>
                              </div>

                              {/* Source Method Tabs & Options */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start">
                                  <button
                                    type="button"
                                    onClick={() => setImportInputMethod("file")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${importInputMethod === "file"
                                        ? "bg-white text-[#1b426e] shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                      }`}
                                  >
                                    <FileUp className="w-3.5 h-3.5" />
                                    <span>Subir Archivo (.csv, .tsv, .txt)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setImportInputMethod("paste")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${importInputMethod === "paste"
                                        ? "bg-white text-[#1b426e] shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                      }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Pegar de Excel / Google Sheets</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                  <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={importHasHeaders}
                                      onChange={(e) => {
                                        const next = e.target.checked;
                                        setImportHasHeaders(next);
                                        if (importPasteText) {
                                          handleProcessImportText(importPasteText, importFileName, next);
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e]"
                                    />
                                    <span className="font-semibold text-[11px] text-slate-700">
                                      La 1.ª fila contiene encabezados
                                    </span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentImportSchema?.sampleCsv) {
                                        handleProcessImportText(currentImportSchema.sampleCsv, `Ejemplo_${selectedImportCategory}.csv`, importHasHeaders);
                                        setImportInputMethod("paste");
                                      }
                                    }}
                                    className="text-[11px] font-bold text-[#0066cc] hover:underline cursor-pointer"
                                  >
                                    Cargar datos de prueba
                                  </button>
                                </div>
                              </div>

                              {/* Method A: File Upload Drag & Drop */}
                              {importInputMethod === "file" && (
                                <div>
                                  <input
                                    type="file"
                                    ref={importFileInputRef}
                                    accept=".csv,.txt,.tsv"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          const content = (ev.target?.result as string) || "";
                                          handleProcessImportText(content, file.name, importHasHeaders);
                                        };
                                        reader.readAsText(file);
                                      }
                                    }}
                                  />

                                  {importFileName && importRawRows.length > 0 ? (
                                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                                          <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-900">{importFileName}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                              ✓ Archivo cargado
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            {importRawRows.length} filas de datos detectadas • {importDetectedHeaders.length} columnas
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => importFileInputRef.current?.click()}
                                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                        >
                                          Cambiar archivo
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setImportFileName("");
                                            setImportPasteText("");
                                            setImportRawRows([]);
                                            setImportDetectedHeaders([]);
                                            setImportColumnMapping({});
                                            if (importFileInputRef.current) importFileInputRef.current.value = "";
                                          }}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                                          title="Quitar archivo"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setImportIsDragging(true);
                                      }}
                                      onDragLeave={() => setImportIsDragging(false)}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setImportIsDragging(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            const content = (ev.target?.result as string) || "";
                                            handleProcessImportText(content, file.name, importHasHeaders);
                                          };
                                          reader.readAsText(file);
                                        }
                                      }}
                                      onClick={() => importFileInputRef.current?.click()}
                                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${importIsDragging
                                          ? "border-[#1b426e] bg-blue-50/50 scale-[0.99]"
                                          : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
                                        }`}
                                    >
                                      <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-slate-200 text-[#1b426e]">
                                        <Upload className="w-6 h-6 stroke-[2]" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-xs text-slate-900">
                                          Arrastra tu archivo aquí o haz clic para seleccionarlo
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                          Formatos compatibles: <strong>CSV</strong> (delimitado por comas o punto y coma), <strong>TSV</strong> o <strong>TXT</strong>
                                        </p>
                                      </div>
                                      <span className="px-3.5 py-1.5 rounded-xl bg-[#1b426e] text-white text-xs font-semibold shadow-xs">
                                        Examinar archivos
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Method B: Paste Text from Spreadsheet */}
                              {importInputMethod === "paste" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-700">
                                      Copia celdas desde Excel o Google Sheets y pégalas aquí (Ctrl + V):
                                    </label>
                                    {importPasteText && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setImportPasteText("");
                                          setImportRawRows([]);
                                          setImportDetectedHeaders([]);
                                          setImportColumnMapping({});
                                        }}
                                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                                      >
                                        Limpiar contenido
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    rows={6}
                                    value={importPasteText}
                                    onChange={(e) => handleProcessImportText(e.target.value, "Pegado_Excel", importHasHeaders)}
                                    placeholder={currentImportSchema?.sampleCsv || "Pega aquí tus datos..."}
                                    className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50/60 text-slate-900 focus:outline-none focus:border-[#1b426e] focus:bg-white transition"
                                  />
                                </div>
                              )}
                            </div>

                            {/* 3. Smart Column Mapping Card */}
                            {importRawRows.length > 0 && currentImportSchema && (
                              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-xs animate-in fade-in duration-150">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-sm text-slate-900">
                                        3. Mapeo Inteligente de Columnas
                                      </h3>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        Auto-detección activa
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Asocia cada campo de Prado ERP con la columna correspondiente de tu archivo. Los campos con (<span className="text-rose-500 font-bold">*</span>) son obligatorios.
                                    </p>
                                  </div>

                                  <div className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                                    {Object.values(importColumnMapping).filter((v) => v !== undefined && v >= 0).length} de {currentImportSchema.fields.length} campos asignados
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                                  {currentImportSchema.fields.map((field: any) => {
                                    const selectedIdx = importColumnMapping[field.key] ?? -1;
                                    const isMapped = selectedIdx >= 0;
                                    return (
                                      <div
                                        key={field.key}
                                        className={`p-3 rounded-xl border transition ${isMapped
                                            ? "bg-slate-50/80 border-slate-200"
                                            : field.required
                                              ? "bg-rose-50/40 border-rose-200"
                                              : "bg-white border-slate-200"
                                          }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                            <span>{field.label}</span>
                                            {field.required && (
                                              <span className="text-rose-500 font-bold text-sm" title="Campo obligatorio">*</span>
                                            )}
                                          </label>
                                          {field.required ? (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                              Requerido
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                              Opcional
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-[10px] text-slate-500 mb-2 truncate" title={field.hint}>
                                          {field.hint}
                                        </p>

                                        <select
                                          value={selectedIdx}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            setImportColumnMapping((prev) => ({
                                              ...prev,
                                              [field.key]: val,
                                            }));
                                          }}
                                          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-medium transition cursor-pointer ${isMapped
                                              ? "bg-white border-slate-300 text-slate-800 focus:border-[#1b426e]"
                                              : field.required
                                                ? "bg-white border-rose-300 text-rose-900 focus:border-rose-500"
                                                : "bg-white border-slate-200 text-slate-500"
                                            }`}
                                        >
                                          <option value={-1}>-- Omitir / Sin mapear --</option>
                                          {importDetectedHeaders.map((headerName, hIdx) => {
                                            const sampleVal = importRawRows[0]?.[hIdx] ? ` (Ej: "${importRawRows[0][hIdx]}")` : "";
                                            return (
                                              <option key={hIdx} value={hIdx}>
                                                Col {hIdx + 1}: {headerName || `Columna ${hIdx + 1}`}{sampleVal}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 4. Live Validated Preview Table */}
                            {importRawRows.length > 0 && currentImportSchema && (
                              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-xs animate-in fade-in duration-150">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div>
                                    <h3 className="font-bold text-sm text-slate-900">
                                      4. Vista Previa y Validación de Registros
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Verifica la calidad y consistencia de los datos antes de guardarlos definitivamente en la base de datos.
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>
                                        {validatedImportRows.filter((r) => r.isValid).length} listos
                                      </span>
                                    </span>
                                    {validatedImportRows.filter((r) => !r.isValid).length > 0 && (
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>
                                          {validatedImportRows.filter((r) => !r.isValid).length} incompletos
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto shadow-inner">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold sticky top-0 backdrop-blur-xs">
                                        <th className="p-2.5 text-center w-12 text-slate-500">#</th>
                                        {currentImportSchema.fields.map((field: any) => {
                                          const colIdx = importColumnMapping[field.key];
                                          const isMapped = colIdx !== undefined && colIdx >= 0;
                                          return (
                                            <th key={field.key} className="p-2.5 whitespace-nowrap">
                                              <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-slate-800">
                                                  {field.label}
                                                  {field.required && <span className="text-rose-500">*</span>}
                                                </span>
                                                <span className="text-[10px] font-normal text-slate-400">
                                                  {isMapped
                                                    ? `Col: ${importDetectedHeaders[colIdx] || colIdx + 1}`
                                                    : "(Sin vincular)"}
                                                </span>
                                              </div>
                                            </th>
                                          );
                                        })}
                                        <th className="p-2.5 text-right whitespace-nowrap">Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {validatedImportRows.slice(0, 10).map((item) => {
                                        return (
                                          <tr
                                            key={item.idx}
                                            className={`hover:bg-slate-50/70 transition ${!item.isValid ? "bg-rose-50/20" : ""
                                              }`}
                                          >
                                            <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                                              {item.idx + 1}
                                            </td>
                                            {currentImportSchema.fields.map((field: any) => {
                                              const colIdx = importColumnMapping[field.key];
                                              const val = colIdx !== undefined && colIdx >= 0 ? item.row[colIdx] : "";
                                              const isMissing = field.required && (!val || val.trim().length === 0);
                                              return (
                                                <td
                                                  key={field.key}
                                                  className={`p-2.5 font-sans whitespace-nowrap max-w-xs truncate ${isMissing
                                                      ? "text-rose-600 bg-rose-50/50 font-bold"
                                                      : "text-slate-800"
                                                    }`}
                                                  title={val}
                                                >
                                                  {val || (field.required ? "(Requerido vacío)" : "-")}
                                                </td>
                                              );
                                            })}
                                            <td className="p-2.5 text-right whitespace-nowrap">
                                              {item.isValid ? (
                                                <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 rounded-full inline-flex items-center gap-1">
                                                  <Check className="w-3 h-3" />
                                                  <span>Válido</span>
                                                </span>
                                              ) : (
                                                <span
                                                  className="px-2.5 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 rounded-full inline-flex items-center gap-1 cursor-help"
                                                  title={`Falta: ${item.missingFields.join(", ")}`}
                                                >
                                                  <AlertCircle className="w-3 h-3" />
                                                  <span>Falta dato</span>
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {validatedImportRows.length > 10 && (
                                  <p className="text-[11px] text-slate-500 italic text-center">
                                    Mostrando las primeras 10 filas de {validatedImportRows.length} registros detectados. Todos serán procesados al importar.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 5. Execution Action Bar & Detailed Report */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
                              {/* Execution Result Box */}
                              {importResultReport && (
                                <div
                                  className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${importResultReport.errorCount === 0
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                      : "bg-amber-50 border-amber-200 text-amber-900"
                                    }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">
                                      {importResultReport.errorCount === 0 ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                      ) : (
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                      )}
                                      <span>
                                        Resultado de la importación: {importResultReport.successCount} guardados con éxito
                                        {importResultReport.errorCount > 0 ? `, ${importResultReport.errorCount} con advertencias` : ""}.
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setImportResultReport(null)}
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {importResultReport.errors.length > 0 && (
                                    <div className="p-3 rounded-lg bg-white/70 border border-amber-200 space-y-1 text-[11px] max-h-36 overflow-y-auto font-mono text-slate-700">
                                      <span className="font-bold font-sans text-slate-800 block">Detalle de observaciones:</span>
                                      {importResultReport.errors.map((err, errIdx) => (
                                        <p key={errIdx}>• {err}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">
                                    {validatedImportRows.length > 0
                                      ? `${validatedImportRows.filter((r) => r.isValid).length} registros listos para insertar en ${currentImportSchema?.title || selectedImportCategory}.`
                                      : "Ingresa datos en el paso 2 para comenzar la importación."}
                                  </span>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Los datos se almacenarán directamente en la base de datos PostgreSQL de {companySettings.nombreLegal || companySettings.nombre || "Prado ERP"}.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    validatedImportRows.length === 0 ||
                                    validatedImportRows.filter((r) => r.isValid).length === 0 ||
                                    isImporting
                                  }
                                  onClick={handleExecuteRealImport}
                                  className="px-6 py-2.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
                                >
                                  {isImporting ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Importando a la base de datos...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>
                                        Importar {validatedImportRows.filter((r) => r.isValid).length > 0 ? `(${validatedImportRows.filter((r) => r.isValid).length})` : ""} a la Base de Datos →
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ================= MODE: EXPORTAR ================= */}
                        {dataExchangeMode === "export" && (
                          <div className="space-y-6 animate-in fade-in duration-150">
                            {/* 1. Selection Cards */}
                            <div>
                              <span className="text-xs font-bold text-slate-700 block mb-2">1. Selecciona la tabla o entidad a exportar:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {[
                                  {
                                    id: "clientes",
                                    title: "Clientes",
                                    desc: "Nombres, RTN, correos, teléfonos, direcciones y moneda",
                                    Icon: Users,
                                    color: "bg-blue-50 text-blue-700 border-blue-200",
                                  },
                                  {
                                    id: "proveedores",
                                    title: "Proveedores",
                                    desc: "Proveedores de materias primas, insumos y servicios",
                                    Icon: Factory,
                                    color: "bg-amber-50 text-amber-700 border-amber-200",
                                  },
                                  {
                                    id: "productos",
                                    title: "Productos e Inventario",
                                    desc: "Catálogo de productos, SKU, stock actual, costo y precios",
                                    Icon: Package,
                                    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  },
                                  {
                                    id: "cuentas",
                                    title: "Catálogo Contable",
                                    desc: "Plan de cuentas, código contable, tipo de cuenta y saldo",
                                    Icon: BookOpen,
                                    color: "bg-purple-50 text-purple-700 border-purple-200",
                                  },
                                  {
                                    id: "facturas_venta",
                                    title: "Facturas de Venta",
                                    desc: "Historial de facturación de clientes, montos y estados de cobro",
                                    Icon: FileText,
                                    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
                                  },
                                  {
                                    id: "facturas_compra",
                                    title: "Facturas de Compra",
                                    desc: "Facturas de proveedores, órdenes vinculadas y pagos",
                                    Icon: CreditCard,
                                    color: "bg-teal-50 text-teal-700 border-teal-200",
                                  },
                                  {
                                    id: "pedidos_venta",
                                    title: "Pedidos de Venta",
                                    desc: "Órdenes de clientes (Sales Orders), fechas y estados",
                                    Icon: Boxes,
                                    color: "bg-orange-50 text-orange-700 border-orange-200",
                                  },
                                  {
                                    id: "cotizaciones",
                                    title: "Cotizaciones",
                                    desc: "Propuestas comerciales a clientes con validez y vendedor",
                                    Icon: Tag,
                                    color: "bg-rose-50 text-rose-700 border-rose-200",
                                  },
                                  {
                                    id: "asientos",
                                    title: "Asientos Contables",
                                    desc: "Libro de diario general, números de póliza y referencias",
                                    Icon: Layers,
                                    color: "bg-violet-50 text-violet-700 border-violet-200",
                                  },
                                ].map((cat) => {
                                  const isSelected = selectedExportCategory === cat.id;
                                  const IconComp = cat.Icon;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setSelectedExportCategory(cat.id as any)}
                                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-32 ${isSelected
                                          ? `${cat.color} ring-2 ring-[#1b426e] font-semibold shadow-xs`
                                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                        }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <IconComp className="w-5 h-5 stroke-[2]" />
                                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />}
                                        </div>
                                        <h3 className="font-bold text-xs text-slate-900">{cat.title}</h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{cat.desc}</p>
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                                        {isSelected ? "Seleccionada" : "Seleccionar"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 2. Export Configuration & Action Panel */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-5 shadow-xs">
                              <div className="border-b border-slate-100 pb-3">
                                <h3 className="font-bold text-sm text-slate-900">
                                  2. Opciones de Formato y Exportación
                                </h3>
                                <p className="text-xs text-slate-500">
                                  Configura el formato de salida compatible con Excel o software contable externo.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Format Selection */}
                                <div className="space-y-2">
                                  <label className="block text-xs font-semibold text-slate-700">Formato del Archivo:</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { id: "csv", label: "CSV (.csv)", desc: "Estándar UTF-8 con BOM" },
                                      { id: "excel", label: "Excel (.xls)", desc: "Hojas de cálculo" },
                                      { id: "json", label: "JSON (.json)", desc: "Estructura cruda" },
                                    ].map((fmt) => (
                                      <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={() => setExportFormat(fmt.id as any)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${exportFormat === fmt.id
                                            ? "bg-[#fff7ed] border-[#1b426e] text-[#1b426e] font-semibold ring-1 ring-[#1b426e]"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                          }`}
                                      >
                                        <span className="block text-xs font-bold">{fmt.label}</span>
                                        <span className="block text-[10px] text-slate-500">{fmt.desc}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Delimiter Selection (if CSV) */}
                                {exportFormat === "csv" && (
                                  <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700">Separador de Campos (Delimitador):</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { id: ",", label: "Coma (,)", desc: "Estándar internacional" },
                                        { id: ";", label: "Punto y coma (;)", desc: "Excel en español" },
                                        { id: "\t", label: "Tabulación (\\t)", desc: "TSV para copiar" },
                                      ].map((del) => (
                                        <button
                                          key={del.id}
                                          type="button"
                                          onClick={() => setExportDelimiter(del.id as any)}
                                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${exportDelimiter === del.id
                                              ? "bg-[#fff7ed] border-[#1b426e] text-[#1b426e] font-semibold ring-1 ring-[#1b426e]"
                                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                          <span className="block text-xs font-bold">{del.label}</span>
                                          <span className="block text-[10px] text-slate-500">{del.desc}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Export Summary Box */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2.5">
                                  <Database className="w-4 h-4 text-[#1b426e]" />
                                  <div>
                                    <span className="font-semibold text-slate-800">Tabla seleccionada: </span>
                                    <span className="font-bold text-[#1b426e] uppercase">{selectedExportCategory.replace(/_/g, " ")}</span>
                                    <span className="text-slate-400 mx-2">•</span>
                                    <span className="text-slate-600">Formato: {exportFormat.toUpperCase()}</span>
                                  </div>
                                </div>
                                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Listo para descarga
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="text-xs text-slate-500">
                                  Los archivos exportados se descargarán directamente en tu dispositivo con codificación UTF-8.
                                </div>
                                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    disabled={isExporting}
                                    onClick={() => handleExportData()}
                                    className="px-6 py-2.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isExporting ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Generando archivo...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4" />
                                        <span>Descargar Archivo Exportado</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Connected Bank Modal */}
                {editingBank && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-slate-900">Editar Cuenta Bancaria</h3>
                        <button
                          type="button"
                          onClick={() => setEditingBank(null)}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">Actualiza la información oficial del banco en la base de datos.</p>

                      <form onSubmit={handleUpdateBank} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Nombre de la Institución Bancaria</label>
                          <input
                            type="text"
                            required
                            value={editingBank.name}
                            onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Número de Cuenta</label>
                            <input
                              type="text"
                              required
                              value={editingBank.accountNumber}
                              onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Moneda</label>
                            <select
                              value={editingBank.currency}
                              onChange={(e) => setEditingBank({ ...editingBank, currency: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            >
                              <option value="USD">USD ($)</option>
                              <option value="HNL">HNL (L)</option>
                              <option value="EUR">EUR (€)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Saldo Bancario</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingBank.bankBalance}
                              onChange={(e) => setEditingBank({ ...editingBank, bankBalance: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Saldo en Libros</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingBank.bookBalance}
                              onChange={(e) => setEditingBank({ ...editingBank, bookBalance: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingBank(null)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20"
                          >
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Interactive Edit Modal for Parameter Subtabs */}
                {paramEditModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-slate-900">Editar {paramEditModal.title}</h3>
                        <button
                          type="button"
                          onClick={() => setParamEditModal(null)}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">Actualiza la configuración de {paramEditModal.title.toLowerCase()}.</p>

                      <div className="mb-5">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">{paramEditModal.label}</label>
                        {paramEditModal.options && paramEditModal.options.length > 0 ? (
                          <select
                            value={paramEditModal.value}
                            onChange={(e) => setParamEditModal((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                          >
                            {paramEditModal.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={paramEditModal.value}
                            onChange={(e) => setParamEditModal((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                          />
                        )}
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setParamEditModal(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            paramEditModal.onSave(paramEditModal.value);
                            setParamEditModal(null);
                          }}
                          className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Edit Modal for Other Company Settings */}
                {activeListModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {activeListModal === "categorias" && "Categorías de Productos"}
                            {activeListModal === "ubicaciones" && "Ubicaciones (Locales Físicos)"}
                            {activeListModal === "metodosPago" && "Métodos de Pago"}
                            {activeListModal === "condiciones" && "Condiciones de Pago"}
                            {activeListModal === "recurrentes" && "Transacciones Recurrentes"}
                            {activeListModal === "clases" && "Clases Contables"}
                          </h3>
                          <p className="text-xs text-slate-500">Administra los elementos registrados en esta lista.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveListModal(null)}
                          className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* MODAL 1: CATEGORÍAS */}
                      {activeListModal === "categorias" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const input = form.elements.namedItem("catName") as HTMLInputElement;
                              if (input && input.value.trim()) {
                                const ok = await handleAddProductCategory(input.value.trim());
                                if (ok) input.value = "";
                              }
                            }}
                            className="flex gap-2"
                          >
                            <input
                              name="catName"
                              type="text"
                              placeholder="Nueva categoría (ej. Empaque Flexográfico)..."
                              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              + Agregar
                            </button>
                          </form>

                          {categoryActionError && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                              {categoryActionError}
                            </div>
                          )}

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {productCategoriesList.map((cat) => (
                              <div key={cat.id} className="p-3 flex items-center justify-between gap-2 text-xs hover:bg-slate-50">
                                {editingCategory?.id === cat.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (editingCategory.name.trim()) {
                                        handleRenameProductCategory(cat.id, editingCategory.name.trim());
                                      }
                                    }}
                                    className="flex-1 flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingCategory.name}
                                      onChange={(e) =>
                                        setEditingCategory({ id: cat.id, name: e.target.value })
                                      }
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#1b426e] text-slate-900 focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="px-2.5 py-1.5 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCategory(null)}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                  </form>
                                ) : (
                                  <>
                                    <span className="font-medium text-slate-800">{cat.name}</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                                        className="text-slate-400 hover:text-[#1b426e] text-xs font-semibold cursor-pointer p-1"
                                        title="Renombrar"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                                            handleDeleteProductCategory(cat.id);
                                          }
                                        }}
                                        className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                        title="Eliminar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                            {productCategoriesList.length === 0 && (
                              <div className="p-4 text-center text-slate-400 text-xs">
                                No hay categorías registradas. Agrega la primera arriba.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* MODAL 2: UBICACIONES FÍSICAS */}
                      {activeListModal === "ubicaciones" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const nameIn = form.elements.namedItem("locName") as HTMLInputElement;
                              const addrIn = form.elements.namedItem("locAddr") as HTMLInputElement;
                              if (nameIn && nameIn.value.trim()) {
                                setPhysicalLocationsList((prev) => [
                                  ...prev,
                                  { id: Date.now().toString(), name: nameIn.value.trim(), address: addrIn.value.trim() || "San Pedro Sula, Cortés" },
                                ]);
                                nameIn.value = "";
                                addrIn.value = "";
                              }
                            }}
                            className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200"
                          >
                            <input
                              name="locName"
                              type="text"
                              required
                              placeholder="Nombre del local (ej. Planta N.º 2 Zip Búfalo)..."
                              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <input
                              name="locAddr"
                              type="text"
                              placeholder="Dirección física (ej. Villanueva, Cortés)..."
                              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                              >
                                + Agregar ubicación
                              </button>
                            </div>
                          </form>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {physicalLocationsList.map((loc) => (
                              <div key={loc.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <div>
                                  <span className="font-bold text-slate-800 block">{loc.name}</span>
                                  <span className="text-[11px] text-slate-500">{loc.address}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPhysicalLocationsList((prev) => prev.filter((l) => l.id !== loc.id))}
                                  className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                  title="Eliminar"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODAL 3: MÉTODOS DE PAGO */}
                      {activeListModal === "metodosPago" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const nameIn = form.elements.namedItem("pmName") as HTMLInputElement;
                              const typeIn = form.elements.namedItem("pmType") as HTMLSelectElement;
                              if (nameIn && nameIn.value.trim()) {
                                setPaymentMethodsList((prev) => [
                                  ...prev,
                                  { id: Date.now().toString(), name: nameIn.value.trim(), type: typeIn.value },
                                ]);
                                nameIn.value = "";
                              }
                            }}
                            className="flex gap-2"
                          >
                            <input
                              name="pmName"
                              type="text"
                              required
                              placeholder="Nuevo método (ej. Depósito directo)..."
                              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <select
                              name="pmType"
                              className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Tarjeta">Tarjeta</option>
                            </select>
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              + Agregar
                            </button>
                          </form>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {paymentMethodsList.map((pm) => (
                              <div key={pm.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <span className="font-medium text-slate-800">{pm.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">{pm.type}</span>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethodsList((prev) => prev.filter((p) => p.id !== pm.id))}
                                    className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                    title="Eliminar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODAL 4: CONDICIONES DE PAGO */}
                      {activeListModal === "condiciones" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const nameIn = form.elements.namedItem("termName") as HTMLInputElement;
                              const daysIn = form.elements.namedItem("termDays") as HTMLInputElement;
                              if (nameIn && nameIn.value.trim()) {
                                setPaymentTermsList((prev) => [
                                  ...prev,
                                  { id: Date.now().toString(), name: nameIn.value.trim(), days: parseInt(daysIn.value) || 0 },
                                ]);
                                nameIn.value = "";
                                daysIn.value = "30";
                              }
                            }}
                            className="flex gap-2"
                          >
                            <input
                              name="termName"
                              type="text"
                              required
                              placeholder="Nombre (ej. Neto 45 días)..."
                              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <input
                              name="termDays"
                              type="number"
                              defaultValue="30"
                              placeholder="Días"
                              className="w-20 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              + Agregar
                            </button>
                          </form>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {paymentTermsList.map((term) => (
                              <div key={term.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <span className="font-medium text-slate-800">{term.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-slate-500 font-mono">{term.days} días plazo</span>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentTermsList((prev) => prev.filter((t) => t.id !== term.id))}
                                    className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                    title="Eliminar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODAL 5: TRANSACCIONES RECURRENTES */}
                      {activeListModal === "recurrentes" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const nameIn = form.elements.namedItem("recName") as HTMLInputElement;
                              const amtIn = form.elements.namedItem("recAmt") as HTMLInputElement;
                              const typeIn = form.elements.namedItem("recType") as HTMLSelectElement;
                              if (nameIn && nameIn.value.trim()) {
                                setRecurringTransactionsList((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now().toString(),
                                    name: nameIn.value.trim(),
                                    type: typeIn.value,
                                    frequency: "Mensual",
                                    amount: parseFloat(amtIn.value) || 0,
                                  },
                                ]);
                                nameIn.value = "";
                                amtIn.value = "";
                              }
                            }}
                            className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                name="recName"
                                type="text"
                                required
                                placeholder="Nombre plantilla..."
                                className="col-span-2 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                              />
                              <select
                                name="recType"
                                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                              >
                                <option value="Gasto">Gasto</option>
                                <option value="Ingreso">Ingreso</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <input
                                name="recAmt"
                                type="number"
                                step="0.01"
                                placeholder="Monto ($ / L)..."
                                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                              >
                                + Guardar plantilla
                              </button>
                            </div>
                          </form>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {recurringTransactionsList.map((rec) => (
                              <div key={rec.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <div>
                                  <span className="font-bold text-slate-800 block">{rec.name}</span>
                                  <span className="text-[11px] text-slate-500">{rec.type} • Frecuencia: {rec.frequency}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-slate-900">${rec.amount.toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => setRecurringTransactionsList((prev) => prev.filter((r) => r.id !== rec.id))}
                                    className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                    title="Eliminar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODAL 6: CLASES CONTABLES */}
                      {activeListModal === "clases" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const nameIn = form.elements.namedItem("clsName") as HTMLInputElement;
                              const descIn = form.elements.namedItem("clsDesc") as HTMLInputElement;
                              if (nameIn && nameIn.value.trim()) {
                                setAccountingClassesList((prev) => [
                                  ...prev,
                                  { id: Date.now().toString(), name: nameIn.value.trim(), description: descIn.value.trim() },
                                ]);
                                nameIn.value = "";
                                descIn.value = "";
                              }
                            }}
                            className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200"
                          >
                            <input
                              name="clsName"
                              type="text"
                              required
                              placeholder="Nombre de la clase (ej. División Flexografía)..."
                              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <input
                              name="clsDesc"
                              type="text"
                              placeholder="Descripción de la línea o segmento..."
                              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-xs"
                              >
                                + Agregar clase
                              </button>
                            </div>
                          </form>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                            {accountingClassesList.map((cls) => (
                              <div key={cls.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <div>
                                  <span className="font-bold text-slate-800 block">{cls.name}</span>
                                  <span className="text-[11px] text-slate-500">{cls.description}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAccountingClassesList((prev) => prev.filter((c) => c.id !== cls.id))}
                                  className="text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer p-1"
                                  title="Eliminar"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveListModal(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Edit Modal for Other Company Settings */}
                {editingConfigKey && editingConfigKey !== "tipoEmpresa" && editingConfigKey !== "sector" && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <h3 className="text-base font-bold text-slate-900 mb-1">Editar {editingConfigLabel}</h3>
                      <p className="text-xs text-slate-500 mb-4">Actualiza la información oficial de la empresa.</p>

                      <div className="mb-5">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">{editingConfigLabel}</label>
                        {editingConfigKey === "rangoAutorizado" ? (
                          <div className="space-y-4">
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Ingresa los últimos <strong>8 dígitos</strong> de cada parte autorizada por el SAR (el prefijo fiscal se asigna automáticamente):
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  DEL (8 dígitos iniciales)
                                </label>
                                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-300 focus-within:border-[#1b426e] focus-within:ring-1 focus-within:ring-[#1b426e] overflow-hidden">
                                  <span className="px-2.5 py-2 font-mono text-[11px] text-slate-500 bg-slate-100 border-r border-slate-200 select-none font-semibold">
                                    {rangoPrefijo}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    value={rangoDesde}
                                    onChange={(e) => setRangoDesde(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                    placeholder="00000661"
                                    className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none bg-transparent"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {rangoDesde.length}/8 dígitos
                                </span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  AL (8 dígitos finales)
                                </label>
                                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-300 focus-within:border-[#1b426e] focus-within:ring-1 focus-within:ring-[#1b426e] overflow-hidden">
                                  <span className="px-2.5 py-2 font-mono text-[11px] text-slate-500 bg-slate-100 border-r border-slate-200 select-none font-semibold">
                                    {rangoPrefijo}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    value={rangoHasta}
                                    onChange={(e) => setRangoHasta(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                    placeholder="00000760"
                                    className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none bg-transparent"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {rangoHasta.length}/8 dígitos
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                                Vista Previa Oficial del Rango:
                              </span>
                              <span className="font-mono text-xs font-bold text-amber-950 break-all select-all">
                                DEL {rangoPrefijo}{rangoDesde ? rangoDesde.padStart(8, "0") : "00000661"} AL {rangoPrefijo}{rangoHasta ? rangoHasta.padStart(8, "0") : "00000760"}
                              </span>
                            </div>
                          </div>
                        ) : editingConfigKey === "fechaLimiteEmision" ? (
                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-500">
                              Selecciona la fecha límite de emisión autorizada por el SAR:
                            </p>
                            <div className="relative flex items-center w-full rounded-xl bg-slate-50 border border-slate-300 focus-within:border-[#1b426e] focus-within:ring-1 focus-within:ring-[#1b426e] focus-within:bg-white transition shadow-2xs">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="dd / mm / yyyy"
                                value={editingConfigValue === "Ninguno indicado" ? "" : editingConfigValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const clean = val.replace(/[^\d\s\/\-]/g, "");
                                  const digits = clean.replace(/\D/g, "");
                                  if (digits.length === 8 && !clean.includes("/")) {
                                    setEditingConfigValue(`${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4, 8)}`);
                                  } else {
                                    setEditingConfigValue(clean);
                                  }
                                }}
                                onBlur={() => {
                                  const digits = editingConfigValue.replace(/\D/g, "");
                                  if (digits.length === 8) {
                                    setEditingConfigValue(`${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4, 8)}`);
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 text-xs rounded-xl text-slate-900 bg-transparent focus:outline-none font-medium font-mono tracking-wider"
                              />
                              {/* Calendar Picker Icon & Overlay Trigger */}
                              <div className="relative pr-3.5 flex items-center justify-center shrink-0 cursor-pointer">
                                <svg
                                  className="w-4 h-4 text-slate-500 pointer-events-none"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.8"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <input
                                  type="date"
                                  value={(() => {
                                    const digits = editingConfigValue.replace(/\D/g, "");
                                    if (digits.length === 8) {
                                      return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
                                    }
                                    const parts = editingConfigValue.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
                                    if (parts) {
                                      return `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
                                    }
                                    return "";
                                  })()}
                                  onChange={(e) => {
                                    const ymd = e.target.value;
                                    if (ymd) {
                                      const [y, m, d] = ymd.split("-");
                                      setEditingConfigValue(`${d} / ${m} / ${y}`);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  tabIndex={-1}
                                  title="Seleccionar fecha"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                              <span>Formato: <strong className="text-slate-600 font-mono">dd / mm / yyyy</strong></span>
                              {(() => {
                                const digits = editingConfigValue.replace(/\D/g, "");
                                return digits.length === 8 ? (
                                  <span className="text-emerald-600 font-medium">✓ Fecha válida</span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        ) : editingConfigKey === "direccion" || editingConfigKey === "domicilioLegal" ? (
                          <textarea
                            rows={3}
                            autoComplete="off"
                            value={editingConfigValue}
                            onChange={(e) => setEditingConfigValue(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                          />
                        ) : (
                          <input
                            type="text"
                            autoComplete="off"
                            value={editingConfigValue}
                            onChange={(e) => setEditingConfigValue(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                          />
                        )}
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingConfigKey(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={saveConfigField}
                          className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW: COTIZACIONES ================= */}
          {currentView === "cotizaciones" && (
            <div className="animate-in fade-in duration-150 p-6">
              <QuotesModule
                companySettings={companySettings}
                customers={customers}
                inventory={inventory}
                salesReps={salesReps}
                autoOpenCreate={quotesAutoOpenCreate}
                onAutoOpenCreateConsumed={() => setQuotesAutoOpenCreate(false)}
                onBack={() => setCurrentView("dashboard")}
                onOpenInvoiceEditor={(prefilled) => {
                  openInvoiceEditor(prefilled);
                }}
                onNavigateToInvoices={() => setCurrentView("lista-facturas")}
                onNavigateToSalesOrders={() => setCurrentView("pedidos-venta")}
                onNavigateToAccounting={() => {
                  fetch("/api/accounts")
                    .then((r) => r.json())
                    .then((accRes) => {
                      if (accRes.success) setAccounts(accRes.data || []);
                    });
                  setCurrentView("plan-cuentas");
                }}
              />
            </div>
          )}

          {/* ================= VIEW: PEDIDOS DE VENTA (SALES ORDERS) ================= */}
          {currentView === "pedidos-venta" && (
            <div className="animate-in fade-in duration-150 p-6">
              <SalesOrdersModule
                customers={customers}
                inventory={inventory}
                salesReps={salesReps}
                companySettings={companySettings}
                onBack={() => setCurrentView("dashboard")}
                onOpenInvoiceEditor={(prefilled) => openInvoiceEditor(prefilled)}
                onNavigateToInvoices={() => setCurrentView("lista-facturas")}
                onNavigateToQuotes={() => setCurrentView("cotizaciones")}
              />
            </div>
          )}

          {/* ================= VIEW: LISTA DE FACTURAS ================= */}
          {/* ================= VIEW: FACTURAS (LISTA Y EDITOR MODULARIZADO) ================= */}
          {(currentView === "lista-facturas" || currentView === "factura-editor") && (
            <InvoicesModule
              currentView={currentView}
              editingInvoice={editingInvoice}
              invoicesList={invoicesList}
              setInvoicesList={setInvoicesList}
              customers={customers}
              inventory={inventory}
              connectedBanks={connectedBanks}
              companySettings={companySettings}
              salesSettings={salesSettings}
              companyLogo={companyLogo}
              defaultCurrencySymbol={defaultCurrencySymbol}
              loading={loading}
              onNavigateToDashboard={() => setCurrentView("dashboard")}
              onNavigateToSettings={() => setCurrentView("configuracion")}
              onOpenInvoiceEditor={(inv) => openInvoiceEditor(inv)}
              onCloseInvoiceEditor={closeInvoiceEditor}
              onRefreshAccounts={() => {
                fetch("/api/accounts")
                  .then((r) => r.json())
                  .then((accRes) => {
                    if (accRes.success) setAccounts(accRes.data || []);
                  });
              }}
            />
          )}

          {/* ================= VIEW: LISTA DE ÓRDENES DE COMPRA ================= */}
          {/* PURCHASING & PROCUREMENT MODULE (Views: lista-ordenes-compra, factura-compra-lista, devoluciones-proveedor, factura-compra-editor, orden-compra-editor) */}
          {(currentView === "lista-ordenes-compra" ||
            currentView === "factura-compra-lista" ||
            currentView === "devoluciones-proveedor" ||
            currentView === "factura-compra-editor" ||
            currentView === "orden-compra-editor") && (
              <PurchasesModule
                currentView={currentView}
                editingPurchaseOrder={editingPurchaseOrder}
                purchaseOrders={purchaseOrders}
                setPurchaseOrders={setPurchaseOrders}
                purchaseInvoices={purchaseInvoices}
                setPurchaseInvoices={setPurchaseInvoices}
                vendorReturns={vendorReturns}
                setVendorReturns={setVendorReturns}
                vendors={vendors}
                inventory={inventory}
                setInventory={setInventory}
                companySettings={companySettings}
                companyLogo={companyLogo}
                defaultCurrencySymbol="$"
                loading={loading}
                onNavigateToDashboard={() => setCurrentView("dashboard")}
                onNavigateToView={(view) => setCurrentView(view)}
                onPayVendor={(vName) => {
                  setSelectedPaymentVendor(vName);
                  setCurrentView("pagos-proveedores");
                }}
                onRefreshAccounts={loadDashboardData}
              />
            )}


          {/* ================= VIEW: EDITAR ORDEN DE COMPRA (PÁGINA COMPLETA COMO CREAR FACTURA) ================= */}
          {/* ================= VIEW: DEPÓSITO BANCARIO ================= */}
          {/* CASH MOVEMENTS & BANKING WORKSPACES (Views: deposito-bancario, agregar-gasto, pagar-proveedor, recibir-pago) */}
          {(currentView === "deposito-bancario" ||
            currentView === "agregar-gasto" ||
            currentView === "pagar-proveedor" ||
            currentView === "recibir-pago") && (
              <CashMovementsModule
                currentView={currentView}
                initialRecibirPagoCustomerId={recibirPagoCustomerId}
                initialPagarProveedorVendor={pagarProveedorVendorFilter}
                connectedBanks={connectedBanks}
                customers={customers}
                vendors={vendors}
                invoicesList={invoicesList}
                companySettings={companySettings}
                loading={loading}
                onNavigateToDashboard={() => setCurrentView("dashboard")}
                onNavigateToView={(view) => setCurrentView(view)}
                onRefreshAccounts={loadDashboardData}
                onUpdatePOStatus={handleUpdatePOStatus}
              />
            )}

        </main>
      </div>

      {/* ================= MODAL OVERLAY ================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal: AGREGAR CLIENTE */}
            {activeModal === "agregar-cliente" && (
              <div>
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-[#1b426e] uppercase tracking-wider">Acción Rápida</span>
                  <h3 className="text-lg font-bold text-slate-900">Agregar Nuevo Cliente</h3>
                  <p className="text-xs text-slate-500">Registrar cliente con código Macola opcional en la base de datos.</p>
                </div>

                {modalError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {modalError}
                  </div>
                )}
                {modalSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {modalSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre de la Empresa / Cliente *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Distribuidora Textil S.A."
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Código Macola</label>
                      <input
                        type="text"
                        placeholder="Ej. CUS-009"
                        value={customerForm.macolaCode}
                        onChange={(e) => setCustomerForm({ ...customerForm, macolaCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Moneda</label>
                      <select
                        value={customerForm.currency}
                        onChange={(e) => setCustomerForm({ ...customerForm, currency: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="HNL">HNL (L)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="contacto@cliente.com"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="+504 2550-0000"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dirección Física</label>
                    <input
                      type="text"
                      placeholder="San Pedro Sula, Honduras"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20 disabled:opacity-50"
                    >
                      {modalLoading ? "Guardando..." : "Guardar Cliente"}
                    </button>
                  </div>
                </form>
              </div>
            )}



            {/* Modal: CREAR / EDITAR ORDEN DE COMPRA */}
            {activeModal === "crear-orden-compra" && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                  {selectedPurchaseOrder ? `Editar Orden de Compra ${selectedPurchaseOrder.num}` : "Crear Nueva Orden de Compra"}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {selectedPurchaseOrder
                    ? `Modifica los términos, materiales o importes de la orden emitida a ${selectedPurchaseOrder.vendor}.`
                    : "Ingresa los datos para solicitar insumos o materia prima a un proveedor."}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setModalLoading(true);
                    setTimeout(() => {
                      setModalLoading(false);
                      setModalSuccess(`¡Orden de compra ${selectedPurchaseOrder ? selectedPurchaseOrder.num : "OC-2026-085"} guardada con éxito!`);
                      setTimeout(() => {
                        setActiveModal(null);
                        setModalSuccess("");
                      }, 1000);
                    }, 600);
                  }}
                  className="space-y-3.5 text-xs"
                >
                  {modalSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      {modalSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Proveedor *</label>
                    <select
                      defaultValue={selectedPurchaseOrder?.vendor || ""}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-medium"
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Categoría de Insumos</label>
                      <input
                        type="text"
                        required
                        defaultValue={selectedPurchaseOrder?.category || "Tintas Flexo"}
                        placeholder="Ej. Cartón, Tintas, Solventes"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Monto Total (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        defaultValue={selectedPurchaseOrder?.total || 6450}
                        placeholder="0.00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Almacén Destino</label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900">
                        <option value="Almacén Central #1">Almacén Central #1</option>
                        <option value="Almacén Materia Prima #2">Almacén Materia Prima #2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Condición de Pago</label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900">
                        <option value="Crédito 30 días">Crédito 30 días</option>
                        <option value="Contado / Inmediato">Contado / Inmediato</option>
                        <option value="Crédito 60 días">Crédito 60 días</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha de Emisión</label>
                      <input
                        type="date"
                        defaultValue={selectedPurchaseOrder?.date || new Date().toISOString().split("T")[0]}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha Entrega Estimada</label>
                      <input
                        type="date"
                        defaultValue="2026-09-15"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20 disabled:opacity-50"
                    >
                      {modalLoading ? "Guardando..." : selectedPurchaseOrder ? "Guardar cambios" : "Emitir orden"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal: OTRAS ACCIONES */}
            {activeModal !== "agregar-cliente" &&
              activeModal !== "agregar-proveedor" &&
              activeModal !== "editar-cliente" &&
              activeModal !== "editar-proveedor" &&
              activeModal !== "crear-orden-compra" &&
              activeModal !== "editar-producto" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] text-[#1b426e] border border-[#fed7aa] flex items-center justify-center mx-auto shadow-xs">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 capitalize">
                      {quickActions.find((a) => a.id === activeModal)?.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Acción configurada para la empresa. Este módulo se integrará con las cuentas contables y facturas del sistema.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-6 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold cursor-pointer transition shadow-md shadow-[#1b426e]/20"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}


      {/* ================= RIGHT SIDEBAR DRAWER: NUEVA CUENTA (Matching screenshot) ================= */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setShowNewAccountModal(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
          />

          {/* Drawer panel */}
          <aside className="relative w-full max-w-md sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="w-5" />
              <div className="text-center">
                <h2 className="text-base font-semibold text-slate-800">
                  {editingAccountId ? "Editar cuenta contable" : "Nueva cuenta"}
                </h2>
                {editingAccountId && newAccountForm.code && (
                  <span className="text-[11px] font-mono text-[#1b426e] font-semibold">
                    Cuenta N.º {newAccountForm.code}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewAccountModal(false);
                  setEditingAccountId(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAccount} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {accountModalError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                    {accountModalError}
                  </div>
                )}
                {accountModalSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                    {accountModalSuccess}
                  </div>
                )}

                {/* Row 1: Nombre de la cuenta* & Número de cuenta */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5">
                      Nombre de la cuenta<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountForm.name}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5">
                      Número de cuenta
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 1105 (opcional)"
                      value={newAccountForm.code}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                    />
                  </div>
                </div>

                {/* Row 2: Tipo de cuenta* & Tipo de detalles* */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 relative">
                      <label className="text-slate-600 font-medium">
                        Tipo de cuenta<span className="text-red-500">*</span>
                      </label>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setShowAccountTypeTooltip(true)}
                          onMouseLeave={() => setShowAccountTypeTooltip(false)}
                          onClick={() => setShowAccountTypeTooltip(!showAccountTypeTooltip)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center p-0.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                          </svg>
                        </button>

                        {showAccountTypeTooltip && (
                          <div className="absolute bottom-full right-0 mb-2.5 z-40 w-72 sm:w-80 p-3 bg-slate-900 text-white rounded-lg shadow-2xl text-[11px] leading-relaxed animate-in fade-in zoom-in-95 duration-150">
                            <p>
                              Estas son las categorías principales en las que se incluyen las cuentas. Puedes verlos en Informes como parte del balance general o de la cuenta de pérdidas y ganancias.{" "}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert("Informes: Balance general y Estado de pérdidas y ganancias disponibles en el módulo Reportes.");
                                }}
                                className="text-[#4589ff] hover:underline cursor-pointer font-medium"
                              >
                                Obtener más información
                              </span>
                            </p>
                            {/* Downward triangle arrow pointing directly to the info icon */}
                            <div className="absolute top-full right-1.5 -mt-0.5 border-4 border-transparent border-t-slate-900" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={newAccountForm.type}
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          const defaultDetail = DETAIL_TYPES_MAP[selectedType]?.[0] || "";
                          setNewAccountForm({
                            ...newAccountForm,
                            type: selectedType,
                            detailType: defaultDetail,
                          });
                        }}
                        className="w-full pl-3 pr-8 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs appearance-none focus:outline-none focus:border-[#1b426e] cursor-pointer"
                      >
                        {Object.entries(ACCOUNT_CATEGORIES).map(([cat, types]) => (
                          <optgroup key={cat} label={cat} className="font-bold text-slate-900 bg-slate-50">
                            {types.map((t) => (
                              <option key={t} value={t} className="font-normal text-slate-800 bg-white">
                                {t}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5">
                      Tipo de detalles<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={newAccountForm.detailType}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, detailType: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs appearance-none focus:outline-none focus:border-[#1b426e] cursor-pointer"
                      >
                        {(DETAIL_TYPES_MAP[newAccountForm.type] || [newAccountForm.type]).map((dt) => (
                          <option key={dt} value={dt}>
                            {dt}
                          </option>
                        ))}
                      </select>
                      <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Row 3: Convertir en una cuenta secundaria */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={newAccountForm.isSubAccount}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, isSubAccount: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                    />
                    <span className="font-medium text-xs">Convertir en una cuenta secundaria</span>
                  </label>

                  {newAccountForm.isSubAccount && (
                    <div className="pl-6 space-y-1">
                      <label className="text-slate-600 block text-xs">Cuenta principal</label>
                      <select
                        value={newAccountForm.parentAccountId}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, parentAccountId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#1b426e]"
                      >
                        <option value="">Seleccionar cuenta principal...</option>
                        {accounts
                          .filter(
                            (a) =>
                              getAccountClassification(a.type, a.name).category ===
                              getAccountClassification(newAccountForm.type, newAccountForm.name).category
                          )
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Row 4: Descripción */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1.5">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newAccountForm.description}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                  />
                </div>

                {/* Estado de la cuenta (Activa / Inactiva) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">Estado de la cuenta</span>
                    <span className="text-[11px] text-slate-500">
                      {newAccountForm.isActive ? "Cuenta activa disponible para transacciones y reportes" : "Cuenta inactiva (deshabilitada)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewAccountForm({ ...newAccountForm, isActive: !newAccountForm.isActive })}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${newAccountForm.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                      }`}
                  >
                    <span>{newAccountForm.isActive ? "✓ Activa" : "✕ Inactiva"}</span>
                  </button>
                </div>

                {/* Divider & Bloquear cuenta */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="relative inline-block">
                      <span
                        onMouseEnter={() => setShowBlockTooltip(true)}
                        onMouseLeave={() => setShowBlockTooltip(false)}
                        className="text-slate-700 font-medium border-b border-dotted border-slate-400 cursor-help select-none"
                      >
                        Bloquear cuenta
                      </span>

                      {showBlockTooltip && (
                        <div className="absolute bottom-full left-0 mb-2.5 z-30 w-72 sm:w-80 p-3 bg-slate-900 text-white rounded-lg shadow-2xl text-[11px] leading-relaxed animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                          <p>
                            Al bloquear cuentas, los usuarios no podrán seleccionarlas en los menús desplegables de formularios y transacciones. Esto evita la contabilización incorrecta. Las funciones y las aplicaciones externas que registran transacciones automáticamente en esta cuenta seguirán haciéndolo.
                          </p>
                          <div className="absolute top-full left-4 -mt-0.5 border-4 border-transparent border-t-slate-900" />
                        </div>
                      )}
                    </div>

                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/70">
                      <button
                        type="button"
                        onClick={() => setNewAccountForm({ ...newAccountForm, isLocked: false })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${!newAccountForm.isLocked
                            ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                            : "text-slate-400 hover:text-slate-700"
                          }`}
                        title="Desbloqueada"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAccountForm({ ...newAccountForm, isLocked: true })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${newAccountForm.isLocked
                            ? "bg-white text-[#1b426e] shadow-xs border border-slate-200"
                            : "text-slate-400 hover:text-slate-700"
                          }`}
                        title="Bloqueada"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAccountModal(false);
                    setEditingAccountId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                {editingAccountId ? (
                  <button
                    type="submit"
                    disabled={accountModalLoading}
                    className="px-5 py-2 rounded-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {accountModalLoading ? "Guardando cambios..." : "Guardar cambios"}
                  </button>
                ) : (
                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="submit"
                      disabled={accountModalLoading}
                      className="px-4 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {accountModalLoading ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                      className="px-2 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showSaveDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown: Guardar y crear nueva */}
                    {showSaveDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            handleSaveAccount(undefined, true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-[#1b426e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Guardar y crear nueva</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* ================= SIDEBAR: PERSONALIZAR (Matching screenshot) ================= */}
      {showConfigSidebar && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setShowConfigSidebar(false)}
          />
          <aside className="fixed inset-y-0 right-0 w-80 sm:w-88 bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="w-5"></div>
              <h3 className="text-sm font-bold text-slate-800 text-center">Personalizar</h3>
              <button
                onClick={() => setShowConfigSidebar(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Section: Rows */}
              <div className="p-5 space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection("rows")}
                  className="w-full flex items-center justify-between font-bold text-slate-800 hover:text-slate-900 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <svg
                      className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${collapsedSections.rows ? "-rotate-90" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>Rows</span>
                  </div>
                </button>

                {!collapsedSections.rows && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5 pl-5">
                      <label className="text-slate-600 block text-xs">Tamaño de página</label>
                      <div className="relative">
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium appearance-none focus:outline-none focus:border-[#1b426e] cursor-pointer"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={75}>75</option>
                          <option value={100}>100</option>
                          <option value={300}>300</option>
                        </select>
                        <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-5">
                      <label className="text-slate-600 block text-xs">Densidad de filas</label>
                      <div className="relative">
                        <select
                          value={rowDensity}
                          onChange={(e) => setRowDensity(e.target.value as "espacioso" | "acogedor" | "compacto")}
                          className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium appearance-none focus:outline-none focus:border-[#1b426e] cursor-pointer"
                        >
                          <option value="espacioso">Espacioso</option>
                          <option value="acogedor">Acogedor</option>
                          <option value="compacto">Compacto</option>
                        </select>
                        <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Columnas */}
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => toggleSection("columns")}
                  className="w-full flex items-center justify-between font-bold text-slate-800 hover:text-slate-900 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <svg
                      className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${collapsedSections.columns ? "-rotate-90" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>Columnas</span>
                  </div>
                </button>

                {!collapsedSections.columns && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-slate-500 pl-5">Drag to change the order of columns</p>

                    <div className="space-y-2 pl-5">
                      {(currentView === "clientes"
                        ? [
                          { id: "macolaCode", label: "Código Macola" },
                          { id: "name", label: "Nombre de Empresa / Cliente" },
                          { id: "email", label: "Correo Electrónico" },
                          { id: "phone", label: "Teléfono" },
                          { id: "address", label: "Dirección" },
                          { id: "currency", label: "Moneda" },
                          { id: "actions", label: "Acciones" },
                        ]
                        : currentView === "proveedores"
                          ? [
                            { id: "macolaCode", label: "Código Macola" },
                            { id: "name", label: "Proveedor" },
                            { id: "email", label: "Correo" },
                            { id: "phone", label: "Teléfono" },
                            { id: "address", label: "Dirección" },
                            { id: "currency", label: "Moneda" },
                            { id: "actions", label: "Acciones" },
                          ]
                          : currentView === "inventario"
                            ? [
                              { id: "sku", label: "SKU" },
                              { id: "description", label: "Descripción del Artículo" },
                              { id: "quantity", label: "Existencias" },
                              { id: "cost", label: "Costo Unitario" },
                              { id: "price", label: "Precio de Venta" },
                              { id: "total", label: "Valoración Total" },
                            ]
                            : [
                              { id: "code", label: "N.º" },
                              { id: "type", label: "Tipo de cuenta" },
                              { id: "detailType", label: "Tipo de detalles" },
                              { id: "description", label: "Descripción" },
                              { id: "currency", label: "Moneda" },
                              { id: "bookBalance", label: "Saldo contable" },
                              { id: "bankBalance", label: "Saldo bancario" },
                            ]
                      ).map((col, index) => (
                        <div key={col.id} className="flex items-center justify-between group py-0.5">
                          <div className="flex items-center gap-2.5">
                            {/* Drag grip icon */}
                            <div className="flex items-center text-slate-400">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="8.5" cy="6.5" r="1.5" />
                                <circle cx="15.5" cy="6.5" r="1.5" />
                                <circle cx="8.5" cy="12" r="1.5" />
                                <circle cx="15.5" cy="12" r="1.5" />
                                <circle cx="8.5" cy="17.5" r="1.5" />
                                <circle cx="15.5" cy="17.5" r="1.5" />
                              </svg>
                            </div>
                            <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(visibleColumns[col.id])}
                                onChange={() =>
                                  setVisibleColumns((prev) => ({
                                    ...prev,
                                    [col.id]: !prev[col.id],
                                  }))
                                }
                                className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                              />
                              <span className="font-medium text-xs text-slate-800">{col.label}</span>
                            </label>
                          </div>

                          {/* Quick re-order arrows */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                            {index > 0 && (
                              <button
                                type="button"
                                title="Mover arriba"
                                onClick={() => {
                                  const nextOrder = [...columnOrder];
                                  const temp = nextOrder[index - 1];
                                  nextOrder[index - 1] = nextOrder[index];
                                  nextOrder[index] = temp;
                                  setColumnOrder(nextOrder);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                ▲
                              </button>
                            )}
                            {index < columnOrder.length - 1 && (
                              <button
                                type="button"
                                title="Mover abajo"
                                onClick={() => {
                                  const nextOrder = [...columnOrder];
                                  const temp = nextOrder[index + 1];
                                  nextOrder[index + 1] = nextOrder[index];
                                  nextOrder[index] = temp;
                                  setColumnOrder(nextOrder);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                ▼
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Preferencias */}
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => toggleSection("preferences")}
                  className="w-full flex items-center justify-between font-bold text-slate-800 hover:text-slate-900 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <svg
                      className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${collapsedSections.preferences ? "-rotate-90" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>Preferencias</span>
                  </div>
                </button>

                {!collapsedSections.preferences && (
                  <div className="space-y-3 pl-5 pt-1 text-slate-700">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={alternateRowColor}
                        onChange={(e) => setAlternateRowColor(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                      />
                      <span className="font-medium text-xs">Alternar color de fila</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showInactiveAccounts}
                        onChange={(e) => setShowInactiveAccounts(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                      />
                      <span className="font-medium text-xs">Mostrar cuentas inactivas</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showReportBadges}
                        onChange={(e) => setShowReportBadges(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                      />
                      <span className="font-medium text-xs">Mostrar distintivos de tipo de informe</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
      {/* ================= MODAL: CONECTAR CUENTA BANCARIA ================= */}
      {showConnectBankModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Cuenta Bancaria Institucional</h3>
                <p className="text-xs text-slate-500">Crea la cuenta operativa para registro y conciliación de extractos</p>
              </div>
              <button
                onClick={() => setShowConnectBankModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setConnectBankLoading(true);
                try {
                  const res = await fetch("/api/bank-accounts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: connectBankForm.institution,
                      accountNumber: connectBankForm.accountNumber,
                      type: `${connectBankForm.accountType} ${connectBankForm.currency}`,
                      currency: connectBankForm.currency,
                      bankBalance: 0,
                      bookBalance: 0,
                    }),
                  });
                  const json = await res.json();
                  if (json.success && json.data) {
                    setConnectedBanks((prev) => [...prev, json.data]);
                    setBankToastNotification(`Cuenta de ${connectBankForm.institution} registrada en la base de datos.`);
                    setTimeout(() => setBankToastNotification(""), 4000);
                  }
                  setShowConnectBankModal(false);
                  loadBankingData();
                } catch (err) {
                  console.error("Error registering bank:", err);
                } finally {
                  setConnectBankLoading(false);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institución Financiera</label>
                <select
                  value={connectBankForm.institution}
                  onChange={(e) => setConnectBankForm({ ...connectBankForm, institution: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-medium cursor-pointer"
                >
                  <option value="Banco Ficohsa">Banco Ficohsa (Honduras / Regional)</option>
                  <option value="BAC Credomatic">BAC Credomatic Honduras</option>
                  <option value="Banco Atlántida">Banco Atlántida S.A.</option>
                  <option value="Banpaís">Banpaís (Banco del País)</option>
                  <option value="Banco de Occidente">Banco de Occidente</option>
                  <option value="Banco Promerica">Banco Promerica</option>
                  <option value="Chase Bank USA">Chase Bank (USD)</option>
                  <option value="Wells Fargo USA">Wells Fargo (USD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={connectBankForm.accountType}
                    onChange={(e) => setConnectBankForm({ ...connectBankForm, accountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 cursor-pointer"
                  >
                    <option value="Cuenta de cheques empresarial">Cuenta de Cheques</option>
                    <option value="Cuenta de ahorros comercial">Cuenta de Ahorros</option>
                    <option value="Cuenta recaudadora">Cuenta Recaudadora</option>
                    <option value="Tarjeta de crédito corporativa">Tarjeta Corporativa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Moneda</label>
                  <select
                    value={connectBankForm.currency}
                    onChange={(e) => setConnectBankForm({ ...connectBankForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 cursor-pointer"
                  >
                    <option value="USD">USD ($ - Dólares)</option>
                    <option value="HNL">HNL (L - Lempiras)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de Cuenta (o últimos 4 dígitos)</label>
                <input
                  type="text"
                  placeholder="ej. 2108849201"
                  required
                  value={connectBankForm.accountNumber}
                  onChange={(e) => setConnectBankForm({ ...connectBankForm, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConnectBankModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={connectBankLoading}
                  className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {connectBankLoading && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>{connectBankLoading ? "Guardando cuenta..." : "Registrar cuenta"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVA REGLA DE AUTOMATIZACIÓN ================= */}
      {showNewRuleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Crear Regla de Automatización</h3>
                <p className="text-xs text-slate-500">Concilia automáticamente movimientos según su descripción</p>
              </div>
              <button
                onClick={() => setShowNewRuleModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newRuleForm.name || !newRuleForm.condition) return;
                try {
                  const res = await fetch("/api/bank-rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: newRuleForm.name,
                      condition: `Descripción contiene '${newRuleForm.condition.toUpperCase()}'`,
                      targetAccount: newRuleForm.targetAccount,
                      autoConfirm: newRuleForm.autoConfirm,
                      active: true,
                    }),
                  });
                  const json = await res.json();
                  if (json.success && json.data) {
                    setAutomationRules((prev) => [...prev, json.data]);
                    setBankToastNotification(`Regla "${newRuleForm.name}" creada y guardada en la base de datos.`);
                    setTimeout(() => setBankToastNotification(""), 4000);
                  }
                  setShowNewRuleModal(false);
                  setNewRuleForm({
                    name: "",
                    condition: "",
                    targetAccount: "5000 - Cost of Goods Sold (Costo de Ventas)",
                    autoConfirm: false,
                  });
                } catch (err) {
                  console.error("Error creating rule in DB:", err);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Regla</label>
                <input
                  type="text"
                  placeholder="ej. Depósitos Clientes Búfalo"
                  required
                  value={newRuleForm.name}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Si la descripción bancaria contiene:</label>
                <input
                  type="text"
                  placeholder="ej. MANUFACTURAS BUFALO o TEXACO"
                  required
                  value={newRuleForm.condition}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, condition: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Cualquier movimiento bancario con este texto aplicará la regla.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asignar automáticamente a la cuenta contable:</label>
                <select
                  value={newRuleForm.targetAccount}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, targetAccount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-medium cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={`${acc.code} - ${acc.name}`}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newRuleForm.autoConfirm}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, autoConfirm: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e] cursor-pointer accent-[#1b426e]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">Auto-confirmar transacciones</span>
                    <span className="text-[11px] text-slate-500">Conciliar y agregar al libro contable sin esperar revisión manual.</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold transition cursor-pointer shadow-xs"
                >
                  Guardar regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL / DRAWER: NUEVA NOTA DE CRÉDITO / DÉBITO ================= */}




    </div>
  );
}
