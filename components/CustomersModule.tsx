"use client";

import React, { useState, useMemo } from "react";
import { Customer } from "@/types/dashboard";
import { TableRowsSkeleton } from "@/components/Skeleton";
import { FileText, Download, Printer, Settings, Plus, Search, ArrowLeft, ChevronDown } from "lucide-react";

interface CustomersModuleProps {
  customers: Customer[];
  onRefreshCustomers: () => Promise<void> | void;
  onBack: () => void;
  onOpenCustomerStatement: (customerIdOrName: string) => void;
  loading?: boolean;
  autoOpenCreate?: boolean;
  onAutoOpenCreateConsumed?: () => void;
}

export default function CustomersModule({
  customers,
  onRefreshCustomers,
  onBack,
  onOpenCustomerStatement,
  loading = false,
  autoOpenCreate = false,
  onAutoOpenCreateConsumed,
}: CustomersModuleProps) {
  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "activos" | "macola">("todos");

  // New Customer Drawer State
  const [showNewDrawer, setShowNewDrawer] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerSuccess, setDrawerSuccess] = useState("");
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [drawerSectionsOpen, setDrawerSectionsOpen] = useState({
    basic: true,
    contact: true,
    commercial: true,
  });

  const defaultNewCustomerForm = {
    name: "",
    rtn: "",
    macolaCode: "",
    currency: "USD",
    email: "",
    phone: "",
    address: "",
    city: "San Pedro Sula",
    paymentTerms: "Crédito 30 días",
    creditLimit: 0,
  };
  const [newCustomerForm, setNewCustomerForm] = useState(defaultNewCustomerForm);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    macolaCode: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Handle autoOpenCreate from external quick action
  React.useEffect(() => {
    if (autoOpenCreate) {
      setShowNewDrawer(true);
      if (onAutoOpenCreateConsumed) onAutoOpenCreateConsumed();
    }
  }, [autoOpenCreate, onAutoOpenCreateConsumed]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.macolaCode && c.macolaCode.toLowerCase().includes(search.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search));

      if (!matchesSearch) return false;

      if (filterType === "macola") {
        return Boolean(c.macolaCode && c.macolaCode.trim() !== "");
      }
      return true;
    });
  }, [customers, search, filterType]);

  // Drawer handlers
  const handleOpenNewDrawer = () => {
    setDrawerSuccess("");
    setShowNewDrawer(true);
  };

  const handleCreateCustomer = async (e?: React.FormEvent, createAnother = false) => {
    if (e) e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      alert("Por favor ingresa el nombre de la empresa o cliente.");
      return;
    }
    setDrawerLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerForm.name,
          macolaCode: newCustomerForm.macolaCode || `CUS-${Math.floor(100 + Math.random() * 900)}`,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          address: newCustomerForm.address,
          currency: newCustomerForm.currency,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        await onRefreshCustomers();
        setDrawerSuccess("¡Cliente registrado correctamente!");
        setTimeout(() => setDrawerSuccess(""), 4000);

        if (createAnother) {
          setNewCustomerForm(defaultNewCustomerForm);
        } else {
          setShowNewDrawer(false);
          setNewCustomerForm(defaultNewCustomerForm);
        }
      } else {
        alert(json.error || "Error al registrar el cliente");
      }
    } catch (err: any) {
      console.error("Error creating customer:", err);
      alert("Error al conectar con el servidor");
    } finally {
      setDrawerLoading(false);
    }
  };

  // Edit Modal handlers
  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name || "",
      macolaCode: c.macolaCode || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      currency: c.currency || "USD",
    });
    setEditError("");
    setEditSuccess("");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar cliente");
      }
      setEditSuccess("¡Cliente actualizado exitosamente!");
      await onRefreshCustomers();
      setTimeout(() => {
        setEditingCustomer(null);
        setEditSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar cliente");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!editingCustomer) return;
    if (!confirm(`¿Eliminar al cliente "${editingCustomer.name}"?`)) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar cliente");
      }
      await onRefreshCustomers();
      setEditingCustomer(null);
    } catch (err: any) {
      setEditError(err.message || "Error al eliminar cliente");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Regresar a Dashboard</span>
        </button>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              alert("Generando reporte de clientes...");
              window.print();
            }}
            className="px-4 py-2 rounded-full border border-[#1b426e] text-[#1b426e] hover:bg-[#fff7ed] text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Generar reporte
          </button>

          <button
            type="button"
            onClick={handleOpenNewDrawer}
            className="px-5 py-2 rounded-full bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#1b426e]/20"
          >
            <span>Nuevo cliente</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar Card (Search, filter type, print, export) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Filtrar por nombre o número"
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
              <option value="todos">Todos los clientes</option>
              <option value="activos">Clientes activos</option>
              <option value="macola">Sincronizados Macola</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right Action Icons (Export, Print) */}
        <div className="flex items-center gap-1.5 self-end md:self-auto text-slate-400">
          <button
            type="button"
            onClick={() => alert("Exportando catálogo de clientes...")}
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
            Directorio de Clientes ({filteredCustomers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código Macola</th>
                <th className="p-3.5">Nombre de Empresa / Cliente</th>
                <th className="p-3.5">Correo Electrónico</th>
                <th className="p-3.5">Teléfono</th>
                <th className="p-3.5">Dirección</th>
                <th className="p-3.5">Moneda</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableRowsSkeleton rows={6} cols={7} />
              ) : (
                <>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomer(c)}
                          className="text-[#1b426e] font-semibold hover:underline cursor-pointer flex items-center gap-1.5 group"
                          title="Haz clic para editar cliente"
                        >
                          <span>{c.macolaCode || `#${c.id.slice(0, 6)}`}</span>
                        </button>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomer(c)}
                          className="hover:text-[#1b426e] hover:underline cursor-pointer text-left font-medium"
                          title="Haz clic para editar cliente"
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-500">{c.email || "—"}</td>
                      <td className="p-3.5 text-slate-500">{c.phone || "—"}</td>
                      <td className="p-3.5 text-slate-500 truncate max-w-xs">{c.address || "—"}</td>
                      <td className="p-3.5 font-medium">{c.currency}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenCustomerStatement(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#fff7ed] hover:bg-[#ffedd5] text-[#1b426e] font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-[#fed7aa]"
                            title="Ver Estado de Cuenta del cliente"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Estado de Cuenta</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(c)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                          >
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No se encontraron clientes
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SIDEBAR / DRAWER: CREAR NUEVO CLIENTE ================= */}
      {showNewDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity z-50"
            onClick={() => setShowNewDrawer(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative z-50 w-full max-w-xl bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-800">Añadir un nuevo cliente</h2>
                <p className="text-xs text-slate-500">Registra un nuevo contacto o razón social comercial</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Notification Banner if success */}
            {drawerSuccess && (
              <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
                <span className="font-semibold">{drawerSuccess}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={(e) => handleCreateCustomer(e, false)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* SECTION 1: INFORMACIÓN BÁSICA DEL CLIENTE */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setDrawerSectionsOpen((prev) => ({ ...prev, basic: !prev.basic }))}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 cursor-pointer"
                >
                  <span>Información básica del cliente</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${drawerSectionsOpen.basic ? "rotate-0" : "-rotate-90"}`} />
                </button>

                {drawerSectionsOpen.basic && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre de la Empresa / Razón Social <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Comercial Sula S.A."
                        value={newCustomerForm.name}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">RTN / Identificación Fiscal</label>
                        <input
                          type="text"
                          placeholder="Ej. 08011990123456"
                          value={newCustomerForm.rtn}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, rtn: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Código Macola</label>
                        <input
                          type="text"
                          placeholder="Ej. CUS-010"
                          value={newCustomerForm.macolaCode}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, macolaCode: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda de Facturación</label>
                      <select
                        value={newCustomerForm.currency}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, currency: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      >
                        <option value="USD">USD - Dólar Estadounidense ($)</option>
                        <option value="HNL">HNL - Lempira Hondureño (L)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: DATOS DE CONTACTO */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setDrawerSectionsOpen((prev) => ({ ...prev, contact: !prev.contact }))}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 cursor-pointer"
                >
                  <span>Datos de Contacto y Ubicación</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${drawerSectionsOpen.contact ? "rotate-0" : "-rotate-90"}`} />
                </button>

                {drawerSectionsOpen.contact && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          placeholder="pagos@comercialsula.com"
                          value={newCustomerForm.email}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="+504 2550-1234"
                          value={newCustomerForm.phone}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Fiscal / Entrega</label>
                      <input
                        type="text"
                        placeholder="Boulevard del Norte, Edificio Plaza 2do nivel"
                        value={newCustomerForm.address}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad / Región</label>
                      <input
                        type="text"
                        placeholder="San Pedro Sula"
                        value={newCustomerForm.city}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: CONDICIONES COMERCIALES */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setDrawerSectionsOpen((prev) => ({ ...prev, commercial: !prev.commercial }))}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 cursor-pointer"
                >
                  <span>Condiciones Comerciales y Crédito</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${drawerSectionsOpen.commercial ? "rotate-0" : "-rotate-90"}`} />
                </button>

                {drawerSectionsOpen.commercial && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Términos de Pago</label>
                        <select
                          value={newCustomerForm.paymentTerms}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, paymentTerms: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                        >
                          <option value="Contado">Contado</option>
                          <option value="Crédito 15 días">Crédito 15 días</option>
                          <option value="Crédito 30 días">Crédito 30 días</option>
                          <option value="Crédito 60 días">Crédito 60 días</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Límite de Crédito ({newCustomerForm.currency})</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newCustomerForm.creditLimit || ""}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimit: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewDrawer(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>

              <div className="relative inline-flex rounded-lg shadow-sm">
                <button
                  type="button"
                  disabled={drawerLoading}
                  onClick={(e) => handleCreateCustomer(e, false)}
                  className="px-4 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {drawerLoading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                  className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#0f2742] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSaveDropdown ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showSaveDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowSaveDropdown(false);
                        handleCreateCustomer(e, false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer flex items-center gap-2"
                    >
                      <span>Guardar y cerrar</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowSaveDropdown(false);
                        handleCreateCustomer(e, true);
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

      {/* ================= MODAL: EDITAR CLIENTE ================= */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <span className="text-[11px] font-semibold text-[#1b426e] uppercase tracking-wider">Gestión de Clientes</span>
              <h3 className="text-lg font-bold text-slate-900">Editar Cliente</h3>
              <p className="text-xs text-slate-500">Actualizar información de la empresa o cliente registrado.</p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Empresa / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Textil S.A."
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Macola</label>
                  <input
                    type="text"
                    placeholder="Ej. CUS-009"
                    value={editForm.macolaCode}
                    onChange={(e) => setEditForm({ ...editForm, macolaCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Moneda</label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
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
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+504 2550-0000"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="San Pedro Sula, Honduras"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={editLoading}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold cursor-pointer border border-red-200 transition"
                >
                  Eliminar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold cursor-pointer shadow-md shadow-[#1b426e]/20 disabled:opacity-50"
                  >
                    {editLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
