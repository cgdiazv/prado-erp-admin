"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PublicNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#25426f] border-b border-white/15">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 h-[88px] md:h-[100px] flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition md:hidden"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-[34px] h-[34px] rounded-[7px] overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src="/logo-prado.png"
                  alt="Prado ERP"
                  width={34}
                  height={34}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-manrope font-extrabold text-[22px] md:text-[25px] tracking-tight text-white leading-[34px]">
                Prado ERP
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-[34px]">
            <nav className="hidden md:flex items-center gap-6 lg:gap-[34px] font-inter text-[14px] text-[#b6c5d5]">
              <Link href="/#funciones" className="hover:text-white transition">
                Funciones
              </Link>
              <Link href="/#precios" className="hover:text-white transition">
                Precios
              </Link>
            </nav>

            <div className="hidden md:block w-px h-5 bg-white/15" />

            <div className="flex items-center gap-4 lg:gap-[34px]">
              <Link
                href="/login"
                className="hidden md:block font-inter text-[14px] text-white hover:text-[#b6c5d5] transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center font-inter font-semibold text-[14px] text-[#25426f] bg-[#a6e9cf] hover:bg-[#8ee0bf] px-5 py-2.5 rounded-[6px] transition shadow-xs"
              >
                Prueba gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] md:hidden transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile sliding drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-[#25426f] text-white border-r border-white/15 shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 px-6 border-b border-white/15 flex items-center justify-between">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-[6px] overflow-hidden">
              <Image src="/logo-prado.png" alt="Prado ERP" width={30} height={30} className="w-full h-full object-cover" />
            </div>
            <span className="font-manrope font-extrabold text-[20px] text-white tracking-tight">Prado ERP</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-6 flex flex-col gap-2 font-inter text-[15px] text-[#b6c5d5]">
          <Link
            href="/#funciones"
            onClick={() => setDrawerOpen(false)}
            className="px-3.5 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
          >
            Funciones
          </Link>
          <Link
            href="/#precios"
            onClick={() => setDrawerOpen(false)}
            className="px-3.5 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
          >
            Precios
          </Link>
          <Link
            href="/login"
            onClick={() => setDrawerOpen(false)}
            className="px-3.5 py-2.5 rounded-lg hover:bg-white/10 text-white font-medium transition"
          >
            Iniciar sesión
          </Link>
        </nav>
        <div className="p-6 border-t border-white/15">
          <Link
            href="/signup"
            onClick={() => setDrawerOpen(false)}
            className="w-full inline-flex items-center justify-center font-inter font-semibold text-[14px] text-[#25426f] bg-[#a6e9cf] hover:bg-[#8ee0bf] px-5 py-3 rounded-[6px] transition text-center shadow-sm"
          >
            Prueba gratis
          </Link>
        </div>
      </aside>
    </>
  );
}
