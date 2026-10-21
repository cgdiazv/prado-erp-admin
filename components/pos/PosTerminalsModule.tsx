"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { DEFAULT_POS_REGISTERS } from "@/lib/posRegisters";

type Props = {
  onBack: () => void;
};

export default function PosTerminalsModule({ onBack }: Props) {
  const [terminals, setTerminals] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pos/terminals", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success || !Array.isArray(data.data?.terminals)) {
          throw new Error(data?.error || "No se pudieron cargar las terminales.");
        }
        if (!cancelled) setTerminals(data.data.terminals);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error inesperado al cargar las terminales.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveTerminals = async (nextTerminals: string[]) => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/pos/terminals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminals: nextTerminals }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "No se pudieron guardar las terminales.");
      }
      setTerminals(data.data.terminals);
      setName("");
      setEditingIndex(null);
      setNotice("Terminales guardadas correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al guardar las terminales.");
    } finally {
      setSaving(false);
    }
  };

  const submitTerminal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Ingrese el nombre de la terminal.");
      return;
    }
    if (normalizedName.length > 60) {
      setError("El nombre no puede exceder 60 caracteres.");
      return;
    }
    if (terminals.some((terminal, index) =>
      index !== editingIndex && terminal.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
    )) {
      setError("Ya existe una terminal con ese nombre.");
      return;
    }

    const updated = [...terminals];
    if (editingIndex === null) updated.push(normalizedName);
    else updated[editingIndex] = normalizedName;
    await saveTerminals(updated);
  };

  const removeTerminal = async (index: number) => {
    if (terminals.length === 1) {
      setError("Debe conservar al menos una terminal del POS.");
      return;
    }
    if (!window.confirm(`¿Eliminar la terminal "${terminals[index]}"?`)) return;
    await saveTerminals(terminals.filter((_, terminalIndex) => terminalIndex !== index));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Regresar a Dashboard
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-5">
          <h1 className="text-base font-bold text-slate-900">Terminales del POS</h1>
          <p className="mt-1 text-xs text-slate-500">
            Agregue y administre las cajas disponibles en la configuración del Punto de Venta.
          </p>
        </div>

        <form onSubmit={submitTerminal} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la terminal"
            aria-label="Nombre de la terminal"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-[#1b426e] focus:outline-none focus:ring-2 focus:ring-[#1b426e]/20"
            disabled={loading || saving}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || saving || !name.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1b426e] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#143355] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {saving ? "Guardando..." : editingIndex === null ? "Agregar terminal" : "Guardar cambios"}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setName("");
                  setError("");
                }}
                disabled={saving}
                aria-label="Cancelar edición"
                className="rounded-xl border border-slate-300 p-2.5 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Cargando terminales...</p>
        ) : error && terminals.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              fetch("/api/pos/terminals", { cache: "no-store" })
                .then(async (response) => {
                  const data = await response.json().catch(() => null);
                  if (!response.ok || !data?.success || !Array.isArray(data.data?.terminals)) {
                    throw new Error(data?.error || "No se pudieron cargar las terminales.");
                  }
                  setTerminals(data.data.terminals);
                })
                .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error inesperado al cargar las terminales."))
                .finally(() => setLoading(false));
            }}
            className="text-xs font-semibold text-[#1b426e] underline"
          >
            Reintentar
          </button>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Terminal</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terminals.map((terminal, index) => (
                  <tr key={`${terminal}-${index}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-800">{terminal}</td>
                    <td className="space-x-3 px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(index);
                          setName(terminal);
                          setError("");
                          setNotice("");
                        }}
                        disabled={saving}
                        className="inline-flex items-center gap-1 font-semibold text-[#1b426e] hover:underline disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTerminal(index)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && terminals.length === 0 && (
          <button
            type="button"
            onClick={() => saveTerminals(DEFAULT_POS_REGISTERS)}
            disabled={saving}
            className="mt-3 text-xs font-semibold text-[#1b426e] hover:underline disabled:opacity-50"
          >
            Restaurar terminales iniciales
          </button>
        )}
      </section>
    </div>
  );
}
