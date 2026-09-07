import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Prado ERP. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500">
          <Link href="/privacidad" className="hover:text-slate-800 transition">Privacidad</Link>
          <Link href="/terminos" className="hover:text-slate-800 transition">Términos y Condiciones</Link>
        </div>
      </div>
    </footer>
  );
}
