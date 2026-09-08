import Link from "next/link";
import {
  BookOpen,
  Landmark,
  Package,
  Receipt,
  Wallet,
  BarChart3,
  ShieldCheck,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

const FEATURES = [
  {
    icon: Receipt,
    title: "Facturación y Cotizaciones",
    description:
      "Emita facturas, cotizaciones y órdenes de venta con numeración CAI, ISV 15% / 18% y envío por correo en un clic.",
  },
  {
    icon: BookOpen,
    title: "Contabilidad Completa",
    description:
      "Plan de cuentas estándar de Honduras, Libro Diario, Libro Mayor y Balanza de Comprobación con partida doble automática.",
  },
  {
    icon: Landmark,
    title: "Bancos y Conciliación",
    description:
      "Conecte sus cuentas bancarias, categorice transacciones con reglas automáticas y concilie sus estados de cuenta.",
  },
  {
    icon: Package,
    title: "Inventario y Compras",
    description:
      "Control de existencias, categorías de producto, órdenes de compra, facturas de proveedor y devoluciones.",
  },
  {
    icon: Wallet,
    title: "Caja Chica y Retenciones",
    description:
      "Arqueo y control de caja chica, vales provisionales, y retenciones fiscales SAR (1% ISV, 12.5%, 10%).",
  },
  {
    icon: BarChart3,
    title: "Reportes Gerenciales",
    description:
      "Antigüedad de saldos de clientes y proveedores, estados de cuenta, comisiones de vendedores y más.",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= NAV ================= */}
      <PublicNavbar />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=60')",
          }}
        />
        {/* Overlay para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-6">
            {TRIAL_DAYS} días gratis — sin tarjeta de crédito
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            El ERP contable hecho para las empresas de Honduras
          </h1>
          <p className="text-base text-slate-500 mt-5 max-w-2xl mx-auto leading-relaxed">
            Facturación con CAI, contabilidad de partida doble, bancos, inventario y retenciones SAR —
            todo en una sola plataforma en la nube, lista en minutos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-6 py-3 bg-[#1b426e] hover:bg-[#143355] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#1b426e]/20 flex items-center gap-2"
            >
              Comenzar prueba gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold rounded-xl text-sm transition"
            >
              Ver planes y precios
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Sin instalación · Sin contratos · Cancele cuando quiera
          </p>
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cumplimiento fiscal SAR y NIIF para PYMES
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
            <Landmark className="w-4 h-4 text-emerald-600" />
            Multi-divisa HNL / USD / EUR
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
            <Users className="w-4 h-4 text-emerald-600" />
            Multi-empresa y multi-usuario
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="funciones" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Todo lo que su empresa necesita
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Desde la cotización hasta el cierre contable, Prado ERP automatiza su operación diaria.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1b426e]/10 text-[#1b426e] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="precios" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Planes simples y transparentes</h2>
            <p className="text-sm text-slate-500 mt-2">
              Todos incluyen {TRIAL_DAYS} días de prueba gratis. No se requiere tarjeta de crédito.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col shadow-sm ${
                  plan.highlighted ? "border-[#1b426e] ring-2 ring-[#1b426e]/20 shadow-lg" : "border-slate-200"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#1b426e] text-white text-[10px] font-bold uppercase tracking-wider">
                    Más Popular
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-xs text-slate-500 font-medium">USD / mes</span>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block text-center px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    plan.highlighted
                      ? "bg-[#1b426e] hover:bg-[#143355] text-white"
                      : "bg-white border border-[#1b426e] text-[#1b426e] hover:bg-slate-50"
                  }`}
                >
                  Probar {TRIAL_DAYS} días gratis
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-8">
            ¿Ya venció su prueba?{" "}
            <Link href="/pricing" className="font-semibold text-[#1b426e] hover:underline">
              Suscríbase aquí →
            </Link>
          </p>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Empiece a facturar hoy mismo
        </h2>
        <p className="text-sm text-slate-500 mt-3 max-w-lg mx-auto">
          Cree su cuenta en menos de 2 minutos. El plan de cuentas de Honduras viene precargado —
          solo registre su empresa y comience.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 mt-7 px-8 py-3.5 bg-[#1b426e] hover:bg-[#143355] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#1b426e]/20"
        >
          Crear cuenta gratis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ================= FOOTER ================= */}
      <PublicFooter />
    </div>
  );
}
