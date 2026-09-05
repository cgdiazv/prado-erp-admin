"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import logoImg from "@/public/logo.webp";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "No se pudo procesar la solicitud. Intente más tarde.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al solicitar restablecimiento.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image
              src={logoImg}
              alt="Prado ERP"
              priority
              className="h-16 w-auto max-w-[260px] object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Ingrese su correo electrónico registrado para recibir las instrucciones de restablecimiento.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/90 text-red-800 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-900 text-xs uppercase tracking-wider mb-0.5">
                Error
              </p>
              <p className="text-red-700 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-emerald-900 mb-1">
                  Enlace Enviado
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Si la dirección <strong>{email}</strong> está registrada en <strong>Prado ERP</strong>, recibirá un correo con el enlace para restablecer su contraseña en los próximos minutos.
                </p>
                <p className="text-[11px] text-emerald-700 mt-2">
                  Revise también su carpeta de correo no deseado (spam) si no lo encuentra en su bandeja de entrada.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1b426e] hover:text-[#143355] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 transition-all text-sm font-medium"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-sm transition-all shadow-lg shadow-[#1b426e]/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Enviando enlace...</span>
                </>
              ) : (
                <span>Enviar enlace de recuperación</span>
              )}
            </button>

            <div className="pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1b426e] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Prado ERP • Acceso seguro administrativo
          </p>
        </div>
      </div>
    </div>
  );
}
