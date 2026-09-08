"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/public/logo.webp";

export default function PublicNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition md:hidden"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={logoImg} alt="Prado ERP" priority className="h-10 w-auto object-contain" />
            <span className="text-lg font-black tracking-tight text-slate-900">Prado ERP</span>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/#funciones" className="hover:text-slate-900 transition">Funciones</Link>
            <Link href="/#precios" className="hover:text-slate-900 transition">Precios</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-2 bg-[#1b426e] hover:bg-[#143355] text-white font-semibold rounded-xl text-xs transition shadow-sm"
            >
              Prueba Gratis
            </Link>
          </div>
        </div>
      </div>

      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-[60] md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile sliding drawer (from the left) */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5">
            <Image src={logoImg} alt="Prado ERP" className="h-9 w-auto object-contain" />
            <span className="text-base font-black tracking-tight text-slate-900">Prado ERP</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Cerrar menú"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 text-sm font-semibold text-slate-600">
          <Link
            href="/#funciones"
            onClick={() => setDrawerOpen(false)}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Funciones
          </Link>
          <Link
            href="/#precios"
            onClick={() => setDrawerOpen(false)}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Precios
          </Link>
          <Link
            href="/login"
            onClick={() => setDrawerOpen(false)}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Iniciar Sesión
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/signup"
            onClick={() => setDrawerOpen(false)}
            className="block w-full text-center px-3.5 py-2.5 bg-[#1b426e] hover:bg-[#143355] text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            Prueba Gratis
          </Link>
        </div>
      </aside>
    </>
  );
}
