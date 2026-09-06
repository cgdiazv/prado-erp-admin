"use client";

import React, { useState, useMemo, useEffect } from "react";
import { InventoryItem, ItemLot, ItemSerial, Account } from "@/types/dashboard";
import { TableRowsSkeleton } from "@/components/Skeleton";
import {
  Package,
  Tag,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ArrowLeft,
  Settings,
  Printer,
  FileSpreadsheet,
  Calendar,
  X,
  Layers,
  ImageIcon,
  Upload
} from "lucide-react";

interface InventoryModuleProps {
  inventory: InventoryItem[];
  onRefreshInventory?: () => Promise<void> | void;
  accounts?: Account[];
  productCategories?: string[];
  currentSubView?: "inventario" | "lotes" | "series";
  onChangeSubView?: (view: "inventario" | "lotes" | "series") => void;
  onBack?: () => void;
  autoOpenCreate?: boolean;
  onAutoOpenCreateConsumed?: () => void;
  formatCurrency?: (val: number) => string;
  loading?: boolean;
}

export default function InventoryModule({
  inventory: initialInventory,
  onRefreshInventory,
  accounts = [],
  productCategories = [],
  currentSubView = "inventario",
  onChangeSubView,
  onBack,
  autoOpenCreate = false,
  onAutoOpenCreateConsumed,
  formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  loading = false,
}: InventoryModuleProps) {
  // Local active sub-view state
  const [activeTab, setActiveTab] = useState<"inventario" | "lotes" | "series">(currentSubView);

  useEffect(() => {
    if (currentSubView) {
      setActiveTab(currentSubView);
    }
  }, [currentSubView]);

  const handleTabChange = (tab: "inventario" | "lotes" | "series") => {
    setActiveTab(tab);
    if (onChangeSubView) {
      onChangeSubView(tab);
    }
  };

  // Local inventory mirror for immediate optimistic UI updates
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(initialInventory);
  useEffect(() => {
    setLocalInventory(initialInventory);
  }, [initialInventory]);

  // Filters for Catalog
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "con-stock" | "bajo-stock" | "macola">("todos");

  // Filters for Lotes
  const [lotesFilter, setLotesFilter] = useState<"todos" | "vencidos" | "por-vencer" | "vigentes">("todos");
  const [lotesSearch, setLotesSearch] = useState("");

  // Filters for Serials
  const [seriesFilterView, setSeriesFilterView] = useState("TODOS");
  const [seriesSearchView, setSeriesSearchView] = useState("");

  // New Product Drawer State
  const [showNewProductDrawer, setShowNewProductDrawer] = useState(false);
  const [showProductSaveDropdown, setShowProductSaveDropdown] = useState(false);
  const [productDrawerLoading, setProductDrawerLoading] = useState(false);
  const [productDrawerSuccess, setProductDrawerSuccess] = useState("");
  const [productSectionsOpen, setProductSectionsOpen] = useState({
    basic: true,
    sales: true,
    purchases: false,
  });

  const defaultProductForm = {
    name: "",
    type: "Servicio",
    sku: "",
    category: "",
    isSold: true,
    salesDescription: "",
    price: 0,
    incomeAccountId: "7000",
    isPurchased: false,
    purchaseDescription: "",
    cost: 0,
    expenseAccountId: "5000",
    imageUrl: "",
  };
  const [newProductForm, setNewProductForm] = useState(defaultProductForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [productForm, setProductForm] = useState({
    sku: "",
    description: "",
    quantity: 0,
    cost: 0,
    price: 0,
    trackingType: "NONE",
    category: "",
    imageUrl: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Lotes Modal State
  const [activeLotItem, setActiveLotItem] = useState<InventoryItem | null>(null);
  const [showLotModal, setShowLotModal] = useState(false);
  const [lotList, setLotList] = useState<ItemLot[]>([]);
  const [lotLoading, setLotLoading] = useState(false);
  const [lotError, setLotError] = useState("");
  const [lotSuccess, setLotSuccess] = useState("");
  const [newLotForm, setNewLotForm] = useState({
    lotNumber: "",
    quantity: 0,
    manufactureDate: "",
    expirationDate: "",
    notes: "",
  });

  // Serials Modal State
  const [activeSerialItem, setActiveSerialItem] = useState<InventoryItem | null>(null);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialList, setSerialList] = useState<ItemSerial[]>([]);
  const [serialLoading, setSerialLoading] = useState(false);
  const [serialError, setSerialError] = useState("");
  const [serialSuccess, setSerialSuccess] = useState("");
  const [serialInputMode, setSerialInputMode] = useState<"single" | "bulk">("single");
  const [singleSerialForm, setSingleSerialForm] = useState({
    serialNumber: "",
    status: "DISPONIBLE",
    notes: "",
  });
  const [bulkSerialText, setBulkSerialText] = useState("");

  // Handle external autoOpenCreate trigger
  useEffect(() => {
    if (autoOpenCreate) {
      setShowNewProductDrawer(true);
      if (onAutoOpenCreateConsumed) {
        onAutoOpenCreateConsumed();
      }
    }
  }, [autoOpenCreate, onAutoOpenCreateConsumed]);

  // Derived: All Lots
  const allLots = useMemo(() => {
    const list: {
      lot: ItemLot;
      item: InventoryItem;
      daysLeft: number | null;
      status: "vencido" | "por-vencer" | "vigente" | "sin-fecha";
    }[] = [];

    localInventory.forEach((item) => {
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
  }, [localInventory]);

  const filteredAllLots = useMemo(() => {
    return allLots.filter((entry) => {
      const q = lotesSearch.toLowerCase();
      const matchesSearch =
        !q ||
        entry.lot.lotNumber.toLowerCase().includes(q) ||
        entry.item.sku.toLowerCase().includes(q) ||
        entry.item.description.toLowerCase().includes(q);

      const matchesFilter =
        lotesFilter === "todos" ||
        (lotesFilter === "vencidos" && entry.status === "vencido") ||
        (lotesFilter === "por-vencer" && entry.status === "por-vencer") ||
        (lotesFilter === "vigentes" && entry.status === "vigente");

      return matchesSearch && matchesFilter;
    });
  }, [allLots, lotesSearch, lotesFilter]);

  // Derived: All Serials
  const allSerials = useMemo(() => {
    const list: {
      serial: ItemSerial;
      item: InventoryItem;
    }[] = [];

    localInventory.forEach((item) => {
      if (item.serials && item.serials.length > 0) {
        item.serials.forEach((serial) => {
          list.push({ serial, item });
        });
      }
    });

    return list;
  }, [localInventory]);

  const filteredAllSerials = useMemo(() => {
    return allSerials.filter((entry) => {
      const q = seriesSearchView.toLowerCase();
      const matchesSearch =
        !q ||
        entry.serial.serialNumber.toLowerCase().includes(q) ||
        entry.item.sku.toLowerCase().includes(q) ||
        entry.item.description.toLowerCase().includes(q);

      const matchesFilter =
        seriesFilterView === "TODOS" || entry.serial.status === seriesFilterView;

      return matchesSearch && matchesFilter;
    });
  }, [allSerials, seriesSearchView, seriesFilterView]);

  // Filtered Catalog
  const filteredInventory = useMemo(() => {
    return localInventory.filter((i) => {
      const matchesSearch =
        !search ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === "con-stock") return i.quantity > 0;
      if (filterType === "bajo-stock") return i.quantity <= 5;
      if (filterType === "macola") return i.sku.startsWith("MAC-") || i.sku.length > 6;

      return true;
    });
  }, [localInventory, search, filterType]);

  // Handlers for Products
  const uploadProductImage = async (file: File): Promise<string | null> => {
    setImageUploadError("");
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/inventory/upload-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al subir la imagen");
      return json.data.url as string;
    } catch (err: any) {
      setImageUploadError(err.message || "Error al subir la imagen");
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleCreateProduct = async (e?: React.FormEvent, createAnother: boolean = false) => {
    if (e) e.preventDefault();
    if (!newProductForm.name.trim()) return;

    setProductDrawerLoading(true);
    try {
      const generatedSku = newProductForm.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
      const descriptionText = `${newProductForm.name.trim()}${newProductForm.salesDescription ? ` - ${newProductForm.salesDescription.trim()}` : ""}`;

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: generatedSku,
          description: descriptionText,
          quantity: newProductForm.type === "Servicio" ? 1 : 10,
          cost: newProductForm.cost || 0,
          price: newProductForm.price || 0,
          category: newProductForm.category || null,
          imageUrl: newProductForm.imageUrl || null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLocalInventory((prev) => [...prev, json.data]);
        if (onRefreshInventory) await onRefreshInventory();
        setProductDrawerSuccess("¡Producto / servicio registrado correctamente!");
        setTimeout(() => setProductDrawerSuccess(""), 4000);

        if (createAnother) {
          setNewProductForm({ ...defaultProductForm });
        } else {
          setShowNewProductDrawer(false);
        }
      } else {
        alert(json.error || "Error al crear el producto en la base de datos");
      }
    } catch (err) {
      console.error("Error creating product:", err);
    } finally {
      setProductDrawerLoading(false);
    }
  };

  const handleOpenEditProduct = (prod: InventoryItem) => {
    setEditingProduct(prod);
    setProductForm({
      sku: prod.sku,
      description: prod.description,
      quantity: prod.quantity,
      cost: prod.cost,
      price: prod.price,
      trackingType: prod.trackingType || "NONE",
      category: prod.category || "",
      imageUrl: prod.imageUrl || "",
    });
    setImageUploadError("");
    setModalError("");
    setModalSuccess("");
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      const res = await fetch(`/api/inventory/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLocalInventory((prev) =>
          prev.map((item) => (item.id === editingProduct.id ? { ...item, ...json.data } : item))
        );
      } else {
        setLocalInventory((prev) =>
          prev.map((item) => (item.id === editingProduct.id ? { ...item, ...productForm } : item))
        );
      }
      if (onRefreshInventory) await onRefreshInventory();
      setModalSuccess("¡Producto de inventario actualizado correctamente!");
      setTimeout(() => {
        setEditingProduct(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al actualizar producto");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (
      !confirm(
        `¿Eliminar el artículo "${editingProduct.description || editingProduct.sku}"? Esta acción no se puede deshacer.`
      )
    )
      return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`/api/inventory/${editingProduct.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar artículo de inventario");
      }
      setLocalInventory((prev) => prev.filter((item) => item.id !== editingProduct.id));
      if (onRefreshInventory) await onRefreshInventory();
      setModalSuccess("¡Artículo de inventario eliminado!");
      setTimeout(() => {
        setEditingProduct(null);
        setModalSuccess("");
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Error al eliminar artículo de inventario");
    } finally {
      setModalLoading(false);
    }
  };

  // Handlers for Lots
  const openLotManagementModal = async (item: InventoryItem) => {
    setActiveLotItem(item);
    setShowLotModal(true);
    setLotLoading(true);
    setLotError("");
    setLotSuccess("");
    try {
      const res = await fetch(`/api/inventory/${item.id}/lots`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLotList(json.data);
      } else {
        setLotList(item.lots || []);
      }
    } catch (err) {
      console.error("Error loading lots:", err);
      setLotList(item.lots || []);
    } finally {
      setLotLoading(false);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLotItem || !newLotForm.lotNumber) return;
    setLotLoading(true);
    setLotError("");
    setLotSuccess("");
    try {
      const res = await fetch(`/api/inventory/${activeLotItem.id}/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLotForm),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const updatedLots = [...lotList, json.data];
        setLotList(updatedLots);
        const newTotalQty = lotList.reduce((acc, l) => acc + l.quantity, 0) + Number(newLotForm.quantity);
        setLocalInventory((prev) =>
          prev.map((i) =>
            i.id === activeLotItem.id
              ? { ...i, quantity: newTotalQty, trackingType: "LOT", lots: updatedLots }
              : i
          )
        );
        if (onRefreshInventory) await onRefreshInventory();
        setLotSuccess(`Lote ${newLotForm.lotNumber} agregado con éxito.`);
        setNewLotForm({ lotNumber: "", quantity: 0, manufactureDate: "", expirationDate: "", notes: "" });
      } else {
        setLotError(json.error || "Error al agregar el lote");
      }
    } catch (err: any) {
      setLotError(err.message || "Error al conectar con la API de lotes");
    } finally {
      setLotLoading(false);
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!activeLotItem) return;
    try {
      const res = await fetch(`/api/inventory/lots/${lotId}`, { method: "DELETE" });
      if (res.ok) {
        const updatedLots = lotList.filter((l) => l.id !== lotId);
        setLotList(updatedLots);
        const newTotalQty = updatedLots.reduce((acc, l) => acc + l.quantity, 0);
        setLocalInventory((prev) =>
          prev.map((i) => (i.id === activeLotItem.id ? { ...i, quantity: newTotalQty, lots: updatedLots } : i))
        );
        if (onRefreshInventory) await onRefreshInventory();
      }
    } catch (err) {
      console.error("Error deleting lot:", err);
    }
  };

  // Handlers for Serials
  const openSerialManagementModal = async (item: InventoryItem) => {
    setActiveSerialItem(item);
    setShowSerialModal(true);
    setSerialLoading(true);
    setSerialError("");
    setSerialSuccess("");
    try {
      const res = await fetch(`/api/inventory/${item.id}/serials`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSerialList(json.data);
      } else {
        setSerialList(item.serials || []);
      }
    } catch (err) {
      console.error("Error loading serials:", err);
      setSerialList(item.serials || []);
    } finally {
      setSerialLoading(false);
    }
  };

  const handleCreateSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSerialItem) return;
    setSerialLoading(true);
    setSerialError("");
    setSerialSuccess("");
    try {
      const payload =
        serialInputMode === "bulk"
          ? { serialNumber: bulkSerialText }
          : { ...singleSerialForm };

      const res = await fetch(`/api/inventory/${activeSerialItem.id}/serials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const updatedSerials = [...serialList, ...json.data];
        setSerialList(updatedSerials);
        const availCount = updatedSerials.filter((s) => s.status === "DISPONIBLE").length;
        setLocalInventory((prev) =>
          prev.map((i) =>
            i.id === activeSerialItem.id
              ? { ...i, quantity: availCount, trackingType: "SERIAL", serials: updatedSerials }
              : i
          )
        );
        if (onRefreshInventory) await onRefreshInventory();
        setSerialSuccess(`Se agregaron ${json.addedCount || json.data.length} números de serie.`);
        setSingleSerialForm({ serialNumber: "", status: "DISPONIBLE", notes: "" });
        setBulkSerialText("");
      } else {
        setSerialError(json.error || "Error al agregar números de serie");
      }
    } catch (err: any) {
      setSerialError(err.message || "Error al conectar con API de series");
    } finally {
      setSerialLoading(false);
    }
  };

  const handleUpdateSerialStatus = async (serialId: string, newStatus: string) => {
    if (!activeSerialItem) return;
    try {
      const res = await fetch(`/api/inventory/serials/${serialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const updatedList = serialList.map((s) => (s.id === serialId ? json.data : s));
        setSerialList(updatedList);
        const availCount = updatedList.filter((s) => s.status === "DISPONIBLE").length;
        setLocalInventory((prev) =>
          prev.map((i) => (i.id === activeSerialItem.id ? { ...i, quantity: availCount, serials: updatedList } : i))
        );
        if (onRefreshInventory) await onRefreshInventory();
      }
    } catch (err) {
      console.error("Error updating serial status:", err);
    }
  };

  const handleDeleteSerial = async (serialId: string) => {
    if (!activeSerialItem) return;
    try {
      const res = await fetch(`/api/inventory/serials/${serialId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        const updatedList = serialList.filter((s) => s.id !== serialId);
        setSerialList(updatedList);
        const availCount = updatedList.filter((s) => s.status === "DISPONIBLE").length;
        setLocalInventory((prev) =>
          prev.map((i) => (i.id === activeSerialItem.id ? { ...i, quantity: availCount, serials: updatedList } : i))
        );
        if (onRefreshInventory) await onRefreshInventory();
      }
    } catch (err) {
      console.error("Error deleting serial:", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Navigation Header (Catálogo, Lotes, Series) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer mr-1"
              title="Regresar al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange("inventario")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "inventario"
                  ? "bg-white text-[#1b426e] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Catálogo ({localInventory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("lotes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "lotes"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Control de Lotes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {allLots.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("series")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "series"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              <span>Números de Serie</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {allSerials.length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              alert("Generando reporte de inventario...");
              window.print();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewProductDrawer(true)}
            className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#1b426e]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: CATALOGO DE PRODUCTOS ================= */}
      {activeTab === "inventario" && (
        <div className="space-y-4">
          {/* Toolbar Card (Search, filter, export) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Filtrar por nombre o SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Dropdown Filter Select */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#1b426e] cursor-pointer pr-8 font-medium appearance-none"
                >
                  <option value="todos">Todos los productos</option>
                  <option value="con-stock">Con inventario disponible</option>
                  <option value="bajo-stock">Bajo inventario / Alerta</option>
                  <option value="macola">Sincronizados Macola</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1.5 self-end md:self-auto text-slate-400">
              <button
                type="button"
                onClick={() => alert("Exportando catálogo de productos...")}
                className="p-1.5 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition cursor-pointer"
                title="Exportar catálogo"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition cursor-pointer"
                title="Imprimir lista"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-slate-900">
                Control Maestro de Inventario ({filteredInventory.length})
              </h2>
              <span className="text-xs text-slate-500">
                Total Valorizado:{" "}
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(
                    filteredInventory.reduce((acc, item) => acc + (item.quantity * item.cost), 0)
                  )}
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">SKU / CÓDIGO</th>
                    <th className="p-3.5">DESCRIPCIÓN DEL ARTÍCULO</th>
                    <th className="p-3.5">RASTREO</th>
                    <th className="p-3.5 text-right">EXISTENCIAS</th>
                    <th className="p-3.5 text-right">COSTO PROM.</th>
                    <th className="p-3.5 text-right">PRECIO VENTA</th>
                    <th className="p-3.5 text-right">VALOR INVENTARIO</th>
                    <th className="p-3.5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableRowsSkeleton cols={8} rows={8} />
                  ) : (
                    <>
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                          <td className="p-3.5 font-mono font-bold text-[#1b426e]">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(item)}
                              className="hover:underline cursor-pointer flex items-center gap-1.5 group"
                              title="Haz clic para editar producto"
                            >
                              <span>{item.sku}</span>
                            </button>
                          </td>
                          <td className="p-3.5 font-medium text-slate-900">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(item)}
                              className="hover:text-[#1b426e] hover:underline cursor-pointer text-left font-medium flex items-center gap-2.5"
                              title="Haz clic para editar producto"
                            >
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <span className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                                </span>
                              )}
                              <span>{item.description}</span>
                            </button>
                          </td>
                          <td className="p-3.5">
                            {item.trackingType === "LOT" ? (
                              <button
                                type="button"
                                onClick={() => openLotManagementModal(item)}
                                className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px] hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5 w-fit"
                              >
                                <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Por Lote</span>
                                <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                                  {item.lots?.length || 0}
                                </span>
                              </button>
                            ) : item.trackingType === "SERIAL" ? (
                              <button
                                type="button"
                                onClick={() => openSerialManagementModal(item)}
                                className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px] hover:bg-purple-100 transition cursor-pointer flex items-center gap-1.5 w-fit"
                              >
                                <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>Por N.º Serie</span>
                                <span className="bg-purple-200 text-purple-900 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                                  {item.serials?.length || 0}
                                </span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                                Sin rastreo
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-medium">
                            <span className={item.quantity <= 0 ? "text-rose-600 font-bold" : "text-slate-800"}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-medium">{formatCurrency(item.cost)}</td>
                          <td className="p-3.5 text-right font-mono font-medium">{formatCurrency(item.price)}</td>
                          <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                            {formatCurrency(item.quantity * item.cost)}
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.trackingType === "LOT" ? (
                                <button
                                  type="button"
                                  onClick={() => openLotManagementModal(item)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 shadow-xs"
                                  title="Gestionar Lotes y Vencimientos"
                                >
                                  <span>Lotes</span>
                                </button>
                              ) : item.trackingType === "SERIAL" ? (
                                <button
                                  type="button"
                                  onClick={() => openSerialManagementModal(item)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 shadow-xs"
                                  title="Gestionar Números de Serie"
                                >
                                  <span>Series</span>
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(item)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fff7ed] hover:text-[#1b426e] text-slate-700 font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                                title="Haz clic para editar producto"
                              >
                                <span>Editar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No se encontraron artículos en inventario
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

      {/* ================= VIEW 2: CONTROL DE LOTES Y VENCIMIENTOS ================= */}
      {activeTab === "lotes" && (
        <div className="space-y-5">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Control Maestro de Lotes & Vencimientos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                  Trazabilidad FEFO ({allLots.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoreo centralizado de frescura de insumos, caducidad por fecha de vencimiento y gestión de lotes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  alert("Generando reporte de lotes y vencimientos...");
                  window.print();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Reporte FEFO</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setLotesFilter("todos")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                lotesFilter === "todos" ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Lotes</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{allLots.length}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Lotes en catálogo activo</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            </div>

            <div
              onClick={() => setLotesFilter("vencidos")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                lotesFilter === "vencidos" ? "border-rose-500 ring-2 ring-rose-200" : "border-slate-200/80 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-600">Lotes Vencidos</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  {allLots.filter((l) => l.status === "vencido").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Caducados / Retirar de stock</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
            </div>

            <div
              onClick={() => setLotesFilter("por-vencer")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                lotesFilter === "por-vencer" ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200/80 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700">Por Vencer (&le; 30 días)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                  {allLots.filter((l) => l.status === "por-vencer").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Prioridad de despacho FEFO</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            </div>

            <div
              onClick={() => setLotesFilter("vigentes")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                lotesFilter === "vigentes" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200/80 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Vigentes (&gt; 30 días)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {allLots.filter((l) => l.status === "vigente").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Stock en condiciones óptimas</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLotesFilter("todos")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    lotesFilter === "todos" ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Todos ({allLots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLotesFilter("vencidos")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    lotesFilter === "vencidos" ? "bg-red-600 text-white font-bold shadow-xs" : "text-red-700 hover:bg-red-50"
                  }`}
                >
                  Vencidos ({allLots.filter((l) => l.status === "vencido").length})
                </button>
                <button
                  type="button"
                  onClick={() => setLotesFilter("por-vencer")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    lotesFilter === "por-vencer" ? "bg-amber-500 text-white font-bold shadow-xs" : "text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  Por Vencer ({allLots.filter((l) => l.status === "por-vencer").length})
                </button>
                <button
                  type="button"
                  onClick={() => setLotesFilter("vigentes")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    lotesFilter === "vigentes" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  Vigentes ({allLots.filter((l) => l.status === "vigente").length})
                </button>
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Buscar por lote, SKU o descripción..."
                  value={lotesSearch}
                  onChange={(e) => setLotesSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">Nº DE LOTE</th>
                    <th className="p-3.5">PRODUCTO / SKU</th>
                    <th className="p-3.5 text-right">CANTIDAD</th>
                    <th className="p-3.5">FECHA FABRICACIÓN</th>
                    <th className="p-3.5">FECHA VENCIMIENTO</th>
                    <th className="p-3.5">ESTADO / DÍAS RESTANTES</th>
                    <th className="p-3.5">NOTAS</th>
                    <th className="p-3.5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllLots.map(({ lot, item, daysLeft, status }) => (
                    <tr key={lot.id} className="hover:bg-slate-50/80 transition group">
                      <td className="p-3.5 font-mono font-bold text-amber-900">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                          {lot.lotNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{item.sku}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">{item.description}</div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">{lot.quantity}</td>
                      <td className="p-3.5 font-mono text-slate-600">{lot.manufactureDate || "-"}</td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">{lot.expirationDate || "-"}</td>
                      <td className="p-3.5">
                        {status === "vencido" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Vencido hace {Math.abs(daysLeft || 0)} días</span>
                          </span>
                        ) : status === "por-vencer" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Vence en {daysLeft} días</span>
                          </span>
                        ) : status === "vigente" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Vigente ({daysLeft} días)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            Sin fecha
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] italic truncate max-w-xs">{lot.notes || "-"}</td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => openLotManagementModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAllLots.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No se encontraron lotes registrados con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: CONTROL DE NÚMEROS DE SERIE ================= */}
      {activeTab === "series" && (
        <div className="space-y-5">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Control de Números de Serie & Trazabilidad
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                  Garantías & Trazabilidad ({allSerials.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Búsqueda rápida por código de barras/serie, garantía y seguimiento del ciclo de vida del producto.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  alert("Generando reporte de trazabilidad de números de serie...");
                  window.print();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Trazabilidad</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setSeriesFilterView("TODOS")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                seriesFilterView === "TODOS" ? "border-purple-600 ring-2 ring-purple-200" : "border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Series</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{allSerials.length}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">en historial de inventario</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
            </div>

            <div
              onClick={() => setSeriesFilterView("DISPONIBLE")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                seriesFilterView === "DISPONIBLE" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200/80 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Disponibles</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {allSerials.filter((s) => s.serial.status === "DISPONIBLE").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Listos para facturar/despachar</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>

            <div
              onClick={() => setSeriesFilterView("VENDIDO")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                seriesFilterView === "VENDIDO" ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200/80 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700">Vendidos / Entregados</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                  {allSerials.filter((s) => s.serial.status === "VENDIDO").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Con clientes / Garantía activa</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </div>

            <div
              onClick={() => setSeriesFilterView("DEFECTUOSO")}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                seriesFilterView === "DEFECTUOSO" ? "border-rose-500 ring-2 ring-rose-200" : "border-slate-200/80 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700">Defectuosos / RMA</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  {allSerials.filter((s) => s.serial.status === "DEFECTUOSO").length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">En cuarentena o reparación</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {["TODOS", "DISPONIBLE", "VENDIDO", "RESERVADO", "DEFECTUOSO"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSeriesFilterView(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      seriesFilterView === st
                        ? "bg-purple-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st} ({st === "TODOS" ? allSerials.length : allSerials.filter((s) => s.serial.status === st).length})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Buscar por serie, SKU o producto..."
                  value={seriesSearchView}
                  onChange={(e) => setSeriesSearchView(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">Nº DE SERIE</th>
                    <th className="p-3.5">PRODUCTO / SKU</th>
                    <th className="p-3.5">ESTADO</th>
                    <th className="p-3.5">NOTAS / OBSERVACIONES</th>
                    <th className="p-3.5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllSerials.map(({ serial, item }) => (
                    <tr key={serial.id} className="hover:bg-slate-50/80 transition group">
                      <td className="p-3.5 font-mono font-bold text-purple-900">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                          {serial.serialNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{item.sku}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">{item.description}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            serial.status === "DISPONIBLE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : serial.status === "VENDIDO"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : serial.status === "RESERVADO"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {serial.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] italic truncate max-w-xs">{serial.notes || "-"}</td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => openSerialManagementModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-800 text-slate-700 font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAllSerials.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No se encontraron números de serie con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR PRODUCTO ================= */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-[#1b426e] uppercase tracking-wider">
                  Control de Inventario
                </span>
                <h3 className="text-base font-bold text-slate-900">Editar Producto / Artículo</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEditProduct} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                {productForm.imageUrl ? (
                  <div className="relative w-16 h-16 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productForm.imageUrl}
                      alt="Foto del producto"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 cursor-pointer shadow"
                      title="Quitar foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  </div>
                )}
                <div>
                  <label className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {imageUploading ? "Subiendo..." : productForm.imageUrl ? "Cambiar foto" : "Subir foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={imageUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        const url = await uploadProductImage(file);
                        if (url) setProductForm((prev) => ({ ...prev, imageUrl: url }));
                      }}
                    />
                  </label>
                  {imageUploadError && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{imageUploadError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Artículo *</label>
                <input
                  type="text"
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Código</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Existencias (Stock)</label>
                  <input
                    type="number"
                    required
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-800 cursor-pointer"
                >
                  <option value="">Sin categoría</option>
                  {/* Preserve the current value even if it no longer exists in the list */}
                  {productForm.category && !productCategories.includes(productForm.category) && (
                    <option value={productForm.category}>{productForm.category}</option>
                  )}
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipo de Rastreo de Inventario *
                </label>
                <select
                  value={productForm.trackingType}
                  onChange={(e) => setProductForm({ ...productForm, trackingType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 border border-amber-300 focus:outline-none focus:border-[#1b426e] text-slate-900 font-semibold cursor-pointer"
                >
                  <option value="NONE">Sin rastreo (Inventario Estándar)</option>
                  <option value="LOT">Control por Lotes y Vencimientos</option>
                  <option value="SERIAL">Control por Números de Serie</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.cost}
                    onChange={(e) => setProductForm({ ...productForm, cost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={modalLoading}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold cursor-pointer border border-red-200 transition disabled:opacity-50"
                >
                  Eliminar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20 disabled:opacity-50"
                  >
                    {modalLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DRAWER: AÑADIR NUEVO PRODUCTO O SERVICIO ================= */}
      {showNewProductDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity z-50"
            onClick={() => setShowNewProductDrawer(false)}
          />

          <aside className="relative z-50 w-full max-w-xl bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
              <h2 className="text-base font-bold text-slate-800">Añadir un nuevo producto o servicio</h2>
              <button
                type="button"
                onClick={() => setShowNewProductDrawer(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success alert banner */}
            {productDrawerSuccess && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{productDrawerSuccess}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={(e) => handleCreateProduct(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION: BASIC INFO */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() =>
                    setProductSectionsOpen((prev) => ({ ...prev, basic: !prev.basic }))
                  }
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Información básica
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      productSectionsOpen.basic ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {productSectionsOpen.basic && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre del artículo / servicio *
                      </label>
                      <input
                        type="text"
                        required
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                        placeholder="Ej. Bobina BOPP Transparente 25 micras"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de ítem</label>
                        <select
                          value={newProductForm.type}
                          onChange={(e) => setNewProductForm({ ...newProductForm, type: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-800"
                        >
                          <option value="Servicio">Servicio</option>
                          <option value="Producto">Producto / Inventario</option>
                          <option value="Insumo">Materia Prima / Insumo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Código</label>
                        <input
                          type="text"
                          value={newProductForm.sku}
                          onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                          placeholder="Autogenerado si está vacío"
                          className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                      <select
                        value={newProductForm.category}
                        onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-800"
                      >
                        <option value="">Sin categoría</option>
                        {productCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {productCategories.length === 0 && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          No hay categorías registradas. Admínistralas en Configuración → Todas las listas → Categorías de productos.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Foto del producto</label>
                      <div className="flex items-center gap-3">
                        {newProductForm.imageUrl ? (
                          <div className="relative w-16 h-16 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={newProductForm.imageUrl}
                              alt="Foto del producto"
                              className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setNewProductForm({ ...newProductForm, imageUrl: "" })}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 cursor-pointer shadow"
                              title="Quitar foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                        <label className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer inline-flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          {imageUploading ? "Subiendo..." : "Subir imagen"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={imageUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              const url = await uploadProductImage(file);
                              if (url) setNewProductForm((prev) => ({ ...prev, imageUrl: url }));
                            }}
                          />
                        </label>
                      </div>
                      {imageUploadError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600">{imageUploadError}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">JPG, PNG, WEBP o GIF. Máx. 5 MB.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: SALES INFO */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() =>
                    setProductSectionsOpen((prev) => ({ ...prev, sales: !prev.sales }))
                  }
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Información de ventas
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      productSectionsOpen.sales ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {productSectionsOpen.sales && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isSold"
                        checked={newProductForm.isSold}
                        onChange={(e) => setNewProductForm({ ...newProductForm, isSold: e.target.checked })}
                        className="rounded text-[#1b426e] focus:ring-[#1b426e]"
                      />
                      <label htmlFor="isSold" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Vendo este producto / servicio a mis clientes
                      </label>
                    </div>

                    {newProductForm.isSold && (
                      <div className="space-y-3 pl-6 border-l-2 border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Precio de venta ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProductForm.price}
                            onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Descripción para facturas
                          </label>
                          <textarea
                            rows={2}
                            value={newProductForm.salesDescription}
                            onChange={(e) => setNewProductForm({ ...newProductForm, salesDescription: e.target.value })}
                            placeholder="Texto descriptivo que aparecerá en la factura"
                            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Cuenta de ingresos
                          </label>
                          <select
                            value={newProductForm.incomeAccountId}
                            onChange={(e) => setNewProductForm({ ...newProductForm, incomeAccountId: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-800"
                          >
                            <option value="7000">7000 - Ingresos por Ventas</option>
                            <option value="7100">7100 - Ventas de Servicios de Impresión</option>
                            {accounts
                              .filter((a) => a.type === "INGRESOS" || a.type === "INGRESOS_OPERATIVOS" || a.type === "REVENUE")
                              .map((acc) => (
                                <option key={acc.id} value={acc.code}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION: PURCHASES INFO */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() =>
                    setProductSectionsOpen((prev) => ({ ...prev, purchases: !prev.purchases }))
                  }
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Información de compras
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      productSectionsOpen.purchases ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {productSectionsOpen.purchases && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPurchased"
                        checked={newProductForm.isPurchased}
                        onChange={(e) => setNewProductForm({ ...newProductForm, isPurchased: e.target.checked })}
                        className="rounded text-[#1b426e] focus:ring-[#1b426e]"
                      />
                      <label htmlFor="isPurchased" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Compro este producto / insumo a un proveedor
                      </label>
                    </div>

                    {newProductForm.isPurchased && (
                      <div className="space-y-3 pl-6 border-l-2 border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Costo de compra ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProductForm.cost}
                            onChange={(e) => setNewProductForm({ ...newProductForm, cost: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Descripción para órdenes de compra
                          </label>
                          <textarea
                            rows={2}
                            value={newProductForm.purchaseDescription}
                            onChange={(e) => setNewProductForm({ ...newProductForm, purchaseDescription: e.target.value })}
                            placeholder="Descripción para órdenes de compra al proveedor"
                            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Cuenta de gastos / costo
                          </label>
                          <select
                            value={newProductForm.expenseAccountId}
                            onChange={(e) => setNewProductForm({ ...newProductForm, expenseAccountId: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1b426e] text-slate-800"
                          >
                            <option value="5000">5000 - Costo de Ventas</option>
                            <option value="6000">6000 - Gastos Operativos</option>
                            {accounts
                              .filter((a) => a.type === "COSTOS" || a.type === "GASTOS" || a.type === "EXPENSE")
                              .map((acc) => (
                                <option key={acc.id} value={acc.code}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Footer Buttons */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowNewProductDrawer(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>

              <div className="relative inline-flex rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={(e) => handleCreateProduct(e, false)}
                  disabled={productDrawerLoading}
                  className="px-4 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {productDrawerLoading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductSaveDropdown(!showProductSaveDropdown)}
                  className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProductSaveDropdown ? "rotate-180" : ""}`} />
                </button>

                {showProductSaveDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductSaveDropdown(false);
                        handleCreateProduct(undefined, false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer flex items-center gap-2"
                    >
                      <span>Guardar y cerrar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductSaveDropdown(false);
                        handleCreateProduct(undefined, true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-[#1b426e]" />
                      <span>Guardar y crear nuevo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ================= MODAL: GESTIÓN DE LOTES Y VENCIMIENTOS ================= */}
      {showLotModal && activeLotItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 inline-flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lotes & Vencimientos</span>
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{activeLotItem.sku}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeLotItem.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLotModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerts */}
            {lotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {lotError}
              </div>
            )}
            {lotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {lotSuccess}
              </div>
            )}

            {/* Form: Add Lot */}
            <form onSubmit={handleCreateLot} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 text-xs">Registrar Nuevo Lote</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº de Lote *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. LOT-2026-001"
                    value={newLotForm.lotNumber}
                    onChange={(e) => setNewLotForm({ ...newLotForm, lotNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newLotForm.quantity}
                    onChange={(e) => setNewLotForm({ ...newLotForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={newLotForm.expirationDate}
                    onChange={(e) => setNewLotForm({ ...newLotForm, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Fabricación</label>
                  <input
                    type="date"
                    value={newLotForm.manufactureDate}
                    onChange={(e) => setNewLotForm({ ...newLotForm, manufactureDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notas / Proveedor</label>
                  <input
                    type="text"
                    placeholder="Ej. Insumo importado..."
                    value={newLotForm.notes}
                    onChange={(e) => setNewLotForm({ ...newLotForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={lotLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {lotLoading ? "Agregando..." : "+ Agregar Lote"}
                </button>
              </div>
            </form>

            {/* List of Lots */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Lotes Registrados ({lotList.length})</h4>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0">
                    <tr>
                      <th className="p-2.5">LOTE</th>
                      <th className="p-2.5 text-right">CANTIDAD</th>
                      <th className="p-2.5">VENCIMIENTO</th>
                      <th className="p-2.5">NOTAS</th>
                      <th className="p-2.5 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lotList.map((lot) => (
                      <tr key={lot.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{lot.lotNumber}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-700">{lot.quantity}</td>
                        <td className="p-2.5 font-mono text-slate-700">{lot.expirationDate || "-"}</td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[150px]">{lot.notes || "-"}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLot(lot.id)}
                            className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lotList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No hay lotes registrados para este producto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLotModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GESTIÓN DE NÚMEROS DE SERIE ================= */}
      {showSerialModal && activeSerialItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 inline-flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Números de Serie</span>
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{activeSerialItem.sku}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeSerialItem.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSerialModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerts */}
            {serialError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {serialError}
              </div>
            )}
            {serialSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {serialSuccess}
              </div>
            )}

            {/* Form: Add Serial */}
            <form onSubmit={handleCreateSerial} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs">Registrar Números de Serie</h4>
                <div className="flex bg-slate-200 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSerialInputMode("single")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                      serialInputMode === "single" ? "bg-white text-purple-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSerialInputMode("bulk")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                      serialInputMode === "bulk" ? "bg-white text-purple-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Masivo (Lector)
                  </button>
                </div>
              </div>

              {serialInputMode === "single" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nº de Serie *</label>
                    <input
                      type="text"
                      required
                      placeholder="SN-998822..."
                      value={singleSerialForm.serialNumber}
                      onChange={(e) => setSingleSerialForm({ ...singleSerialForm, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estado Inicial</label>
                    <select
                      value={singleSerialForm.status}
                      onChange={(e) => setSingleSerialForm({ ...singleSerialForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    >
                      <option value="DISPONIBLE">DISPONIBLE</option>
                      <option value="RESERVADO">RESERVADO</option>
                      <option value="DEFECTUOSO">DEFECTUOSO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notas / Ubicación</label>
                    <input
                      type="text"
                      placeholder="Estante A3..."
                      value={singleSerialForm.notes}
                      onChange={(e) => setSingleSerialForm({ ...singleSerialForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pegar o escanear números de serie (separados por salto de línea o coma):
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="SN-1001&#10;SN-1002&#10;SN-1003"
                    value={bulkSerialText}
                    onChange={(e) => setBulkSerialText(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={serialLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {serialLoading ? "Registrando..." : "+ Agregar Números de Serie"}
                </button>
              </div>
            </form>

            {/* List of Serials */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Series Registradas ({serialList.length})</h4>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0">
                    <tr>
                      <th className="p-2.5">SERIE</th>
                      <th className="p-2.5">ESTADO</th>
                      <th className="p-2.5 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serialList.map((serial) => (
                      <tr key={serial.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{serial.serialNumber}</td>
                        <td className="p-2.5">
                          <select
                            value={serial.status}
                            onChange={(e) => handleUpdateSerialStatus(serial.id, e.target.value)}
                            className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-semibold cursor-pointer"
                          >
                            <option value="DISPONIBLE">DISPONIBLE</option>
                            <option value="VENDIDO">VENDIDO</option>
                            <option value="RESERVADO">RESERVADO</option>
                            <option value="DEFECTUOSO">DEFECTUOSO</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSerial(serial.id)}
                            className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {serialList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400">
                          No hay números de serie registrados para este producto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSerialModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
