"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SalesRep, CommissionRecord } from "@/types/dashboard";
import { TableRowsSkeleton } from "@/components/Skeleton";
import {
  Users,
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Printer,
  X,
  Percent,
  DollarSign,
  TrendingUp,
  Check
} from "lucide-react";

interface CommissionsModuleProps {
  salesReps: SalesRep[];
  commissions: CommissionRecord[];
  onRefreshSalesReps?: () => Promise<void> | void;
  onRefreshCommissions?: () => Promise<void> | void;
  currentSubView?: "vendedores" | "comisiones";
  onChangeSubView?: (view: "vendedores" | "comisiones") => void;
  onBack?: () => void;
  loading?: boolean;
  formatCurrency?: (val: number) => string;
  companySettings?: {
    nombre?: string;
    nombreLegal?: string;
    taxId?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: string;
  };
}

export default function CommissionsModule({
  salesReps: initialSalesReps,
  commissions: initialCommissions,
  onRefreshSalesReps,
  onRefreshCommissions,
  currentSubView = "vendedores",
  onChangeSubView,
  onBack,
  loading = false,
  formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  companySettings,
}: CommissionsModuleProps) {
  // Company settings fallback
  const [internalCompanySettings, setInternalCompanySettings] = useState(companySettings);

  useEffect(() => {
    if (companySettings) {
      setInternalCompanySettings(companySettings);
    } else {
      fetch("/api/company")
        .then((res) => res.json())
        .then((data) => {
          if (data?.company) {
            setInternalCompanySettings(data.company);
          }
        })
        .catch(() => {});
    }
  }, [companySettings]);

  // Report Modal State for Vendedores
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportScope, setReportScope] = useState<"filtrados" | "todos" | "activos" | "inactivos">("filtrados");
  const [reportSortBy, setReportSortBy] = useState<"name" | "code" | "target" | "rate" | "zone">("name");

  // Sub-view tab
  const [activeTab, setActiveTab] = useState<"vendedores" | "comisiones">(currentSubView);

  useEffect(() => {
    if (currentSubView) {
      setActiveTab(currentSubView);
    }
  }, [currentSubView]);

  const handleTabChange = (tab: "vendedores" | "comisiones") => {
    setActiveTab(tab);
    if (onChangeSubView) {
      onChangeSubView(tab);
    }
  };

  // Local state mirrors for immediate optimistic UI updates
  const [localSalesReps, setLocalSalesReps] = useState<SalesRep[]>(initialSalesReps);
  const [localCommissions, setLocalCommissions] = useState<CommissionRecord[]>(initialCommissions);

  useEffect(() => {
    setLocalSalesReps(initialSalesReps);
  }, [initialSalesReps]);

  useEffect(() => {
    setLocalCommissions(initialCommissions);
  }, [initialCommissions]);

  // Vendedores filters & search
  const [vendedoresSearch, setVendedoresSearch] = useState("");
  const [vendedoresFilter, setVendedoresFilter] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");

  // Comisiones filters & search
  const [comisionesSearch, setComisionesSearch] = useState("");
  const [comisionesStatusFilter, setComisionesStatusFilter] = useState<"TODOS" | "PENDIENTE" | "APROBADO" | "PAGADO">("TODOS");

  // Sales Rep Drawer State
  const [showSalesRepDrawer, setShowSalesRepDrawer] = useState(false);
  const [salesRepLoading, setSalesRepLoading] = useState(false);
  const [salesRepError, setSalesRepError] = useState("");
  const [salesRepSuccess, setSalesRepSuccess] = useState("");
  const [editingRepId, setEditingRepId] = useState<string | null>(null);
  const [salesRepForm, setSalesRepForm] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    zone: "San Pedro Sula / Zona Norte",
    commissionRate: 5.0,
    commissionType: "PERCENTAGE",
    monthlyTarget: 50000.0,
    status: "ACTIVO",
    notes: "",
  });

  // Commission Modal State
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState("");
  const [commSuccess, setCommSuccess] = useState("");
  const [commissionForm, setCommissionForm] = useState({
    salesRepId: "",
    period: new Date().toISOString().slice(0, 7),
    invoiceNumber: "",
    customerName: "",
    saleAmount: 0,
    commissionRate: 5.0,
    commissionAmount: 0,
    status: "PENDIENTE",
    notes: "",
  });

  // Filtered Sales Reps
  const filteredSalesReps = useMemo(() => {
    return localSalesReps.filter((r) => {
      const q = vendedoresSearch.toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.zone && r.zone.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q));

      const matchesFilter =
        vendedoresFilter === "TODOS" ||
        (vendedoresFilter === "ACTIVOS" && r.status === "ACTIVO") ||
        (vendedoresFilter === "INACTIVOS" && r.status === "INACTIVO");

      return matchesSearch && matchesFilter;
    });
  }, [localSalesReps, vendedoresSearch, vendedoresFilter]);

  // Filtered sales reps for official report
  const reportSalesReps = useMemo(() => {
    let list: SalesRep[] = [];
    if (reportScope === "todos") {
      list = [...localSalesReps];
    } else if (reportScope === "activos") {
      list = localSalesReps.filter((r) => r.status === "ACTIVO");
    } else if (reportScope === "inactivos") {
      list = localSalesReps.filter((r) => r.status === "INACTIVO");
    } else {
      list = [...filteredSalesReps];
    }

    return list.sort((a, b) => {
      if (reportSortBy === "code") {
        return a.code.localeCompare(b.code);
      }
      if (reportSortBy === "target") {
        return (b.monthlyTarget || 0) - (a.monthlyTarget || 0);
      }
      if (reportSortBy === "rate") {
        return (b.commissionRate || 0) - (a.commissionRate || 0);
      }
      if (reportSortBy === "zone") {
        return (a.zone || "").localeCompare(b.zone || "");
      }
      return a.name.localeCompare(b.name);
    });
  }, [localSalesReps, filteredSalesReps, reportScope, reportSortBy]);

  const reportStats = useMemo(() => {
    const total = reportSalesReps.length;
    const activos = reportSalesReps.filter((r) => r.status === "ACTIVO").length;
    const inactivos = reportSalesReps.filter((r) => r.status === "INACTIVO").length;
    const totalTarget = reportSalesReps.reduce((acc, r) => acc + (r.monthlyTarget || 0), 0);
    const avgRate = total > 0 ? reportSalesReps.reduce((acc, r) => acc + (r.commissionRate || 0), 0) / total : 0;
    return { total, activos, inactivos, totalTarget, avgRate };
  }, [reportSalesReps]);

  const handleExportCSV = (repsToExport: SalesRep[] = filteredSalesReps) => {
    if (repsToExport.length === 0) {
      alert("No hay vendedores disponibles para exportar.");
      return;
    }

    const headers = [
      "No.",
      "Código",
      "Vendedor / Ejecutivo",
      "Zona Asignada",
      "Teléfono",
      "Correo Electrónico",
      "Cuota Mensual",
      "% Comisión",
      "Estado",
    ];

    const rows = repsToExport.map((r, idx) => [
      idx + 1,
      `"${r.code.replace(/"/g, '""')}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.zone || "Sin asignar").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      (r.monthlyTarget || 0).toFixed(2),
      `${r.commissionRate || 0}%`,
      `"${r.status || "ACTIVO"}"`,
    ]);

    const companyName = internalCompanySettings?.nombreLegal || internalCompanySettings?.nombre || "PRADO ERP";
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        `"DIRECTORIO OFICIAL DE FUERZA DE VENTAS - ${companyName}"`,
        `"Fecha de emisión: ${new Date().toLocaleDateString("es-HN")}"`,
        `"Total registros: ${repsToExport.length}"`,
        "",
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Directorio_Vendedores_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Commissions
  const filteredCommissions = useMemo(() => {
    return localCommissions.filter((c) => {
      const q = comisionesSearch.toLowerCase();
      const matchesSearch =
        !q ||
        c.salesRepName.toLowerCase().includes(q) ||
        (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(q)) ||
        (c.customerName && c.customerName.toLowerCase().includes(q));

      const matchesStatus =
        comisionesStatusFilter === "TODOS" || c.status === comisionesStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [localCommissions, comisionesSearch, comisionesStatusFilter]);

  // Handlers for Sales Reps
  const openCreateSalesRepModal = () => {
    setEditingRepId(null);
    setSalesRepError("");
    setSalesRepSuccess("");
    setSalesRepForm({
      code: `VEND-00${localSalesReps.length + 1}`,
      name: "",
      email: "",
      phone: "",
      zone: "San Pedro Sula / Zona Norte",
      commissionRate: 5.0,
      commissionType: "PERCENTAGE",
      monthlyTarget: 50000.0,
      status: "ACTIVO",
      notes: "",
    });
    setShowSalesRepDrawer(true);
  };

  const openEditSalesRepModal = (rep: SalesRep) => {
    setEditingRepId(rep.id);
    setSalesRepError("");
    setSalesRepSuccess("");
    setSalesRepForm({
      code: rep.code,
      name: rep.name,
      email: rep.email || "",
      phone: rep.phone || "",
      zone: rep.zone || "San Pedro Sula / Zona Norte",
      commissionRate: rep.commissionRate,
      commissionType: rep.commissionType,
      monthlyTarget: rep.monthlyTarget,
      status: rep.status,
      notes: rep.notes || "",
    });
    setShowSalesRepDrawer(true);
  };

  const handleSaveSalesRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalesRepLoading(true);
    setSalesRepError("");
    setSalesRepSuccess("");

    if (!salesRepForm.name || !salesRepForm.code) {
      setSalesRepError("El nombre y código son obligatorios.");
      setSalesRepLoading(false);
      return;
    }

    try {
      const url = editingRepId ? `/api/sales-reps/${editingRepId}` : "/api/sales-reps";
      const method = editingRepId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salesRepForm),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Error al guardar vendedor");
      }

      if (editingRepId) {
        setLocalSalesReps((prev) =>
          prev.map((r) => (r.id === editingRepId ? { ...r, ...data.data } : r))
        );
      } else if (data.data) {
        setLocalSalesReps((prev) => [...prev, data.data]);
      }

      if (onRefreshSalesReps) await onRefreshSalesReps();

      setSalesRepSuccess(editingRepId ? "Vendedor actualizado exitosamente." : "Vendedor registrado exitosamente.");
      setTimeout(() => {
        setShowSalesRepDrawer(false);
      }, 1000);
    } catch (err: any) {
      setSalesRepError(err.message || "Ocurrió un error al guardar el vendedor");
    } finally {
      setSalesRepLoading(false);
    }
  };

  // Handlers for Commissions
  const openCreateCommissionModal = () => {
    setCommError("");
    setCommSuccess("");
    const defaultRep = localSalesReps[0];
    setCommissionForm({
      salesRepId: defaultRep ? defaultRep.id : "",
      period: new Date().toISOString().slice(0, 7),
      invoiceNumber: "",
      customerName: "",
      saleAmount: 0,
      commissionRate: defaultRep ? defaultRep.commissionRate : 5.0,
      commissionAmount: 0,
      status: "PENDIENTE",
      notes: "",
    });
    setShowCommissionModal(true);
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommLoading(true);
    setCommError("");
    setCommSuccess("");

    if (!commissionForm.salesRepId || Number(commissionForm.saleAmount) <= 0) {
      setCommError("Seleccione un vendedor y especifique el monto de la venta.");
      setCommLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commissionForm),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Error al registrar comisión");
      }

      if (data.data) {
        setLocalCommissions((prev) => [...prev, data.data]);
      }
      if (onRefreshCommissions) await onRefreshCommissions();

      setCommSuccess("Comisión registrada exitosamente.");
      setTimeout(() => {
        setShowCommissionModal(false);
      }, 1000);
    } catch (err: any) {
      setCommError(err.message || "Ocurrió un error al guardar la comisión");
    } finally {
      setCommLoading(false);
    }
  };

  const handleUpdateCommissionStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalCommissions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (onRefreshCommissions) await onRefreshCommissions();
      }
    } catch (err) {
      console.error("Error updating commission status:", err);
    }
  };

  return (
    <>
      <div className={`space-y-6 ${showReportModal ? "print:hidden" : ""}`}>
      {/* Module Subtab Header */}
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
              onClick={() => handleTabChange("vendedores")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "vendedores"
                  ? "bg-white text-[#1b426e] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Fuerza de Ventas ({localSalesReps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("comisiones")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "comisiones"
                  ? "bg-white text-[#1b426e] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Liquidación de Comisiones ({localCommissions.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 rounded-full border border-[#1b426e] text-[#1b426e] hover:bg-[#fff7ed] text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Generar e imprimir reporte formal de vendedores"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generar reporte</span>
          </button>
          {activeTab === "vendedores" ? (
            <button
              type="button"
              onClick={openCreateSalesRepModal}
              className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#1b426e]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Vendedor</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateCommissionModal}
              className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#1b426e]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Calcular Comisión</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= VIEW: VENDEDORES ================= */}
      {activeTab === "vendedores" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Fuerza de Ventas & Esquema de Zonas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                  {localSalesReps.filter((r) => r.status === "ACTIVO").length} Activos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de ejecutivos comerciales, cuotas mensuales, porcentaje de comisión y zonificación.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleExportCSV(filteredSalesReps)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Descargar catálogo en formato CSV"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Vendedores</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Vendedores</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{localSalesReps.length}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {localSalesReps.filter((r) => r.status === "ACTIVO").length} activos en catálogo
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Cuota Mensual Global</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(localSalesReps.reduce((acc, r) => acc + (r.monthlyTarget || 0), 0))}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Meta consolidada del equipo</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700">Comisión Promedio</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(
                    localSalesReps.reduce((acc, r) => acc + (r.commissionRate || 0), 0) /
                    (localSalesReps.length || 1)
                  ).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tasa promedio sobre ventas</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-700">Comisiones Acumuladas</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                  {formatCurrency(localCommissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0))}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Liquidaciones registradas</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVendedoresFilter("TODOS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    vendedoresFilter === "TODOS"
                      ? "bg-[#fff7ed] text-[#1b426e] font-bold shadow-xs border border-[#fed7aa]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  TODOS ({localSalesReps.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVendedoresFilter("ACTIVOS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    vendedoresFilter === "ACTIVOS"
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  ACTIVOS ({localSalesReps.filter((r) => r.status === "ACTIVO").length})
                </button>
                <button
                  type="button"
                  onClick={() => setVendedoresFilter("INACTIVOS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    vendedoresFilter === "INACTIVOS"
                      ? "bg-slate-700 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  INACTIVOS ({localSalesReps.filter((r) => r.status === "INACTIVO").length})
                </button>
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o zona..."
                  value={vendedoresSearch}
                  onChange={(e) => setVendedoresSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">CÓDIGO</th>
                    <th className="p-3.5">VENDEDOR / EJECUTIVO</th>
                    <th className="p-3.5">ZONA ASIGNADA</th>
                    <th className="p-3.5">CONTACTO</th>
                    <th className="p-3.5 text-right">% COMISIÓN</th>
                    <th className="p-3.5 text-right">CUOTA MENSUAL</th>
                    <th className="p-3.5 text-center">ESTADO</th>
                    <th className="p-3.5 text-right print:hidden">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableRowsSkeleton cols={8} rows={5} />
                  ) : (
                    <>
                      {filteredSalesReps.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/80 transition group">
                          <td className="p-3.5 font-mono font-bold text-[#1b426e]">{rep.code}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900">{rep.name}</div>
                            {rep.notes && (
                              <div className="text-slate-400 text-[10px] italic truncate max-w-xs">
                                {rep.notes}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">{rep.zone || "Sin asignar"}</td>
                          <td className="p-3.5 text-slate-500">
                            <div>{rep.email || "-"}</div>
                            <div className="text-[11px] font-mono">{rep.phone || "-"}</div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {rep.commissionRate}%
                          </td>
                          <td className="p-3.5 text-right font-mono font-medium text-slate-700">
                            {formatCurrency(rep.monthlyTarget)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                rep.status === "ACTIVO"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {rep.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-sans print:hidden">
                            <button
                              type="button"
                              onClick={() => openEditSalesRepModal(rep)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fff7ed] hover:text-[#1b426e] text-slate-700 font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSalesReps.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No se encontraron vendedores con los filtros aplicados.
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

      {/* ================= VIEW: COMISIONES ================= */}
      {activeTab === "comisiones" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Control & Liquidación de Comisiones
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cálculo Automatizado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro, liquidación y seguimiento de comisiones sobre ventas cobradas o facturadas por vendedor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  alert("Exportando reporte de comisiones...");
                  window.print();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Liquidaciones</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Liquidaciones</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{localCommissions.length}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Registros en historial</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700">Comisiones Pendientes</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                  {formatCurrency(
                    localCommissions
                      .filter((c) => c.status === "PENDIENTE")
                      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0)
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pendiente de aprobación administrativa</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Comisiones Aprobadas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(
                    localCommissions
                      .filter((c) => c.status === "APROBADO")
                      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0)
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Listas para desembolso en nómina</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-700">Total Desembolsado</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                  {formatCurrency(
                    localCommissions
                      .filter((c) => c.status === "PAGADO")
                      .reduce((acc, c) => acc + (c.commissionAmount || 0), 0)
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Comisiones efectivamente pagadas</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(["TODOS", "PENDIENTE", "APROBADO", "PAGADO"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setComisionesStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      comisionesStatusFilter === st
                        ? "bg-[#fff7ed] text-[#1b426e] font-bold shadow-xs border border-[#fed7aa]"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st} ({st === "TODOS" ? localCommissions.length : localCommissions.filter((c) => c.status === st).length})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Buscar por vendedor, factura o cliente..."
                  value={comisionesSearch}
                  onChange={(e) => setComisionesSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">VENDEDOR</th>
                    <th className="p-3.5">PERÍODO</th>
                    <th className="p-3.5">DOCUMENTO / CLIENTE</th>
                    <th className="p-3.5 text-right">MONTO VENTA</th>
                    <th className="p-3.5 text-right">% COMISIÓN</th>
                    <th className="p-3.5 text-right">COMISIÓN ($)</th>
                    <th className="p-3.5 text-center">ESTADO</th>
                    <th className="p-3.5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableRowsSkeleton cols={8} rows={5} />
                  ) : (
                    <>
                      {filteredCommissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-slate-50/80 transition group">
                          <td className="p-3.5 font-semibold text-slate-900">{comm.salesRepName}</td>
                          <td className="p-3.5 font-mono text-slate-600">{comm.period}</td>
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-[#1b426e]">
                              {comm.invoiceNumber || "Cálculo global"}
                            </div>
                            <div className="text-slate-500 text-[11px] truncate max-w-xs">
                              {comm.customerName || "-"}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-medium text-slate-700">
                            {formatCurrency(comm.saleAmount)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {comm.commissionRate}%
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-600">
                            {formatCurrency(comm.commissionAmount)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                comm.status === "PAGADO"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : comm.status === "APROBADO"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {comm.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {comm.status === "PENDIENTE" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCommissionStatus(comm.id, "APROBADO")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold cursor-pointer transition text-[11px] border border-emerald-200"
                                >
                                  Aprobar
                                </button>
                              )}
                              {comm.status === "APROBADO" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCommissionStatus(comm.id, "PAGADO")}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold cursor-pointer transition text-[11px] border border-purple-200"
                                >
                                  Marcar Pagado
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCommissions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No se encontraron registros de comisión con los filtros aplicados.
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

      {/* ================= MODAL: REGISTRAR / EDITAR VENDEDOR ================= */}
      {showSalesRepDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1b426e]" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingRepId ? "Editar Vendedor / Esquema" : "Registrar Nuevo Vendedor"}
                </h3>
              </div>
              <button
                onClick={() => setShowSalesRepDrawer(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalesRep} className="p-6 space-y-4 text-xs">
              {salesRepError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  {salesRepError}
                </div>
              )}
              {salesRepSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                  {salesRepSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código Identificador *</label>
                  <input
                    type="text"
                    required
                    value={salesRepForm.code}
                    onChange={(e) => setSalesRepForm({ ...salesRepForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estado</label>
                  <select
                    value={salesRepForm.status}
                    onChange={(e) => setSalesRepForm({ ...salesRepForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={salesRepForm.name}
                  onChange={(e) => setSalesRepForm({ ...salesRepForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="vendedor@empresa.com"
                    value={salesRepForm.email}
                    onChange={(e) => setSalesRepForm({ ...salesRepForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="+504 9999-0000"
                    value={salesRepForm.phone}
                    onChange={(e) => setSalesRepForm({ ...salesRepForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Zona Comercial Asignada</label>
                <input
                  type="text"
                  placeholder="Ej. Zona Metropolitana Tegucigalpa, Corredor Industrial"
                  value={salesRepForm.zone}
                  onChange={(e) => setSalesRepForm({ ...salesRepForm, zone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200/60">
                <div>
                  <label className="block text-amber-900 font-bold mb-1">% Tasa de Comisión *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={salesRepForm.commissionRate}
                      onChange={(e) => setSalesRepForm({ ...salesRepForm, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-3 pr-7 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-[#1b426e] font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-amber-900 font-bold mb-1">Cuota Mensual Meta ($) *</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    value={salesRepForm.monthlyTarget}
                    onChange={(e) => setSalesRepForm({ ...salesRepForm, monthlyTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-[#1b426e] font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={salesRepForm.notes}
                  onChange={(e) => setSalesRepForm({ ...salesRepForm, notes: e.target.value })}
                  placeholder="Condiciones específicas, escalafón, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSalesRepDrawer(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salesRepLoading}
                  className="px-6 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {salesRepLoading ? "Guardando..." : editingRepId ? "Actualizar Vendedor" : "Guardar Vendedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR CÁLCULO DE COMISIÓN ================= */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1b426e]" />
                <h3 className="font-bold text-base text-slate-900">Registrar Cálculo de Comisión</h3>
              </div>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommission} className="p-6 space-y-4 text-xs">
              {commError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  {commError}
                </div>
              )}
              {commSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                  {commSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vendedor Asignado *</label>
                  <select
                    required
                    value={commissionForm.salesRepId}
                    onChange={(e) => {
                      const rep = localSalesReps.find((r) => r.id === e.target.value);
                      const rate = rep ? rep.commissionRate : 5.0;
                      const sale = Number(commissionForm.saleAmount) || 0;
                      setCommissionForm({
                        ...commissionForm,
                        salesRepId: e.target.value,
                        commissionRate: rate,
                        commissionAmount: (sale * rate) / 100,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none font-semibold"
                  >
                    <option value="">Seleccione un vendedor</option>
                    {localSalesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.commissionRate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Período / Mes *</label>
                  <input
                    type="month"
                    required
                    value={commissionForm.period}
                    onChange={(e) => setCommissionForm({ ...commissionForm, period: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nº Factura Relacionada</label>
                  <input
                    type="text"
                    placeholder="Ej. FAC-00102"
                    value={commissionForm.invoiceNumber}
                    onChange={(e) => setCommissionForm({ ...commissionForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cliente</label>
                  <input
                    type="text"
                    placeholder="Ej. Grupo Industrial S.A."
                    value={commissionForm.customerName}
                    onChange={(e) => setCommissionForm({ ...commissionForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                <div>
                  <label className="block text-emerald-900 font-bold mb-1">Monto Venta Cobrada ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={commissionForm.saleAmount}
                    onChange={(e) => {
                      const sale = parseFloat(e.target.value) || 0;
                      const rate = Number(commissionForm.commissionRate) || 0;
                      setCommissionForm({
                        ...commissionForm,
                        saleAmount: sale,
                        commissionAmount: Number(((sale * rate) / 100).toFixed(2)),
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-[#1b426e] font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-emerald-900 font-bold mb-1">Comisión Calculada ($)</label>
                  <div className="px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-black text-emerald-700 text-sm flex items-center justify-between">
                    <span>{formatCurrency(commissionForm.commissionAmount)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ({commissionForm.commissionRate}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estado de Liquidación</label>
                  <select
                    value={commissionForm.status}
                    onChange={(e) => setCommissionForm({ ...commissionForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="APROBADO">APROBADO</option>
                    <option value="PAGADO">PAGADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notas / Referencia</label>
                  <input
                    type="text"
                    placeholder="Bono adicional, pago quincenal..."
                    value={commissionForm.notes}
                    onChange={(e) => setCommissionForm({ ...commissionForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1b426e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={commLoading}
                  className="px-6 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {commLoading ? "Guardando..." : "Registrar Comisión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ================= OFFICIAL SALES REP REPORT MODAL / CANVAS ================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:static print:inset-auto print:bg-white print:overflow-visible print:block print:p-0">
          {/* Top Control Bar (Hidden on print) */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-md print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1b426e] text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Reporte Oficial de Fuerza de Ventas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Directorio comercial y zonificación formal listo para impresión y exportación en PDF
                  </p>
                </div>
              </div>

              {/* Alcance / Filtro */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium hidden sm:inline">Alcance:</span>
                <select
                  value={reportScope}
                  onChange={(e) => setReportScope(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1b426e] cursor-pointer"
                >
                  <option value="filtrados">
                    Filtro actual ({filteredSalesReps.length} vendedores)
                  </option>
                  <option value="todos">
                    Todos los vendedores ({localSalesReps.length})
                  </option>
                  <option value="activos">
                    Solo vendedores activos ({localSalesReps.filter((r) => r.status === "ACTIVO").length})
                  </option>
                  <option value="inactivos">
                    Solo vendedores inactivos ({localSalesReps.filter((r) => r.status === "INACTIVO").length})
                  </option>
                </select>
              </div>

              {/* Orden */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium hidden sm:inline">Ordenar:</span>
                <select
                  value={reportSortBy}
                  onChange={(e) => setReportSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1b426e] cursor-pointer"
                >
                  <option value="name">Por Nombre (A - Z)</option>
                  <option value="code">Por Código</option>
                  <option value="target">Por Cuota Mensual (Mayor)</option>
                  <option value="rate">Por % Comisión (Mayor)</option>
                  <option value="zone">Por Zona Asignada</option>
                </select>
              </div>
            </div>

            {/* Buttons: Export CSV, Print, Close */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => handleExportCSV(reportSalesReps)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Descargar archivo CSV compatible con Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20"
                title="Imprimir documento oficial o guardar en PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Cerrar reporte"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Canvas */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center print:p-0 print:m-0 print:block">
            <div
              id="printable-sales-rep-report"
              className="printable-document bg-white w-full max-w-5xl rounded-2xl shadow-xl p-8 sm:p-12 border border-slate-200 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none text-slate-900"
            >
              {/* Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
                <div className="space-y-1 max-w-md">
                  {internalCompanySettings?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={internalCompanySettings.logoUrl}
                      alt="Logo"
                      className="h-12 max-w-[200px] object-contain mb-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#1b426e] text-white flex items-center justify-center font-bold text-sm">
                        {((internalCompanySettings?.nombreLegal || internalCompanySettings?.nombre || "P").charAt(0)).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-sm tracking-tight text-[#1b426e]">
                        PRADO ERP
                      </span>
                    </div>
                  )}
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-snug">
                    {internalCompanySettings?.nombreLegal || internalCompanySettings?.nombre || "EMPRESA PRADO"}
                  </h1>
                  {internalCompanySettings?.taxId && (
                    <p className="text-xs font-mono font-bold text-slate-700">
                      RTN: {internalCompanySettings.taxId}
                    </p>
                  )}
                  {internalCompanySettings?.direccion && (
                    <p className="text-[11px] text-slate-600 leading-tight">
                      {internalCompanySettings.direccion}
                    </p>
                  )}
                  {(internalCompanySettings?.telefono || internalCompanySettings?.email) && (
                    <p className="text-[11px] text-slate-500">
                      {[
                        internalCompanySettings?.telefono ? `Tel: ${internalCompanySettings.telefono}` : "",
                        internalCompanySettings?.email ? `Correo: ${internalCompanySettings.email}` : "",
                      ].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>

                {/* Right Info Box */}
                <div className="text-right border border-slate-300 rounded-xl p-3.5 bg-slate-50/80 min-w-[260px] space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    DOCUMENTO COMERCIAL OFICIAL
                  </span>
                  <h2 className="text-sm font-black text-[#1b426e] uppercase tracking-tight">
                    Directorio de Fuerza de Ventas
                  </h2>
                  <div className="pt-2 border-t border-slate-200 text-[11px] space-y-0.5 text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">Fecha de emisión:</span>{" "}
                      {new Date().toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Alcance:</span>{" "}
                      <span className="font-medium capitalize">
                        {reportScope === "todos"
                          ? "Catálogo Completo"
                          : reportScope === "activos"
                          ? "Solo Activos"
                          : reportScope === "inactivos"
                          ? "Solo Inactivos"
                          : "Filtro Aplicado"}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Registros:</span>{" "}
                      <span className="font-mono font-bold text-slate-900">{reportSalesReps.length} ejecutivos</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen Estadístico (KPIs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Vendedores</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{reportStats.total}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Vendedores Activos</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{reportStats.activos}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuota Mensual Global</span>
                  <span className="text-xl font-black text-blue-700 font-mono mt-0.5 block">{formatCurrency(reportStats.totalTarget)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Comisión Promedio</span>
                  <span className="text-xl font-black text-purple-700 font-mono mt-0.5 block">{reportStats.avgRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Tabla Oficial */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase tracking-wider border-b border-slate-300">
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 w-24">Código</th>
                      <th className="py-2.5 px-3">Vendedor / Ejecutivo</th>
                      <th className="py-2.5 px-3">Zona Asignada</th>
                      <th className="py-2.5 px-3">Contacto</th>
                      <th className="py-2.5 px-3 text-right">Cuota Mensual</th>
                      <th className="py-2.5 px-3 text-right">% Comisión</th>
                      <th className="py-2.5 px-3 text-center w-20">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {reportSalesReps.map((r, index) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">{index + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#1b426e] whitespace-nowrap text-[11px]">
                          {r.code}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{r.name}</div>
                          {r.notes && (
                            <div className="text-slate-400 text-[10px] italic truncate max-w-xs">{r.notes}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">{r.zone || "Sin asignar"}</td>
                        <td className="py-2 px-3 text-slate-600">
                          <div>{r.email || "—"}</div>
                          <div className="text-[11px] font-mono text-slate-500">{r.phone || "—"}</div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {formatCurrency(r.monthlyTarget || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {r.commissionRate}%
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-[11px]">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                              r.status === "ACTIVO"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reportSalesReps.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          No hay vendedores que coincidan con el alcance seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reportSalesReps.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100/80 font-bold border-t border-slate-300 text-slate-900">
                        <td colSpan={5} className="py-2 px-3 text-right text-[11px] uppercase tracking-wider">
                          Totales / Resumen:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-blue-900 font-black">
                          {formatCurrency(reportStats.totalTarget)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-purple-900 font-black">
                          {reportStats.avgRate.toFixed(1)}% (prom)
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[10px] text-slate-500">
                          {reportStats.activos} activos
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pie de Página */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700">
                    {internalCompanySettings?.nombre || "Prado ERP"} — Control Administrativo de Ventas
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Este reporte contiene información comercial confidencial. Documento emitido automáticamente.
                  </p>
                </div>
                <div className="sm:text-right text-[10px] text-slate-400">
                  <p>Generado el {new Date().toLocaleString("es-HN")}</p>
                  <p>Documento Oficial de Fuerza de Ventas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
