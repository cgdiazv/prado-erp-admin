import Link from "next/link";
import Image from "next/image";
import logoImg from "@/public/logo.webp";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logoImg} alt="Prado ERP" priority className="h-10 w-auto object-contain" />
          <span className="text-lg font-black tracking-tight text-slate-900">Prado ERP</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/#funciones" className="hover:text-slate-900 transition">Funciones</Link>
            <Link href="/#precios" className="hover:text-slate-900 transition">Precios</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
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
  );
}
