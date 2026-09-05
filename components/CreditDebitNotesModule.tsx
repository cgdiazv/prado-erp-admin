"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreditDebitNote, Customer, Vendor, CompanySettings } from "@/types/dashboard";
import { CheckCircle2, FileText, Search } from "lucide-react";

export interface CreditDebitNotesModuleProps {
  creditDebitNotes: CreditDebitNote[];
  customers: Customer[];
  vendors: Vendor[];
  companySettings: CompanySettings;
  loading?: boolean;
  onNavigateToDashboard: () => void;
  onRefreshNotes?: () => Promise<void> | void;
}

const formatFechaLimite = (val?: string): string => {
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

export default function CreditDebitNotesModule({
  creditDebitNotes,
  customers,
  vendors,
  companySettings,
  loading = false,
  onNavigateToDashboard,
  onRefreshNotes,
}: CreditDebitNotesModuleProps) {
  const [selectedPrintNote, setSelectedPrintNote] = useState<CreditDebitNote | null>(null);
  const [notasFilter, setNotasFilter] = useState<"TODAS" | "CREDITO" | "DEBITO" | "APLICADAS" | "ANULADAS">("TODAS");
  const [notasSearch, setNotasSearch] = useState("");

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");
  const [noteForm, setNoteForm] = useState({
    noteNumber: "",
    type: "CREDIT" as "CREDIT" | "DEBIT",
    entityType: "CUSTOMER" as "CUSTOMER" | "VENDOR",
    entityId: "",
    entityName: "",
    targetDocNum: "",
    issueDate: new Date().toISOString().split("T")[0],
    reason: "Devolución de Insumos / Mercadería Defectuosa",
    amount: 0,
    tax: 0,
    total: 0,
    currency: "USD",
    status: "APLICADA",
    notes: "",
  });

  useEffect(() => {
    const handleAfterPrint = () => {
      setSelectedPrintNote(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const filteredCreditDebitNotes = useMemo(() => {
    return creditDebitNotes.filter((note) => {
      const q = notasSearch.toLowerCase();
      const matchesSearch =
        !q ||
        note.noteNumber.toLowerCase().includes(q) ||
        note.entityName.toLowerCase().includes(q) ||
        (note.targetDocNum && note.targetDocNum.toLowerCase().includes(q)) ||
        note.reason.toLowerCase().includes(q);

      const matchesFilter =
        notasFilter === "TODAS" ||
        (notasFilter === "CREDITO" && note.type === "CREDIT") ||
        (notasFilter === "DEBITO" && note.type === "DEBIT") ||
        (notasFilter === "APLICADAS" && note.status === "APLICADA") ||
        (notasFilter === "ANULADAS" && note.status === "ANULADA");

      return matchesSearch && matchesFilter;
    });
  }, [creditDebitNotes, notasSearch, notasFilter]);

  const handlePrintNote = (note: CreditDebitNote) => {
    setSelectedPrintNote(note);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const openCreateNoteModal = () => {
    setNoteError("");
    setNoteSuccess("");
    const isCredit = noteForm.type === "CREDIT";
    const prefix = isCredit ? "NC" : "ND";
    setNoteForm({
      noteNumber: `${prefix}-2026-00${creditDebitNotes.length + 1}`,
      type: "CREDIT",
      entityType: "CUSTOMER",
      entityId: "",
      entityName: "",
      targetDocNum: "",
      issueDate: new Date().toISOString().split("T")[0],
      reason: "Devolución de Insumos / Mercadería Defectuosa",
      amount: 0,
      tax: 0,
      total: 0,
      currency: "USD",
      status: "APLICADA",
      notes: "",
    });
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteLoading(true);
    setNoteError("");
    setNoteSuccess("");

    if (!noteForm.noteNumber || !noteForm.entityName || Number(noteForm.amount) <= 0) {
      setNoteError("Por favor completa los campos requeridos y asegura un monto válido.");
      setNoteLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/credit-debit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json();
      if (data.success) {
        setNoteSuccess(`¡${noteForm.type === "CREDIT" ? "Nota de Crédito" : "Nota de Débito"} ${noteForm.noteNumber} guardada correctamente!`);
        if (onRefreshNotes) {
          await onRefreshNotes();
        }
        setTimeout(() => {
          setShowNoteModal(false);
          setNoteSuccess("");
        }, 1200);
      } else {
        setNoteError(data.error || "Error al registrar la nota.");
      }
    } catch (err: any) {
      setNoteError(err.message || "Error al procesar la solicitud.");
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <>
            <div className="space-y-5">
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
                  <span className="text-xs font-semibold text-slate-500">Ventas</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-900">Notas de Crédito y Débito</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Gestión de Notas de Crédito & Débito
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                        SAR & Macola ERP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ajustes contables de saldo, devoluciones de mercadería, bonificaciones e intereses.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={openCreateNoteModal}
                      className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span>
                      <span>Nueva Nota de Crédito / Débito</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards (Matching Dashboard Typography text-3xl font-bold) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Notas</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{creditDebitNotes.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">documentos registrados</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-400" />
                </div>

                <div
                  onClick={() => setNotasFilter("CREDITO")}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                    notasFilter === "CREDITO" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200/80 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Notas de Crédito</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      ${creditDebitNotes
                        .filter((n) => n.type === "CREDIT" && n.status === "APLICADA")
                        .reduce((acc, n) => acc + n.total, 0)
                        .toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    {creditDebitNotes.filter((n) => n.type === "CREDIT").length} créditos aplicados
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                <div
                  onClick={() => setNotasFilter("DEBITO")}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden ${
                    notasFilter === "DEBITO" ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200/80 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">Notas de Débito</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                      ${creditDebitNotes
                        .filter((n) => n.type === "DEBIT" && n.status === "APLICADA")
                        .reduce((acc, n) => acc + n.total, 0)
                        .toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium mt-1">
                    {creditDebitNotes.filter((n) => n.type === "DEBIT").length} débitos aplicados
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1b426e]">Facturas Afectadas</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#1b426e] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {new Set(creditDebitNotes.map((n) => n.targetDocNum).filter(Boolean)).size}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">documentos de origen</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1b426e]" />
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto text-xs font-medium overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setNotasFilter("TODAS")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      notasFilter === "TODAS" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Todas ({creditDebitNotes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotasFilter("CREDITO")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      notasFilter === "CREDITO" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Créditos ({creditDebitNotes.filter((n) => n.type === "CREDIT").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotasFilter("DEBITO")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      notasFilter === "DEBITO" ? "bg-blue-600 text-white font-bold shadow-xs" : "text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Débitos ({creditDebitNotes.filter((n) => n.type === "DEBIT").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotasFilter("APLICADAS")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      notasFilter === "APLICADAS" ? "bg-slate-900 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Aplicadas ({creditDebitNotes.filter((n) => n.status === "APLICADA").length})
                  </button>
                </div>

                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Buscar por N.º nota, cliente, factura o motivo..."
                    value={notasSearch}
                    onChange={(e) => setNotasSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Master Credit / Debit Notes Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">N° Documento</th>
                        <th className="p-3.5">Tipo</th>
                        <th className="p-3.5">Beneficiario / Entidad</th>
                        <th className="p-3.5">Doc. Afectado</th>
                        <th className="p-3.5">Motivo / Concepto</th>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5 text-right">Monto Total</th>
                        <th className="p-3.5 text-center">Estado</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCreditDebitNotes.map((note) => (
                        <tr key={note.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                              note.type === "CREDIT" ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-blue-50 text-blue-900 border-blue-200"
                            }`}>
                              {note.noteNumber}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {note.type === "CREDIT" ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>NOTA DE CRÉDITO</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold inline-flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>NOTA DE DÉBITO</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {note.entityName}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {note.entityType === "CUSTOMER" ? "Cliente" : "Proveedor"}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-semibold text-slate-700">
                            {note.targetDocNum || "—"}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {note.reason}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">
                            {note.issueDate}
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                            ${note.total.toLocaleString("es-HN", { minimumFractionDigits: 2 })} USD
                          </td>
                          <td className="p-3.5 text-center">
                            {note.status === "APLICADA" && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                APLICADA
                              </span>
                            )}
                            {note.status === "BORRADOR" && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                                BORRADOR
                              </span>
                            )}
                            {note.status === "ANULADA" && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold text-[10px]">
                                ANULADA
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handlePrintNote(note)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fff7ed] hover:text-[#1b426e] text-slate-700 font-semibold cursor-pointer transition text-[11px] border border-slate-200"
                            >
                              Imprimir PDF
                            </button>

                          </td>
                        </tr>
                      ))}
                      {filteredCreditDebitNotes.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No se encontraron notas de crédito o débito registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

      {/* ================= COMPROBANTE IMPRESO: NOTA DE CRÉDITO O DÉBITO ================= */}
      {selectedPrintNote && (
            <div id="printable-note-document" className="hidden print:block p-8 bg-white text-slate-900 text-xs">

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-[#1b426e] tracking-tight">WAYNE TRADEMARK</h1>
                    <p className="font-bold text-slate-900 text-sm mt-1">{companySettings.nombre}</p>
                    <p className="text-slate-600 text-xs">{companySettings.direccion}</p>
                    <p className="text-slate-600 text-xs">RTN: {companySettings.taxId} | Tel: {companySettings.telefono}</p>
                    <p className="text-slate-600 text-xs font-mono">CAI: {companySettings.cai}</p>
                    <p className="text-slate-600 text-xs">Correo: {companySettings.email}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-slate-900">
                      {selectedPrintNote?.type === "CREDIT" ? "NOTA DE CRÉDITO" : "NOTA DE DÉBITO"}
                    </h2>
                    <p className="font-mono font-bold text-slate-800 text-base">N.º {selectedPrintNote?.noteNumber || "NC-2026-001"}</p>
                    <p className="text-slate-600 text-xs mt-1"><strong>Fecha de emisión:</strong> {selectedPrintNote?.issueDate || new Date().toISOString().split("T")[0]}</p>
                    <p className="text-slate-600 text-xs"><strong>Estado:</strong> {selectedPrintNote?.status || "APLICADA"}</p>
                  </div>
                </div>

                {/* Entity Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 mb-6 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {selectedPrintNote?.entityType === "CUSTOMER" ? "Emitido a Cliente:" : "Emitido a Proveedor:"}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{selectedPrintNote?.entityName || "Cliente / Proveedor"}</span>
                    {selectedPrintNote?.targetDocNum && (
                      <p className="text-slate-600 text-xs mt-0.5"><strong>Documento Afectado:</strong> {selectedPrintNote.targetDocNum}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Moneda oficial:</span>
                    <span className="font-bold text-slate-900 text-sm">USD ($)</span>
                  </div>
                </div>

                {/* Adjustment Details Table */}
                <table className="w-full text-left border-collapse mb-6">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-900 font-bold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Concepto / Motivo de Ajuste</th>
                      <th className="py-2.5 px-3">Doc. Afectado</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-right">ISV 15%</th>
                      <th className="py-2.5 px-3 text-right">Total ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-3 font-mono text-slate-500">1</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{selectedPrintNote?.reason || "Ajuste Contable"}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{selectedPrintNote?.targetDocNum || "—"}</td>
                      <td className="py-3 px-3 text-right font-bold">${(selectedPrintNote?.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-medium">${(selectedPrintNote?.tax || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">${(selectedPrintNote?.total || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Summary & Totals */}
                <div className="flex justify-between items-start border-t border-slate-300 pt-4 mb-8">
                  <div className="max-w-md text-xs text-slate-600">
                    <p><strong>Observaciones:</strong> {selectedPrintNote?.notes || "Ajuste registrado en el sistema contable Macola ERP."}</p>
                  </div>
                  <div className="w-64 space-y-2 text-right text-xs font-sans">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal Ajustado:</span>
                      <span className="font-bold text-slate-900">${(selectedPrintNote?.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>ISV (15%):</span>
                      <span className="font-bold text-slate-900">${(selectedPrintNote?.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[#1b426e] border-t-2 border-slate-900 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider">TOTAL AJUSTADO:</span>
                      <span className="text-2xl font-bold">${(selectedPrintNote?.total || 0).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Fiscal Footer SAR */}
                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between items-center text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Rango Autorizado: </span>
                    <span className="font-mono">{companySettings.rangoAutorizado}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">Fecha Límite de Emisión: </span>
                    <span className="font-mono">{formatFechaLimite(companySettings.fechaLimiteEmision)}</span>
                  </div>
                </div>

                {/* Signatures & Footer */}
                <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs text-slate-500">
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Autorizado por (Wayne Trademark)</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Recibido / Conformidad Beneficiario</p>
                  </div>
                </div>
              </div>

      )}

      {/* ================= MODAL / DRAWER: NUEVA NOTA DE CRÉDITO / DÉBITO ================= */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#fff7ed] text-[#1b426e]">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Emitir {noteForm.type === "CREDIT" ? "Nota de Crédito" : "Nota de Débito"}
                  </h3>
                  <p className="text-xs text-slate-500">Ajuste de saldo, devoluciones e intereses para Macola & SAR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Notifications */}
            {noteSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                ✓ {noteSuccess}
              </div>
            )}
            {noteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                ⚠ {noteError}
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              {/* Type Toggle: Nota de Crédito vs Nota de Débito */}
              <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1 rounded-2xl font-bold">
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = `NC-2026-00${creditDebitNotes.length + 1}`;
                    setNoteForm({ ...noteForm, type: "CREDIT", noteNumber: nextNum });
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                    noteForm.type === "CREDIT"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nota de Crédito (Reduce Saldo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = `ND-2026-00${creditDebitNotes.length + 1}`;
                    setNoteForm({ ...noteForm, type: "DEBIT", noteNumber: nextNum });
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                    noteForm.type === "DEBIT"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Nota de Débito (Aumenta Saldo)</span>
                </button>
              </div>

              {/* Entity Type & Note Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirigido a *</label>
                  <select
                    value={noteForm.entityType}
                    onChange={(e) => {
                      const et = e.target.value as "CUSTOMER" | "VENDOR";
                      setNoteForm({ ...noteForm, entityType: et, entityName: "" });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-[#1b426e]"
                  >
                    <option value="CUSTOMER">Cliente (Cuentas por Cobrar)</option>
                    <option value="VENDOR">Proveedor (Cuentas por Pagar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">N.º de Nota *</label>
                  <input
                    type="text"
                    value={noteForm.noteNumber}
                    onChange={(e) => setNoteForm({ ...noteForm, noteNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    required
                  />
                </div>
              </div>

              {/* Beneficiary Name & Target Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {noteForm.entityType === "CUSTOMER" ? "Seleccionar Cliente *" : "Seleccionar Proveedor *"}
                  </label>
                  <select
                    value={noteForm.entityName}
                    onChange={(e) => setNoteForm({ ...noteForm, entityName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    required
                  >
                    <option value="">Selecciona beneficiario...</option>
                    {noteForm.entityType === "CUSTOMER"
                      ? customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                      : vendors.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Factura o Documento Afectado</label>
                  <input
                    type="text"
                    placeholder="Ej. FAC-2026-004 o OC-2026-012"
                    value={noteForm.targetDocNum || ""}
                    onChange={(e) => setNoteForm({ ...noteForm, targetDocNum: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-800 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>
              </div>

              {/* Reason / Motivo & Issue Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo / Concepto del Ajuste *</label>
                  <select
                    value={noteForm.reason}
                    onChange={(e) => setNoteForm({ ...noteForm, reason: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-[#1b426e]"
                  >
                    <option value="Devolución de Insumos / Mercadería Defectuosa">Devolución de Insumos / Mercadería Defectuosa</option>
                    <option value="Descuento por Volumen en Facturación">Descuento por Volumen en Facturación</option>
                    <option value="Ajuste por Error en Precio Unitario">Ajuste por Error en Precio Unitario</option>
                    <option value="Cargo por Flete Especial y Despacho">Cargo por Flete Especial y Despacho</option>
                    <option value="Intereses por Pago Fuera de Plazo (Mora)">Intereses por Pago Fuera de Plazo (Mora)</option>
                    <option value="Otros Ajustes Contables SAR/Macola">Otros Ajustes Contables SAR/Macola</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Emisión *</label>
                  <input
                    type="date"
                    value={noteForm.issueDate}
                    onChange={(e) => setNoteForm({ ...noteForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-800 focus:outline-none focus:border-[#1b426e]"
                    required
                  />
                </div>
              </div>

              {/* Amounts Calculation (Subtotal, ISV 15%, Total) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Monto Subtotal ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={noteForm.amount || ""}
                    onChange={(e) => {
                      const amt = Number(e.target.value) || 0;
                      const isv = amt * 0.15;
                      setNoteForm({ ...noteForm, amount: amt, tax: isv, total: amt + isv });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ISV 15% ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={noteForm.tax || ""}
                    onChange={(e) => {
                      const isv = Number(e.target.value) || 0;
                      setNoteForm({ ...noteForm, tax: isv, total: (noteForm.amount || 0) + isv });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-[#1b426e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Final ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={noteForm.total || ""}
                    readOnly
                    className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-50 border border-emerald-300 font-bold text-emerald-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes / Comentarios */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Observaciones del Ajuste</label>
                <textarea
                  rows={2}
                  value={noteForm.notes || ""}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  placeholder="Detalles adicionales para auditoría contable..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-[#1b426e] resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={noteLoading}
                  className="px-6 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {noteLoading ? "Guardando..." : `Emitir ${noteForm.type === "CREDIT" ? "Nota de Crédito" : "Nota de Débito"}`}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}
    </>
  );
}
