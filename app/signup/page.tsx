"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import logoImg from "@/public/logo.webp";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "No se pudo crear la cuenta. Por favor verifique sus datos.");
      }

      // Successfully registered and session cookie created -> redirect to dashboard
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al registrar la cuenta.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
        {/* Brand Header with same logo and colors as login */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <Image
              src={logoImg}
              alt="Prado ERP"
              priority
              className="h-16 w-auto max-w-[260px] object-contain"
            />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-5">
            Registrarse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cree su cuenta de prueba de 30 días
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200/90 text-red-800 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-900 text-xs uppercase tracking-wider mb-0.5">
                Aviso
              </p>
              <p className="text-red-700 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nombre de la empresa
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 transition-all text-sm font-medium"
              placeholder="Ej. Inversiones del Prado S.A."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1b426e] focus:ring-2 focus:ring-[#1b426e]/20 transition-all text-sm font-medium"
              placeholder="admin@empresa.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Contraseña
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
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-lg transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-sm transition-all shadow-lg shadow-[#1b426e]/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creando cuenta...</span>
              </>
            ) : (
              <span>Crear Mi Cuenta y Comenzar</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-4 text-center">
          <p className="text-xs text-slate-500">
            ¿Ya tiene una cuenta?{" "}
            <a
              href="/login"
              className="font-bold text-[#1b426e] hover:text-[#143355] hover:underline transition-colors cursor-pointer"
            >
              Inicie sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
