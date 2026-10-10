"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Factory,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Play,
  RotateCcw,
  Printer,
  ChevronRight,
  Boxes,
  ArrowRight,
  Package,
  Calendar,
  Building,
  User,
  Hash,
  X,
  FileCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface ProductionModuleProps {
  inventory?: Array<{
    id: string;
    sku: string;
    description: string;
    quantity: number;
    cost?: number;
    price?: number;
  }>;
  customers?: Array<{
    id: string;
    name: string;
  }>;
  warehouses?: Array<{
    id: string;
    name: string;
  }>;
  defaultCurrencySymbol?: string;
  defaultCurrencyCode?: string;
  onNavigateToDashboard?: () => void;
  onNavigateToSalesOrders?: () => void;
  prefilledSalesOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    items?: Array<{
      productName: string;
      sku?: string | null;
      quantityOrdered: number;
    }>;
  } | null;
  onClearPrefilledSalesOrder?: () => void;
}

export default function ProductionModule({
  inventory = [],
  customers = [],
  warehouses = [],
  defaultCurrencySymbol = "$",
  defaultCurrencyCode = "USD",
  onNavigateToDashboard,
  onNavigateToSalesOrders,
  prefilledSalesOrder,
  onClearPrefilledSalesOrder,
}: ProductionModuleProps) {
  // Tabs: 'work-orders' | 'boms'
  const [activeTab, setActiveTab] = useState<"work-orders" | "boms">("work-orders");

  // State: Data
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [salesOrdersList, setSalesOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Next suggested numbers
  const [nextWorkOrderNumber, setNextWorkOrderNumber] = useState("");
  const [nextBomCode, setNextBomCode] = useState("");

  // Modals
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<any | null>(null);

  const [showBomModal, setShowBomModal] = useState(false);
  const [editingBom, setEditingBom] = useState<any | null>(null);

  const [viewingWorkOrder, setViewingWorkOrder] = useState<any | null>(null);
  const [closingWorkOrder, setClosingWorkOrder] = useState<any | null>(null);
  const [closingProducedQty, setClosingProducedQty] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState("");
  const [closeValidationResult, setCloseValidationResult] = useState<{
    hasMissing: boolean;
    missingItems: any[];
  } | null>(null);

  // Form states for Work Order
  const [woCreationMode, setWoCreationMode] = useState<"manual" | "sales_order">("manual");
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [selectedBomId, setSelectedBomId] = useState("");
  const [woOrderNumber, setWoOrderNumber] = useState("");
  const [woProductName, setWoProductName] = useState("");
  const [woProductSku, setWoProductSku] = useState("");
  const [woCustomerName, setWoCustomerName] = useState("");
  const [woQuantityPlanned, setWoQuantityPlanned] = useState<number>(1);
  const [woUnit, setWoUnit] = useState("Unidades");
  const [woStartDate, setWoStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [woDueDate, setWoDueDate] = useState("");
  const [woPriority, setWoPriority] = useState("MEDIA");
  const [woWarehouse, setWoWarehouse] = useState(warehouses[0]?.name || "Bodega Principal Zip Búfalo");
  const [woNotes, setWoNotes] = useState("");

  // Form states for BOM
  const [bomCode, setBomCode] = useState("");
  const [bomName, setBomName] = useState("");
  const [bomDescription, setBomDescription] = useState("");
  const [bomFinishedProductName, setBomFinishedProductName] = useState("");
  const [bomFinishedProductSku, setBomFinishedProductSku] = useState("");
  const [bomOutputQuantity, setBomOutputQuantity] = useState<number>(1);
  const [bomOutputUnit, setBomOutputUnit] = useState("Unidades");
  const [bomVersion, setBomVersion] = useState("1.0");
  const [bomIsActive, setBomIsActive] = useState(true);
  const [bomNotes, setBomNotes] = useState("");
  const [bomItems, setBomItems] = useState<
    Array<{
      inventoryItemId: string;
      sku: string;
      description: string;
      quantityRequired: number;
      unit: string;
      estimatedCost: number;
      notes: string;
    }>
  >([]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [woRes, bomRes, soRes] = await Promise.all([
        fetch("/api/production/work-orders").then((r) => r.json()),
        fetch("/api/production/boms").then((r) => r.json()),
        fetch("/api/sales-orders?status=CONFIRMADO").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (woRes.success) {
        setWorkOrders(woRes.data || []);
        if (woRes.nextOrderNumber) setNextWorkOrderNumber(woRes.nextOrderNumber);
      }
      if (bomRes.success) {
        setBoms(bomRes.data || []);
        if (bomRes.nextCode) setNextBomCode(bomRes.nextCode);
      }
      if (soRes.success) {
        setSalesOrdersList(soRes.data || []);
      }
    } catch (err: any) {
      console.error("Error loading production data:", err);
      setErrorMsg("No se pudieron cargar los datos de producción. Verifique su conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle prefilled sales order navigation
  useEffect(() => {
    if (prefilledSalesOrder) {
      setActiveTab("work-orders");
      openNewWorkOrderModalWithSalesOrder(prefilledSalesOrder);
      if (onClearPrefilledSalesOrder) onClearPrefilledSalesOrder();
    }
  }, [prefilledSalesOrder]);

  // Toast auto-clear
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Open modal for new Work Order
  const openNewWorkOrderModal = () => {
    setEditingWorkOrder(null);
    setWoCreationMode("manual");
    setSelectedSalesOrderId("");
    setSelectedBomId("");
    setWoOrderNumber(nextWorkOrderNumber);
    setWoProductName("");
    setWoProductSku("");
    setWoCustomerName("");
    setWoQuantityPlanned(1);
    setWoUnit("Unidades");
    setWoStartDate(new Date().toISOString().split("T")[0]);
    setWoDueDate("");
    setWoPriority("MEDIA");
    setWoWarehouse(warehouses[0]?.name || "Bodega Principal Zip Búfalo");
    setWoNotes("");
    setShowWorkOrderModal(true);
  };

  const openNewWorkOrderModalWithSalesOrder = (so: any) => {
    setEditingWorkOrder(null);
    setWoCreationMode("sales_order");
    setSelectedSalesOrderId(so.id);
    setWoOrderNumber(nextWorkOrderNumber);
    setWoCustomerName(so.customerName || "");
    const firstItem = so.items && so.items.length > 0 ? so.items[0] : null;
    if (firstItem) {
      setWoProductName(firstItem.productName || "");
      setWoProductSku(firstItem.sku || "");
      setWoQuantityPlanned(Number(firstItem.quantityOrdered) || 1);
    }
    // Attempt auto-match BOM by sku or product name
    const matchedBom = boms.find(
      (b) =>
        (firstItem?.sku && b.finishedProductSku === firstItem.sku) ||
        b.finishedProductName.toLowerCase() === (firstItem?.productName || "").toLowerCase()
    );
    if (matchedBom) {
      setSelectedBomId(matchedBom.id);
      setWoUnit(matchedBom.outputUnit || "Unidades");
    } else {
      setSelectedBomId("");
    }
    setWoStartDate(new Date().toISOString().split("T")[0]);
    setWoDueDate("");
    setWoPriority("MEDIA");
    setWoWarehouse(warehouses[0]?.name || "Bodega Principal Zip Búfalo");
    setWoNotes(`Generada desde Pedido de Venta ${so.orderNumber}`);
    setShowWorkOrderModal(true);
  };

  // Open modal for editing Work Order
  const openEditWorkOrderModal = (wo: any) => {
    setEditingWorkOrder(wo);
    setWoCreationMode(wo.salesOrderId ? "sales_order" : "manual");
    setSelectedSalesOrderId(wo.salesOrderId || "");
    setSelectedBomId(wo.bomId);
    setWoOrderNumber(wo.orderNumber);
    setWoProductName(wo.productName);
    setWoProductSku(wo.productSku || "");
    setWoCustomerName(wo.customerName || "");
    setWoQuantityPlanned(wo.quantityPlanned);
    setWoUnit(wo.unit || "Unidades");
    setWoStartDate(wo.startDate || "");
    setWoDueDate(wo.dueDate || "");
    setWoPriority(wo.priority || "MEDIA");
    setWoWarehouse(wo.warehouse || "Bodega Principal Zip Búfalo");
    setWoNotes(wo.notes || "");
    setShowWorkOrderModal(true);
  };

  // When selected BOM changes in Work Order modal
  const handleSelectBom = (bomId: string) => {
    setSelectedBomId(bomId);
    const selected = boms.find((b) => b.id === bomId);
    if (selected) {
      if (!woProductName) setWoProductName(selected.finishedProductName);
      if (!woProductSku && selected.finishedProductSku) setWoProductSku(selected.finishedProductSku);
      setWoUnit(selected.outputUnit || "Unidades");
    }
  };

  // When selected Sales Order changes in Work Order modal
  const handleSelectSalesOrder = (soId: string) => {
    setSelectedSalesOrderId(soId);
    const so = salesOrdersList.find((s) => s.id === soId);
    if (so) {
      setWoCustomerName(so.customerName || "");
      if (so.items && so.items.length > 0) {
        const item = so.items[0];
        setWoProductName(item.productName || "");
        setWoProductSku(item.sku || "");
        setWoQuantityPlanned(Number(item.quantityOrdered) || 1);
        const match = boms.find(
          (b) =>
            (item.sku && b.finishedProductSku === item.sku) ||
            b.finishedProductName.toLowerCase() === (item.productName || "").toLowerCase()
        );
        if (match) {
          setSelectedBomId(match.id);
          setWoUnit(match.outputUnit || "Unidades");
        }
      }
    }
  };

  // Calculated BOM items for current planned quantity
  const calculatedWorkOrderComponents = useMemo(() => {
    if (!selectedBomId) return [];
    const bom = boms.find((b) => b.id === selectedBomId);
    if (!bom || !bom.items) return [];

    const factor = bom.outputQuantity > 0 ? (Number(woQuantityPlanned) || 1) / bom.outputQuantity : 1;

    return bom.items.map((it: any) => {
      const required = it.quantityRequired * factor;
      // Find current stock from inventory
      const invMatch = inventory.find(
        (inv) => (it.inventoryItemId && inv.id === it.inventoryItemId) || inv.sku === it.sku
      );
      const available = invMatch ? Number(invMatch.quantity) : 0;
      const isSufficient = available >= required;

      return {
        ...it,
        calculatedRequired: required,
        availableStock: available,
        isSufficient,
        missing: isSufficient ? 0 : required - available,
      };
    });
  }, [selectedBomId, woQuantityPlanned, boms, inventory]);

  // Save Work Order
  const handleSaveWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBomId) {
      setErrorMsg("Debe seleccionar una lista de materiales (BOM) obligatoriamente.");
      return;
    }
    if (!woProductName.trim()) {
      setErrorMsg("Debe especificar el nombre del producto a fabricar.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        orderNumber: woOrderNumber,
        bomId: selectedBomId,
        salesOrderId: selectedSalesOrderId || null,
        salesOrderNumber: salesOrdersList.find((s) => s.id === selectedSalesOrderId)?.orderNumber || null,
        customerName: woCustomerName || null,
        productSku: woProductSku || null,
        productName: woProductName.trim(),
        quantityPlanned: Number(woQuantityPlanned) || 1,
        unit: woUnit,
        startDate: woStartDate,
        dueDate: woDueDate || null,
        priority: woPriority,
        warehouse: woWarehouse,
        notes: woNotes,
      };

      const url = editingWorkOrder
        ? `/api/production/work-orders/${editingWorkOrder.id}`
        : "/api/production/work-orders";
      const method = editingWorkOrder ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar la orden de trabajo");
      }

      setSuccessMsg(
        editingWorkOrder
          ? "Orden de trabajo actualizada con éxito."
          : `Orden de trabajo ${data.data.orderNumber} creada con éxito.`
      );
      setShowWorkOrderModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar la orden de trabajo.");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Status of Work Order (e.g. Iniciar Producción)
  const handleChangeStatus = async (wo: any, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/production/work-orders/${wo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar estado");
      }
      setSuccessMsg(`Estado actualizado a ${newStatus}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Close Work Order Modal with Real-time Stock Check
  const openCloseWorkOrderModal = (wo: any) => {
    setClosingWorkOrder(wo);
    setClosingProducedQty(wo.quantityPlanned);
    setClosingNotes("");

    // Real-time stock validation check
    const missing: any[] = [];
    if (wo.items && wo.items.length > 0) {
      wo.items.forEach((item: any) => {
        const required = Number(item.quantityRequired) || 0;
        const invMatch = inventory.find(
          (inv) => (item.inventoryItemId && inv.id === item.inventoryItemId) || inv.sku === item.sku
        );
        const available = invMatch ? Number(invMatch.quantity) : 0;
        if (!invMatch || available < required) {
          missing.push({
            sku: item.sku,
            description: item.description,
            required,
            available,
            missing: required - available,
            unit: item.unit || "Unidades",
          });
        }
      });
    }

    setCloseValidationResult({
      hasMissing: missing.length > 0,
      missingItems: missing,
    });
  };

  // Execute Close Work Order (deducts raw materials inventory)
  const handleExecuteCloseWorkOrder = async () => {
    if (!closingWorkOrder) return;
    if (closeValidationResult?.hasMissing) {
      setErrorMsg(
        "No se puede cerrar la orden: hay materias primas con existencias insuficientes. Se debe abastecer el inventario primero."
      );
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/production/work-orders/${closingWorkOrder.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityProduced: Number(closingProducedQty) || closingWorkOrder.quantityPlanned,
          notes: closingNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.missingStock && data.missingStock.length > 0) {
          setCloseValidationResult({
            hasMissing: true,
            missingItems: data.missingStock,
          });
          throw new Error("Stock insuficiente detectado en el servidor para cerrar la orden.");
        }
        throw new Error(data.error || "Error al cerrar la orden de trabajo");
      }

      setSuccessMsg(
        `¡Orden de trabajo ${closingWorkOrder.orderNumber} cerrada exitosamente! Se rebajó el inventario de materias primas.`
      );
      setClosingWorkOrder(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cerrar la orden de trabajo");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Work Order
  const handleDeleteWorkOrder = async (wo: any) => {
    if (
      !confirm(
        `¿Está seguro de eliminar la Orden de Trabajo ${wo.orderNumber}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/production/work-orders/${wo.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar la orden de trabajo");
      }
      setSuccessMsg("Orden de trabajo eliminada exitosamente.");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open BOM modal
  const openNewBomModal = () => {
    setEditingBom(null);
    setBomCode(nextBomCode);
    setBomName("");
    setBomDescription("");
    setBomFinishedProductName("");
    setBomFinishedProductSku("");
    setBomOutputQuantity(1);
    setBomOutputUnit("Unidades");
    setBomVersion("1.0");
    setBomIsActive(true);
    setBomNotes("");
    setBomItems([
      {
        inventoryItemId: "",
        sku: "",
        description: "",
        quantityRequired: 1,
        unit: "Unidades",
        estimatedCost: 0,
        notes: "",
      },
    ]);
    setShowBomModal(true);
  };

  const openEditBomModal = (bom: any) => {
    setEditingBom(bom);
    setBomCode(bom.code);
    setBomName(bom.name);
    setBomDescription(bom.description || "");
    setBomFinishedProductName(bom.finishedProductName);
    setBomFinishedProductSku(bom.finishedProductSku || "");
    setBomOutputQuantity(bom.outputQuantity);
    setBomOutputUnit(bom.outputUnit);
    setBomVersion(bom.version);
    setBomIsActive(bom.isActive);
    setBomNotes(bom.notes || "");
    setBomItems(
      bom.items && bom.items.length > 0
        ? bom.items.map((it: any) => ({
            inventoryItemId: it.inventoryItemId || "",
            sku: it.sku || "",
            description: it.description || "",
            quantityRequired: it.quantityRequired || 1,
            unit: it.unit || "Unidades",
            estimatedCost: it.estimatedCost || 0,
            notes: it.notes || "",
          }))
        : [
            {
              inventoryItemId: "",
              sku: "",
              description: "",
              quantityRequired: 1,
              unit: "Unidades",
              estimatedCost: 0,
              notes: "",
            },
          ]
    );
    setShowBomModal(true);
  };

  // Add Item line in BOM modal
  const addBomItemLine = () => {
    setBomItems((prev) => [
      ...prev,
      {
        inventoryItemId: "",
        sku: "",
        description: "",
        quantityRequired: 1,
        unit: "Unidades",
        estimatedCost: 0,
        notes: "",
      },
    ]);
  };

  const removeBomItemLine = (idx: number) => {
    setBomItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBomItemLine = (idx: number, field: string, value: any) => {
    setBomItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };

      // If user selected an inventory item, auto-fill sku, description, unit cost
      if (field === "inventoryItemId") {
        const inv = inventory.find((i) => i.id === value);
        if (inv) {
          copy[idx].sku = inv.sku;
          copy[idx].description = inv.description;
          copy[idx].estimatedCost = inv.cost || 0;
        }
      }
      return copy;
    });
  };

  // Save BOM
  const handleSaveBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomName.trim() || !bomFinishedProductName.trim()) {
      setErrorMsg("El nombre de la BOM y el producto terminado son obligatorios.");
      return;
    }
    if (bomItems.length === 0) {
      setErrorMsg("Debe agregar al menos un componente o materia prima.");
      return;
    }
    const hasInvalid = bomItems.some((it) => !it.sku.trim() || Number(it.quantityRequired) <= 0);
    if (hasInvalid) {
      setErrorMsg("Todos los componentes deben tener un SKU y cantidad requerida mayor a cero.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        code: bomCode,
        name: bomName.trim(),
        description: bomDescription.trim() || undefined,
        finishedProductSku: bomFinishedProductSku.trim() || undefined,
        finishedProductName: bomFinishedProductName.trim(),
        outputQuantity: Number(bomOutputQuantity) || 1,
        outputUnit: bomOutputUnit,
        version: bomVersion,
        isActive: bomIsActive,
        notes: bomNotes.trim() || undefined,
        items: bomItems.map((it) => ({
          inventoryItemId: it.inventoryItemId || null,
          sku: it.sku.trim(),
          description: it.description.trim() || it.sku,
          quantityRequired: Number(it.quantityRequired),
          unit: it.unit,
          estimatedCost: Number(it.estimatedCost) || 0,
          notes: it.notes.trim() || null,
        })),
      };

      const url = editingBom ? `/api/production/boms/${editingBom.id}` : "/api/production/boms";
      const method = editingBom ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar la lista de materiales");
      }

      setSuccessMsg(
        editingBom
          ? "Lista de materiales actualizada con éxito."
          : `Lista de materiales ${data.data.code} creada con éxito.`
      );
      setShowBomModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar la lista de materiales.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete BOM
  const handleDeleteBom = async (bom: any) => {
    if (
      !confirm(
        `¿Está seguro de eliminar la Lista de Materiales ${bom.code} (${bom.name})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/production/boms/${bom.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar la BOM");
      }
      setSuccessMsg("Lista de materiales eliminada exitosamente.");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchSearch =
        !searchQuery ||
        wo.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wo.productSku && wo.productSku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.customerName && wo.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.salesOrderNumber && wo.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.bom?.name && wo.bom.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || wo.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || wo.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [workOrders, searchQuery, statusFilter, priorityFilter]);

  const filteredBoms = useMemo(() => {
    return boms.filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.finishedProductName.toLowerCase().includes(q) ||
        (b.finishedProductSku && b.finishedProductSku.toLowerCase().includes(q))
      );
    });
  }, [boms, searchQuery]);

  // KPI Calculations
  const woKpis = useMemo(() => {
    return {
      total: workOrders.length,
      planificadas: workOrders.filter((w) => w.status === "PLANIFICADA").length,
      enProceso: workOrders.filter((w) => w.status === "EN_PROCESO").length,
      completadas: workOrders.filter((w) => w.status === "COMPLETADA").length,
      canceladas: workOrders.filter((w) => w.status === "CANCELADA").length,
    };
  }, [workOrders]);

  return (
    <div className="space-y-6">
      {/* ================= SCREEN HEADER ================= */}
      <div className="space-y-4 print:hidden">
        {/* Breadcrumbs */}
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
          <span className="text-xs font-semibold text-slate-500">Producción</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">
            {activeTab === "work-orders" ? "Órdenes de Producción" : "Listas de Materiales (BOM)"}
          </span>
        </div>

        {/* Title row + Badge + Subtitle + Action buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === "work-orders"
                  ? "Órdenes de Producción (Fabricación)"
                  : "Listas de Materiales (BOMs)"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de órdenes de trabajo, listas de materiales (BOM) y consumo automático de materias primas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("work-orders");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "work-orders"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-[#1b426e]" />
                Órdenes ({workOrders.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("boms");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "boms"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                BOMs ({boms.length})
              </button>
            </div>

            {/* Main Action Button matching exact screenshot styling */}
            <button
              type="button"
              onClick={activeTab === "work-orders" ? openNewWorkOrderModal : openNewBomModal}
              className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 cursor-pointer"
            >
              <span className="text-sm leading-none">+</span>
              <span>
                {activeTab === "work-orders"
                  ? "Crear Orden de Trabajo"
                  : "Crear Lista de Materiales (BOM)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= TAB 1: ÓRDENES DE TRABAJO ================= */}
      {activeTab === "work-orders" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Órdenes</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{woKpis.total}</p>
              <span className="text-[10px] text-slate-400">Registradas en el sistema</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Planificadas</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{woKpis.planificadas}</p>
              <span className="text-[10px] text-blue-600">Por iniciar en planta</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">En Proceso</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{woKpis.enProceso}</p>
              <span className="text-[10px] text-amber-600">Fabricación en curso</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Cerradas / Listas</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{woKpis.completadas}</p>
              <span className="text-[10px] text-emerald-600">Stock rebajado</span>
            </div>
          </div>

          {/* Search, Filters, and New Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por OT, producto, cliente, BOM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-700 cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PLANIFICADA">Planificadas</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADA">Completadas (Cerradas)</option>
                <option value="CANCELADA">Canceladas</option>
              </select>

              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-700 cursor-pointer"
              >
                <option value="ALL">Todas las Prioridades</option>
                <option value="URGENTE">Urgente</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>

          {/* Work Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span>Cargando órdenes de trabajo...</span>
              </div>
            ) : filteredWorkOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <Factory className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No se encontraron órdenes de trabajo</p>
                <p className="text-slate-400 mt-1">
                  Crea una nueva orden de trabajo manual o generada desde un pedido de venta.
                </p>
                <button
                  onClick={openNewWorkOrderModal}
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#1b426e] hover:bg-[#143355] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear primera orden
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">N° Orden</th>
                      <th className="py-3 px-4">Producto a Fabricar</th>
                      <th className="py-3 px-4">Lista de Materiales (BOM)</th>
                      <th className="py-3 px-4">Origen / Cliente</th>
                      <th className="py-3 px-4">Fechas</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-center">Inventario</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkOrders.map((wo) => {
                      const isCompleted = wo.status === "COMPLETADA";
                      const isCancelled = wo.status === "CANCELADA";
                      const isInProgress = wo.status === "EN_PROCESO";
                      const isPlanned = wo.status === "PLANIFICADA";

                      return (
                        <tr key={wo.id} className="hover:bg-slate-50/80 transition">
                          {/* Order Number & Priority */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{wo.orderNumber}</span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  wo.priority === "URGENTE"
                                    ? "bg-rose-100 text-rose-700"
                                    : wo.priority === "ALTA"
                                    ? "bg-amber-100 text-amber-700"
                                    : wo.priority === "MEDIA"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {wo.priority}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3" />
                              {wo.warehouse}
                            </span>
                          </td>

                          {/* Product */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{wo.productName}</div>
                            <div className="text-[10px] text-slate-400">
                              {wo.productSku ? `SKU: ${wo.productSku} • ` : ""}
                              <span className="font-bold text-slate-700">
                                {wo.quantityPlanned} {wo.unit}
                              </span>
                            </div>
                          </td>

                          {/* BOM */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-indigo-700 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{wo.bom?.name || "BOM"}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{wo.bom?.code}</span>
                          </td>

                          {/* Sales Order / Customer */}
                          <td className="py-3 px-4">
                            {wo.salesOrderNumber ? (
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <Package className="w-3 h-3 text-orange-500" />
                                <span>{wo.salesOrderNumber}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Orden manual</span>
                            )}
                            {wo.customerName && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {wo.customerName}
                              </div>
                            )}
                          </td>

                          {/* Dates */}
                          <td className="py-3 px-4">
                            <div className="text-[11px] text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Inicio: {wo.startDate || "N/D"}</span>
                            </div>
                            {wo.dueDate && (
                              <div className="text-[10px] text-slate-400">Entrega: {wo.dueDate}</div>
                            )}
                            {wo.completionDate && (
                              <div className="text-[10px] text-emerald-600 font-bold">
                                Cerrada: {wo.completionDate}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isInProgress
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : isPlanned
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isCompleted
                                    ? "bg-emerald-500"
                                    : isInProgress
                                    ? "bg-amber-500 animate-pulse"
                                    : isPlanned
                                    ? "bg-blue-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {wo.status}
                            </span>
                          </td>

                          {/* Inventory status */}
                          <td className="py-3 px-4 text-center">
                            {wo.inventoryDeducted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Rebajado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                                Pendiente
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right space-x-1">
                            {/* View detail */}
                            <button
                              onClick={() => setViewingWorkOrder(wo)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Ver detalle de componentes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Start process */}
                            {isPlanned && (
                              <button
                                onClick={() => handleChangeStatus(wo, "EN_PROCESO")}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Iniciar producción"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Close order button (Rebajar materias primas) */}
                            {!isCompleted && !isCancelled && (
                              <button
                                onClick={() => openCloseWorkOrderModal(wo)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition cursor-pointer shadow-sm"
                                title="Cerrar orden y rebajar inventario"
                              >
                                <FileCheck className="w-3 h-3" />
                                Cerrar Orden
                              </button>
                            )}

                            {/* Edit (only if not completed) */}
                            {!isCompleted && (
                              <button
                                onClick={() => openEditWorkOrderModal(wo)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Editar orden"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            {!isCompleted && (
                              <button
                                onClick={() => handleDeleteWorkOrder(wo)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Eliminar orden"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LISTAS DE MATERIALES (BOM) ================= */}
      {activeTab === "boms" && (
        <div className="space-y-6">
          {/* Header & New BOM Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 sm:w-72 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o producto final..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* BOM Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Cargando listas de materiales...</span>
            </div>
          ) : filteredBoms.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No se encontraron Listas de Materiales (BOM)</p>
              <p className="text-slate-400 mt-1">
                Las BOMs definen la receta o lista de materias primas requeridas para fabricar cada producto.
              </p>
              <button
                onClick={openNewBomModal}
                className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear primera BOM
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBoms.map((bom) => {
                const totalCost = (bom.items || []).reduce(
                  (sum: number, it: any) => sum + (it.quantityRequired || 0) * (it.estimatedCost || 0),
                  0
                );

                return (
                  <div
                    key={bom.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Code, version, status */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {bom.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">v{bom.version}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            bom.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {bom.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      {/* BOM Name */}
                      <h3 className="font-bold text-slate-900 text-sm">{bom.name}</h3>
                      {bom.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{bom.description}</p>
                      )}

                      {/* Target product */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Producto Terminado
                        </span>
                        <div className="font-semibold text-slate-800 text-xs mt-0.5">
                          {bom.finishedProductName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                          <span>
                            {bom.finishedProductSku ? `SKU: ${bom.finishedProductSku}` : "Sin SKU asignado"}
                          </span>
                          <span className="font-bold text-indigo-700">
                            Lote base: {bom.outputQuantity} {bom.outputUnit}
                          </span>
                        </div>
                      </div>

                      {/* Items list preview */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                          <span className="font-semibold">Insumos ({bom.items?.length || 0})</span>
                          <span className="text-slate-500">
                            Costo estimado:{" "}
                            <strong className="text-slate-800">
                              {defaultCurrencySymbol}
                              {totalCost.toFixed(2)}
                            </strong>
                          </span>
                        </div>
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {bom.items?.map((it: any) => (
                            <div
                              key={it.id || it.sku}
                              className="text-[10px] text-slate-600 flex items-center justify-between bg-slate-50/50 px-2 py-1 rounded"
                            >
                              <span className="truncate max-w-[170px]">
                                <strong className="text-slate-700">{it.sku}</strong> - {it.description}
                              </span>
                              <span className="font-mono text-slate-700 shrink-0">
                                {it.quantityRequired} {it.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedBomId(bom.id);
                          setWoProductName(bom.finishedProductName);
                          setWoProductSku(bom.finishedProductSku || "");
                          setWoUnit(bom.outputUnit);
                          setWoQuantityPlanned(bom.outputQuantity);
                          setWoOrderNumber(nextWorkOrderNumber);
                          setShowWorkOrderModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Crear Orden con esta BOM
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditBomModal(bom)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Editar BOM"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBom(bom)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Eliminar BOM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: NUEVA / EDITAR ORDEN DE TRABAJO ================= */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingWorkOrder ? `Editar Orden ${editingWorkOrder.orderNumber}` : "Nueva Orden de Trabajo"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Planifique la producción vinculando una lista de materiales (BOM).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveWorkOrder} className="p-6 space-y-5">
              {/* Mode Selector (Manual vs Sales Order) */}
              {!editingWorkOrder && (
                <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setWoCreationMode("manual");
                      setSelectedSalesOrderId("");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                      woCreationMode === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Creación Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setWoCreationMode("sales_order")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                      woCreationMode === "sales_order" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Desde Pedido de Ventas (Sales Order)
                  </button>
                </div>
              )}

              {/* If from Sales Order */}
              {woCreationMode === "sales_order" && !editingWorkOrder && (
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Seleccionar Pedido de Venta Confirmado:
                  </label>
                  <select
                    value={selectedSalesOrderId}
                    onChange={(e) => handleSelectSalesOrder(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                    required
                  >
                    <option value="">-- Seleccione un Pedido de Venta --</option>
                    {salesOrdersList.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} • {so.customerName} ({so.items?.length || 0} ítems)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    N° de Orden de Trabajo
                  </label>
                  <input
                    type="text"
                    value={woOrderNumber}
                    onChange={(e) => setWoOrderNumber(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* BOM Selector (Required!) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Lista de Materiales (BOM) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBomId}
                    onChange={(e) => handleSelectBom(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-800"
                  >
                    <option value="">-- Seleccionar BOM requerida --</option>
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} • {b.name} ({b.finishedProductName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Producto a Fabricar
                  </label>
                  <input
                    type="text"
                    value={woProductName}
                    onChange={(e) => setWoProductName(e.target.value)}
                    placeholder="ej. Caja Corrugada 12x12x12"
                    required
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Product SKU */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    SKU Producto Terminado
                  </label>
                  <input
                    type="text"
                    value={woProductSku}
                    onChange={(e) => setWoProductSku(e.target.value)}
                    placeholder="ej. PROD-CAJA-001"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Quantity Planned */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cantidad a Producir
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={woQuantityPlanned}
                      onChange={(e) => setWoQuantityPlanned(Number(e.target.value))}
                      required
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                    />
                    <input
                      type="text"
                      value={woUnit}
                      onChange={(e) => setWoUnit(e.target.value)}
                      placeholder="Unidades"
                      className="w-28 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                    />
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cliente Destino (Opcional)
                  </label>
                  <input
                    type="text"
                    value={woCustomerName}
                    onChange={(e) => setWoCustomerName(e.target.value)}
                    placeholder="ej. Cervecería Hondureña"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={woStartDate}
                    onChange={(e) => setWoStartDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Fecha de Entrega / Límite
                  </label>
                  <input
                    type="date"
                    value={woDueDate}
                    onChange={(e) => setWoDueDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Prioridad</label>
                  <select
                    value={woPriority}
                    onChange={(e) => setWoPriority(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Almacén / Planta de Consumo
                  </label>
                  <select
                    value={woWarehouse}
                    onChange={(e) => setWoWarehouse(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                    {warehouses.length === 0 && (
                      <option value="Bodega Principal Zip Búfalo">Bodega Principal Zip Búfalo</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Real-time Component Breakdown from selected BOM */}
              {selectedBomId && calculatedWorkOrderComponents.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Insumos Requeridos según BOM ({calculatedWorkOrderComponents.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Verificación en tiempo real de existencias
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase border-b border-slate-100">
                          <th className="py-2 px-3">Materia Prima / SKU</th>
                          <th className="py-2 px-3 text-right">Cant. Requerida</th>
                          <th className="py-2 px-3 text-right">Stock Actual</th>
                          <th className="py-2 px-3 text-center">Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {calculatedWorkOrderComponents.map((it: any) => (
                          <tr key={it.id || it.sku} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800">{it.sku}</span>
                              <span className="text-[10px] text-slate-400 block">{it.description}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {it.calculatedRequired.toFixed(2)} {it.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {it.availableStock.toFixed(2)} {it.unit}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {it.isSufficient ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  Faltan {it.missing.toFixed(2)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Notas / Instrucciones de Producción
                </label>
                <textarea
                  rows={2}
                  value={woNotes}
                  onChange={(e) => setWoNotes(e.target.value)}
                  placeholder="Detalles sobre especificaciones, lote de corte, troquel, etc."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWorkOrderModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? "Guardando..." : editingWorkOrder ? "Guardar Cambios" : "Crear Orden de Trabajo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CERRAR ORDEN DE TRABAJO (REBAJA DE INVENTARIO) ================= */}
      {closingWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Cerrar Orden de Trabajo: {closingWorkOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Al confirmar, se descontarán las materias primas del inventario según la BOM utilizada.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClosingWorkOrder(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Product summary card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{closingWorkOrder.productName}</span>
                  <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {closingWorkOrder.quantityPlanned} {closingWorkOrder.unit}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Lista de Materiales: <strong className="text-slate-700">{closingWorkOrder.bom?.name}</strong> (
                  {closingWorkOrder.bom?.code})
                </div>
              </div>

              {/* Validation Alert: If Missing Stock, BLOCK closure */}
              {closeValidationResult?.hasMissing ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Cierre Bloqueado: Stock insuficiente de materias primas</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    No es posible cerrar la orden de trabajo porque los siguientes insumos no tienen suficiente
                    existencia en el inventario. Debe abastecer o realizar una compra de estos insumos antes de
                    cerrar:
                  </p>
                  <div className="space-y-1.5 mt-2 bg-white/70 p-2.5 rounded-lg border border-rose-200">
                    {closeValidationResult.missingItems.map((m: any) => (
                      <div
                        key={m.sku}
                        className="flex items-center justify-between text-[11px] border-b border-rose-100 last:border-0 pb-1"
                      >
                        <span className="font-semibold text-rose-900">
                          {m.sku} - {m.description}
                        </span>
                        <span className="font-mono text-rose-700">
                          Requiere: <strong>{m.required.toFixed(2)}</strong> | Disponible:{" "}
                          <strong>{m.available.toFixed(2)}</strong> (Faltan {m.missing.toFixed(2)} {m.unit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium">
                    Todas las materias primas cuentan con existencias suficientes en el inventario para ser
                    rebajadas.
                  </span>
                </div>
              )}

              {/* Finished Product to be added card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      +
                    </div>
                    <span className="font-bold text-emerald-900 text-xs">
                      Incremento Automático de Producto Terminado en Inventario
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs border border-emerald-200">
                    +{closingProducedQty || closingWorkOrder.quantityPlanned} {closingWorkOrder.unit}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Producto: <strong>{closingWorkOrder.productName}</strong>
                  </span>
                  {closingWorkOrder.productSku && (
                    <span>
                      SKU: <strong className="font-mono">{closingWorkOrder.productSku}</strong>
                    </span>
                  )}
                  <span className="text-emerald-700/80">
                    (Se sumará automáticamente a las existencias disponibles en el inventario)
                  </span>
                </div>
              </div>

              {/* Items to be deducted list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 text-[11px] flex items-center justify-between">
                  <span>Materias Primas a Rebajar del Inventario:</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {closingWorkOrder.items?.length || 0} insumos
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {closingWorkOrder.items?.map((it: any) => (
                    <div key={it.id || it.sku} className="px-3 py-2 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800">{it.sku}</span>
                        <span className="text-slate-400 ml-1.5">({it.description})</span>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        -{Number(it.quantityRequired).toFixed(2)} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real produced quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cantidad Real Producida (Unidades a Ingresar)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={closingProducedQty}
                    onChange={(e) => setClosingProducedQty(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nota de Cierre (Opcional)
                  </label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="ej. Turno A, control de calidad aprobado"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClosingWorkOrder(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionLoading || closeValidationResult?.hasMissing}
                  onClick={handleExecuteCloseWorkOrder}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm ${
                    closeValidationResult?.hasMissing
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  }`}
                >
                  {actionLoading
                    ? "Procesando inventario..."
                    : "Confirmar Cierre y Actualizar Inventario (+ PT / - Insumos)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETALLES DE ORDEN DE TRABAJO ================= */}
      {viewingWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ficha Técnica de Orden: {viewingWorkOrder.orderNumber}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Estado: <strong className="text-slate-800">{viewingWorkOrder.status}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition cursor-pointer"
                  title="Imprimir Hoja de Trabajo"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingWorkOrder(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Producto</span>
                  <p className="font-bold text-slate-900 text-sm">{viewingWorkOrder.productName}</p>
                  <p className="text-slate-500 text-[11px]">
                    SKU: {viewingWorkOrder.productSku || "N/A"} • Cantidad:{" "}
                    <strong>
                      {viewingWorkOrder.quantityPlanned} {viewingWorkOrder.unit}
                    </strong>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lista de Materiales</span>
                  <p className="font-bold text-indigo-700">{viewingWorkOrder.bom?.name}</p>
                  <p className="text-slate-500 text-[11px]">Código: {viewingWorkOrder.bom?.code}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Almacén de Planta</span>
                  <p className="text-slate-700 font-medium">{viewingWorkOrder.warehouse}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pedido / Cliente</span>
                  <p className="text-slate-700 font-medium">
                    {viewingWorkOrder.salesOrderNumber || "Orden Directa"}
                    {viewingWorkOrder.customerName ? ` (${viewingWorkOrder.customerName})` : ""}
                  </p>
                </div>
              </div>

              {/* Items detail */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">Desglose de Materias Primas Requeridas:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-right">Cant. Requerida</th>
                        <th className="py-2.5 px-3 text-right">Cant. Consumida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingWorkOrder.items?.map((it: any) => (
                        <tr key={it.id || it.sku}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.sku}</td>
                          <td className="py-2 px-3 text-slate-600">{it.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {Number(it.quantityRequired).toFixed(2)} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                            {Number(it.quantityConsumed).toFixed(2)} {it.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingWorkOrder.notes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Notas:</span>
                  {viewingWorkOrder.notes}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewingWorkOrder(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVA / EDITAR BOM ================= */}
      {showBomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingBom ? `Editar Lista de Materiales ${editingBom.code}` : "Nueva Lista de Materiales (BOM)"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina la receta técnica de insumos requeridos para producir este artículo.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBomModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBom} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Código de BOM <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bomCode}
                    onChange={(e) => setBomCode(e.target.value)}
                    required
                    placeholder="BOM-2026-0001"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nombre Descriptivo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bomName}
                    onChange={(e) => setBomName(e.target.value)}
                    required
                    placeholder="ej. Caja Corrugada 12x12x12 Kraft"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Versión</label>
                  <input
                    type="text"
                    value={bomVersion}
                    onChange={(e) => setBomVersion(e.target.value)}
                    placeholder="1.0"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Finished product selector from inventory or manual */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Producto Terminado Resultante <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={bomFinishedProductSku}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBomFinishedProductSku(val);
                        const inv = inventory.find((i) => i.sku === val);
                        if (inv) setBomFinishedProductName(inv.description);
                      }}
                      className="w-1/2 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Vincular con Inventario (Opcional) --</option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.sku}>
                          {inv.sku} - {inv.description}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={bomFinishedProductName}
                      onChange={(e) => setBomFinishedProductName(e.target.value)}
                      placeholder="Nombre del producto terminado"
                      required
                      className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Base batch output quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Lote Base Resultante
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={bomOutputQuantity}
                      onChange={(e) => setBomOutputQuantity(Number(e.target.value))}
                      required
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                      type="text"
                      value={bomOutputUnit}
                      onChange={(e) => setBomOutputUnit(e.target.value)}
                      placeholder="Unidades"
                      className="w-28 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Items / Raw materials table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Materias Primas e Insumos de la Receta (para producir {bomOutputQuantity} {bomOutputUnit})
                  </label>
                  <button
                    type="button"
                    onClick={addBomItemLine}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Materia Prima
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Materia Prima (Inventario)</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 w-28">Cant. Requerida</th>
                        <th className="py-2.5 px-3 w-24">Unidad</th>
                        <th className="py-2.5 px-3 w-28">Costo Est.</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bomItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {/* Inventory item selector */}
                          <td className="py-2 px-3">
                            <select
                              value={item.inventoryItemId}
                              onChange={(e) => updateBomItemLine(idx, "inventoryItemId", e.target.value)}
                              className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">-- Seleccionar insumo de inventario --</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.sku} - {inv.description} (Stock: {inv.quantity})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* SKU & Description */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.sku}
                              onChange={(e) => updateBomItemLine(idx, "sku", e.target.value)}
                              placeholder="SKU"
                              required
                              className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </td>

                          {/* Quantity Required */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0.0001"
                              step="any"
                              value={item.quantityRequired}
                              onChange={(e) =>
                                updateBomItemLine(idx, "quantityRequired", Number(e.target.value))
                              }
                              required
                              className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 text-right font-mono"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateBomItemLine(idx, "unit", e.target.value)}
                              placeholder="Unidades"
                              className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Estimated Cost */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.estimatedCost}
                              onChange={(e) =>
                                updateBomItemLine(idx, "estimatedCost", Number(e.target.value))
                              }
                              className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 text-right font-mono"
                            />
                          </td>

                          {/* Delete Line */}
                          <td className="py-2 px-2 text-center">
                            {bomItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBomItemLine(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
              </div>

              {/* Description & Active status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Descripción / Especificaciones
                  </label>
                  <textarea
                    rows={2}
                    value={bomDescription}
                    onChange={(e) => setBomDescription(e.target.value)}
                    placeholder="Instrucciones o notas de la fórmula..."
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={bomIsActive}
                      onChange={(e) => setBomIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Lista de Materiales Activa para Producción</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si está inactiva, no se podrá seleccionar para nuevas órdenes de trabajo.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBomModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? "Guardando..." : editingBom ? "Guardar Cambios" : "Crear Lista de Materiales"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
