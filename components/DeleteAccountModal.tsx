"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

const REASONS = [
  "Ya no necesito la plataforma",
  "Muy costoso para mi negocio",
  "Faltan funciones importantes",
  "Problemas técnicos o errores",
  "Cambio a otra plataforma",
  "Preocupaciones de privacidad o seguridad",
  "Otro motivo",
];

export default function DeleteAccountModal({
  isOpen,
  onClose,
  companyName,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isOtherSelected = selectedReasons.includes("Otro motivo");
  const isConfirmed = confirmationInput.trim().toUpperCase() === "ELIMINAR";

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/company/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: confirmationInput,
          reasons: selectedReasons,
          comments: isOtherSelected ? otherText : "",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Error al eliminar la cuenta.");
      }

      // Redirect to login upon successful deletion
      window.location.href = "/login?account_deleted=1";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar la eliminación.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white border border-red-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900 font-sans max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900 tracking-tight">
              Eliminar cuenta y todos los datos
            </h3>
            <p className="text-xs text-red-700">
              Esta acción es permanente y no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Impact Warning */}
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
          <p className="font-semibold">
            Se eliminarán de forma definitiva todos los registros asociados a{" "}
            <span className="font-bold underline">{companyName}</span>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-red-700">
            <li>Facturas de venta y de compra</li>
            <li>Plan de cuentas y libro diario contable</li>
            <li>Cuentas bancarias y conciliaciones</li>
            <li>Inventario, lotes y series</li>
            <li>Clientes, proveedores y cotizaciones</li>
            <li>Todos los usuarios y accesos de su equipo</li>
            <li>Cualquier suscripción activa de Stripe se cancelará de inmediato</li>
          </ul>
        </div>

        {/* Optional Survey */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ¿Por qué ha decidido eliminar su cuenta? (Opcional)
          </label>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 cursor-pointer select-none transition"
              >
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(r)}
                  onChange={() => toggleReason(r)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {isOtherSelected && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Cuéntenos más sobre su experiencia..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          )}
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800">
            Para confirmar la eliminación permanente, escriba{" "}
            <span className="text-red-600 font-black tracking-wider">ELIMINAR</span>:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Escriba ELIMINAR"
            disabled={loading}
            className="w-full border border-red-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
          >
            Cancelar y volver
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center gap-2 shadow-sm ${
              isConfirmed && !loading
                ? "bg-red-600 hover:bg-red-700 cursor-pointer shadow-red-600/20"
                : "bg-red-300 cursor-not-allowed opacity-60"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? "Eliminando cuenta y datos..." : "Eliminar cuenta y todos mis datos"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
