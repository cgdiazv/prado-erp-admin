"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import logoImg from "@/public/logo.webp";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-5">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider mb-1">
              Enlace Incompleto
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              No se detectó un token de verificación en el enlace. Asegúrese de abrir el enlace completo que recibió por correo electrónico.
            </p>
          </div>
        </div>

        <Link
          href="/forgot-password"
          className="inline-block w-full py-3 px-4 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-sm transition-all shadow-md shadow-[#1b426e]/20"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifíquelas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "No se pudo actualizar la contraseña.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar el cambio de contraseña.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-left flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider text-emerald-900 mb-1">
              Contraseña Actualizada
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Su contraseña ha sido modificada con éxito. Ya puede acceder a Prado ERP utilizando sus nuevas credenciales.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full py-3.5 px-4 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-sm transition-all shadow-lg shadow-[#1b426e]/25 cursor-pointer flex items-center justify-center gap-2"
        >
          Iniciar sesión ahora
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200/90 text-red-800 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-red-900 text-xs uppercase tracking-wider mb-0.5">
              Aviso
            </p>
            <p className="text-red-700 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Nueva Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 transition-all text-sm font-medium"
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar" : "Ver"}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-lg transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 transition-all text-sm font-medium"
            placeholder="Repita la nueva contraseña"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? "Ocultar" : "Ver"}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-lg transition-colors cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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
            <span>Actualizando contraseña...</span>
          </>
        ) : (
          <span>Guardar nueva contraseña</span>
        )}
      </button>

      <div className="pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1b426e] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancelar y volver al inicio
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            Restablecer Contraseña
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Defina una nueva contraseña segura para su cuenta en Prado ERP.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b426e]"></div>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Prado ERP • Acceso seguro administrativo
          </p>
        </div>
      </div>
    </div>
  );
}
