import Link from "next/link";
import {
  BookOpen,
  Landmark,
  Package,
  Receipt,
  Wallet,
  BarChart3,
  Check,
  ArrowRight,
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

const FEATURES = [
  {
    id: "facturacion",
    icon: Receipt,
    badge: "Facturación & Ventas",
    title: "Facturación y Cotizaciones",
    subtitle: "Emisión ágil de facturas legales con numeración CAI e ISV automático",
    description:
      "Emita facturas, cotizaciones y órdenes de venta con numeración CAI autorizada por el SAR, cálculo automático de ISV 15% / 18% y envío directo al cliente por correo electrónico en un solo clic.",
    bullets: [
      "Numeración y rangos CAI vigentes autorizados por el SAR",
      "Cálculo automático de ISV general (15%) y sobre licores/cerveza (18%)",
      "Conversión directa de cotizaciones y órdenes de venta a factura final",
      "Envío por correo al cliente con documento oficial en PDF descargable",
    ],
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Facturación y cotizaciones electrónicas con CAI",
    statBadge: {
      title: "Factura N° 000-001-01-0004521",
      subtitle: "CAI Vigente · ISV 15% calculado",
      metric: "L 24,850.00",
    },
    cta: "Probar facturación gratis",
  },
  {
    id: "contabilidad",
    icon: BookOpen,
    badge: "Contabilidad Automática",
    title: "Contabilidad Completa",
    subtitle: "Plan de cuentas estándar de Honduras y partida doble en tiempo real",
    description:
      "Plan de cuentas estándar de Honduras, Libro Diario, Libro Mayor y Balanza de Comprobación con partida doble automática generada sin intervención manual a partir de cada venta, compra o pago.",
    bullets: [
      "Catálogo contable estándar para empresas hondureñas ya precargado",
      "Partida doble automática en cada movimiento comercial y operativo",
      "Libro Diario, Libro Mayor y Balanza de Comprobación siempre cuadrados",
      "Cierres de periodo contable mensual y anual con reportes NIIF para PYMES",
    ],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Contabilidad y balanza de comprobación automática",
    statBadge: {
      title: "Balanza de Comprobación",
      subtitle: "Debe y Haber conciliados",
      metric: "100% Cuadrada",
    },
    cta: "Explorar módulo contable",
  },
  {
    id: "bancos",
    icon: Landmark,
    badge: "Tesorería & Cuentas Bancarias",
    title: "Bancos y Conciliación",
    subtitle: "Conecte y concilie sus cuentas bancarias en Lempiras y Dólares",
    description:
      "Conecte sus cuentas bancarias, categorice transacciones con reglas automáticas y concilie sus estados de cuenta bancarios con los registros contables sin discrepancias.",
    bullets: [
      "Cuentas de cheques y ahorros en Lempiras (HNL), Dólares (USD) o Euros (EUR)",
      "Importación de extractos bancarios y reglas inteligentes de coincidencia",
      "Historial cronológico de transferencias, cheques y depósitos en tránsito",
      "Conciliación bancaria ágil para garantizar el saldo real disponible",
    ],
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Gestión bancaria y conciliación de cuentas",
    statBadge: {
      title: "Conciliación Bancaria",
      subtitle: "BAC · Ficohsa · Atlántida · Banpaís",
      metric: "Cuentas al día",
    },
    cta: "Probar bancos y tesorería",
  },
  {
    id: "inventario",
    icon: Package,
    badge: "Almacén & Cadena de Suministro",
    title: "Inventario y Compras",
    subtitle: "Control de existencias, órdenes de compra y facturas de proveedor",
    description:
      "Control de existencias, categorías de producto, órdenes de compra, facturas de proveedor y devoluciones. Mantenga su stock siempre actualizado y optimice sus compras.",
    bullets: [
      "Kardex valorizado en tiempo real con costo promedio ponderado",
      "Alertas automáticas de existencias mínimas para evitar quiebres de inventario",
      "Ciclo completo de compras: orden de compra, recepción y factura de proveedor",
      "Gestión por categorías, unidades de medida y control de proveedores",
    ],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Control de inventario físico y órdenes de compra",
    statBadge: {
      title: "Kardex Valorizado",
      subtitle: "Existencias y costos en tiempo real",
      metric: "Stock en vivo",
    },
    cta: "Gestionar inventario",
  },
  {
    id: "caja-chica",
    icon: Wallet,
    badge: "Gastos & Fiscal SAR",
    title: "Caja Chica y Retenciones",
    subtitle: "Arqueos de fondos fijos y retenciones tributarias del SAR",
    description:
      "Arqueo y control de caja chica, vales provisionales, y retenciones fiscales SAR (1% ISV, 12.5% de servicios profesionales, y 10% de alquileres) emitidas en regla.",
    bullets: [
      "Control de fondos fijos de caja chica con registro de vales provisionales",
      "Arqueos sistemáticos con desglose de denominaciones de efectivo y recibos",
      "Emisión oficial de comprobantes de retención fiscal autorizados por el SAR",
      "Reporte mensual de retenciones efectuadas listo para declaraciones tributarias",
    ],
    image:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Caja chica y comprobantes de retención SAR",
    statBadge: {
      title: "Retenciones SAR",
      subtitle: "1% ISV / 12.5% Honorarios / 10%",
      metric: "SAR Homologado",
    },
    cta: "Probar caja chica y retenciones",
  },
  {
    id: "reportes",
    icon: BarChart3,
    badge: "Inteligencia & Rendimiento",
    title: "Reportes Gerenciales",
    subtitle: "Antigüedad de saldos, comisiones de vendedores y estados financieros",
    description:
      "Antigüedad de saldos de clientes y proveedores, estados de cuenta, comisiones de vendedores y más reportes ejecutivos para tomar decisiones financieras informadas.",
    bullets: [
      "Reporte de antigüedad de saldos a 30, 60 y 90+ días para acelerar cobranzas",
      "Estados de cuenta detallados por cliente y proveedor con opción de descarga",
      "Cálculo automático de comisiones de vendedores según ventas o cobranzas",
      "Exportación ágil de datos a Excel y reportes ejecutivos listos para imprimir",
    ],
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Reportes gerenciales y analítica empresarial",
    statBadge: {
      title: "Reportes Ejecutivos",
      subtitle: "Cuentas por cobrar y comisiones",
      metric: "Métricas en vivo",
    },
    cta: "Ver reportes gerenciales",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= NAV ================= */}
      <PublicNavbar />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden min-h-[60vh] md:min-h-[68vh] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=60')",
          }}
        />
        {/* Overlay para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white" />
        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-20 md:pt-16 md:pb-28 text-center w-full">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-6">
            {TRIAL_DAYS} días gratis — sin tarjeta de crédito
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            La app en línea hecha para facturar y administrar empresas en Honduras
          </h1>
          <p className="text-base md:text-lg text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Facturación con CAI, contabilidad de partida doble, bancos, inventario y retenciones SAR —
            todo en una sola plataforma en la nube, lista en minutos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-7 py-3.5 bg-[#1b426e] hover:bg-[#143355] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#1b426e]/20 flex items-center gap-2"
            >
              Comenzar prueba gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold rounded-xl text-sm transition shadow-xs"
            >
              Ver planes y precios
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">
            Sin instalación · Sin contratos · Cancele cuando quiera
          </p>
        </div>
      </section>

      {/* ================= FEATURES INTRO & QUICK NAV ================= */}
      <section id="funciones" className="pt-20 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-[#1b426e]/10 text-[#1b426e] text-[11px] font-bold uppercase tracking-wider mb-4">
            Módulos Integrados
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Todo lo que su empresa necesita
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-3 max-w-2xl mx-auto leading-relaxed">
            Desde la cotización hasta el cierre contable, Prado ERP automatiza su operación diaria con cumplimiento fiscal SAR y mejores prácticas contables NIIF.
          </p>

          {/* Quick jump navigation pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {FEATURES.map((f) => (
              <a
                key={f.id}
                href={`#${f.id}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-[#1b426e]/10 border border-slate-200 hover:border-[#1b426e]/30 text-xs font-semibold text-slate-700 hover:text-[#1b426e] transition shadow-xs"
              >
                <f.icon className="w-3.5 h-3.5 text-[#1b426e]" />
                <span>{f.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DEDICATED MODULE SECTIONS ================= */}
      <div className="divide-y divide-slate-100">
        {FEATURES.map((f, idx) => {
          const isEven = idx % 2 === 1;
          return (
            <section
              key={f.id}
              id={f.id}
              className={`py-16 md:py-24 scroll-mt-20 ${
                isEven ? "bg-slate-50/60" : "bg-white"
              }`}
            >
              <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                  {/* TEXT CONTENT */}
                  <div
                    className={`lg:col-span-6 ${
                      isEven ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b426e]/10 text-[#1b426e] text-xs font-bold uppercase tracking-wider mb-4">
                      <f.icon className="w-3.5 h-3.5" />
                      <span>{f.badge}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                      {f.title}
                    </h3>

                    <p className="text-sm sm:text-base font-semibold text-slate-700 mt-2">
                      {f.subtitle}
                    </p>

                    <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                      {f.description}
                    </p>

                    {/* Bullet highlights */}
                    <div className="mt-6 space-y-3">
                      {f.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <span className="text-xs sm:text-sm text-slate-700 font-medium">
                            {bullet}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA link */}
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#1b426e]/20 transition"
                      >
                        {f.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <span className="text-xs text-slate-400 font-medium">
                        Sin tarjeta de crédito · {TRIAL_DAYS} días gratis
                      </span>
                    </div>
                  </div>

                  {/* IMAGE PREVIEW WITH GLASSMORPHIC CARD */}
                  <div
                    className={`lg:col-span-6 ${
                      isEven ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <div className="relative group">
                      {/* Glow effect */}
                      <div className="absolute -inset-2 bg-gradient-to-tr from-[#1b426e]/15 to-emerald-500/15 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-700" />

                      {/* Main card */}
                      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
                        {/* Image banner */}
                        <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                          <img
                            src={f.image}
                            alt={f.imageAlt}
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Floating ERP Status Preview */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-200/80 shadow-lg">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">
                                {f.statBadge.title}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {f.statBadge.subtitle}
                              </p>
                            </div>
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black shrink-0">
                              {f.statBadge.metric}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

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
                className={`relative bg-white rounded-2xl border p-6 flex flex-col shadow-sm ${plan.highlighted ? "border-[#1b426e] ring-2 ring-[#1b426e]/20 shadow-lg" : "border-slate-200"
                  }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#1b426e] text-white text-[10px] font-bold uppercase tracking-wider">
                    Más Popular
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="text-lg font-bold text-slate-400 line-through">${plan.originalPrice}</span>
                  )}
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
                  className={`mt-6 block text-center px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${plan.highlighted
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
