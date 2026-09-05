"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Printer,
  Download,
  CreditCard,
  Clock,
  Package,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";
import { TableRowsSkeleton } from "@/components/Skeleton";
import { numberToWordsSpanish } from "@/components/InvoicesModule";
import {
  Customer,
  Vendor,
  InventoryItem,
  CompanySettings,
  PurchaseOrder,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  VendorReturnRecord,
  VendorReturnItem,
  NavItem,
} from "@/types/dashboard";

export interface PurchasesModuleProps {
  currentView:
    | "lista-ordenes-compra"
    | "orden-compra-editor"
    | "factura-compra-lista"
    | "factura-compra-editor"
    | "devoluciones-proveedor";
  editingPurchaseOrder?: any | null;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  purchaseInvoices: PurchaseInvoice[];
  setPurchaseInvoices: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>;
  vendorReturns: VendorReturnRecord[];
  setVendorReturns: React.Dispatch<React.SetStateAction<VendorReturnRecord[]>>;
  vendors: Vendor[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  companySettings: CompanySettings;
  companyLogo?: string | null;
  defaultCurrencySymbol?: string;
  loading?: boolean;
  onNavigateToDashboard: () => void;
  onNavigateToView: (view: NavItem) => void;
  onPayVendor?: (vendorName: string) => void;
  onRefreshAccounts?: () => void;
}

export function PurchasesModule({
  currentView,
  editingPurchaseOrder,
  purchaseOrders,
  setPurchaseOrders,
  purchaseInvoices,
  setPurchaseInvoices,
  vendorReturns,
  setVendorReturns,
  vendors,
  inventory,
  setInventory,
  companySettings,
  companyLogo,
  defaultCurrencySymbol = "$",
  loading = false,
  onNavigateToDashboard,
  onNavigateToView,
  onPayVendor,
  onRefreshAccounts,
}: PurchasesModuleProps) {
  // Dynamic Purchase Orders Statistics
  const totalPO = useMemo(() => purchaseOrders.reduce((acc, item) => acc + item.total, 0), [purchaseOrders]);
  const poRecibidas = useMemo(() => purchaseOrders.filter((item) => item.status === "Recibida"), [purchaseOrders]);
  const totalPORecibidas = useMemo(() => poRecibidas.reduce((acc, item) => acc + item.total, 0), [poRecibidas]);
  const poPendientes = useMemo(() => purchaseOrders.filter((item) => item.status === "Pendiente" || item.status === "Aprobada"), [purchaseOrders]);
  const totalPOPendientes = useMemo(() => poPendientes.reduce((acc, item) => acc + item.total, 0), [poPendientes]);

  // -------------------------------------------------------------
  // 1. Purchase Orders List & Editor State
  // -------------------------------------------------------------
  const [searchPO, setSearchPO] = useState("");
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [showPODetailModal, setShowPODetailModal] = useState(false);

  const [activePOTab, setActivePOTab] = useState<"Editar" | "Vista de correo" | "Vista de PDF">("Editar");
  const [showPOOptionsSidebar, setShowPOOptionsSidebar] = useState(false);
  const [activePOOptionSection, setActivePOOptionSection] = useState<string | null>("general");
  const [showPOSaveDropdown, setShowPOSaveDropdown] = useState(false);
  const [showPOPrintDropdown, setShowPOPrintDropdown] = useState(false);
  const [showPOSendDropdown, setShowPOSendDropdown] = useState(false);
  const [sendingPOEmail, setSendingPOEmail] = useState(false);
  const [poSuccessMsg, setPOSuccessMsg] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [poForm, setPOForm] = useState({
    num: "OC-2026-085",
    vendorName: "Insumos Flexográficos S.A.",
    vendorEmail: "compras@insumosflexo.hn",
    vendorAddress: "Zona Industrial San José, San Pedro Sula",
    category: "Tintas Flexo",
    currency: "USD",
    date: "2026-09-03",
    expectedDate: "2026-09-18",
    paymentTerms: "Crédito 30 días",
    status: "Aprobada",
    notes: "Entregar en almacén central de materias primas con certificado de calidad del lote.",
    lines: [
      { id: "1", productName: "Tinta Flexográfica Cian UV", sku: "TIN-UV-01", description: "Cubeta de 20kg alta viscosidad", quantity: 5, rate: 450.00, total: 2250.00 },
      { id: "2", productName: "Tinta Flexográfica Magenta UV", sku: "TIN-UV-02", description: "Cubeta de 20kg alta viscosidad", quantity: 5, rate: 450.00, total: 2250.00 },
      { id: "3", productName: "Solvente de Limpieza Flexo", sku: "SOL-FL-09", description: "Tambor de 55 galones", quantity: 2, rate: 975.00, total: 1950.00 },
    ],
  });

  const poSubtotal = poForm.lines.reduce((acc, l) => acc + (l.total || 0), 0);
  const poTotal = poSubtotal;

  // Initialize PO Form if editingPurchaseOrder is passed or changed
  useEffect(() => {
    if (currentView === "orden-compra-editor" && editingPurchaseOrder) {
      handleOpenPOEditor(editingPurchaseOrder);
    }
  }, [currentView, editingPurchaseOrder]);

  const handleOpenPOEditor = (poToEdit?: any) => {
    if (poToEdit) {
      setSelectedPurchaseOrder(poToEdit);
      const lines = Array.isArray(poToEdit.items) && poToEdit.items.length > 0
        ? poToEdit.items.map((it: any, idx: number) => ({
            id: it.id || String(idx + 1),
            productName: it.productName || "Insumo",
            sku: it.sku || "",
            description: it.description || "",
            quantity: Number(it.quantity) || 1,
            rate: Number(it.unitCost ?? it.rate) || 0,
            total: Number(it.totalCost ?? it.total) || 0,
          }))
        : [
            { id: "1", productName: `${poToEdit.category} - Lote de Insumos`, sku: "INS-001", description: `Suministro de insumos categoría ${poToEdit.category}`, quantity: 1, rate: poToEdit.total, total: poToEdit.total }
          ];

      setPOForm({
        num: poToEdit.num,
        vendorName: poToEdit.vendor,
        vendorEmail: poToEdit.vendorEmail || "compras@insumosflexo.hn",
        vendorAddress: poToEdit.vendorAddress || "Zona Industrial San José, San Pedro Sula",
        category: poToEdit.category || "Tintas Flexo",
        currency: poToEdit.currency || "USD",
        date: poToEdit.date,
        expectedDate: poToEdit.expectedDate || "2026-09-20",
        paymentTerms: poToEdit.paymentTerms || "Crédito 30 días",
        status: poToEdit.status,
        notes: poToEdit.notes || "Entregar en almacén central de materias primas con certificado de calidad del lote.",
        lines,
      });
    } else {
      const nextNum = `OC-2026-${Math.floor(100 + Math.random() * 900)}`;
      setSelectedPurchaseOrder(null);
      setPOForm({
        num: nextNum,
        vendorName: vendors[0]?.name || "Insumos Flexográficos S.A.",
        vendorEmail: vendors[0]?.email || "compras@insumosflexo.hn",
        vendorAddress: vendors[0]?.address || "Zona Industrial San José, San Pedro Sula",
        category: "Tintas Flexo",
        currency: "USD",
        date: new Date().toISOString().split("T")[0],
        expectedDate: "2026-09-20",
        paymentTerms: "Crédito 30 días",
        status: "Aprobada",
        notes: "Favor incluir certificado de análisis y cumplir normas de seguridad en transporte.",
        lines: [
          { id: "1", productName: "Materia Prima Flexográfica", sku: "MAT-FLX-01", description: "Insumo de producción estándar", quantity: 10, rate: 250.00, total: 2500.00 },
        ],
      });
    }
    onNavigateToView("orden-compra-editor");
  };

  const handleClosePOEditor = () => {
    onNavigateToView("lista-ordenes-compra");
  };

  const handlePOLineChange = (id: string, field: string, val: any) => {
    setPOForm((prev) => {
      const newLines = prev.lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        if (field === "quantity" || field === "rate") {
          updated.total = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      });
      return { ...prev, lines: newLines };
    });
  };

  const handleAddPOLine = () => {
    setPOForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: Date.now().toString(),
          productName: "",
          sku: "",
          description: "",
          quantity: 1,
          rate: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleRemovePOLine = (id: string) => {
    if (poForm.lines.length <= 1) return;
    setPOForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== id),
    }));
  };

  const handleUpdatePOStatus = (num: string, newStatus: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.num === num ? { ...po, status: newStatus } : po))
    );
    if (selectedPurchaseOrder && selectedPurchaseOrder.num === num) {
      setSelectedPurchaseOrder({ ...selectedPurchaseOrder, status: newStatus });
    }
  };

  const handleSavePOEditor = async (statusOverride?: string) => {
    const finalStatus = statusOverride || poForm.status;
    const poTotalVal = poForm.lines.reduce((acc, l) => acc + l.total, 0);
    const existing = purchaseOrders.find((p) => p.num === poForm.num);
    const matchingVendor = vendors.find(
      (v) => v.name.toLowerCase().trim() === poForm.vendorName.toLowerCase().trim()
    );

    // Optimistic UI update
    if (existing) {
      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.num === poForm.num
            ? {
                ...p,
                vendor: poForm.vendorName,
                vendorEmail: poForm.vendorEmail,
                vendorAddress: poForm.vendorAddress,
                category: poForm.category,
                total: poTotalVal,
                status: finalStatus,
                date: poForm.date,
                expectedDate: poForm.expectedDate,
                paymentTerms: poForm.paymentTerms,
                notes: poForm.notes,
              }
            : p
        )
      );
    } else {
      setPurchaseOrders((prev) => [
        {
          num: poForm.num,
          date: poForm.date,
          vendor: poForm.vendorName,
          vendorEmail: poForm.vendorEmail,
          vendorAddress: poForm.vendorAddress,
          category: poForm.category,
          total: poTotalVal,
          status: finalStatus,
          expectedDate: poForm.expectedDate,
          paymentTerms: poForm.paymentTerms,
          notes: poForm.notes,
        },
        ...prev,
      ]);
    }

    const payload = {
      orderNumber: poForm.num,
      vendorId: matchingVendor?.id || null,
      vendorName: poForm.vendorName,
      vendorEmail: poForm.vendorEmail,
      vendorAddress: poForm.vendorAddress,
      category: poForm.category,
      issueDate: poForm.date,
      expectedDate: poForm.expectedDate,
      paymentTerms: poForm.paymentTerms,
      currency: poForm.currency,
      status: finalStatus,
      notes: poForm.notes,
      items: poForm.lines.map((l) => ({
        productName: l.productName || "Material o Insumo",
        sku: l.sku || null,
        description: l.description || null,
        quantity: Number(l.quantity) || 1,
        unitCost: Number(l.rate) || 0,
      })),
    };

    try {
      let res;
      if (existing) {
        res = await fetch(`/api/purchase-orders/${encodeURIComponent(existing.id || existing.num)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/purchase-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        setPOSuccessMsg(`¡Orden de compra ${poForm.num} guardada exitosamente!`);
        setTimeout(() => setPOSuccessMsg(""), 3500);
      } else {
        console.error("Error al guardar orden de compra:", json.error);
        alert(`Error al guardar orden: ${json.error}`);
      }
    } catch (err: any) {
      console.error("Error connecting to purchase orders API:", err);
      alert("Error al conectar con el servidor para guardar la orden.");
    }
  };

  const handleSendPOEmail = async () => {
    setSendingPOEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await handleSavePOEditor("Aprobada");
      setPOSuccessMsg(`¡Orden de compra ${poForm.num} enviada con éxito por correo a ${poForm.vendorName} (${poForm.vendorEmail})!`);
      setTimeout(() => setPOSuccessMsg(""), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingPOEmail(false);
    }
  };

  const downloadPOPDF = async () => {
    setShowPOPrintDropdown(false);
    setIsGeneratingPDF(true);
    try {
      const printableElem = document.getElementById("printable-po-document");
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

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      let heightLeft = imgHeight - pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanNum = (poForm.num || "orden_compra").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Orden_Compra_${cleanNum}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF de orden de compra:", error);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Purchase Invoices (Facturas de Compra) State & Handlers
  // -------------------------------------------------------------
  const [purchaseInvoicesSearch, setPurchaseInvoicesSearch] = useState("");
  const [purchaseInvoicesFilter, setPurchaseInvoicesFilter] = useState<"TODAS" | "PAGADAS" | "PENDIENTES" | "INGRESADAS">("TODAS");
  const [selectedDetailPurchaseInvoice, setSelectedDetailPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [purchaseInvoiceLoading, setPurchaseInvoiceLoading] = useState(false);
  const [purchaseInvoiceError, setPurchaseInvoiceError] = useState("");
  const [purchaseInvoiceSuccess, setPurchaseInvoiceSuccess] = useState("");

  const defaultPurchaseInvoiceForm = {
    invoiceNumber: "",
    purchaseOrderNumber: "",
    vendorName: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    currency: "USD",
    notes: "",
    items: [] as { sku: string; description: string; quantity: number; unitCost: number; lotNumber: string }[],
  };
  const [purchaseInvoiceForm, setPurchaseInvoiceForm] = useState(defaultPurchaseInvoiceForm);

  const handleOpenCreatePurchaseInvoice = () => {
    setPurchaseInvoiceForm({
      ...defaultPurchaseInvoiceForm,
      invoiceNumber: `FPROV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          sku: "MAT-FLX-01",
          description: "Materia Prima / Insumo Estándar",
          quantity: 1,
          unitCost: 100,
          lotNumber: `LOT-${new Date().toISOString().slice(0, 7)}-01`,
        },
      ],
    });
    setPurchaseInvoiceError("");
    setPurchaseInvoiceSuccess("");
    onNavigateToView("factura-compra-editor");
  };

  const handleCreatePurchaseInvoiceFromPO = (po: any) => {
    setPurchaseInvoiceError("");
    setPurchaseInvoiceSuccess("");
    const matchingVendor = vendors.find(
      (v) => v.name.toLowerCase().trim() === (po.vendor || "").toLowerCase().trim()
    );

    const mappedItems = Array.isArray(po.items) && po.items.length > 0
      ? po.items.map((it: any) => ({
          sku: it.sku || "INS-001",
          description: it.productName || it.description || "Insumo de compra",
          quantity: Number(it.quantity) || 1,
          unitCost: Number(it.unitCost ?? it.rate) || 0,
          lotNumber: `LOT-${new Date().toISOString().slice(0, 7)}-01`,
        }))
      : [
          {
            sku: "MAT-FLX-01",
            description: `${po.category || "Insumos"} - Suministro según OC ${po.num}`,
            quantity: 1,
            unitCost: Number(po.total) || 0,
            lotNumber: `LOT-${new Date().toISOString().slice(0, 7)}-01`,
          },
        ];

    const cleanSuffix = (po.num || "").replace(/[^0-9]/g, "").slice(-4) || String(Math.floor(100 + Math.random() * 900));
    setPurchaseInvoiceForm({
      invoiceNumber: `FPROV-2026-${cleanSuffix}`,
      purchaseOrderNumber: po.num,
      vendorName: po.vendor || matchingVendor?.name || "Proveedor General",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: po.expectedDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      currency: po.currency || "USD",
      notes: `Factura de compra generada automáticamente a partir de la Orden de Compra ${po.num}.`,
      items: mappedItems,
    });
    onNavigateToView("factura-compra-editor");
  };

  const handleSavePurchaseInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseInvoiceLoading(true);
    setPurchaseInvoiceError("");
    setPurchaseInvoiceSuccess("");

    if (!purchaseInvoiceForm.invoiceNumber || !purchaseInvoiceForm.vendorName) {
      setPurchaseInvoiceError("Ingrese el Nº de factura de proveedor y el proveedor.");
      setPurchaseInvoiceLoading(false);
      return;
    }

    if (purchaseInvoiceForm.items.length === 0) {
      setPurchaseInvoiceError("Agregue al menos un insumo/producto para ingresar al inventario.");
      setPurchaseInvoiceLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseInvoiceForm),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Error al registrar factura de compra");
      }

      const [invRes, itemsRes] = await Promise.all([
        fetch("/api/purchase-invoices").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json()),
      ]);

      if (invRes.success) setPurchaseInvoices(invRes.data);
      if (itemsRes.success && Array.isArray(itemsRes.data)) setInventory(itemsRes.data);

      setPurchaseInvoiceSuccess("Factura de Compra e Ingreso a Inventario registrado exitosamente.");
      if (onRefreshAccounts) onRefreshAccounts();
      setTimeout(() => {
        onNavigateToView("factura-compra-lista");
      }, 1200);
    } catch (err: any) {
      setPurchaseInvoiceError(err.message || "Ocurrió un error al guardar la factura de compra");
    } finally {
      setPurchaseInvoiceLoading(false);
    }
  };

  const handleUpdatePurchaseInvoiceStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/purchase-invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPurchaseInvoices((prev) =>
          prev.map((pi) => (pi.id === id ? { ...pi, paymentStatus: newStatus } : pi))
        );
      }
    } catch (err) {
      console.error("Error updating purchase invoice status:", err);
    }
  };

  // -------------------------------------------------------------
  // 3. Vendor Returns (Devoluciones a Proveedores) State & Handlers
  // -------------------------------------------------------------
  const [vendorReturnsSearch, setVendorReturnsSearch] = useState("");
  const [vendorReturnsFilter, setVendorReturnsFilter] = useState<"TODAS" | "BORRADOR" | "APROBADA" | "ENVIADA" | "COMPLETADA" | "ANULADA">("TODAS");
  const [showVendorReturnDrawer, setShowVendorReturnDrawer] = useState(false);
  const [editingVendorReturn, setEditingVendorReturn] = useState<VendorReturnRecord | null>(null);
  const [vendorReturnLoading, setVendorReturnLoading] = useState(false);
  const [vendorReturnError, setVendorReturnError] = useState("");
  const [vendorReturnSuccess, setVendorReturnSuccess] = useState("");
  const [vendorReturnDetailModal, setVendorReturnDetailModal] = useState<VendorReturnRecord | null>(null);

  const defaultVendorReturnForm = {
    returnNumber: "",
    vendorId: "",
    vendorName: "",
    purchaseInvoiceNumber: "",
    returnDate: new Date().toISOString().split("T")[0],
    reason: "DEFECTO",
    status: "BORRADOR",
    currency: "USD",
    notes: "",
    items: [] as VendorReturnItem[],
  };
  const [vendorReturnForm, setVendorReturnForm] = useState(defaultVendorReturnForm);

  const vendorReturnSubtotal = vendorReturnForm.items.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitCost ?? 0),
    0
  );

  const loadVendorReturns = async () => {
    try {
      const res = await fetch("/api/vendor-returns");
      if (res.ok) setVendorReturns(await res.json());
    } catch (e) {
      console.error("Error loading vendor returns:", e);
    }
  };

  const openNewVendorReturn = () => {
    const nextNum = `DEV-${new Date().getFullYear()}-${String(vendorReturns.length + 1).padStart(3, "0")}`;
    setVendorReturnForm({ ...defaultVendorReturnForm, returnNumber: nextNum });
    setEditingVendorReturn(null);
    setVendorReturnError("");
    setVendorReturnSuccess("");
    setShowVendorReturnDrawer(true);
  };

  const openEditVendorReturn = (vr: VendorReturnRecord) => {
    setVendorReturnForm({
      returnNumber: vr.returnNumber,
      vendorId: vr.vendorId ?? "",
      vendorName: vr.vendorName,
      purchaseInvoiceNumber: vr.purchaseInvoiceNumber ?? "",
      returnDate: vr.returnDate,
      reason: vr.reason,
      status: vr.status,
      currency: vr.currency,
      notes: vr.notes ?? "",
      items: vr.items.map((i) => ({ ...i })),
    });
    setEditingVendorReturn(vr);
    setVendorReturnError("");
    setVendorReturnSuccess("");
    setShowVendorReturnDrawer(true);
  };

  const handleSaveVendorReturn = async (approveOnSave = false) => {
    if (!vendorReturnForm.vendorName.trim()) {
      setVendorReturnError("El nombre del proveedor es obligatorio.");
      return;
    }
    if (!vendorReturnForm.returnNumber.trim()) {
      setVendorReturnError("El número de devolución es obligatorio.");
      return;
    }
    if (vendorReturnForm.items.length === 0) {
      setVendorReturnError("Debe agregar al menos un artículo.");
      return;
    }
    setVendorReturnLoading(true);
    setVendorReturnError("");
    try {
      const payload = {
        ...vendorReturnForm,
        status: approveOnSave ? "APROBADA" : vendorReturnForm.status,
        subtotal: vendorReturnSubtotal,
        total: vendorReturnSubtotal,
        items: vendorReturnForm.items.map((item) => ({
          ...item,
          totalCost: (item.quantity ?? 0) * (item.unitCost ?? 0),
        })),
      };
      const url = editingVendorReturn
        ? `/api/vendor-returns/${editingVendorReturn.id}`
        : "/api/vendor-returns";
      const method = editingVendorReturn ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setVendorReturnError(err.error ?? "Error al guardar.");
        return;
      }
      setVendorReturnSuccess(approveOnSave ? "¡Devolución aprobada!" : "¡Devolución guardada!");
      await loadVendorReturns();
      setTimeout(() => {
        setShowVendorReturnDrawer(false);
        setVendorReturnSuccess("");
      }, 1500);
    } catch (e) {
      setVendorReturnError("Error de conexión.");
    } finally {
      setVendorReturnLoading(false);
    }
  };

  const handleVendorReturnStatusChange = async (vr: VendorReturnRecord, newStatus: string) => {
    try {
      const res = await fetch(`/api/vendor-returns/${vr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await loadVendorReturns();
    } catch (e) {
      console.error("Error updating vendor return status:", e);
    }
  };

  const handleDeleteVendorReturn = async (vr: VendorReturnRecord) => {
    if (!confirm(`¿Eliminar devolución ${vr.returnNumber}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/vendor-returns/${vr.id}`, { method: "DELETE" });
      if (res.ok) await loadVendorReturns();
      else {
        const err = await res.json();
        alert(err.error ?? "Error al eliminar.");
      }
    } catch (e) {
      console.error("Error deleting vendor return:", e);
    }
  };

  const addVendorReturnLine = () => {
    setVendorReturnForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { sku: "", description: "", quantity: 1, unitCost: 0, totalCost: 0, lotNumber: "", itemReason: "" },
      ],
    }));
  };

  const updateVendorReturnLine = (idx: number, field: keyof VendorReturnItem, value: string | number) => {
    setVendorReturnForm((prev) => {
      const items = [...prev.items];
      (items[idx] as any)[field] = value;
      items[idx].totalCost = (items[idx].quantity ?? 0) * (items[idx].unitCost ?? 0);
      return { ...prev, items };
    });
  };

  const removeVendorReturnLine = (idx: number) => {
    setVendorReturnForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const fillVendorReturnLineFromInventory = (idx: number, invItem: { sku: string; name: string; unitCost?: number; cost?: number }) => {
    setVendorReturnForm((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        sku: invItem.sku,
        description: invItem.name,
        unitCost: invItem.unitCost ?? invItem.cost ?? 0,
        totalCost: (items[idx].quantity ?? 1) * (invItem.unitCost ?? invItem.cost ?? 0),
      };
      return { ...prev, items };
    });
  };

  // Outside click listener for local PO dropdowns
  useEffect(() => {
    const anyOpen = showPOSaveDropdown || showPOPrintDropdown || showPOSendDropdown;
    if (!anyOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowPOSaveDropdown(false);
        setShowPOPrintDropdown(false);
        setShowPOSendDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [showPOSaveDropdown, showPOPrintDropdown, showPOSendDropdown]);

  // Filtered lists
  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter((inv) => {
      const q = purchaseInvoicesSearch.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.vendorName.toLowerCase().includes(q) ||
        (inv.purchaseOrderNumber && inv.purchaseOrderNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (purchaseInvoicesFilter === "TODAS") return true;
      if (purchaseInvoicesFilter === "PAGADAS") return inv.paymentStatus === "PAGADA";
      if (purchaseInvoicesFilter === "PENDIENTES") return inv.paymentStatus === "PENDIENTE";
      if (purchaseInvoicesFilter === "INGRESADAS") return inv.inventoryStatus === "INGRESADO";
      return true;
    });
  }, [purchaseInvoices, purchaseInvoicesSearch, purchaseInvoicesFilter]);

  const filteredVendorReturns = useMemo(() => {
    return vendorReturns.filter((vr) => {
      const q = vendorReturnsSearch.toLowerCase();
      const matchesSearch =
        !q ||
        vr.returnNumber.toLowerCase().includes(q) ||
        vr.vendorName.toLowerCase().includes(q) ||
        (vr.purchaseInvoiceNumber && vr.purchaseInvoiceNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (vendorReturnsFilter === "TODAS") return true;
      return vr.status === vendorReturnsFilter;
    });
  }, [vendorReturns, vendorReturnsSearch, vendorReturnsFilter]);

  return (
    <>
          {currentView === "lista-ordenes-compra" && (
            <div className="space-y-6 animate-in fade-in duration-150 p-6">
              {/* ================= SCREEN HEADER ================= */}
              <div className="space-y-4 print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar a Dashboard</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-semibold text-slate-500">Compras</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-900">Órdenes de Compra</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Órdenes de Compra
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                        Gestión de Compras (PO)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Control y trazabilidad de las compras de materia prima e insumos a proveedores.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPOEditor()}
                      className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span>
                      <span>Crear orden de compra</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid (Matching Dashboard Metric Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Monto Total en Órdenes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Monto Total Órdenes</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      ${totalPO.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">USD contratados</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </div>

                {/* Órdenes Recibidas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Órdenes Recibidas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      ${totalPORecibidas.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">{poRecibidas.length} orden en almacén</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                {/* Pendiente de Recibir */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1b426e]">Pendiente de Recibir</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#1b426e] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#1b426e] tracking-tight">
                      ${totalPOPendientes.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{poPendientes.length} órdenes en tránsito</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1b426e]" />
                </div>

                {/* Órdenes Registradas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Órdenes Registradas</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{purchaseOrders.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Órdenes activas</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Buscar por N.º de orden, proveedor, categoría..."
                      value={searchPO}
                      onChange={(e) => setSearchPO(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {(() => {
                    const filteredPOs = purchaseOrders.filter((po) =>
                      !searchPO ||
                      po.num.toLowerCase().includes(searchPO.toLowerCase()) ||
                      po.vendor.toLowerCase().includes(searchPO.toLowerCase()) ||
                      (po.category && po.category.toLowerCase().includes(searchPO.toLowerCase()))
                    );
                    return (
                      <span className="text-xs text-slate-500 font-medium">
                        Mostrando {filteredPOs.length} {filteredPOs.length === 1 ? "orden" : "órdenes"} de compra
                      </span>
                    );
                  })()}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3 px-4">N.º Orden</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Proveedor</th>
                        <th className="py-3 px-4">Categoría Insumos</th>
                        <th className="py-3 px-4 text-right">Monto Total</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {loading ? (
                        <TableRowsSkeleton rows={6} cols={7} />
                      ) : (() => {
                        const filteredPOs = purchaseOrders.filter((po) =>
                          !searchPO ||
                          po.num.toLowerCase().includes(searchPO.toLowerCase()) ||
                          po.vendor.toLowerCase().includes(searchPO.toLowerCase()) ||
                          (po.category && po.category.toLowerCase().includes(searchPO.toLowerCase()))
                        );

                        if (filteredPOs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                                No se encontraron órdenes de compra con el criterio de búsqueda.
                              </td>
                            </tr>
                          );
                        }

                        return filteredPOs.map((po) => (
                          <tr key={po.num} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{po.num}</td>
                            <td className="py-3.5 px-4 font-sans text-slate-600">{po.date}</td>
                            <td className="py-3.5 px-4 font-bold font-sans text-slate-900">{po.vendor}</td>
                            <td className="py-3.5 px-4 font-sans text-slate-600">{po.category}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">${po.total.toFixed(2)} USD</td>
                            <td className="py-3.5 px-4 text-center font-sans">
                              <select
                                value={po.status}
                                onChange={(e) => handleUpdatePOStatus(po.num, e.target.value)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer appearance-none outline-none border transition ${
                                  po.status === "Recibida"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : po.status === "Aprobada"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    : po.status === "Cancelada"
                                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                }`}
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Recibida">Recibida</option>
                                <option value="Cancelada">Cancelada</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPurchaseOrder(po);
                                    setShowPODetailModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px]"
                                  title="Ver detalle de la orden"
                                >
                                  Detalle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPOEditor(po)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px]"
                                  title="Editar orden en pantalla completa"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreatePurchaseInvoiceFromPO(po)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold cursor-pointer transition text-[11px]"
                                  title="Convertir esta orden en Factura de Compra"
                                >
                                  Facturar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenPOEditor(po);
                                    setTimeout(() => window.print(), 300);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold cursor-pointer transition text-[11px]"
                                  title="Imprimir documento de orden"
                                >
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: LISTA DE FACTURAS DE COMPRA ================= */}
          {currentView === "factura-compra-lista" && (
            <div className="space-y-6 animate-in fade-in duration-150 p-6">
              {/* ================= SCREEN HEADER ================= */}
              <div className="space-y-4 print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar a Dashboard</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-semibold text-slate-500">Compras</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-900">Facturas de Compra</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Facturas de Compra (Entradas de Inventario)
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                        Entradas de Stock
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registro de comprobantes fiscales de proveedores con incremento automático de existencias en almacén.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenCreatePurchaseInvoice}
                      className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span>
                      <span>Registrar Factura de Compra</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Facturado</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      ${purchaseInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Monto bruto acumulado USD</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-700">Cuentas por Pagar</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                      ${purchaseInvoices.filter((inv) => inv.paymentStatus === "PENDIENTE").reduce((acc, inv) => acc + (inv.total || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">Pendiente de pago a proveedores</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Facturas Pagadas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      ${purchaseInvoices.filter((inv) => inv.paymentStatus === "PAGADA").reduce((acc, inv) => acc + (inv.total || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">Total abonado / liquidado</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Entradas a Inventario</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {purchaseInvoices.filter((inv) => inv.inventoryStatus === "INGRESADO").length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Comprobantes procesados</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setPurchaseInvoicesFilter("TODAS")}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        purchaseInvoicesFilter === "TODAS"
                          ? "bg-[#1b426e] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      TODAS ({purchaseInvoices.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseInvoicesFilter("PENDIENTES")}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        purchaseInvoicesFilter === "PENDIENTES"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      PENDIENTES ({purchaseInvoices.filter((i) => i.paymentStatus === "PENDIENTE").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseInvoicesFilter("PAGADAS")}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        purchaseInvoicesFilter === "PAGADAS"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      PAGADAS ({purchaseInvoices.filter((i) => i.paymentStatus === "PAGADA").length})
                    </button>
                  </div>

                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Buscar por N° factura proveedor, OC o proveedor..."
                      value={purchaseInvoicesSearch}
                      onChange={(e) => setPurchaseInvoicesSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3.5 px-4">N° Factura Proveedor</th>
                        <th className="py-3.5 px-4">OC Relacionada</th>
                        <th className="py-3.5 px-4">Proveedor</th>
                        <th className="py-3.5 px-4">Fecha Emisión</th>
                        <th className="py-3.5 px-4 text-right">Total ($ USD)</th>
                        <th className="py-3.5 px-4 text-center">Estado Pago</th>
                        <th className="py-3.5 px-4 text-center">Entrada Stock</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <TableRowsSkeleton rows={6} cols={8} />
                      ) : (
                        <>
                          {filteredPurchaseInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-600">
                                {inv.purchaseOrderNumber || "—"}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {inv.vendorName}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {inv.issueDate}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                                ${(inv.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  inv.paymentStatus === "PAGADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {inv.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1 w-fit mx-auto">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>STOCK INGRESADO</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-1.5">
                                {inv.paymentStatus !== "PAGADA" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onPayVendor) onPayVendor(inv.vendorName);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#fff7ed] hover:bg-orange-100 text-[#ea580c] font-semibold cursor-pointer transition text-[11px] border border-[#ffedd5]"
                                    title="Registrar abono o cancelación de esta factura"
                                  >
                                    Pagar / Abonar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailPurchaseInvoice(inv)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px] border border-slate-200"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredPurchaseInvoices.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No se encontraron facturas de compra registradas.
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: DEVOLUCIONES A PROVEEDORES ================= */}
          {currentView === "devoluciones-proveedor" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar a Dashboard</span>
                  </button>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Devoluciones a Proveedores</span>
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {vendorReturns.length} registros
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gestión de notas de salida de mercancía por defectos, garantías, vencimientos o discrepancias.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir / Exportar</span>
                  </button>
                  <button
                    type="button"
                    onClick={openNewVendorReturn}
                    className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#1b426e]/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nueva Devolución</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Monto Total Devoluciones</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#1b426e] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      ${vendorReturns
                        .filter((r) => r.status !== "ANULADA")
                        .reduce((acc, r) => acc + (r.total || 0), 0)
                        .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">USD en crédito/reembolso</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1b426e]" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-700">Borradores Pendientes</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                      {vendorReturns.filter((r) => r.status === "BORRADOR").length}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">Sin aprobar ni despachar</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">Aprobadas / En Tránsito</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                      {vendorReturns.filter((r) => r.status === "APROBADA" || r.status === "ENVIADA").length}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium mt-1">Esperando confirmación prov.</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Completadas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      {vendorReturns.filter((r) => r.status === "COMPLETADA").length}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">Inventario actualizado</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["TODAS", "BORRADOR", "APROBADA", "ENVIADA", "COMPLETADA", "ANULADA"] as const).map((filterOpt) => {
                    const count = filterOpt === "TODAS"
                      ? vendorReturns.length
                      : vendorReturns.filter((r) => r.status === filterOpt).length;
                    return (
                      <button
                        key={filterOpt}
                        type="button"
                        onClick={() => setVendorReturnsFilter(filterOpt)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          vendorReturnsFilter === filterOpt
                            ? "bg-[#1b426e] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{filterOpt}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          vendorReturnsFilter === filterOpt
                            ? "bg-white/20 text-white font-bold"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Buscar por N° dev, proveedor, factura o motivo..."
                    value={vendorReturnsSearch}
                    onChange={(e) => setVendorReturnsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3.5 px-4">N° Devolución</th>
                        <th className="py-3.5 px-4">Proveedor</th>
                        <th className="py-3.5 px-4">Factura Ref.</th>
                        <th className="py-3.5 px-4">Fecha</th>
                        <th className="py-3.5 px-4">Motivo</th>
                        <th className="py-3.5 px-4 text-center">Ítems</th>
                        <th className="py-3.5 px-4 text-right">Total ($ USD)</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVendorReturns.map((vr) => {
                        const statusColors: Record<string, string> = {
                          BORRADOR: "bg-amber-100 text-amber-800 border-amber-200",
                          APROBADA: "bg-blue-100 text-blue-800 border-blue-200",
                          ENVIADA: "bg-purple-100 text-purple-800 border-purple-200",
                          COMPLETADA: "bg-emerald-100 text-emerald-800 border-emerald-200",
                          ANULADA: "bg-slate-100 text-slate-600 border-slate-200",
                        };
                        const reasonLabels: Record<string, string> = {
                          DEFECTO: "Mercancía defectuosa",
                          EXCESO: "Exceso de pedido",
                          INCORRECTO: "Producto incorrecto",
                          VENCIDO: "Producto vencido",
                          OTRO: "Otro motivo",
                        };
                        return (
                          <tr key={vr.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {vr.returnNumber}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {vr.vendorName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {vr.purchaseInvoiceNumber || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {vr.returnDate}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                                {reasonLabels[vr.reason] || vr.reason}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                              {vr.items?.length || 0}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              ${(vr.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${statusColors[vr.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                {vr.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setVendorReturnDetailModal(vr)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px] border border-slate-200"
                              >
                                Ver Detalle
                              </button>

                              {vr.status === "BORRADOR" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVendorReturnStatusChange(vr, "APROBADA")}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold cursor-pointer transition text-[11px] border border-blue-200"
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditVendorReturn(vr)}
                                    className="px-2.5 py-1 rounded-lg bg-[#fff7ed] hover:bg-orange-100 text-[#1b426e] font-semibold cursor-pointer transition text-[11px] border border-orange-200"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVendorReturn(vr)}
                                    className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer transition text-[11px]"
                                    title="Eliminar borrador"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}

                              {vr.status === "APROBADA" && (
                                <button
                                  type="button"
                                  onClick={() => handleVendorReturnStatusChange(vr, "ENVIADA")}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold cursor-pointer transition text-[11px] border border-purple-200"
                                >
                                  Marcar Enviada
                                </button>
                              )}

                              {vr.status === "ENVIADA" && (
                                <button
                                  type="button"
                                  onClick={() => handleVendorReturnStatusChange(vr, "COMPLETADA")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold cursor-pointer transition text-[11px] border border-emerald-200"
                                >
                                  Completar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredVendorReturns.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <div className="max-w-xs mx-auto space-y-2">
                              <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <p className="font-semibold text-slate-600">No hay devoluciones registradas</p>
                              <p className="text-[11px] text-slate-400">
                                {vendorReturnsSearch ? "No se encontraron resultados con ese criterio de búsqueda." : "Crea la primera devolución haciendo clic en 'Nueva Devolución'."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: CREAR FACTURA DE COMPRA (Formal Registry) ================= */}
          {currentView === "factura-compra-editor" && (
            <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 text-slate-800 animate-in fade-in duration-150 overflow-hidden">
              {/* Header Bar */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigateToView("factura-compra-lista")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <div className="border-l border-slate-200 pl-4">
                    <h1 className="font-bold text-lg text-slate-900">Registrar Factura de Compra (Entrada de Inventario)</h1>
                    <p className="text-xs text-slate-500">Ingreso automático de productos a stock y creación de lotes en base de datos.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToView("factura-compra-lista")}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePurchaseInvoice}
                    disabled={purchaseInvoiceLoading}
                    className="px-6 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>{purchaseInvoiceLoading ? "Procesando..." : "Registrar Factura & Ingresar a Inventario"}</span>
                  </button>
                </div>
              </div>

              {/* Form Content Body */}
              <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
                {purchaseInvoiceError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    {purchaseInvoiceError}
                  </div>
                )}
                {purchaseInvoiceSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                    {purchaseInvoiceSuccess}
                  </div>
                )}

                {/* General Data Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                  <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                    Datos del Comprobante Fiscal del Proveedor
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">N° Factura de Proveedor *</label>
                      <input
                        type="text"
                        value={purchaseInvoiceForm.invoiceNumber}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, invoiceNumber: e.target.value })}
                        placeholder="FPROV-2026-089"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">N° Orden de Compra Relacionada</label>
                      <input
                        type="text"
                        value={purchaseInvoiceForm.purchaseOrderNumber}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, purchaseOrderNumber: e.target.value })}
                        placeholder="OC-2026-012"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-800 focus:outline-none focus:border-[#1b426e]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Proveedor Emitente *</label>
                      <select
                        value={purchaseInvoiceForm.vendorName}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, vendorName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                        required
                      >
                        {vendors.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha de Emisión</label>
                      <input
                        type="date"
                        value={purchaseInvoiceForm.issueDate}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, issueDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-[#1b426e]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={purchaseInvoiceForm.dueDate}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-[#1b426e]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Moneda</label>
                      <select
                        value={purchaseInvoiceForm.currency}
                        onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, currency: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#1b426e]"
                      >
                        <option value="USD">USD ($ - Dólar Estadounidense)</option>
                        <option value="HNL">HNL (L - Lempira Hondureño)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Received Items Card (Inventory Stock Update) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="font-bold text-sm text-slate-900">Insumos y Productos a Ingresar a Stock</h2>
                      <p className="text-[11px] text-slate-500">Selecciona el artículo para incrementar automáticamente su existencia actual.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const first = inventory[0];
                        setPurchaseInvoiceForm({
                          ...purchaseInvoiceForm,
                          items: [
                            ...purchaseInvoiceForm.items,
                            {
                              sku: first?.sku || `MAT-${Math.floor(100+Math.random()*900)}`,
                              description: first?.description || "Insumo Industrial",
                              quantity: 1,
                              unitCost: first?.cost || 50.0,
                              lotNumber: "",
                            },
                          ],
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#fff7ed] text-[#1b426e] border border-[#1b426e]/30 font-bold hover:bg-[#1b426e] hover:text-white transition cursor-pointer"
                    >
                      + Agregar Insumo
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-3">Artículo / SKU</th>
                          <th className="py-2.5 px-3">Descripción</th>
                          <th className="py-2.5 px-3 w-28">Cant. Recibida</th>
                          <th className="py-2.5 px-3 w-32">Costo Unit. ($)</th>
                          <th className="py-2.5 px-3 w-36">N° de Lote</th>
                          <th className="py-2.5 px-3 text-right w-32">Total ($)</th>
                          <th className="py-2.5 px-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseInvoiceForm.items.map((it, index) => (
                          <tr key={index}>
                            <td className="py-2.5 px-3">
                              <select
                                value={it.sku}
                                onChange={(e) => {
                                  const sel = inventory.find((inv) => inv.sku === e.target.value);
                                  const updatedItems = [...purchaseInvoiceForm.items];
                                  updatedItems[index] = {
                                    ...updatedItems[index],
                                    sku: e.target.value,
                                    description: sel ? sel.description : updatedItems[index].description,
                                    unitCost: sel ? sel.cost : updatedItems[index].unitCost,
                                  };
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none"
                              >
                                {inventory.map((inv) => (
                                  <option key={inv.id} value={inv.sku}>
                                    {inv.sku} - {inv.description.slice(0, 30)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={it.description}
                                onChange={(e) => {
                                  const updatedItems = [...purchaseInvoiceForm.items];
                                  updatedItems[index].description = e.target.value;
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => {
                                  const updatedItems = [...purchaseInvoiceForm.items];
                                  updatedItems[index].quantity = Number(e.target.value) || 0;
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-slate-300 font-bold text-slate-900 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="0.01"
                                value={it.unitCost}
                                onChange={(e) => {
                                  const updatedItems = [...purchaseInvoiceForm.items];
                                  updatedItems[index].unitCost = Number(e.target.value) || 0;
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-slate-300 font-bold text-slate-900 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                placeholder="OPCIONAL LOTE"
                                value={it.lotNumber}
                                onChange={(e) => {
                                  const updatedItems = [...purchaseInvoiceForm.items];
                                  updatedItems[index].lotNumber = e.target.value;
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-amber-50/50 border border-amber-200 font-mono text-amber-900 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              ${((it.quantity || 0) * (it.unitCost || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = purchaseInvoiceForm.items.filter((_, i) => i !== index);
                                  setPurchaseInvoiceForm({ ...purchaseInvoiceForm, items: updatedItems });
                                }}
                                className="text-slate-400 hover:text-red-600 font-bold p-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-end space-y-1 text-xs">
                    <div className="flex justify-between w-64 text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">
                        ${purchaseInvoiceForm.items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between w-64 text-slate-600">
                      <span>ISV 15%:</span>
                      <span className="font-mono font-bold">
                        ${(purchaseInvoiceForm.items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0), 0) * 0.15).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between w-64 text-slate-900 font-bold text-sm border-t border-slate-300 pt-1 mt-1">
                      <span>TOTAL FACTURA COMPRA:</span>
                      <span className="font-mono text-[#1b426e]">
                        ${(purchaseInvoiceForm.items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0), 0) * 1.15).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Textarea */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                  <label className="block font-bold text-slate-700">Observaciones y Notas de Entrada</label>
                  <textarea
                    rows={3}
                    value={purchaseInvoiceForm.notes}
                    onChange={(e) => setPurchaseInvoiceForm({ ...purchaseInvoiceForm, notes: e.target.value })}
                    placeholder="Detalles sobre estado de empaque, transporte o inspección de calidad al recibir insumos..."
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-[#1b426e] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

              {currentView === "orden-compra-editor" && (
                <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 text-slate-800 animate-in fade-in duration-150 overflow-hidden print:static print:inset-auto print:bg-white print:overflow-visible print:block print:p-0">

              
              {/* OFFICIAL PRINTABLE PURCHASE ORDER DOCUMENT */}
              <div
                id="printable-po-document"
                className="hidden print:flex min-h-[10.5in] flex-col justify-between p-8 bg-white text-slate-900 text-xs"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-[#1b426e] pb-6 mb-6">
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-[#1b426e]">WAYNE TRADEMARK</h1>
                      <p className="font-bold text-slate-900 text-sm mt-1">{companySettings.nombre}</p>
                      <p className="text-slate-600 text-xs">{companySettings.direccion}</p>
                      <p className="text-slate-600 text-xs">RTN: {companySettings.taxId} | Tel: {companySettings.telefono}</p>
                      <p className="text-slate-600 text-xs">Correo: {companySettings.email}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-slate-900">ORDEN DE COMPRA</h2>
                      <p className="font-mono font-bold text-slate-800 text-base">N.º {poForm.num}</p>
                      <p className="text-slate-600 text-xs mt-1"><strong>Fecha de emisión:</strong> {poForm.date}</p>
                      <p className="text-slate-600 text-xs"><strong>Entrega esperada:</strong> {poForm.expectedDate}</p>
                      <p className="text-slate-600 text-xs"><strong>Estado:</strong> {poForm.status}</p>
                    </div>
                  </div>

                  {/* 2-column info cards: Proveedor / Suplidor (izq) y Lugar de Entrega / Facturar a (der) */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                    {/* Proveedor */}
                    <div className="p-4 space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor / Suplidor:</span>
                      <p className="font-bold text-slate-900 text-sm">{poForm.vendorName || "Proveedor General"}</p>
                      {poForm.vendorAddress && (
                        <p className="text-slate-600 text-xs">{poForm.vendorAddress}</p>
                      )}
                      {poForm.vendorEmail && (
                        <p className="text-slate-600 text-xs">{poForm.vendorEmail}</p>
                      )}
                      <p className="text-slate-600 text-xs font-medium">Categoría: {poForm.category}</p>
                    </div>

                    {/* Entrega a */}
                    <div className="p-4 space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lugar de Entrega / Facturar a:</span>
                      <p className="font-bold text-slate-900 text-sm">{companySettings.nombre}</p>
                      <p className="text-slate-600 text-xs">{companySettings.direccion}</p>
                      <p className="text-slate-600 text-xs">Atención: Almacén de Insumos & Materia Prima</p>
                      <p className="text-slate-600 text-xs">Tel: {companySettings.telefono} • compras@waynetrademark.com</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left border-collapse mb-6">
                    <thead>
                      <tr className="border-b-2 border-[#1b426e] text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Insumo / Descripción</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Cant.</th>
                        <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                        <th className="py-2.5 px-3 text-right">Total (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poForm.lines.map((l, idx) => (
                        <tr key={l.id}>
                          <td className="py-3 px-3 font-mono text-slate-400 text-xs">{idx + 1}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div>{l.productName || "Insumo"}</div>
                            {l.description && <div className="text-[11px] text-slate-500 font-normal">{l.description}</div>}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-xs">{l.sku || "—"}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">{l.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">${l.rate.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">${l.total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Totals & Signatures */}
                <div className="mt-auto pt-6 space-y-6">
                  <div className="grid grid-cols-12 gap-6 items-start">
                    {/* Left: Notes & Valor en letras */}
                    <div className="col-span-7 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                          Valor en Letras (Dólares USD)
                        </span>
                        <p className="font-bold text-slate-800 text-xs uppercase leading-relaxed tracking-wide">
                          {numberToWordsSpanish(poTotal)} DÓLARES CON {Math.round((poTotal % 1) * 100).toString().padStart(2, "0")}/100 USD
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium">Documento Comercial de Compra</span>
                        <span className="font-mono font-semibold">Wayne Trademark</span>
                      </div>
                    </div>

                    {/* Right: Breakdown Table */}
                    <div className="col-span-5 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-1 text-xs">
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Subtotal Insumos</span>
                        <span className="font-mono font-bold text-slate-900">${poSubtotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Impuestos / Retenciones</span>
                        <span className="font-mono font-medium text-slate-700">$0.00</span>
                      </div>
                      <div className="border-t border-slate-100 my-0.5" />
                      <div className="pt-1">
                        <div className="flex justify-between items-center py-2.5 px-3.5 shadow-xs rounded-xl bg-[#1b426e] text-white">
                          <span className="font-black text-xs uppercase tracking-wider">Total Orden USD</span>
                          <span className="font-mono font-black text-base">${poTotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Línea con las notas */}
                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-slate-900 shrink-0">Notas:</span>
                    <span className="text-slate-600 leading-relaxed">{poForm.notes || "Sin notas adicionales."}</span>
                  </div>
                </div>
              </div>
              
              {/* TOP HEADER BAR */}
              <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleClosePOEditor}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 border-l border-slate-200 pl-4">
                    <span>Orden de compra {poForm.num}</span>
                  </h1>

                  {/* Nav Sub-Tabs */}
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-6">
                    {(["Editar", "Vista de correo", "Vista de PDF"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActivePOTab(tab)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          activePOTab === tab
                            ? "bg-[#fff7ed] text-[#1b426e] border border-[#1b426e]/30"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Right Actions */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={handleClosePOEditor}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* MAIN CONTENT WORKSPACE */}
              <div className="flex-1 flex overflow-hidden print:hidden">
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                  
                  {activePOTab === "Editar" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-5xl mx-auto space-y-8">
                      
                      {/* Notification Banner */}
                      {poSuccessMsg && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
                          <span className="font-bold">✓ {poSuccessMsg}</span>
                        </div>
                      )}

                      {/* HEADER ROW */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
                        <div className="space-y-1 text-xs text-slate-600 max-w-md">
                          <h2 className="text-xl font-black text-[#1b426e] tracking-tight mb-2">ORDEN DE COMPRA</h2>
                          <p className="font-bold text-slate-900 uppercase">{companySettings.nombre}</p>
                          <p>{companySettings.email} • {companySettings.telefono}</p>
                          <p>{companySettings.direccion}</p>
                        </div>

                        <div className="text-right space-y-3">
                          <div className="text-xs font-semibold text-slate-500">
                            Monto Total: <span className="font-bold text-slate-900 text-sm">${poTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })} USD</span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-500 font-semibold">Estado:</span>
                            <select
                              value={poForm.status}
                              onChange={(e) => setPOForm({ ...poForm, status: e.target.value })}
                              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer outline-none border transition ${
                                poForm.status === "Recibida"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : poForm.status === "Aprobada"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : poForm.status === "Pendiente"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Aprobada">Aprobada</option>
                              <option value="Recibida">Recibida</option>
                              <option value="Cancelada">Cancelada</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* VENDOR AND DATES GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                        {/* Vendor Selection */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Proveedor / Suplidor</label>
                          <select
                            value={poForm.vendorName}
                            onChange={(e) => {
                              const selected = vendors.find((v) => v.name === e.target.value);
                              setPOForm({
                                ...poForm,
                                vendorName: e.target.value,
                                vendorEmail: selected ? selected.email || "compras@proveedor.hn" : "compras@proveedor.hn",
                                vendorAddress: selected ? selected.address || "Dirección no especificada" : "San Pedro Sula",
                              });
                            }}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-semibold cursor-pointer shadow-2xs"
                          >
                            {vendors.map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name} ({v.currency})
                              </option>
                            ))}
                          </select>

                          {poForm.vendorEmail && (
                            <p className="text-[11px] text-slate-500">
                              Contacto compras: <span className="font-mono text-slate-700 font-semibold">{poForm.vendorEmail}</span>
                            </p>
                          )}
                        </div>

                        {/* PO Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">N.º de Orden</label>
                            <input
                              type="text"
                              value={poForm.num}
                              onChange={(e) => setPOForm({ ...poForm, num: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Categoría de Insumos</label>
                            <input
                              type="text"
                              value={poForm.category}
                              onChange={(e) => setPOForm({ ...poForm, category: e.target.value })}
                              placeholder="Ej. Tintas, Cartón"
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Fecha de Emisión</label>
                            <input
                              type="date"
                              value={poForm.date}
                              onChange={(e) => setPOForm({ ...poForm, date: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Entrega Esperada</label>
                            <input
                              type="date"
                              value={poForm.expectedDate}
                              onChange={(e) => setPOForm({ ...poForm, expectedDate: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ITEMS / MATERIALS TABLE */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Líneas de Insumos y Materias Primas</h3>
                          <button
                            type="button"
                            onClick={handleAddPOLine}
                            className="px-3 py-1.5 rounded-xl bg-[#fff7ed] hover:bg-[#ffedd5] text-[#1b426e] font-bold text-xs transition cursor-pointer border border-[#fed7aa] flex items-center gap-1"
                          >
                            <span>+ Añadir línea</span>
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                              <tr>
                                <th className="p-3 w-10 text-center">#</th>
                                <th className="p-3 min-w-[200px]">Insumo / Producto</th>
                                <th className="p-3 w-28">SKU</th>
                                <th className="p-3 min-w-[180px]">Descripción / Especificaciones</th>
                                <th className="p-3 w-24 text-right">Cantidad</th>
                                <th className="p-3 w-28 text-right">Precio Unit.</th>
                                <th className="p-3 w-28 text-right">Total (USD)</th>
                                <th className="p-3 w-12 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {poForm.lines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-slate-50/70 transition">
                                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={line.productName}
                                      onChange={(e) => handlePOLineChange(line.id, "productName", e.target.value)}
                                      placeholder="Nombre del insumo..."
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={line.sku}
                                      onChange={(e) => handlePOLineChange(line.id, "sku", e.target.value)}
                                      placeholder="SKU-001"
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={line.description}
                                      onChange={(e) => handlePOLineChange(line.id, "description", e.target.value)}
                                      placeholder="Detalle o lote..."
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={line.quantity}
                                      onChange={(e) => handlePOLineChange(line.id, "quantity", Number(e.target.value))}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-right focus:outline-none focus:border-[#1b426e] font-bold"
                                    />
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={line.rate}
                                      onChange={(e) => handlePOLineChange(line.id, "rate", Number(e.target.value))}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-right focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900">
                                    ${line.total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePOLine(line.id)}
                                      className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                                      title="Eliminar línea"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SUMMARY & NOTES GRID */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Notas e Instrucciones de Entrega</label>
                            <textarea
                              rows={3}
                              value={poForm.notes}
                              onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                              placeholder="Condiciones de recepción, horario de almacén..."
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>

                        {/* Totals Summary Column */}
                        <div className="space-y-3 text-xs text-right bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Subtotal</span>
                              <span className="font-bold text-slate-900">${poSubtotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                              <span>Total Orden de Compra</span>
                              <span className="text-3xl font-bold text-slate-900">${poTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })} USD</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 italic text-left pt-4">
                            Emisión en dólares (USD). Sujeta a términos de pago especificados en el contrato marco.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA DE CORREO */}
                  {activePOTab === "Vista de correo" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="font-bold text-base text-slate-900">Vista previa del correo para el proveedor</h3>
                        <p className="text-xs text-slate-500">Formato del correo automático que recibirá {poForm.vendorName}.</p>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700 font-sans">
                        <div className="space-y-1 border-b border-slate-200 pb-3">
                          <p><strong>De:</strong> compras@waynetrademark.com</p>
                          <p><strong>Para:</strong> {poForm.vendorEmail}</p>
                          <p><strong>Asunto:</strong> Orden de Compra {poForm.num} - Wayne Trademark</p>
                        </div>
                        <p>Estimado equipo de {poForm.vendorName},</p>
                        <p>Adjunto a este correo enviamos la **Orden de Compra {poForm.num}** por un importe total de **${poTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })} USD** correspondiente a insumos de {poForm.category}.</p>
                        <p>Agradecemos confirmar recepción e indicar la fecha programada de despacho a nuestro almacén.</p>
                      </div>
                    </div>
                  )}

                  {/* VISTA DE PDF */}
                  {activePOTab === "Vista de PDF" && (
                    <div className="overflow-x-auto pb-12 flex flex-col items-center">
                      <div className="w-[8.5in] min-h-[11in] bg-white border border-slate-300 rounded-xs shadow-2xl p-12 flex flex-col justify-between animate-in fade-in duration-150 text-xs text-slate-800 shrink-0">
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex justify-between items-start border-b-2 border-[#1b426e] pb-6">
                            <div>
                              <h1 className="text-2xl font-black tracking-tight text-[#1b426e]">WAYNE TRADEMARK</h1>
                              <p className="font-bold text-slate-900 mt-1">{companySettings.nombre}</p>
                              <p className="text-slate-500">{companySettings.direccion}</p>
                              <p className="text-slate-500">RTN: {companySettings.taxId}</p>
                              <p className="text-slate-500">Tel: {companySettings.telefono} • {companySettings.email}</p>
                            </div>
                            <div className="text-right">
                              <h2 className="text-xl font-bold text-slate-900">ORDEN DE COMPRA</h2>
                              <p className="font-mono font-bold text-slate-700 text-sm">N.º {poForm.num}</p>
                              <p className="text-slate-500 mt-1">Fecha de emisión: {poForm.date}</p>
                              <p className="text-slate-500">Entrega esperada: {poForm.expectedDate}</p>
                              <p className="text-slate-500">Estado: <span className="font-semibold text-emerald-700">{poForm.status}</span></p>
                            </div>
                          </div>

                          {/* Proveedor / Suplidor (izq) y Lugar de Entrega / Facturar a (der) */}
                          <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                            {/* Proveedor */}
                            <div className="p-4 space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor / Suplidor:</span>
                              <p className="font-bold text-slate-900 text-sm">{poForm.vendorName || "Proveedor General"}</p>
                              {poForm.vendorAddress && (
                                <p className="text-slate-500 text-xs">{poForm.vendorAddress}</p>
                              )}
                              {poForm.vendorEmail && (
                                <p className="text-slate-500 text-xs">{poForm.vendorEmail}</p>
                              )}
                              <p className="text-slate-500 text-xs font-medium">Categoría: {poForm.category}</p>
                            </div>

                            {/* Entrega a */}
                            <div className="p-4 space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lugar de Entrega / Facturar a:</span>
                              <p className="font-bold text-slate-900 text-sm">{companySettings.nombre}</p>
                              <p className="text-slate-500 text-xs">{companySettings.direccion}</p>
                              <p className="text-slate-500 text-xs">Atención: Almacén de Insumos & Materia Prima</p>
                              <p className="text-slate-500 text-xs">Tel: {companySettings.telefono} • compras@waynetrademark.com</p>
                            </div>
                          </div>

                          {/* Items Table */}
                          <table className="w-full text-left border-collapse mb-6">
                            <thead>
                              <tr className="border-b-2 border-[#1b426e] text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Insumo / Descripción</th>
                                <th className="py-2.5 px-3">SKU</th>
                                <th className="py-2.5 px-3 text-right">Cant.</th>
                                <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                                <th className="py-2.5 px-3 text-right">Total (USD)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {poForm.lines.map((l, idx) => (
                                <tr key={l.id}>
                                  <td className="py-3 px-3 font-mono text-slate-400 text-xs">{idx + 1}</td>
                                  <td className="py-3 px-3 font-semibold text-slate-900">
                                    <div>{l.productName || "Insumo"}</div>
                                    {l.description && <div className="text-[11px] text-slate-500 font-normal">{l.description}</div>}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-slate-500 text-xs">{l.sku || "—"}</td>
                                  <td className="py-3 px-3 text-right font-mono text-slate-700">{l.quantity}</td>
                                  <td className="py-3 px-3 text-right font-mono text-slate-700">${l.rate.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">${l.total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals & Notes + Signatures */}
                        <div className="mt-auto pt-6 space-y-6">
                          <div className="grid grid-cols-12 gap-6 items-start">
                            {/* Left: VALOR EN LETRAS & NOTAS */}
                            <div className="col-span-7 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                  Valor en Letras (Dólares USD)
                                </span>
                                <p className="font-bold text-slate-800 text-xs uppercase leading-relaxed tracking-wide">
                                  {numberToWordsSpanish(poTotal)} DÓLARES CON {Math.round((poTotal % 1) * 100).toString().padStart(2, "0")}/100 USD
                                </p>
                              </div>
                              <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-medium">Documento Comercial de Compra</span>
                                <span className="font-mono font-semibold">Wayne Trademark</span>
                              </div>
                            </div>

                            {/* Right: Breakdown Table */}
                            <div className="col-span-5 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-1 text-xs">
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Subtotal Insumos</span>
                                <span className="font-mono font-bold text-slate-900">${poSubtotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Impuestos / Retenciones</span>
                                <span className="font-mono font-medium text-slate-700">$0.00</span>
                              </div>
                              <div className="border-t border-slate-100 my-0.5" />
                              <div className="pt-1">
                                <div className="flex justify-between items-center py-2.5 px-3.5 shadow-xs rounded-xl bg-[#1b426e] text-white">
                                  <span className="font-black text-xs uppercase tracking-wider">Total Orden USD</span>
                                  <span className="font-mono font-black text-base">${poTotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Línea con las notas */}
                          <div className="pt-4 border-t border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                            <span className="font-bold text-slate-900 shrink-0">Notas:</span>
                            <span className="text-slate-600 leading-relaxed">{poForm.notes || "Sin notas adicionales."}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* FIXED BOTTOM ACTION BAR */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between z-30 shadow-lg shrink-0 print:hidden">
                <div data-dropdown="true" className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPOPrintDropdown(!showPOPrintDropdown)}
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

                  {showPOPrintDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs font-normal text-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPOPrintDropdown(false);
                          window.print();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 flex items-center justify-between"
                      >
                        <span>Imprimir Documento</span>
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPOPrintDropdown(false);
                          downloadPOPDF();
                        }}
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

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClosePOEditor}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleSavePOEditor()}
                      className="px-5 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      Guardar y aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPOSaveDropdown(!showPOSaveDropdown)}
                      className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showPOSaveDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showPOSaveDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPOSaveDropdown(false);
                            handleSavePOEditor("Aprobada");
                            handleClosePOEditor();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Guardar y cerrar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPOSaveDropdown(false);
                            handleSavePOEditor("Pendiente");
                            handleClosePOEditor();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Guardar como borrador
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Split Button 2: Revisar y enviar (al proveedor por email) */}
                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="button"
                      disabled={sendingPOEmail}
                      onClick={handleSendPOEmail}
                      className="px-5 py-2 rounded-l-lg bg-[#004d40] hover:bg-[#00382e] text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingPOEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando al proveedor...</span>
                        </>
                      ) : (
                        <span>Revisar y enviar</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPOSendDropdown(!showPOSendDropdown)}
                      className="px-2.5 py-2 rounded-r-lg bg-[#00382e] hover:bg-[#002821] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showPOSendDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showPOSendDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPOSendDropdown(false);
                            setActivePOTab("Vista de PDF");
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Vista previa PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPOSendDropdown(false);
                            setActivePOTab("Vista de correo");
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Vista previa correo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </footer>

              {/* SIDEBAR MODAL DRAWER: OPCIONES DE ORDEN DE COMPRA (Boton Administrar) */}
              {showPOOptionsSidebar && (
                <div className="fixed inset-0 z-50 flex justify-end">
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity z-50"
                    onClick={() => setShowPOOptionsSidebar(false)}
                  />

                  {/* Drawer Panel */}
                  <aside className="relative z-50 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                      <h3 className="font-bold text-sm text-slate-900">Orden de compra {poForm.num}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Administrar</span>
                        <button
                          type="button"
                          onClick={() => setShowPOOptionsSidebar(false)}
                          className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Content Accordions */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
                      
                      {/* Section 1: Configuración de Proveedor y Moneda */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePOOptionSection(
                              activePOOptionSection === "general" ? null : "general"
                            )
                          }
                          className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                        >
                          <span>General y Moneda</span>
                          <span className={`text-slate-400 transition-transform ${activePOOptionSection === "general" ? "rotate-180" : ""}`}>▾</span>
                        </button>
                        {activePOOptionSection === "general" && (
                          <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                            <label className="block">
                              <span className="font-semibold block mb-1">Moneda de la orden</span>
                              <select
                                value={poForm.currency || "USD"}
                                onChange={(e) => setPOForm({ ...poForm, currency: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                              >
                                <option value="USD">USD ($ Dólar estadounidense)</option>
                                <option value="HNL">HNL (L Lempira hondureño)</option>
                              </select>
                            </label>

                            <label className="block">
                              <span className="font-semibold block mb-1">Categoría de insumos</span>
                              <input
                                type="text"
                                value={poForm.category}
                                onChange={(e) => setPOForm({ ...poForm, category: e.target.value })}
                                placeholder="Ej. Tintas, Cartón, Solventes"
                                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Recepción y Almacén */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePOOptionSection(
                              activePOOptionSection === "recepcion" ? null : "recepcion"
                            )
                          }
                          className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                        >
                          <span>Recepción y Almacén</span>
                          <span className={`text-slate-400 transition-transform ${activePOOptionSection === "recepcion" ? "rotate-180" : ""}`}>▾</span>
                        </button>
                        {activePOOptionSection === "recepcion" && (
                          <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                            <label className="block">
                              <span className="font-semibold block mb-1">Almacén de destino</span>
                              <select className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900">
                                <option>Almacén Central - San Pedro Sula</option>
                                <option>Almacén Insumos UV - Tegucigalpa</option>
                                <option>Bodega Materia Prima Flexo</option>
                              </select>
                            </label>

                            <div className="space-y-2 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1b426e]" />
                                <span>Requiere certificado de calidad del lote</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1b426e]" />
                                <span>Notificar a almacén vía correo al despachar</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 3: Integración Macola / ERP */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePOOptionSection(
                              activePOOptionSection === "macola" ? null : "macola"
                            )
                          }
                          className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                        >
                          <span>Integración Macola ERP</span>
                          <span className={`text-slate-400 transition-transform ${activePOOptionSection === "macola" ? "rotate-180" : ""}`}>▾</span>
                        </button>
                        {activePOOptionSection === "macola" && (
                          <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                              <p><strong>Estado Sync:</strong> <span className="text-emerald-700 font-bold">Lista para sincronizar</span></p>
                              <p><strong>Módulo Macola:</strong> PO (Purchase Orders)</p>
                            </div>

                            <label className="block">
                              <span className="font-semibold block mb-1">Centro de Costos</span>
                              <input
                                type="text"
                                defaultValue="CC-102 (Producción Flexográfica)"
                                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Archivos Adjuntos */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePOOptionSection(
                              activePOOptionSection === "adjuntos" ? null : "adjuntos"
                            )
                          }
                          className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                        >
                          <span>Archivos Adjuntos</span>
                          <span className={`text-slate-400 transition-transform ${activePOOptionSection === "adjuntos" ? "rotate-180" : ""}`}>▾</span>
                        </button>
                        {activePOOptionSection === "adjuntos" && (
                          <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#1b426e] transition cursor-pointer bg-slate-50/50">
                              <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="font-semibold text-[#1b426e] text-xs">Adjuntar ficha técnica / contrato</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG hasta 15MB</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowPOOptionsSidebar(false)}
                        className="w-full py-2 bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Aplicar y cerrar
                      </button>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

      {/* ================= MODAL: DETALLE DE ORDEN DE COMPRA ================= */}
      {showPODetailModal && selectedPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header (Light theme) */}
            <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fff7ed] text-[#1b426e] border border-[#fed7aa] flex items-center justify-center shadow-xs">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Orden de Compra {selectedPurchaseOrder.num}</h2>
                    <select
                      value={selectedPurchaseOrder.status}
                      onChange={(e) => handleUpdatePOStatus(selectedPurchaseOrder.num, e.target.value)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer outline-none border transition ${
                        selectedPurchaseOrder.status === "Recibida"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : selectedPurchaseOrder.status === "Aprobada"
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : selectedPurchaseOrder.status === "Cancelada"
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Aprobada">Aprobada</option>
                      <option value="Recibida">Recibida</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500">Emitida el {selectedPurchaseOrder.date} para {selectedPurchaseOrder.vendor}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowPODetailModal(false); setSelectedPurchaseOrder(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Información del Proveedor</span>
                  <p className="font-bold text-sm text-slate-900">{selectedPurchaseOrder.vendor}</p>
                  <p className="text-slate-600">RTN: 08019998124091</p>
                  <p className="text-slate-600">Contacto: {selectedPurchaseOrder.vendorEmail || `ventas@${selectedPurchaseOrder.vendor.toLowerCase().replace(/[^a-z]/g, "")}.hn`}</p>
                  <p className="text-slate-600">Dirección: {selectedPurchaseOrder.vendorAddress || "Zona Industrial San José, San Pedro Sula"}</p>
                </div>

                {/* Logistics Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Detalles de Almacén y Entrega</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Categoría:</span>
                      <span className="font-semibold text-slate-800">{selectedPurchaseOrder.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Almacén Destino:</span>
                      <span className="font-semibold text-slate-800">Almacén Central #1</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Condición Pago:</span>
                      <span className="font-semibold text-slate-800">{selectedPurchaseOrder.paymentTerms || "Crédito 30 días"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha Entrega:</span>
                      <span className="font-semibold text-slate-800">{selectedPurchaseOrder.expectedDate || "2026-09-18"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <span>Ítems / Materiales Solicitados</span>
                  <span className="text-[11px] font-normal text-slate-500">Multimoneda {selectedPurchaseOrder.currency || "USD"} ($)</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Descripción del Material</th>
                      <th className="py-2.5 px-4 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 text-right">Precio Unitario</th>
                      <th className="py-2.5 px-4 text-right">Importe Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(Array.isArray(selectedPurchaseOrder.items) && selectedPurchaseOrder.items.length > 0
                      ? selectedPurchaseOrder.items.map((item: any) => ({
                          sku: item.sku || "N/A",
                          desc: item.productName || item.description || "Insumo",
                          qty: Number(item.quantity) || 1,
                          price: Number(item.unitCost ?? item.rate) || 0,
                          total: Number(item.totalCost ?? item.total) || 0,
                        }))
                      : [
                          { sku: "MAT-FLX-001", desc: `${selectedPurchaseOrder.category} - Lote Premium Grado A`, qty: 25, price: selectedPurchaseOrder.total * 0.028, total: selectedPurchaseOrder.total * 0.7 },
                          { sku: "MAT-FLX-002", desc: `Complementos y Soluciones para ${selectedPurchaseOrder.category}`, qty: 10, price: selectedPurchaseOrder.total * 0.03, total: selectedPurchaseOrder.total * 0.3 },
                        ]
                    ).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-[#1b426e]">{item.sku}</td>
                        <td className="py-3 px-4 font-sans text-slate-800 font-medium">{item.desc}</td>
                        <td className="py-3 px-4 text-center font-bold">{item.qty}</td>
                        <td className="py-3 px-4 text-right">${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-right">
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">${(selectedPurchaseOrder.subtotal ?? selectedPurchaseOrder.total * 0.85).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Impuesto IVA (15%):</span>
                    <span className="font-mono font-medium">${(selectedPurchaseOrder.tax ?? selectedPurchaseOrder.total * 0.15).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Orden ({selectedPurchaseOrder.currency || "USD"}):</span>
                    <span className="font-mono text-[#1b426e]">${selectedPurchaseOrder.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPOEditor(selectedPurchaseOrder); setShowPODetailModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Editar orden
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCreatePurchaseInvoiceFromPO(selectedPurchaseOrder); setShowPODetailModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition cursor-pointer"
                >
                  Convertir a Factura
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Imprimir PDF
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPODetailModal(false); setSelectedPurchaseOrder(null); }}
                  className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md shadow-[#1b426e]/20"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>

      )}

      {/* ================= MODALES DE COMPRAS & DEVOLUCIONES ================= */}
      {/* ================= MODAL: DETALLE DE FACTURA DE COMPRA ================= */}
      {selectedDetailPurchaseInvoice && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Factura de Compra</span>
                <h3 className="font-bold text-base text-slate-900 font-mono">
                  {selectedDetailPurchaseInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailPurchaseInvoice(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Proveedor</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedDetailPurchaseInvoice.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">OC Relacionada</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">{selectedDetailPurchaseInvoice.purchaseOrderNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Fecha Emisión</span>
                  <span className="font-medium text-slate-800 block mt-0.5">{selectedDetailPurchaseInvoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Estado Pago</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${
                    selectedDetailPurchaseInvoice.paymentStatus === "PAGADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedDetailPurchaseInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Insumos y Productos Ingresados a Inventario</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5 text-center">Cant.</th>
                        <th className="p-2.5 text-right">Costo Unit.</th>
                        <th className="p-2.5 text-center">Lote</th>
                        <th className="p-2.5 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailPurchaseInvoice.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{it.sku}</td>
                          <td className="p-2.5 text-slate-700">{it.description}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">+{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono">${it.unitCost.toFixed(2)}</td>
                          <td className="p-2.5 text-center font-mono text-amber-800">{it.lotNumber || "—"}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">${it.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Factura Fiscal:</span>
                <span className="text-base text-[#1b426e] font-mono">${selectedDetailPurchaseInvoice.total.toFixed(2)} USD</span>
              </div>

              {selectedDetailPurchaseInvoice.notes && (
                <div className="text-[11px] text-slate-600 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
                  <span className="font-bold block mb-0.5">Observaciones:</span>
                  {selectedDetailPurchaseInvoice.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedDetailPurchaseInvoice(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
              {selectedDetailPurchaseInvoice.paymentStatus !== "PAGADA" && (
                <button
                  type="button"
                  onClick={() => {
                    const vName = selectedDetailPurchaseInvoice.vendorName;
                    setSelectedDetailPurchaseInvoice(null);
                    if (onPayVendor) onPayVendor(vName);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar / Abonar Factura</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL / DRAWER: CREAR O EDITAR DEVOLUCIÓN A PROVEEDOR ================= */}
      {showVendorReturnDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {editingVendorReturn ? "Edición de Devolución" : "Nueva Devolución a Proveedor"}
                </span>
                <h3 className="font-bold text-base text-slate-900 font-mono">
                  {vendorReturnForm.returnNumber || "DEV-2026-XXX"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVendorReturnDrawer(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {vendorReturnError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {vendorReturnError}
                </div>
              )}
              {vendorReturnSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{vendorReturnSuccess}</span>
                </div>
              )}

              {/* General Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Devolución *</label>
                  <input
                    type="text"
                    value={vendorReturnForm.returnNumber}
                    onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, returnNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Proveedor *</label>
                  <input
                    type="text"
                    list="vendors-list-datalist"
                    placeholder="Escriba o elija proveedor..."
                    value={vendorReturnForm.vendorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = vendors.find((v) => v.name.toLowerCase() === val.toLowerCase());
                      setVendorReturnForm({
                        ...vendorReturnForm,
                        vendorName: val,
                        vendorId: matched ? matched.id : vendorReturnForm.vendorId,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                  <datalist id="vendors-list-datalist">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Factura Compra Ref.</label>
                  <input
                    type="text"
                    list="purchase-invoices-datalist"
                    placeholder="Ej. FPROV-2026-001..."
                    value={vendorReturnForm.purchaseInvoiceNumber}
                    onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, purchaseInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                  <datalist id="purchase-invoices-datalist">
                    {purchaseInvoices.map((pi) => (
                      <option key={pi.id} value={pi.invoiceNumber}>
                        {pi.vendorName} (${pi.total.toFixed(2)})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Devolución *</label>
                  <input
                    type="date"
                    value={vendorReturnForm.returnDate}
                    onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, returnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivo de la Devolución</label>
                  <select
                    value={vendorReturnForm.reason}
                    onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  >
                    <option value="DEFECTO">Mercancía defectuosa / dañada en origen</option>
                    <option value="EXCESO">Exceso de pedido / error en despacho</option>
                    <option value="INCORRECTO">Producto incorrecto (SKU no corresponde)</option>
                    <option value="VENCIDO">Producto vencido / vida útil insuficiente</option>
                    <option value="OTRO">Otro motivo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado Inicial</label>
                  <select
                    value={vendorReturnForm.status}
                    onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  >
                    <option value="BORRADOR">Borrador (En revisión)</option>
                    <option value="APROBADA">Aprobada (Lista para despachar)</option>
                    <option value="ENVIADA">Enviada (En tránsito hacia proveedor)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Artículos a Devolver</h4>
                    <p className="text-[11px] text-slate-500">Seleccione del inventario existente o ingrese manualmente los ítems.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVendorReturnLine}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 w-48">SKU / Selección</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3 w-20 text-center">Cant.</th>
                        <th className="p-3 w-28 text-right">Costo Unit. ($)</th>
                        <th className="p-3 w-28">N° Lote</th>
                        <th className="p-3 w-36">Motivo Ítem</th>
                        <th className="p-3 w-28 text-right">Total ($)</th>
                        <th className="p-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorReturnForm.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <select
                              onChange={(e) => {
                                const selected = inventory.find((i) => i.sku === e.target.value);
                                if (selected) {
                                  fillVendorReturnLineFromInventory(idx, {
                                    sku: selected.sku,
                                    name: selected.description,
                                    unitCost: selected.cost,
                                  });
                                }
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#1b426e]"
                              value={it.sku || ""}
                            >
                              <option value="">Seleccionar SKU...</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.sku}>
                                  {inv.sku} - {inv.description.slice(0, 20)}...
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => updateVendorReturnLine(idx, "description", e.target.value)}
                              placeholder="Descripción..."
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => updateVendorReturnLine(idx, "quantity", Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center font-bold focus:outline-none focus:border-[#1b426e]"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={it.unitCost}
                              onChange={(e) => updateVendorReturnLine(idx, "unitCost", Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-right font-mono focus:outline-none focus:border-[#1b426e]"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={it.lotNumber}
                              onChange={(e) => updateVendorReturnLine(idx, "lotNumber", e.target.value)}
                              placeholder="Lote opc."
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#1b426e]"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={it.itemReason}
                              onChange={(e) => updateVendorReturnLine(idx, "itemReason", e.target.value)}
                              placeholder="Detalle defecto..."
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ${((it.quantity ?? 0) * (it.unitCost ?? 0)).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeVendorReturnLine(idx)}
                              className="text-slate-400 hover:text-rose-600 font-bold p-1 cursor-pointer transition"
                              title="Quitar línea"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                      {vendorReturnForm.items.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Haga clic en "+ Agregar Ítem" para incluir productos a la devolución.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Total a Reclamar / Devolver:</span>
                  <span className="text-base font-bold font-mono text-[#1b426e]">
                    ${vendorReturnSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Observaciones y Guía de Despacho</label>
                <textarea
                  rows={3}
                  value={vendorReturnForm.notes}
                  onChange={(e) => setVendorReturnForm({ ...vendorReturnForm, notes: e.target.value })}
                  placeholder="Detalles sobre número de guía, transportista, acuerdo con el proveedor o número de RMA..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e] resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowVendorReturnDrawer(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveVendorReturn(false)}
                  disabled={vendorReturnLoading}
                  className="px-4 py-2 rounded-xl border border-[#1b426e] bg-white hover:bg-[#fff7ed] text-[#1b426e] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {vendorReturnLoading ? "Guardando..." : "Guardar como Borrador"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVendorReturn(true)}
                  disabled={vendorReturnLoading}
                  className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md shadow-[#1b426e]/20 disabled:opacity-50"
                >
                  {vendorReturnLoading ? "Guardando..." : "Guardar & Aprobar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETALLE DE DEVOLUCIÓN A PROVEEDOR ================= */}
      {vendorReturnDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comprobante de Devolución</span>
                <h3 className="font-bold text-base text-slate-900 font-mono">
                  {vendorReturnDetailModal.returnNumber}
                </h3>
              </div>
              <button
                onClick={() => setVendorReturnDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Proveedor</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{vendorReturnDetailModal.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Factura Compra</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">{vendorReturnDetailModal.purchaseInvoiceNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Fecha</span>
                  <span className="font-medium text-slate-800 block mt-0.5">{vendorReturnDetailModal.returnDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Estado</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${
                    vendorReturnDetailModal.status === "COMPLETADA"
                      ? "bg-emerald-100 text-emerald-800"
                      : vendorReturnDetailModal.status === "BORRADOR"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {vendorReturnDetailModal.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Artículos Devueltos</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5 text-center">Cant.</th>
                        <th className="p-2.5 text-right">Costo Unit.</th>
                        <th className="p-2.5 text-center">Lote</th>
                        <th className="p-2.5 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorReturnDetailModal.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{it.sku}</td>
                          <td className="p-2.5 text-slate-700">{it.description}</td>
                          <td className="p-2.5 text-center font-bold text-rose-600">-{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono">${(it.unitCost || 0).toFixed(2)}</td>
                          <td className="p-2.5 text-center font-mono text-amber-800">{it.lotNumber || "—"}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">${(it.totalCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Reclamado:</span>
                <span className="text-base text-[#1b426e] font-mono">${(vendorReturnDetailModal.total || 0).toFixed(2)} USD</span>
              </div>

              {vendorReturnDetailModal.notes && (
                <div className="text-[11px] text-slate-600 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
                  <span className="font-bold block mb-0.5">Observaciones / Guía:</span>
                  {vendorReturnDetailModal.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Imprimir Comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => setVendorReturnDetailModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
