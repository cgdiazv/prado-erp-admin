"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { CardSkeleton, TableRowsSkeleton } from "@/components/Skeleton";
import {
  PackageCheck,
  Plus,
  Search,
  RefreshCw,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Building2,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Edit3,
  BookOpen,
  ArrowUpRight,
  Send,
  Check,
  Truck,
  Layers,
  ShoppingBag,
  Boxes,
  FileCheck,
  ArrowRight,
  Info,
  X,
  Eye,
  Download,
  Factory,
} from "lucide-react";

export interface SalesOrderItem {
  id?: string;
  productName: string;
  sku?: string | null;
  description?: string | null;
  quantityOrdered: number;
  quantityCommitted: number;
  quantityShipped: number;
  quantityInvoiced: number;
  rate: number;
  amount: number;
  notes?: string | null;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quoteId?: string | null;
  quoteNumber?: string | null;
  customerPoNumber?: string | null;
  customerId?: string | null;
  customerName: string;
  customerRtn?: string | null;
  customerAddress?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  paymentTerms: string;
  currency: string;
  salesRepId?: string | null;
  salesRepName?: string | null;
  warehouse: string;
  notes?: string | null;
  shippingNotes?: string | null;
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  status: "BORRADOR" | "CONFIRMADO" | "EN_PREPARACION" | "DESPACHADO_PARCIAL" | "DESPACHADO" | "FACTURADO" | "CANCELADO" | string;
  salesInvoiceId?: string | null;
  invoiceNumber?: string | null;
  salesInvoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    total: number;
    status: string;
  } | null;
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
  } | null;
  items: SalesOrderItem[];
  createdAt: string;
}

interface SalesOrdersModuleProps {
  onBack?: () => void;
  onOpenInvoiceEditor?: (prefilledData: any) => void;
  onNavigateToInvoices?: () => void;
  onNavigateToQuotes?: () => void;
  onNavigateToProduction?: (salesOrder: any) => void;
  customers?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
  }>;
  inventory?: Array<{
    id: string;
    sku: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  salesReps?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  defaultCurrencySymbol?: string;
  defaultCurrencyCode?: string;
  warehouses?: Array<{
    id: string;
    code: string;
    name: string;
    address?: string;
    manager?: string;
    isDefault?: boolean;
  }>;
  onOpenWarehousesConfig?: () => void;
  companySettings?: any;
}

export default function SalesOrdersModule({
  onBack,
  onOpenInvoiceEditor,
  onNavigateToInvoices,
  onNavigateToQuotes,
  onNavigateToProduction,
  customers = [],
  inventory = [],
  salesReps = [],
  warehouses,
  onOpenWarehousesConfig,
  defaultCurrencySymbol = "$",
  defaultCurrencyCode = "USD",
  companySettings,
}: SalesOrdersModuleProps) {
  // Lista dinámica de almacenes (prop o sincronizada de localStorage)
  const [internalWarehouses, setInternalWarehouses] = useState<
    Array<{ id: string; code: string; name: string; address?: string; manager?: string; isDefault?: boolean }>
  >(warehouses && warehouses.length > 0 ? warehouses : []);

  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      setInternalWarehouses(warehouses);
      return;
    }
    const loadWarehouses = () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("prado_warehouses_settings") : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInternalWarehouses(parsed);
            return;
          }
        }
      } catch {}
      setInternalWarehouses([
        { id: "wh-1", code: "BOD-01", name: "Bodega Principal Zip Búfalo", isDefault: true },
        { id: "wh-2", code: "BOD-02", name: "Bodega de Producto Terminado Planta 1", isDefault: false },
        { id: "wh-3", code: "BOD-03", name: "Bodega Flexografía Villanueva", isDefault: false },
      ]);
    };
    loadWarehouses();

    const handleUpdate = () => loadWarehouses();
    window.addEventListener("warehouses-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("warehouses-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [warehouses]);

  // Resolver la moneda seleccionada en configuración (con fallback a localStorage y USD)
  const { effectiveCurrencySymbol, effectiveCurrencyCode } = useMemo(() => {
    if (defaultCurrencySymbol && defaultCurrencyCode && (defaultCurrencySymbol !== "$" || defaultCurrencyCode !== "USD")) {
      return { effectiveCurrencySymbol: defaultCurrencySymbol, effectiveCurrencyCode: defaultCurrencyCode };
    }
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("wayne_monedas_settings") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        const main = parsed?.monedaPrincipal || "";
        if (main.includes("HNL") || main.includes("(L)") || main.includes("Lempira")) {
          return { effectiveCurrencySymbol: "L", effectiveCurrencyCode: "HNL" };
        }
        if (main.includes("EUR") || main.includes("(€)") || main.includes("Euro")) {
          return { effectiveCurrencySymbol: "€", effectiveCurrencyCode: "EUR" };
        }
        if (main.includes("USD") || main.includes("($)") || main.includes("Dólar")) {
          return { effectiveCurrencySymbol: "$", effectiveCurrencyCode: "USD" };
        }
      }
    } catch { }
    return {
      effectiveCurrencySymbol: defaultCurrencySymbol || "$",
      effectiveCurrencyCode: defaultCurrencyCode || (defaultCurrencySymbol === "L" ? "HNL" : defaultCurrencySymbol === "€" ? "EUR" : "USD"),
    };
  }, [defaultCurrencySymbol, defaultCurrencyCode]);

  const getCurrencySymbol = (currencyCode?: string | null) => {
    if (!currencyCode) return effectiveCurrencySymbol;
    if (currencyCode === "HNL" || currencyCode.includes("Lempira")) return "L";
    if (currencyCode === "EUR" || currencyCode.includes("Euro")) return "€";
    if (currencyCode === "USD" || currencyCode.includes("Dólar")) return "$";
    return effectiveCurrencySymbol;
  };

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [nextOrderNumber, setNextOrderNumber] = useState("PV-2026-0001");

  // Alertas
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Modales
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [converting, setConverting] = useState(false);

  // Estados de página de editor completo (idéntico a Cotizaciones y Facturas)
  const [activeEditorTab, setActiveEditorTab] = useState<"Editar" | "Hoja de Despacho" | "Vista Previa PDF">("Editar");
  const [showPrintDownloadDropdown, setShowPrintDownloadDropdown] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const printDownloadDropdownRef = useRef<HTMLDivElement>(null);

  // Datos corporativos
  const compName = companySettings?.nombreLegal || companySettings?.nombre || "PRADO DISTRIBUIDORA";
  const compRtn = companySettings?.rtn || "";
  const compAddress = companySettings?.direccion || "";
  const compContact = [companySettings?.telefono ? `Tel: ${companySettings.telefono}` : "", companySettings?.email].filter(Boolean).join(" • ");

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        printDownloadDropdownRef.current &&
        !printDownloadDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPrintDownloadDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formulario
  const initialFormState = {
    id: "",
    orderNumber: "",
    customerPoNumber: "",
    quoteId: "",
    quoteNumber: "",
    customerId: "",
    customerName: "",
    customerRtn: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
    paymentTerms: "Neto 30 días",
    currency: effectiveCurrencyCode || "USD",
    salesRepId: "",
    salesRepName: "",
    warehouse: "Bodega Principal Zip Búfalo",
    notes: "Pedido para producción y empaque flexográfico.",
    shippingNotes: "Entregar en muelle de recepción con remisión formal.",
    discount: 0,
    taxRate: 15,
    status: "CONFIRMADO",
    items: [
      {
        productName: "",
        sku: "",
        description: "",
        quantityOrdered: 1,
        quantityCommitted: 1,
        quantityShipped: 0,
        quantityInvoiced: 0,
        rate: 0,
        amount: 0,
        notes: "",
      },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);
  const printSlipRef = useRef<HTMLDivElement>(null);

  // Cargar pedidos desde API
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/sales-orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
        if (json.nextOrderNumber) {
          setNextOrderNumber(json.nextOrderNumber);
        }
      } else {
        setErrorAlert(json.error || "No se pudieron cargar los pedidos.");
      }
    } catch (err: any) {
      console.error("Error al cargar pedidos:", err);
      setErrorAlert("Error de conexión al obtener pedidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Limpiar alertas automáticamente
  useEffect(() => {
    if (successAlert) {
      const timer = setTimeout(() => setSuccessAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successAlert]);

  useEffect(() => {
    if (errorAlert) {
      const timer = setTimeout(() => setErrorAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorAlert]);

  // Cálculos de métricas
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const confirmados = orders.filter((o) => o.status === "CONFIRMADO").length;
    const enBodega = orders.filter((o) => o.status === "EN_PREPARACION").length;
    const despachados = orders.filter((o) => o.status === "DESPACHADO" || o.status === "DESPACHADO_PARCIAL").length;
    const facturados = orders.filter((o) => o.status === "FACTURADO").length;
    const montoTotal = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const montoDespachadoSinFacturar = orders
      .filter((o) => o.status === "DESPACHADO" || o.status === "DESPACHADO_PARCIAL")
      .reduce((acc, o) => acc + (o.total || 0), 0);

    return {
      totalCount,
      confirmados,
      enBodega,
      despachados,
      facturados,
      montoTotal,
      montoDespachadoSinFacturar,
    };
  }, [orders]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        order.orderNumber.toLowerCase().includes(search) ||
        (order.customerPoNumber && order.customerPoNumber.toLowerCase().includes(search)) ||
        order.customerName.toLowerCase().includes(search) ||
        (order.quoteNumber && order.quoteNumber.toLowerCase().includes(search)) ||
        (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(search)) ||
        order.items.some(
          (it) =>
            it.productName.toLowerCase().includes(search) ||
            (it.sku && it.sku.toLowerCase().includes(search))
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  // Manejo del formulario de creación / edición
  const handleOpenCreate = () => {
    const defaultWh = internalWarehouses.find((w) => w.isDefault)?.name || internalWarehouses[0]?.name || "Bodega Principal Zip Búfalo";
    setFormData({
      ...initialFormState,
      warehouse: defaultWh,
      currency: effectiveCurrencyCode || "USD",
      orderNumber: nextOrderNumber,
    });
    setActiveEditorTab("Editar");
    setShowPrintDownloadDropdown(false);
    setShowEditorModal(true);
  };

  const handleOpenEdit = (order: SalesOrder) => {
    setFormData({
      id: order.id,
      orderNumber: order.orderNumber,
      customerPoNumber: order.customerPoNumber || "",
      quoteId: order.quoteId || "",
      quoteNumber: order.quoteNumber || "",
      customerId: order.customerId || "",
      customerName: order.customerName,
      customerRtn: order.customerRtn || "",
      customerAddress: order.customerAddress || "",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate || "",
      paymentTerms: order.paymentTerms,
      currency: order.currency,
      salesRepId: order.salesRepId || "",
      salesRepName: order.salesRepName || "",
      warehouse: order.warehouse || "Bodega Principal Zip Búfalo",
      notes: order.notes || "",
      shippingNotes: order.shippingNotes || "",
      discount: order.discount || 0,
      taxRate: order.taxRate || 15,
      status: order.status,
      items: order.items.map((it) => ({
        productName: it.productName,
        sku: it.sku || "",
        description: it.description || "",
        quantityOrdered: it.quantityOrdered,
        quantityCommitted: it.quantityCommitted,
        quantityShipped: it.quantityShipped,
        quantityInvoiced: it.quantityInvoiced,
        rate: it.rate,
        amount: it.amount,
        notes: it.notes || "",
      })),
    });
    setActiveEditorTab("Editar");
    setShowPrintDownloadDropdown(false);
    setShowEditorModal(true);
  };

  // Actualizar totales de formulario
  const calculateFormTotals = (
    items: typeof formData.items,
    discountVal: number,
    taxRateVal: number
  ) => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const taxableBase = Math.max(0, subtotal - Number(discountVal || 0));
    const tax = Number(((taxableBase * Number(taxRateVal || 0)) / 100).toFixed(2));
    const total = Number((taxableBase + tax).toFixed(2));
    return { subtotal, tax, total };
  };

  const formTotals = useMemo(() => {
    return calculateFormTotals(formData.items, formData.discount, formData.taxRate);
  }, [formData.items, formData.discount, formData.taxRate]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };

    if (field === "quantityOrdered" || field === "rate") {
      const q = field === "quantityOrdered" ? Number(value) : Number(item.quantityOrdered);
      const r = field === "rate" ? Number(value) : Number(item.rate);
      item.amount = Number((q * r).toFixed(2));
      item.quantityCommitted = q;
    }

    newItems[index] = item;
    const totals = calculateFormTotals(newItems, formData.discount, formData.taxRate);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  const handleSelectSku = (index: number, skuValue: string) => {
    const prod = inventory.find((p) => p.sku === skuValue);
    if (prod) {
      const newItems = [...formData.items];
      const item = {
        ...newItems[index],
        sku: prod.sku,
        productName: prod.description,
        description: prod.description,
        rate: prod.price || 0,
        amount: Number(((newItems[index].quantityOrdered || 1) * (prod.price || 0)).toFixed(2)),
      };
      newItems[index] = item;
      const totals = calculateFormTotals(newItems, formData.discount, formData.taxRate);
      setFormData((prev) => ({
        ...prev,
        items: newItems,
        ...totals,
      }));
    } else {
      handleItemChange(index, "sku", skuValue);
    }
  };

  const handleAddItem = () => {
    const newItems = [
      ...formData.items,
      {
        productName: "",
        sku: "",
        description: "",
        quantityOrdered: 1,
        quantityCommitted: 1,
        quantityShipped: 0,
        quantityInvoiced: 0,
        rate: 0,
        amount: 0,
        notes: "",
      },
    ];
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateFormTotals(newItems, formData.discount, formData.taxRate);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  const handleSelectInventoryItem = (index: number, invItem: any) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      productName: invItem.description,
      sku: invItem.sku,
      description: invItem.description,
      rate: invItem.price || 0,
      amount: Number((newItems[index].quantityOrdered * (invItem.price || 0)).toFixed(2)),
    };
    const totals = calculateFormTotals(newItems, formData.discount, formData.taxRate);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  const handleSelectCustomer = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerRtn: (customer as any).rtn || prev.customerRtn || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      customerAddress: customer.address || "",
      currency: customer.currency || prev.currency || effectiveCurrencyCode,
    }));
  };

  const handleSaveOrder = async (e?: React.FormEvent, closeModal = true) => {
    if (e) e.preventDefault();
    if (!formData.customerName.trim()) {
      setErrorAlert("Debe indicar el nombre del cliente.");
      setActiveEditorTab("Editar");
      return;
    }
    if (formData.items.some((it) => !it.productName.trim())) {
      setErrorAlert("Todos los ítems deben tener un nombre o descripción.");
      setActiveEditorTab("Editar");
      return;
    }

    setSavingOrder(true);
    try {
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/sales-orders/${formData.id}` : "/api/sales-orders";
      const method = isEditing ? "PUT" : "POST";

      const totals = calculateFormTotals(formData.items, formData.discount, formData.taxRate);

      const payload = {
        ...formData,
        ...totals,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setSuccessAlert(json.message || (isEditing ? "Pedido actualizado exitosamente." : "Pedido guardado exitosamente."));
        if (closeModal) {
          setShowEditorModal(false);
        } else if (!formData.id && json.data?.id) {
          setFormData((prev) => ({ ...prev, id: json.data.id }));
        }
        fetchOrders();
      } else {
        setErrorAlert(json.error || "Error al guardar el pedido.");
      }
    } catch (err: any) {
      console.error("Error al guardar pedido:", err);
      setErrorAlert("Ocurrió un error inesperado al guardar.");
    } finally {
      setSavingOrder(false);
    }
  };

  // Descargar PDF del pedido
  const downloadSalesOrderPDF = async () => {
    setShowPrintDownloadDropdown(false);
    setIsGeneratingPDF(true);
    try {
      const printableElem = document.getElementById("printable-sales-order-document");
      if (!printableElem) {
        window.print();
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.width = "816px";
      wrapper.style.background = "#ffffff";
      wrapper.style.minHeight = "1056px";
      wrapper.style.color = "#000000";
      wrapper.style.zIndex = "-9999";

      const clone = printableElem.cloneNode(true) as HTMLElement;
      clone.classList.remove("hidden");
      clone.classList.remove("print:block");
      clone.classList.remove("print:flex");
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.justifyContent = "space-between";
      clone.style.minHeight = "1056px";
      clone.style.width = "100%";
      clone.style.background = "#ffffff";
      clone.style.color = "#000000";
      clone.style.padding = "32px";
      clone.style.boxSizing = "border-box";

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 816,
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Pedido_${formData.orderNumber || "Venta"}.pdf`);
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Cambio de estado rápido
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sales-orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessAlert(json.message || `Estado actualizado a ${newStatus}.`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(json.data);
        }
      } else {
        setErrorAlert(json.error || "No se pudo actualizar el estado.");
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setErrorAlert("Error al actualizar el estado del pedido.");
    }
  };

  // Facturar pedido con 1 clic
  const handleConvertToInvoice = async (order: SalesOrder) => {
    if (!order.salesRepId && !order.salesRepName) {
      setErrorAlert("No se puede facturar un pedido sin vendedor asignado. Asigne un vendedor al pedido antes de facturarlo.");
      setShowConvertModal(false);
      return;
    }

    try {
      setConverting(true);
      const res = await fetch(`/api/sales-orders/${order.id}/convert-to-invoice`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setSuccessAlert(json.message);
        setShowConvertModal(false);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({
            ...selectedOrder,
            status: "FACTURADO",
            invoiceNumber: json.data?.invoiceNumber,
            salesInvoiceId: json.data?.invoice?.id,
          });
        }
      } else {
        setErrorAlert(json.error || "No se pudo facturar el pedido.");
      }
    } catch (err) {
      console.error("Error al convertir a factura:", err);
      setErrorAlert("Ocurrió un error al emitir la factura.");
    } finally {
      setConverting(false);
    }
  };

  // Renderizador de Badges de Estado
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "BORRADOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Borrador
          </span>
        );
      case "CONFIRMADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3 text-blue-600" />
            Confirmado
          </span>
        );
      case "EN_PREPARACION":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Boxes className="w-3 h-3 text-amber-600 animate-pulse" />
            En Almacén
          </span>
        );
      case "DESPACHADO_PARCIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            Despacho Parcial
          </span>
        );
      case "DESPACHADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600" />
            Despachado
          </span>
        );
      case "FACTURADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            Facturado
          </span>
        );
      case "CANCELADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {successAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successAlert}</span>
          </div>
          <button onClick={() => setSuccessAlert(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorAlert && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorAlert}</span>
          </div>
          <button onClick={() => setErrorAlert(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= SCREEN HEADER ================= */}
      <div className="space-y-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Regresar a Dashboard</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-500">Ventas</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">Historial de Pedidos de Venta</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Historial de Pedidos de Venta
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                Ciclo Comercial y Almacén
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione las órdenes de venta confirmadas por clientes, controle el alistamiento en bodega (Picking & Packing) y facture con 1 clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#1b426e]" : ""}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#e07116] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 transition cursor-pointer"
            >
              <span className="text-sm leading-none">+</span>
              <span>Nuevo Pedido de Venta</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Total Pedidos */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pedidos Activos
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {effectiveCurrencySymbol}{metrics.montoTotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {metrics.totalCount} pedidos registrados
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#1b426e]">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: En Preparación Almacén */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  En Almacén / Surtido
                </span>
                <h3 className="text-xl font-black text-amber-600 mt-1">
                  {metrics.enBodega} pedidos
                </h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Preparando empaque en bodega
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Despachados Listos para Facturar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Despachados sin Facturar
                </span>
                <h3 className="text-xl font-black text-indigo-600 mt-1">
                  {effectiveCurrencySymbol}{metrics.montoDespachadoSinFacturar.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {metrics.despachados} con remisión entregada
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Facturados */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facturados y Cerrados
                </span>
                <h3 className="text-xl font-black text-emerald-600 mt-1">
                  {metrics.facturados} pedidos
                </h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Con Factura SAR emitida
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= BARRA DE FILTROS & BÚSQUEDA ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Búsqueda */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N.º pedido, O.C. cliente o artículo..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] transition"
            />
          </div>

          {/* Selector de pestañas / estados */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Todos", count: orders.length },
              { id: "CONFIRMADO", label: "Confirmados", count: metrics.confirmados },
              { id: "EN_PREPARACION", label: "En Almacén", count: metrics.enBodega },
              { id: "DESPACHADO", label: "Despachados", count: metrics.despachados },
              { id: "FACTURADO", label: "Facturados", count: metrics.facturados },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= TABLA DE PEDIDOS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4">Pedido / O.C. Cliente</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Fecha Prometida</th>
                  <th className="py-3 px-4">Almacén</th>
                  <th className="py-3 px-4 text-center">Ítems</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <TableRowsSkeleton rows={6} cols={9} />
              </tbody>
            </table>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
              <PackageCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No se encontraron pedidos de venta</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay pedidos que coincidan con los filtros aplicados. Puede crear un nuevo pedido o convertir una cotización aprobada.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primer Pedido</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4">Pedido / O.C. Cliente</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Fecha Prometida</th>
                  <th className="py-3 px-4">Almacén</th>
                  <th className="py-3 px-4 text-center">Ítems</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                    {/* Pedido / O.C. Cliente */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            handleOpenEdit(order);
                          }}
                          className="hover:underline text-left cursor-pointer hover:text-[#1b426e] transition font-bold"
                          title="Ver y editar pedido de venta"
                        >
                          {order.orderNumber}
                        </button>
                        {order.quoteNumber && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                            Cot: {order.quoteNumber}
                          </span>
                        )}
                      </div>
                      {order.customerPoNumber ? (
                        <span className="text-[11px] font-semibold text-orange-600 flex items-center gap-1 mt-0.5">
                          <span>O.C.:</span> {order.customerPoNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">Sin O.C. cliente</span>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      {order.customerRtn && (
                        <span className="text-[10px] text-slate-400 block font-mono">RTN: {order.customerRtn}</span>
                      )}
                    </td>

                    {/* Fechas */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{order.orderDate}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.expectedDeliveryDate ? (
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {order.expectedDeliveryDate}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Por definir</span>
                      )}
                    </td>

                    {/* Almacén */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="truncate max-w-[140px] block" title={order.warehouse}>
                        {order.warehouse}
                      </span>
                    </td>

                    {/* Ítems */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                        {order.items.length}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                      {getCurrencySymbol(order.currency)}{order.total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-[10px] font-normal text-slate-500">{order.currency || effectiveCurrencyCode}</span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center">{renderStatusBadge(order.status)}</td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ver / Detalle (Solo icono) */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            handleOpenEdit(order);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="Ver y editar pedido de venta"
                          aria-label="Ver y editar pedido de venta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Crear Orden de Trabajo en Producción */}
                        {onNavigateToProduction && order.status !== "CANCELADO" && (
                          <button
                            type="button"
                            onClick={() => onNavigateToProduction(order)}
                            className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-800 border border-orange-200 transition cursor-pointer"
                            title="Crear Orden de Trabajo (Producción)"
                            aria-label="Crear Orden de Trabajo"
                          >
                            <Factory className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Botón Facturar (Solo icono) */}
                        {order.status !== "FACTURADO" && order.status !== "CANCELADO" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowConvertModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 border border-emerald-200 transition cursor-pointer"
                            title="Generar Factura SAR con 1 clic"
                            aria-label="Generar Factura SAR"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {order.status === "FACTURADO" && order.invoiceNumber && (
                          <span
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                            title={`Factura emitida: #${order.invoiceNumber}`}
                          >
                            #{order.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PÁGINA COMPLETA: CREAR / EDITAR PEDIDO DE VENTA ================= */}
      {showEditorModal && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 text-slate-800 animate-in fade-in duration-150 overflow-hidden print:static print:inset-auto print:bg-white print:overflow-visible print:block print:p-0">
          {/* TOP HEADER BAR */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Regresar</span>
              </button>

              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 border-l border-slate-200 pl-4">
                <span>{formData.id ? `Editar Pedido ${formData.orderNumber}` : `Pedido de Venta ${formData.orderNumber || nextOrderNumber}`}</span>
              </h1>

              {/* Sub-tabs: Editar vs Hoja de Despacho vs Vista de PDF */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-6">
                {(["Editar", "Hoja de Despacho", "Vista Previa PDF"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveEditorTab(tab)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      activeEditorTab === tab
                        ? "bg-[#fff7ed] text-[#1b426e] border border-[#1b426e]/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Cerrar editor"
              >
                ✕
              </button>
            </div>
          </header>

          {/* MAIN CONTENT WORKSPACE */}
          <div className="flex-1 flex overflow-hidden print:hidden">
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

              {/* PESTAÑA: EDITAR */}
              {activeEditorTab === "Editar" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-5xl mx-auto space-y-8">
                  {/* Fila Superior: Membrete corporativo y Correlativo */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] border border-orange-200 flex items-center justify-center text-[#1b426e] shrink-0">
                        <PackageCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 leading-tight">
                          {compName}
                        </h2>
                        {compRtn && <p className="text-xs text-slate-500 font-mono mt-0.5">RTN: {compRtn}</p>}
                        {compAddress && <p className="text-xs text-slate-500 mt-0.5">{compAddress}</p>}
                        {compContact && <p className="text-[11px] text-slate-400 mt-0.5">{compContact}</p>}
                      </div>
                    </div>

                    <div className="text-right w-full sm:w-auto">
                      <h3 className="text-xl font-black text-[#1b426e] tracking-tight">PEDIDO DE VENTA</h3>
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <label className="text-xs font-bold text-slate-600">N.º:</label>
                        <input
                          type="text"
                          value={formData.orderNumber}
                          onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                          required
                          className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 text-right w-44 focus:outline-none focus:border-[#1b426e]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500">Moneda:</span>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700"
                          >
                            <option value="HNL">HNL (L)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500">Estado:</span>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700"
                          >
                            <option value="CONFIRMADO">Confirmado</option>
                            <option value="BORRADOR">Borrador</option>
                            <option value="EN_PREPARACION">En Almacén</option>
                            <option value="DESPACHADO">Despachado</option>
                            <option value="FACTURADO">Facturado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fila Central: Datos Comerciales y del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
                    {/* Cliente / Razón Social */}
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Cliente / Razón Social *
                        </label>
                        {customers.length > 0 && (
                          <span className="text-[11px] text-slate-500">
                            o seleccione de la lista:
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Nombre o empresa del cliente..."
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#1b426e] font-semibold text-slate-900"
                        />
                        {customers.length > 0 && (
                          <select
                            onChange={(e) => {
                              const c = customers.find((cust) => cust.id === e.target.value);
                              if (c) handleSelectCustomer(c);
                            }}
                            value={formData.customerId || ""}
                            className="w-44 px-2 py-1 text-xs bg-white border border-slate-300 rounded-xl text-slate-700"
                          >
                            <option value="">Buscar de lista...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                            RTN del Cliente
                          </label>
                          <input
                            type="text"
                            placeholder="05019000000000"
                            value={formData.customerRtn || ""}
                            onChange={(e) => setFormData({ ...formData, customerRtn: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-[#1b426e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                            Dirección de Entrega
                          </label>
                          <input
                            type="text"
                            placeholder="Muelle o planta de entrega"
                            value={formData.customerAddress || ""}
                            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#1b426e]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Referencias Comerciales: O.C. Cliente y Cotización */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          N.º O.C. del Cliente (Customer PO) *
                        </label>
                        <input
                          type="text"
                          value={formData.customerPoNumber || ""}
                          onChange={(e) => setFormData({ ...formData, customerPoNumber: e.target.value })}
                          placeholder="Ej. OC-CERV-2026-891"
                          className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cotización Vinculada (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.quoteNumber || ""}
                          onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                          placeholder="Ej. COT-2026-0001"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Fechas, Almacén, Términos y Vendedor */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha del Pedido
                      </label>
                      <input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha Prometida de Entrega
                      </label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate || ""}
                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Almacén de Despacho
                        </label>
                        {onOpenWarehousesConfig && (
                          <button
                            type="button"
                            onClick={onOpenWarehousesConfig}
                            className="text-[11px] font-semibold text-[#1b426e] hover:underline cursor-pointer flex items-center gap-1"
                            title="Administrar almacenes en Configuración"
                          >
                            ⚙️ Configurar
                          </button>
                        )}
                      </div>
                      <select
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                      >
                        {internalWarehouses.map((wh) => (
                          <option key={wh.id} value={wh.name}>
                            {wh.name} {wh.code ? `(${wh.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Términos de Pago
                      </label>
                      <select
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                      >
                        <option value="Contado">Contado</option>
                        <option value="Neto 15 días">Neto 15 días</option>
                        <option value="Neto 30 días">Neto 30 días</option>
                        <option value="Neto 60 días">Neto 60 días</option>
                        <option value="Contra Entrega">Contra Entrega</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Vendedor / Ejecutivo
                      </label>
                      {salesReps.length > 0 ? (
                        <select
                          value={formData.salesRepName || ""}
                          onChange={(e) => {
                            const rep = salesReps.find((r) => r.name === e.target.value);
                            setFormData({
                              ...formData,
                              salesRepName: e.target.value,
                              salesRepId: rep ? rep.id : "",
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                        >
                          <option value="">Sin asignar / General</option>
                          {salesReps.map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name} ({r.code})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nombre del ejecutivo..."
                          value={formData.salesRepName || ""}
                          onChange={(e) => setFormData({ ...formData, salesRepName: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono / Contacto
                      </label>
                      <input
                        type="text"
                        placeholder="Teléfono del cliente"
                        value={formData.customerPhone || ""}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Tabla de Productos / Materiales */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Productos & Materiales Ordenados</span>
                        <span className="text-xs font-normal text-slate-400">
                          ({formData.items.length} {formData.items.length === 1 ? "ítem" : "ítems"})
                        </span>
                      </h4>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 w-48">SKU / Catálogo</th>
                            <th className="p-3">Producto *</th>
                            <th className="p-3">Descripción / Arte</th>
                            <th className="p-3 w-28 text-center">Cant. Ordenada *</th>
                            <th className="p-3 w-32 text-right">Precio Unit. ({getCurrencySymbol(formData.currency)})</th>
                            <th className="p-3 w-32 text-right">Importe ({getCurrencySymbol(formData.currency)})</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                              {/* SKU con buscador por catálogo */}
                              <td className="p-3">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="SKU..."
                                    value={it.sku || ""}
                                    onChange={(e) => handleSelectSku(idx, e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-mono text-slate-800 focus:border-[#1b426e]"
                                  />
                                  {inventory.length > 0 && (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) handleSelectSku(idx, e.target.value);
                                      }}
                                      value={inventory.some((inv) => inv.sku === it.sku) ? (it.sku || "") : ""}
                                      className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500"
                                    >
                                      <option value="">-- Catálogo por SKU --</option>
                                      {inventory.map((inv) => (
                                        <option key={inv.id} value={inv.sku}>
                                          {inv.sku} — {inv.description.slice(0, 24)} ({getCurrencySymbol(formData.currency)}{inv.price})
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>

                              {/* Producto */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Nombre del producto..."
                                  required
                                  value={it.productName}
                                  onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900 focus:border-[#1b426e]"
                                />
                              </td>

                              {/* Especificaciones */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Especificaciones o arte..."
                                  value={it.description || ""}
                                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 focus:border-[#1b426e]"
                                />
                              </td>

                              {/* Cantidad Ordenada */}
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={it.quantityOrdered}
                                  onChange={(e) => handleItemChange(idx, "quantityOrdered", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-center font-bold text-slate-900 focus:border-[#1b426e]"
                                />
                              </td>

                              {/* Precio Unitario */}
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={it.rate}
                                  onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-right font-mono font-bold text-slate-900 focus:border-[#1b426e]"
                                />
                              </td>

                              {/* Monto */}
                              <td className="p-3 text-right font-black text-slate-900 font-mono">
                                {getCurrencySymbol(formData.currency)}{Number(it.amount || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Acción */}
                              <td className="p-3 text-center">
                                {formData.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Eliminar fila"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-300/80"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#1b426e]" />
                        <span>+ Agregar producto o material</span>
                      </button>
                    </div>
                  </div>

                  {/* Sección Inferior: Notas y Desglose de Totales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Instrucciones de Despacho para Bodega
                        </label>
                        <textarea
                          rows={3}
                          value={formData.shippingNotes || ""}
                          onChange={(e) => setFormData({ ...formData, shippingNotes: e.target.value })}
                          placeholder="Empaque, paletizado, horarios de muelle, transportista..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1b426e]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Notas Internas & Observaciones Comerciales
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes || ""}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Comentarios de ventas, crédito o control interno..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#1b426e]"
                        />
                      </div>
                    </div>

                    {/* Desglose de Totales */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                            Subtotal:
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            {getCurrencySymbol(formData.currency)} {formTotals.subtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                            Descuento ({getCurrencySymbol(formData.currency)}):
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={formData.discount}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setFormData((prev) => ({ ...prev, discount: val }));
                            }}
                            className="w-24 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-right font-mono"
                          />
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                            Tasa de Impuesto (I.S.V.):
                          </span>
                          <select
                            value={formData.taxRate}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setFormData((prev) => ({ ...prev, taxRate: val }));
                            }}
                            className="w-28 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                          >
                            <option value={15}>15% (SAR General)</option>
                            <option value={18}>18% (Especial)</option>
                            <option value={0}>0% (Exento)</option>
                          </select>
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                            Total I.S.V. ({formData.taxRate}%):
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            {getCurrencySymbol(formData.currency)} {formTotals.tax.toFixed(2)}
                          </span>
                        </div>

                        <div className="border-t border-slate-300 pt-3">
                          <div className="flex justify-between items-center py-2 px-3 bg-slate-200 border border-slate-300 text-slate-900 rounded-xl shadow-xs">
                            <span className="font-black text-xs uppercase tracking-wider text-slate-700">Total del Pedido:</span>
                            <span className="font-mono font-black text-xl text-[#1b426e]">
                              {getCurrencySymbol(formData.currency)} {formTotals.total.toFixed(2)}{" "}
                              <span className="text-xs font-normal text-slate-600">{formData.currency}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA: HOJA DE DESPACHO (PICKING & PACKING) */}
              {activeEditorTab === "Hoja de Despacho" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                    <div>
                      <h3 className="font-black text-slate-900 text-base tracking-wide">
                        {compName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {[compAddress, compContact].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-xs font-bold text-orange-600 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Hoja de Despacho & Control de Almacén (Packing Slip)</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-800 block">
                        Pedido: {formData.orderNumber || nextOrderNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 block">Fecha: {formData.orderDate}</span>
                      {formData.expectedDeliveryDate && (
                        <span className="text-[11px] text-indigo-700 font-semibold block">
                          Entrega Prometida: {formData.expectedDeliveryDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos Operativos de Entrega */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                        Entregar a / Cliente:
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{formData.customerName || "Cliente"}</p>
                      {formData.customerRtn && <p className="text-slate-600 font-mono">RTN: {formData.customerRtn}</p>}
                      {formData.customerAddress && <p className="text-slate-500 mt-0.5">{formData.customerAddress}</p>}
                      {formData.customerPhone && <p className="text-slate-500">Tel: {formData.customerPhone}</p>}
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                        Datos Logísticos:
                      </span>
                      <p className="text-slate-700 mt-0.5">
                        <span className="font-semibold">O.C. Cliente:</span> {formData.customerPoNumber || "N/A"}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold">Almacén:</span> {formData.warehouse}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold">Términos:</span> {formData.paymentTerms}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold">Vendedor:</span> {formData.salesRepName || "General"}
                      </p>
                    </div>
                  </div>

                  {/* Instrucciones de Despacho */}
                  {formData.shippingNotes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Instrucciones de Despacho y Transporte:</span>
                        <p className="text-[11px] mt-0.5">{formData.shippingNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Tabla de Artículos a Despachar */}
                  <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2.5 px-3 w-10 text-center">✓</th>
                        <th className="py-2.5 px-3 w-32">SKU</th>
                        <th className="py-2.5 px-3">Producto / Material</th>
                        <th className="py-2.5 px-3">Especificaciones</th>
                        <th className="py-2.5 px-3 text-center w-24">Cant. Ordenada</th>
                        <th className="py-2.5 px-3 text-center w-24">Cant. Preparada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {formData.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center">
                            <input type="checkbox" defaultChecked className="rounded text-[#1b426e]" />
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{it.sku || "—"}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.productName || "Artículo"}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{it.description || "—"}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">{it.quantityOrdered}</td>
                          <td className="py-2 px-3 text-center font-bold text-[#1b426e]">{it.quantityCommitted || it.quantityOrdered}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Firmas de Control */}
                  <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-600">
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-semibold text-slate-800">Preparado por Bodega</p>
                      <p className="text-[10px] text-slate-400">Firma y Fecha de Alistamiento</p>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-semibold text-slate-800">Verificado por Supervisor</p>
                      <p className="text-[10px] text-slate-400">Control de Calidad y Conteo</p>
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-semibold text-slate-800">Recibido por Transportista</p>
                      <p className="text-[10px] text-slate-400">Firma y N.º de Placa</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA: VISTA PREVIA PDF (Carta 8.5" × 11") */}
              {activeEditorTab === "Vista Previa PDF" && (
                <div className="overflow-x-auto pb-12 flex flex-col items-center">
                  <div
                    id="printable-sales-order-document"
                    className="w-[8.5in] min-h-[11in] bg-white border border-slate-300 rounded-xs shadow-xl p-12 flex flex-col justify-between text-slate-800 text-xs shrink-0 my-2 animate-in fade-in duration-150"
                    style={{ width: "8.5in", minHeight: "11in" }}
                  >
                    <div className="space-y-6">
                      {/* Membrete formal */}
                      <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                          <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            {compName}
                          </h1>
                          {compRtn && <p className="text-xs text-slate-600 font-mono mt-0.5">RTN: {compRtn}</p>}
                          {compAddress && <p className="text-xs text-slate-500 mt-0.5">{compAddress}</p>}
                          {compContact && <p className="text-xs text-slate-400 mt-0.5">{compContact}</p>}
                        </div>

                        <div className="text-right">
                          <h2 className="text-xl font-bold text-slate-900">PEDIDO DE VENTA</h2>
                          <p className="font-mono font-bold text-slate-700 text-sm mt-1">{formData.orderNumber || nextOrderNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Fecha: {formData.orderDate}</p>
                          {formData.expectedDeliveryDate && (
                            <p className="text-xs text-slate-500">Entrega: {formData.expectedDeliveryDate}</p>
                          )}
                        </div>
                      </div>

                      {/* Datos del Cliente */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">Facturar / Entregar a:</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{formData.customerName || "Cliente"}</p>
                          {formData.customerRtn && <p className="text-slate-600 mt-0.5 font-mono">RTN: {formData.customerRtn}</p>}
                          {formData.customerAddress && <p className="text-slate-500 mt-0.5">{formData.customerAddress}</p>}
                          {formData.customerPhone && <p className="text-slate-500">Tel: {formData.customerPhone}</p>}
                        </div>

                        <div className="text-right space-y-0.5">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">Condiciones Comerciales:</p>
                          <p className="text-slate-700"><span className="font-semibold">O.C. Cliente:</span> {formData.customerPoNumber || "N/A"}</p>
                          <p className="text-slate-700"><span className="font-semibold">Términos:</span> {formData.paymentTerms}</p>
                          <p className="text-slate-700"><span className="font-semibold">Moneda:</span> {formData.currency}</p>
                          <p className="text-slate-700"><span className="font-semibold">Almacén:</span> {formData.warehouse}</p>
                          <p className="text-slate-700"><span className="font-semibold">Vendedor:</span> {formData.salesRepName || "General"}</p>
                        </div>
                      </div>

                      {/* Tabla de Productos */}
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-600 font-bold">
                            <th className="py-2 px-2 w-10 text-center">#</th>
                            <th className="py-2 px-2">Descripción del Producto</th>
                            <th className="py-2 px-2 w-20 text-center">Cantidad</th>
                            <th className="py-2 px-2 w-28 text-right">Precio Unit. ({getCurrencySymbol(formData.currency)})</th>
                            <th className="py-2 px-2 w-28 text-right">Importe ({getCurrencySymbol(formData.currency)})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {formData.items.map((it, i) => (
                            <tr key={i}>
                              <td className="py-2.5 px-2 text-center text-slate-400">{i + 1}</td>
                              <td className="py-2.5 px-2">
                                <div className="font-bold text-slate-900">{it.productName || "Artículo"}</div>
                                {it.sku && <div className="text-[#1b426e] font-mono text-[10px]">SKU: {it.sku}</div>}
                                {it.description && <div className="text-slate-500 text-[11px]">{it.description}</div>}
                              </td>
                              <td className="py-2.5 px-2 text-center font-medium">{it.quantityOrdered}</td>
                              <td className="py-2.5 px-2 text-right">{getCurrencySymbol(formData.currency)} {(Number(it.rate) || 0).toFixed(2)}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-slate-900">{getCurrencySymbol(formData.currency)} {(Number(it.amount) || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Totales */}
                      <div className="flex justify-end pt-2">
                        <div className="w-64 space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">{getCurrencySymbol(formData.currency)} {formTotals.subtotal.toFixed(2)}</span>
                          </div>
                          {formData.discount > 0 && (
                            <div className="flex justify-between text-slate-500">
                              <span>Descuento:</span>
                              <span>-{getCurrencySymbol(formData.currency)} {(Number(formData.discount) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>I.S.V. ({formData.taxRate}%):</span>
                            <span className="font-semibold">{getCurrencySymbol(formData.currency)} {formTotals.tax.toFixed(2)}</span>
                          </div>
                          <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                            <span>Total General ({formData.currency}):</span>
                            <span className="font-mono text-base">{getCurrencySymbol(formData.currency)} {formTotals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notas */}
                      {(formData.shippingNotes || formData.notes) && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
                          {formData.shippingNotes && (
                            <p><strong>Instrucciones de Despacho:</strong> {formData.shippingNotes}</p>
                          )}
                          {formData.notes && (
                            <p><strong>Observaciones:</strong> {formData.notes}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Firmas */}
                    <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 text-center text-xs">
                      <div className="border-t border-slate-300 pt-2">
                        <p className="font-semibold text-slate-900">{compName}</p>
                        <p className="text-[11px] text-slate-400">Autorizado por Ventas / Operaciones</p>
                      </div>
                      <div className="border-t border-slate-300 pt-2">
                        <p className="font-semibold text-slate-900">{formData.customerName || "Cliente"}</p>
                        <p className="text-[11px] text-slate-400">Aceptación y Recibido Conforme</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FIXED BOTTOM ACTION BAR */}
          <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-30 shadow-md print:hidden">
            <div ref={printDownloadDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowPrintDownloadDropdown(!showPrintDownloadDropdown)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                {isGeneratingPDF ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <span>Imprimir o descargar</span>
                )}
              </button>

              {showPrintDownloadDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs font-normal text-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintDownloadDropdown(false);
                      window.print();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 flex items-center justify-between"
                  >
                    <span>Imprimir</span>
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={downloadSalesOrderPDF}
                    disabled={isGeneratingPDF}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 flex items-center justify-between"
                  >
                    <span>Descargar PDF</span>
                    {isGeneratingPDF ? (
                      <span className="text-[10px] text-amber-600 font-semibold animate-pulse">Generando...</span>
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={savingOrder}
                onClick={() => handleSaveOrder(undefined, false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Guardar y seguir editando
              </button>

              <button
                type="button"
                disabled={savingOrder}
                onClick={() => handleSaveOrder(undefined, true)}
                className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#e07116] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                {savingOrder ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{formData.id ? "Guardar Cambios" : "Guardar Pedido de Venta"}</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* ================= MODAL: DETALLE Y HOJA DE DESPACHO ================= */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Header del Modal */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedOrder.orderNumber}</h2>
                    {renderStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    O.C. Cliente:{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedOrder.customerPoNumber || "Sin O.C."}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimir Remisión</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido imprimible de la Remisión / Packing Slip */}
            <div ref={printSlipRef} className="p-6 space-y-6">
              {/* Encabezado Corporativo */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-wide">
                    {companySettings?.nombreLegal || companySettings?.nombre || "EMPRESA"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {[companySettings?.direccion, companySettings?.telefono ? `Tel: ${companySettings.telefono}` : ""].filter(Boolean).join(" • ")}
                  </p>
                  <p className="text-xs font-semibold text-orange-600 mt-1">
                    HOJA DE DESPACHO Y CONTROL DE ALMACÉN (PACKING SLIP)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 block">
                    N.º: {selectedOrder.orderNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Fecha: {selectedOrder.orderDate}</span>
                  {selectedOrder.expectedDeliveryDate && (
                    <span className="text-[11px] text-indigo-700 font-semibold block">
                      Entrega Prometida: {selectedOrder.expectedDeliveryDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Datos de Entrega */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Cliente / Entregar a:
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrder.customerName}</p>
                  {selectedOrder.customerRtn && <p className="text-slate-600">RTN: {selectedOrder.customerRtn}</p>}
                  {selectedOrder.customerAddress && (
                    <p className="text-slate-500 mt-0.5">{selectedOrder.customerAddress}</p>
                  )}
                  {selectedOrder.customerPhone && (
                    <p className="text-slate-500">Tel: {selectedOrder.customerPhone}</p>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Detalles Operativos:
                  </span>
                  <p className="text-slate-700 mt-0.5">
                    <span className="font-semibold">O.C. Cliente:</span> {selectedOrder.customerPoNumber || "N/A"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Almacén:</span> {selectedOrder.warehouse}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Términos:</span> {selectedOrder.paymentTerms}
                  </p>
                  {selectedOrder.invoiceNumber && (
                    <p className="text-emerald-700 font-bold mt-1">
                      Factura Asociada: {selectedOrder.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Instrucciones de Envío */}
              {selectedOrder.shippingNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Instrucciones de Despacho y Transporte:</span>
                    <p className="text-[11px] mt-0.5">{selectedOrder.shippingNotes}</p>
                  </div>
                </div>
              )}

              {/* Tabla de Artículos a Despachar */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2 px-3 w-8 text-center">✓</th>
                      <th className="py-2 px-3">Producto / SKU</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3 text-center">Cant. Ordenada</th>
                      <th className="py-2 px-3 text-center">Cant. Despachada</th>
                      <th className="py-2 px-3 text-right">Precio</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedOrder.items.map((it, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center">
                          <input type="checkbox" defaultChecked={it.quantityShipped > 0} className="rounded" />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {it.productName}
                          {it.sku && <span className="text-[10px] text-slate-400 block font-mono">{it.sku}</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{it.description || "—"}</td>
                        <td className="py-2 px-3 text-center font-bold">{it.quantityOrdered}</td>
                        <td className="py-2 px-3 text-center font-bold text-indigo-600">
                          {it.quantityShipped || it.quantityOrdered}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{getCurrencySymbol(selectedOrder?.currency)}{it.rate.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{getCurrencySymbol(selectedOrder?.currency)}{it.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 font-bold text-xs bg-slate-50">
                      <td colSpan={6} className="py-2.5 px-3 text-right text-slate-600">
                        Total Pedido:
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                        {getCurrencySymbol(selectedOrder.currency)}{selectedOrder.total.toFixed(2)} {selectedOrder.currency || effectiveCurrencyCode}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Firmas de Control */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold text-slate-800">Preparado por Almacén</p>
                  <p className="text-[10px] text-slate-400 mt-1">Firma / Bodega Central</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold text-slate-800">Transporte / Chofer</p>
                  <p className="text-[10px] text-slate-400 mt-1">Nombre y Placa de Camión</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="font-bold text-slate-800">Recibido Conforme Cliente</p>
                  <p className="text-[10px] text-slate-400 mt-1">Firma, Sello y Fecha</p>
                </div>
              </div>
            </div>

            {/* Footer con Transición de Estados */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Avanzar Estado:</span>
                {selectedOrder.status === "BORRADOR" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMADO")}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer"
                  >
                    Confirmar Pedido
                  </button>
                )}

                {selectedOrder.status === "CONFIRMADO" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "EN_PREPARACION")}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Pasar a Bodega</span>
                  </button>
                )}

                {selectedOrder.status === "EN_PREPARACION" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "DESPACHADO")}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Marcar Despachado</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.status !== "FACTURADO" && selectedOrder.status !== "CANCELADO" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowConvertModal(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Facturar Este Pedido</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRMAR CONVERSIÓN A FACTURA ================= */}
      {showConvertModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shrink-0">
                <FileCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Facturar Pedido de Venta</h3>
                <p className="text-xs text-slate-500">{selectedOrder.orderNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">O.C. Cliente:</span>
                <span className="font-semibold text-orange-600">{selectedOrder.customerPoNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total a Facturar:</span>
                <span className="font-black text-slate-900 font-mono">
                  {getCurrencySymbol(selectedOrder.currency)}{selectedOrder.total.toFixed(2)} {selectedOrder.currency || effectiveCurrencyCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Productos:</span>
                <span>{selectedOrder.items.length} ítems despachados</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-800">Contabilización Automática NIIF / SAR:</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Se generará inmediatamente la Factura Fiscal y su correspondiente Asiento Contable de partida doble en el Libro Diario (Débito a Cuentas por Cobrar 1200 y Crédito a Ventas 4000 e ISV 2150).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleConvertToInvoice(selectedOrder)}
                disabled={converting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                {converting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Emitiendo Factura...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Confirmar y Emitir Factura SAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
