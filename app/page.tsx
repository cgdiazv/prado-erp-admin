"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle,
  ClipboardList,
  Cloud,
  Download,
  FileCheck2,
  FileText,
  Landmark,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number[]>([0, 1, 2, 3]);
  const [isAnnual, setIsAnnual] = useState(true);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#14253b] selection:bg-[#a6e9cf] selection:text-[#25426f]">
      {/* =========================================================================
          SECTION 0: Presentación (Hero)
          ========================================================================= */}
      <section className="bg-[#25426f] text-white">
        {/* Navigation */}
        <PublicNavbar />

        {/* Hero Body */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 pt-12 md:pt-[77px] pb-14 md:pb-[70px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left: Value Proposition */}
            <div className="lg:col-span-5 flex flex-col gap-6 md:gap-[26px]">
              {/* Origin badge */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-[2px] bg-[#a6e9cf]" />
                <span className="font-inter font-semibold text-[11px] leading-[13px] tracking-wider text-[#a6e9cf] uppercase">
                  HECHO PARA EMPRESAS EN HONDURAS
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-manrope font-bold text-4xl sm:text-5xl lg:text-[64px] leading-tight lg:leading-[69px] text-white tracking-tight">
                Su empresa,
                <br />
                en orden.
                <br />
                Su futuro,
                <br />
                en marcha.
              </h1>

              {/* Subtitle / Proposition */}
              <p className="font-inter text-base sm:text-[17px] leading-relaxed sm:leading-[28px] text-[#b6c5d5] max-w-[465px]">
                La app en línea para facturar y administrar su empresa en Honduras. Contabilidad, bancos e inventario, en un solo lugar.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-[13px] pt-1">
                <div className="flex flex-wrap items-center gap-4 sm:gap-[22px]">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-3.5 bg-[#a6e9cf] hover:bg-[#8ee0bf] text-[#25426f] font-inter font-semibold text-[15px] leading-[18px] px-6 py-4 rounded-[6px] transition shadow-xs group"
                  >
                    <span>Empiece sus 60 días gratis</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/#funciones"
                    className="inline-flex items-center text-white hover:text-[#a6e9cf] font-inter text-[14px] leading-[17px] transition"
                  >
                    Ver funciones ↗
                  </Link>
                </div>
                <p className="font-inter text-[12px] leading-[15px] text-[#b6c5d5]">
                  Sin tarjeta de crédito. Sin contratos.
                </p>
              </div>
            </div>

            {/* Right: Software Presentation Window */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Product Category & Status */}
              <div className="flex items-center justify-between font-inter text-[11px] leading-[13px] px-1">
                <span className="text-[#b6c5d5] tracking-wide">
                  UNA SOLA PLATAFORMA. TODA SU OPERACIÓN.
                </span>
                <span className="text-[#a6e9cf] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a6e9cf] inline-block animate-pulse" />
                  En la nube
                </span>
              </div>

              {/* Conceptual Product Window */}
              <div className="bg-white rounded-[12px] shadow-[0_20px_48px_rgba(0,0,0,0.3)] overflow-hidden text-[#14253b] border border-white/20">
                {/* Title Bar */}
                <div className="bg-[#e8eeed] h-[35px] px-4 flex items-center justify-between border-b border-[#dde5e2]">
                  <div className="flex items-center gap-[7px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b2bfbd]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b2bfbd]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b2bfbd]" />
                  </div>
                  <div className="font-inter text-[10px] leading-[12px] text-[#637080] text-center flex-1 pr-10">
                    Prado ERP · Su empresa, conectada
                  </div>
                </div>

                {/* Window Body: Mini App UI */}
                <div className="flex flex-col sm:flex-row min-h-[440px]">
                  {/* Mini Sidebar */}
                  <div className="w-full sm:w-[140px] bg-[#25426f] text-white p-4 sm:p-[23px_14px] flex flex-col justify-between border-r border-[#1b304b] flex-shrink-0">
                    <div className="flex flex-col gap-5 sm:gap-[22px]">
                      <span className="font-manrope font-extrabold text-[18px] leading-[25px] text-white">
                        Prado ERP
                      </span>
                      <div className="flex flex-row sm:flex-col gap-1 sm:gap-[7px] flex-wrap">
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] bg-[#1b304b] text-white font-inter text-[10px]">
                          <LayoutDashboard className="w-[13px] h-[13px] text-[#a6e9cf]" />
                          <span>Resumen</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[#b6c5d5] hover:text-white font-inter text-[10px]">
                          <FileText className="w-[13px] h-[13px]" />
                          <span>Facturación</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[#b6c5d5] hover:text-white font-inter text-[10px]">
                          <BookOpen className="w-[13px] h-[13px]" />
                          <span>Contabilidad</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[#b6c5d5] hover:text-white font-inter text-[10px]">
                          <Landmark className="w-[13px] h-[13px]" />
                          <span>Bancos</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[#b6c5d5] hover:text-white font-inter text-[10px]">
                          <Package className="w-[13px] h-[13px]" />
                          <span>Inventario</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[#b6c5d5] hover:text-white font-inter text-[10px]">
                          <BarChart3 className="w-[13px] h-[13px]" />
                          <span>Reportes</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-[58px] flex flex-col gap-1 border-t sm:border-t-0 border-white/10 mt-3 sm:mt-0">
                      <span className="font-inter font-semibold text-[10px] leading-[12px] text-white truncate">
                        Comercial Los Pinos
                      </span>
                      <span className="font-inter text-[9px] leading-[11px] text-[#b6c5d5]">
                        Honduras · HNL
                      </span>
                    </div>
                  </div>

                  {/* Mini Dashboard Panel */}
                  <div className="flex-1 bg-[#f6f8f7] p-4 sm:p-6 flex flex-col gap-4 sm:gap-[19px]">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-inter text-[10px] leading-[12px] text-[#637080]">
                          Todo listo para un nuevo día
                        </span>
                        <span className="font-manrope font-bold text-lg sm:text-[21px] leading-[29px] text-[#25426f]">
                          Su negocio, de un vistazo
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#eaf5ef] flex items-center justify-center font-inter font-semibold text-[9px] text-[#087e63]">
                        MP
                      </div>
                    </div>

                    {/* KPI Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-white rounded-[7px] border border-[#dde5e2] p-3 flex flex-col gap-2">
                        <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                          Ventas del mes
                        </span>
                        <span className="font-manrope font-bold text-[16px] leading-[22px] text-[#25426f]">
                          L 128,450.00
                        </span>
                        <div className="w-6 h-[2px] bg-[#087e63]" />
                      </div>
                      <div className="bg-white rounded-[7px] border border-[#dde5e2] p-3 flex flex-col gap-2">
                        <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                          Por cobrar
                        </span>
                        <span className="font-manrope font-bold text-[16px] leading-[22px] text-[#25426f]">
                          L 32,680.00
                        </span>
                        <div className="w-6 h-[2px] bg-[#087e63]" />
                      </div>
                      <div className="bg-white rounded-[7px] border border-[#dde5e2] p-3 flex flex-col gap-2">
                        <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                          Por pagar
                        </span>
                        <span className="font-manrope font-bold text-[16px] leading-[22px] text-[#25426f]">
                          L 18,240.00
                        </span>
                        <div className="w-6 h-[2px] bg-[#087e63]" />
                      </div>
                    </div>

                    {/* Weekly Sales Chart */}
                    <div className="bg-white rounded-[7px] p-3.5 flex flex-col gap-3 border border-[#dde5e2]">
                      <div className="flex items-center justify-between">
                        <span className="font-inter font-semibold text-[11px] leading-[13px] text-[#25426f]">
                          Ventas por semana
                        </span>
                        <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                          Octubre 2026
                        </span>
                      </div>
                      <div className="flex items-end gap-3 pt-1">
                        <div className="flex flex-col justify-between h-[74px] font-inter text-[8px] leading-[10px] text-[#637080] pb-1">
                          <span>40 mil</span>
                          <span>20 mil</span>
                          <span>0</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <svg
                            viewBox="0 0 405 74"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-full h-[74px]"
                            preserveAspectRatio="none"
                          >
                            <rect y="7" width="405" height="1" fill="#DDE5E2" />
                            <rect y="37" width="405" height="1" fill="#DDE5E2" />
                            <rect y="73" width="405" height="1" fill="#DDE5E2" />
                            <path
                              d="M0 64.8662C40 64.8662 45 33.4052 85 42.539C125 51.6729 142 62.8364 180 28.3309C218 -6.17472 230 39.4944 270 25.2862C310 11.0781 330 31.3755 365 10.0632C400 -11.2491 391 9.04833 405 1.94424V74H0V64.8662Z"
                              fill="#EAF5EF"
                            />
                            <path
                              d="M0 74C40 74 45 38.109 85 48.529C125 58.9489 142 71.6844 180 32.3201C218 -7.04419 230 45.0556 270 28.8468C310 12.638 330 35.7935 365 11.4802C400 -12.8331 391 10.3224 405 2.218"
                              strokeWidth="2.5"
                              stroke="#087E63"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Recent Invoices List */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-inter font-semibold text-[11px] leading-[13px] text-[#25426f]">
                          Últimas facturas
                        </span>
                        <span className="font-inter text-[9px] leading-[11px] text-[#087e63]">
                          Ver todas →
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-inter text-[10px] bg-white px-3 py-1.5 rounded-[5px] border border-[#dde5e2]/60">
                          <span className="text-[#637080]">Comercial El Roble</span>
                          <span className="text-[#25426f] font-medium">L 8,625.00</span>
                          <span className="bg-[#eaf5ef] text-[#087e63] text-[8px] px-1.5 py-0.5 rounded-[4px]">
                            Pagada
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-inter text-[10px] bg-white px-3 py-1.5 rounded-[5px] border border-[#dde5e2]/60">
                          <span className="text-[#637080]">Servicios del Valle</span>
                          <span className="text-[#25426f] font-medium">L 4,140.00</span>
                          <span className="bg-[#f8f0e4] text-[#a66d21] text-[8px] px-1.5 py-0.5 rounded-[4px]">
                            Pendiente
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="font-inter text-[10px] leading-[12px] text-[#b6c5d5] text-right">
                Vista conceptual · Datos ilustrativos en lempiras
              </p>
            </div>
          </div>
        </div>

        {/* Reasons to start strip */}
        <div className="bg-[#0b1729] border-t border-white/10">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <h2 className="font-manrope font-semibold text-lg leading-[25px] text-white">
              Menos complicaciones.
              <br className="hidden sm:inline" />
              Más claridad para su negocio.
            </h2>
            <div className="flex flex-wrap items-center gap-6 lg:gap-14 font-inter text-[14px] text-[#b6c5d5]">
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-[22px] h-[22px] text-[#a6e9cf]" />
                <span>Facturación con CAI</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-[22px] h-[22px] text-[#a6e9cf]" />
                <span>Contabilidad hondureña</span>
              </div>
              <div className="flex items-center gap-3">
                <Cloud className="w-[22px] h-[22px] text-[#a6e9cf]" />
                <span>Sin instalación</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: Funciones integradas
          ========================================================================= */}
      <section id="funciones" className="py-20 md:py-[96px] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 flex flex-col gap-12 md:gap-[52px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-[18px] max-w-[660px]">
              <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                TODO CONECTADO
              </span>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                Seis módulos. Una sola forma de trabajar.
              </h2>
            </div>
            <p className="font-inter text-base leading-[26px] text-[#637080] max-w-[380px]">
              De la venta al cierre contable, su información sigue el mismo camino. Elija el plan que acompañe a su empresa.
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
            {/* 1. Facturación y cotizaciones */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <FileText className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    VENDA CON ORDEN
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Facturación y cotizaciones
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    De la primera cotización a la factura final, sin volver a ingresar la información.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Numeración CAI autorizada por el SAR · ISV del 15% y 18% automático · Cotizaciones y pedidos a facturas · Envío por correo y PDF
              </p>
            </div>

            {/* 2. Contabilidad completa */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <BookOpen className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    CIERRE CON CLARIDAD
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Contabilidad completa
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    Cada movimiento en su lugar. Una visión contable que acompaña su operación.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Plan de cuentas hondureño · Partida doble automática · Diario, Mayor y Balanza de Comprobación · Cierres mensuales y anuales · Reportes NIIF para PYMES
              </p>
            </div>

            {/* 3. Bancos y conciliación */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <Landmark className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    CONTROLE SU LIQUIDEZ
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Bancos y conciliación
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    Conecte sus registros con sus movimientos bancarios y mantenga sus saldos al día.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Cuentas en HNL, USD y EUR · Importación de estados y cruce de transacciones · Transferencias, cheques y depósitos
              </p>
            </div>

            {/* 4. Inventario y compras */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <Package className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    DÉ SEGUIMIENTO A CADA PRODUCTO
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Inventario y compras
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    Sepa qué tiene, cuánto vale y cuándo necesita reponerlo.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Kardex valorizado en tiempo real · Costo promedio ponderado · Alertas de stock bajo · De la orden de compra a la recepción y factura del proveedor
              </p>
            </div>

            {/* 5. Caja chica y retenciones */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <Wallet className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    CUIDE CADA MOVIMIENTO
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Caja chica y retenciones
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    Orden para los gastos cotidianos y para sus obligaciones de retención.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Fondos fijos · Vales provisionales y arqueos de caja · Constancias de retención del SAR y reporte mensual
              </p>
            </div>

            {/* 6. Reportes gerenciales */}
            <div className="border border-[#dde5e2] rounded-[4px] p-7 md:p-[28px_28px_30px_28px] flex flex-col justify-between gap-6 hover:shadow-md transition">
              <div className="flex flex-col gap-[21px]">
                <div className="flex items-center justify-between">
                  <BarChart3 className="w-[30px] h-[30px] text-[#087e63]" strokeWidth={1.6} />
                  <span className="font-inter font-semibold text-[9px] leading-[11px] tracking-wider text-[#637080] uppercase">
                    DECIDA CON PERSPECTIVA
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-manrope font-bold text-[23px] leading-[28px] text-[#25426f]">
                    Reportes gerenciales
                  </h3>
                  <p className="font-inter text-[15px] leading-[24px] text-[#637080]">
                    La información que necesita para decidir, sin perderse entre hojas de cálculo.
                  </p>
                </div>
              </div>
              <p className="font-inter text-[12px] leading-[22px] text-[#14253b] pt-2 border-t border-[#dde5e2]/60">
                Antigüedad de saldos a 30, 60 y 90+ días · Estados de clientes y proveedores · Comisiones de ventas · Exportación a Excel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: Flujo de operación
          ========================================================================= */}
      <section className="py-20 md:py-[80px] bg-[#f6f8f7]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 flex flex-col gap-12 md:gap-[48px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-[18px] max-w-[750px]">
              <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                DE PRINCIPIO A FIN
              </span>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                Una venta no termina en una factura.
              </h2>
            </div>
            <p className="font-inter text-[13px] leading-[21px] text-[#637080] max-w-[285px]">
              Un flujo integrado, con funciones disponibles según su plan.
            </p>
          </div>

          {/* Connected Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
            {/* Step 1 */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[6px] bg-white border border-[#dde5e2] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ClipboardList className="w-[23px] h-[23px] text-[#087e63]" strokeWidth={1.5} />
                </div>
                <div className="hidden lg:flex items-center gap-2 flex-1">
                  <div className="h-[1px] bg-[#dde5e2] flex-1" />
                  <span className="text-[#087e63] font-inter text-lg">→</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#101f36]">
                  01 Cotice y confirme
                </h3>
                <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                  Prepare su cotización y conviértala en un pedido de venta.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[6px] bg-white border border-[#dde5e2] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FileCheck2 className="w-[23px] h-[23px] text-[#087e63]" strokeWidth={1.5} />
                </div>
                <div className="hidden lg:flex items-center gap-2 flex-1">
                  <div className="h-[1px] bg-[#dde5e2] flex-1" />
                  <span className="text-[#087e63] font-inter text-lg">→</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#101f36]">
                  02 Facture con CAI
                </h3>
                <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                  Genere su factura con el ISV correspondiente y envíela por correo.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[6px] bg-white border border-[#dde5e2] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <RefreshCw className="w-[23px] h-[23px] text-[#087e63]" strokeWidth={1.5} />
                </div>
                <div className="hidden lg:flex items-center gap-2 flex-1">
                  <div className="h-[1px] bg-[#dde5e2] flex-1" />
                  <span className="text-[#087e63] font-inter text-lg">→</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#101f36]">
                  03 Registre y concilie
                </h3>
                <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                  Mantenga la partida doble y sus movimientos bancarios en orden.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[6px] bg-white border border-[#dde5e2] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <BarChart3 className="w-[23px] h-[23px] text-[#087e63]" strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#101f36]">
                  04 Revise y decida
                </h3>
                <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                  Consulte sus saldos, reportes y resultados para dar el siguiente paso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: Hecho para Honduras
          ========================================================================= */}
      <section className="py-20 md:py-[96px] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-[100px] items-center">
            {/* Left: Invoice Mock Scenario */}
            <div className="lg:col-span-6 bg-[#eaf5ef] rounded-[20px] p-6 sm:p-10 flex flex-col items-center gap-5">
              {/* White Invoice Card */}
              <div className="w-full max-w-[425px] bg-white rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 sm:p-[30px] flex flex-col gap-[22px]">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-manrope font-extrabold text-[16px] leading-[22px] text-[#25426f]">
                      Comercial Los Pinos
                    </span>
                    <span className="font-inter text-[10px] leading-[12px] text-[#637080]">
                      Tegucigalpa, Honduras
                    </span>
                  </div>
                  <span className="font-inter font-bold text-[10px] leading-[12px] text-[#087e63]">
                    FACTURA
                  </span>
                </div>

                <div className="w-full h-[2px] bg-[#087e63]" />

                {/* Metadata */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                      FACTURAR A
                    </span>
                    <span className="font-inter font-semibold text-[12px] leading-[15px] text-[#25426f]">
                      Comercial El Roble
                    </span>
                    <span className="font-inter text-[10px] leading-[12px] text-[#637080]">
                      18 de octubre de 2026
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="font-inter font-semibold text-[11px] leading-[13px] text-[#25426f]">
                      000-001-01-00001248
                    </span>
                    <span className="font-inter text-[9px] leading-[11px] text-[#637080]">
                      Numeración CAI · Ejemplo
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col border-t border-[#dde5e2]">
                  <div className="bg-[#f6f8f7] py-2 px-2 flex justify-between font-inter text-[9px] leading-[11px] text-[#637080]">
                    <span>DESCRIPCIÓN</span>
                    <span>IMPORTE</span>
                  </div>
                  <div className="py-2.5 px-2 flex justify-between font-inter text-[10px] leading-[12px] text-[#25426f] border-b border-[#dde5e2]">
                    <span>Suministros de oficina</span>
                    <span>L 5,000.00</span>
                  </div>
                  <div className="py-2.5 px-2 flex justify-between font-inter text-[10px] leading-[12px] text-[#25426f] border-b border-[#dde5e2]">
                    <span>Material de empaque</span>
                    <span>L 2,500.00</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-inter text-[11px] leading-[13px]">
                    <span className="text-[#637080]">Subtotal</span>
                    <span className="text-[#25426f]">L 7,500.00</span>
                  </div>
                  <div className="flex justify-between font-inter text-[11px] leading-[13px]">
                    <span className="text-[#637080]">ISV 15%</span>
                    <span className="text-[#25426f]">L 1,125.00</span>
                  </div>
                  <div className="pt-2 border-t border-[#dde5e2] flex justify-between items-center">
                    <span className="font-manrope font-bold text-[17px] leading-[23px] text-[#25426f]">
                      Total a pagar
                    </span>
                    <span className="font-manrope font-extrabold text-[21px] leading-[29px] text-[#087e63]">
                      L 8,625.00
                    </span>
                  </div>
                </div>

                <p className="font-inter text-[9px] leading-[11px] text-[#637080] text-center pt-1">
                  Documento ilustrativo · Sin validez fiscal
                </p>
              </div>

              {/* Automatic Accounting Banner */}
              <div className="w-full max-w-[425px] bg-[#25426f] rounded-[6px] p-4 flex items-center gap-3 text-white">
                <div className="flex-shrink-0">
                  <CheckCheck className="w-[22px] h-[22px] text-[#a6e9cf]" strokeWidth={1.8} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-inter font-semibold text-[12px] leading-[15px] text-white">
                    Factura emitida. Contabilidad en orden.
                  </span>
                  <span className="font-inter text-[10px] leading-[12px] text-[#b6c5d5]">
                    Asiento de partida doble generado automáticamente.
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Local Tax Preparation Info */}
            <div className="lg:col-span-6 flex flex-col gap-8 md:gap-8">
              <div className="flex flex-col gap-[18px]">
                <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                  HONDURAS, DESDE EL ORIGEN
                </span>
                <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                  Su operación habla el mismo idioma que su contabilidad.
                </h2>
                <p className="font-inter text-base sm:text-[17px] leading-relaxed sm:leading-[28px] text-[#637080]">
                  No empiece desde cero. Trabaje con una base contable y fiscal pensada para las empresas hondureñas.
                </p>
              </div>

              {/* 3 Local Features with Checks */}
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#087e63]" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-inter font-semibold text-[15px] leading-[18px] text-[#25426f]">
                      CAI e ISV, en su flujo de venta
                    </h3>
                    <p className="font-inter text-[14px] leading-[23px] text-[#637080]">
                      Numeración autorizada por el SAR y cálculo automático de ISV al 15% o 18%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#087e63]" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-inter font-semibold text-[15px] leading-[18px] text-[#25426f]">
                      Un punto de partida contable local
                    </h3>
                    <p className="font-inter text-[14px] leading-[23px] text-[#637080]">
                      Plan de cuentas hondureño precargado y reportes bajo NIIF para PYMES.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#087e63]" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-inter font-semibold text-[15px] leading-[18px] text-[#25426f]">
                      Retenciones con seguimiento
                    </h3>
                    <p className="font-inter text-[14px] leading-[23px] text-[#637080]">
                      Constancias de retención del SAR y reportes mensuales, sin separar su operación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: Visibilidad gerencial
          ========================================================================= */}
      <section className="py-20 md:py-[88px] bg-[#25426f] text-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-[90px] items-center">
            {/* Left: Value of Reports */}
            <div className="lg:col-span-5 flex flex-col gap-[30px]">
              <div className="flex flex-col gap-[18px]">
                <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#a6e9cf] uppercase">
                  INFORMACIÓN PARA DECIDIR
                </span>
                <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-white">
                  Sepa dónde está su dinero. Y qué sigue.
                </h2>
                <p className="font-inter text-base sm:text-[17px] leading-relaxed sm:leading-[28px] text-[#b6c5d5]">
                  Vea qué le deben, qué debe pagar y cómo se mueve su negocio. Información clara para sus decisiones de cada día.
                </p>
              </div>

              {/* Bullets with mint arrow */}
              <div className="flex flex-col gap-[18px]">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-[18px] h-[18px] text-[#a6e9cf] flex-shrink-0" strokeWidth={1.7} />
                  <span className="font-inter text-[14px] leading-[22px] text-[#b6c5d5]">
                    Priorice cobros con saldos a 30, 60 y 90+ días.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-[18px] h-[18px] text-[#a6e9cf] flex-shrink-0" strokeWidth={1.7} />
                  <span className="font-inter text-[14px] leading-[22px] text-[#b6c5d5]">
                    Revise estados de clientes y proveedores.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-[18px] h-[18px] text-[#a6e9cf] flex-shrink-0" strokeWidth={1.7} />
                  <span className="font-inter text-[14px] leading-[22px] text-[#b6c5d5]">
                    Consulte comisiones y exporte sus datos a Excel.
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Conceptual Aging Report Card */}
            <div className="lg:col-span-7 bg-white rounded-[12px] p-6 sm:p-8 text-[#14253b] shadow-2xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex flex-col gap-1.5">
                  <span className="font-inter text-[10px] leading-[12px] text-[#637080] tracking-wider uppercase">
                    CUENTAS POR COBRAR
                  </span>
                  <h3 className="font-manrope font-bold text-2xl sm:text-[23px] leading-[31px] text-[#25426f]">
                    Antigüedad de saldos
                  </h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-[5px] border border-[#dde5e2] text-[#25426f] font-inter font-semibold text-[11px] leading-[13px]">
                  <Download className="w-3.5 h-3.5 text-[#087e63]" strokeWidth={1.8} />
                  <span>Excel</span>
                </div>
              </div>

              {/* Total Due & Date */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="font-inter text-[12px] leading-[15px] text-[#637080]">
                    Total por cobrar
                  </span>
                  <span className="font-manrope font-bold text-3xl sm:text-[34px] leading-[46px] text-[#25426f]">
                    L 32,680.00
                  </span>
                </div>
                <span className="font-inter text-[11px] leading-[13px] text-[#637080] pb-1">
                  Al 18 oct. 2026
                </span>
              </div>

              {/* Distribution Bar */}
              <div className="flex h-5 w-full rounded-[4px] overflow-hidden">
                <div style={{ width: "45.2%" }} className="bg-[#087e63] h-full" title="Al día: 45.2%" />
                <div style={{ width: "19.3%" }} className="bg-[#6daf98] h-full" title="1–30 días: 19.3%" />
                <div style={{ width: "11.6%" }} className="bg-[#abd0bf] h-full" title="31–60 días: 11.6%" />
                <div style={{ width: "23.9%" }} className="bg-[#dbe8df] h-full" title="61–90+ días: 23.9%" />
              </div>

              {/* Rows Detail */}
              <div className="flex flex-col divide-y divide-[#dde5e2]">
                <div className="py-3 flex items-center justify-between font-inter text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-[2px] bg-[#087e63]" />
                    <span className="text-[#637080]">Al día</span>
                  </div>
                  <span className="font-medium text-[#25426f]">L 18,500.00</span>
                </div>

                <div className="py-3 flex items-center justify-between font-inter text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-[2px] bg-[#6daf98]" />
                    <span className="text-[#637080]">1–30 días</span>
                  </div>
                  <span className="font-medium text-[#25426f]">L 7,900.00</span>
                </div>

                <div className="py-3 flex items-center justify-between font-inter text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-[2px] bg-[#abd0bf]" />
                    <span className="text-[#637080]">31–60 días</span>
                  </div>
                  <span className="font-medium text-[#25426f]">L 4,500.00</span>
                </div>

                <div className="py-3 flex items-center justify-between font-inter text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-[2px] bg-[#dbe8df]" />
                    <span className="text-[#637080]">61–90+ días</span>
                  </div>
                  <span className="font-medium text-[#25426f]">L 1,780.00</span>
                </div>
              </div>

              {/* Clarification */}
              <p className="font-inter text-[10px] leading-[12px] text-[#637080]">
                Vista conceptual · Datos ilustrativos en lempiras
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: Planes y precios
          ========================================================================= */}
      <section id="precios" className="py-20 md:py-[96px] bg-[#f6f8f7]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 flex flex-col gap-11 md:gap-[44px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-[18px] max-w-[720px]">
              <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                PRECIOS CLAROS
              </span>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                Un plan para cada etapa.
              </h2>
              <p className="font-inter text-base sm:text-[17px] leading-relaxed text-[#637080]">
                Empiece con 60 días gratis en cualquiera de nuestros planes.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2.5">
              <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#dde5e2] shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-full font-inter font-semibold text-[13px] leading-[16px] transition-all cursor-pointer ${
                    !isAnnual
                      ? "bg-[#25426f] text-white shadow-xs"
                      : "text-[#637080] hover:text-[#25426f]"
                  }`}
                >
                  Pago mensual
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-inter font-semibold text-[13px] leading-[16px] transition-all cursor-pointer ${
                    isAnnual
                      ? "bg-[#eaf5ef] text-[#087e63] border border-[#b5d9c9] shadow-xs"
                      : "text-[#637080] hover:text-[#087e63]"
                  }`}
                >
                  {isAnnual && <CheckCircle className="w-3.5 h-3.5 text-[#087e63]" strokeWidth={2} />}
                  <span>Pago anual</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#a6e9cf] text-[#25426f]">
                    Ahorra 20%
                  </span>
                </button>
              </div>
              <span className="font-inter text-[11px] leading-[13px] text-[#637080]">
                Todos los precios en dólares estadounidenses
              </span>
            </div>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1: Básico */}
            <div className="bg-white rounded-[12px] border border-[#dde5e2] flex flex-col overflow-hidden shadow-xs hover:shadow-md transition">
              <div className="h-[5px] bg-white w-full" />
              <div className="p-7 sm:p-[29px] flex flex-col justify-between flex-1 gap-6">
                <div className="flex flex-col gap-[23px]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-manrope font-bold text-[24px] leading-[33px] text-[#25426f]">
                      Básico
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-manrope font-bold text-4xl sm:text-[53px] leading-[58px] text-[#101f36]">
                      ${isAnnual ? "8" : "10"}{" "}
                      <span className="text-xl sm:text-2xl font-normal text-[#637080]">USD/mes</span>
                    </div>
                    <span className="font-inter text-[13px] leading-[16px] text-[#637080]">
                      {isAnnual ? "Facturado $96 USD/año" : "Facturado mes a mes"}
                    </span>
                  </div>

                  <div className="h-px bg-[#dde5e2] w-full" />

                  <div className="flex items-center gap-2.5">
                    <Users className="w-[18px] h-[18px] text-[#087e63]" strokeWidth={1.6} />
                    <span className="font-inter font-semibold text-[14px] leading-[17px] text-[#25426f]">
                      1 usuario
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-col gap-4 font-inter text-[14px] leading-[20px] text-[#14253b]">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Facturación y cotizaciones</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Clientes y proveedores</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Plan de cuentas y Libro Diario</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Reportes básicos</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Soporte por correo</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <Link
                    href={`/signup?plan=basico&billing=${isAnnual ? "annual" : "monthly"}`}
                    className="w-full inline-flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-[#25426f] font-inter font-semibold text-[15px] leading-[18px] py-4 px-6 rounded-[6px] border border-[#dde5e2] transition shadow-xs group"
                  >
                    <span>Probar 60 días gratis</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="font-inter text-[11px] leading-[13px] text-[#637080]">
                    Sin tarjeta de crédito
                  </span>
                </div>
              </div>
            </div>

            {/* Plan 2: Profesional (Highlighted / Más popular) */}
            <div className="bg-white rounded-[12px] border-2 border-[#087e63] flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition relative">
              <div className="h-[5px] bg-[#087e63] w-full" />
              <div className="p-7 sm:p-[29px] flex flex-col justify-between flex-1 gap-6">
                <div className="flex flex-col gap-[23px]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-manrope font-bold text-[24px] leading-[33px] text-[#25426f]">
                      Profesional
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-[#eaf5ef] font-inter font-semibold text-[10px] leading-[12px] text-[#087e63]">
                      Más popular
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-manrope font-bold text-4xl sm:text-[53px] leading-[58px] text-[#101f36]">
                      ${isAnnual ? "24" : "29"}{" "}
                      <span className="text-xl sm:text-2xl font-normal text-[#637080]">USD/mes</span>
                    </div>
                    <span className="font-inter text-[13px] leading-[16px] text-[#637080]">
                      {isAnnual ? "Facturado $288 USD/año" : "Facturado mes a mes"}
                    </span>
                  </div>

                  <div className="h-px bg-[#dde5e2] w-full" />

                  <div className="flex items-center gap-2.5">
                    <Users className="w-[18px] h-[18px] text-[#087e63]" strokeWidth={1.6} />
                    <span className="font-inter font-semibold text-[14px] leading-[17px] text-[#25426f]">
                      Hasta 5 usuarios
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-col gap-4 font-inter text-[14px] leading-[20px] text-[#14253b]">
                    <div className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Todo lo incluido en Básico</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Punto de venta (POS)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Pedidos de venta y despachos</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Inventario y órdenes de compra</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Bancos y conciliación</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <Link
                    href={`/signup?plan=profesional&billing=${isAnnual ? "annual" : "monthly"}`}
                    className="w-full inline-flex items-center justify-center gap-3.5 bg-[#087e63] hover:bg-[#076a53] text-white font-inter font-semibold text-[15px] leading-[18px] py-4 px-6 rounded-[6px] transition shadow-xs group"
                  >
                    <span>Probar 60 días gratis</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="font-inter text-[11px] leading-[13px] text-[#637080]">
                    Sin tarjeta de crédito
                  </span>
                </div>
              </div>
            </div>

            {/* Plan 3: Empresarial */}
            <div className="bg-white rounded-[12px] border border-[#dde5e2] flex flex-col overflow-hidden shadow-xs hover:shadow-md transition">
              <div className="h-[5px] bg-white w-full" />
              <div className="p-7 sm:p-[29px] flex flex-col justify-between flex-1 gap-6">
                <div className="flex flex-col gap-[23px]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-manrope font-bold text-[24px] leading-[33px] text-[#25426f]">
                      Empresarial
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-manrope font-bold text-4xl sm:text-[53px] leading-[58px] text-[#101f36]">
                      ${isAnnual ? "40" : "49"}{" "}
                      <span className="text-xl sm:text-2xl font-normal text-[#637080]">USD/mes</span>
                    </div>
                    <span className="font-inter text-[13px] leading-[16px] text-[#637080]">
                      {isAnnual ? "Facturado $480 USD/año" : "Facturado mes a mes"}
                    </span>
                  </div>

                  <div className="h-px bg-[#dde5e2] w-full" />

                  <div className="flex items-center gap-2.5">
                    <Users className="w-[18px] h-[18px] text-[#087e63]" strokeWidth={1.6} />
                    <span className="font-inter font-semibold text-[14px] leading-[17px] text-[#25426f]">
                      Usuarios ilimitados
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-col gap-4 font-inter text-[14px] leading-[20px] text-[#14253b]">
                    <div className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Todo lo incluido en Profesional</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Comisiones y vendedores</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Multi-divisa avanzada</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Notas de crédito y débito</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-[15px] h-[15px] text-[#087e63] flex-shrink-0" strokeWidth={2} />
                      <span>Soporte dedicado</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <Link
                    href={`/signup?plan=empresarial&billing=${isAnnual ? "annual" : "monthly"}`}
                    className="w-full inline-flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-[#25426f] font-inter font-semibold text-[15px] leading-[18px] py-4 px-6 rounded-[6px] border border-[#dde5e2] transition shadow-xs group"
                  >
                    <span>Probar 60 días gratis</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="font-inter text-[11px] leading-[13px] text-[#637080]">
                    Sin tarjeta de crédito
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Conditions */}
          <div className="flex items-center justify-center gap-3 pt-2 text-[#637080]">
            <Check className="w-[17px] h-[17px] text-[#087e63]" strokeWidth={2} />
            <span className="font-inter text-[13px] leading-[16px]">
              Sin instalación. Sin contratos. Cancele cuando quiera.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: Primeros pasos
          ========================================================================= */}
      <section className="py-20 md:py-[88px] bg-white border-y border-[#dde5e2]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Left Header */}
            <div className="lg:col-span-5 flex flex-col gap-[18px]">
              <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                UN COMIENZO SENCILLO
              </span>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                Configure su empresa en menos de 2 minutos.
              </h2>
            </div>

            {/* Right Steps */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8">
              {/* Step 1 */}
              <div className="flex flex-col gap-[18px]">
                <span className="font-manrope text-[45px] leading-[61px] text-[#709b88]">
                  01
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#25426f]">
                    Cree su cuenta
                  </h3>
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                    Active su prueba gratuita de 60 días. No necesita tarjeta de crédito.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-[18px]">
                <span className="font-manrope text-[45px] leading-[61px] text-[#709b88]">
                  02
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#25426f]">
                    Configure su empresa
                  </h3>
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                    Empiece con el plan de cuentas hondureño ya precargado.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-[18px]">
                <span className="font-manrope text-[45px] leading-[61px] text-[#709b88]">
                  03
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-manrope font-bold text-[20px] leading-[27px] text-[#25426f]">
                    Empiece a trabajar
                  </h3>
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080]">
                    Facture y administre en línea, sin instalar ningún programa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: Preguntas frecuentes
          ========================================================================= */}
      <section className="py-20 md:py-[88px] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-[120px] items-start">
            {/* Left Header */}
            <div className="lg:col-span-4 flex flex-col gap-[18px]">
              <span className="font-inter font-semibold text-[12px] leading-[15px] tracking-wider text-[#087e63] uppercase">
                ANTES DE EMPEZAR
              </span>
              <h2 className="font-manrope font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[50px] text-[#25426f]">
                Sus preguntas, en claro.
              </h2>
              <p className="font-inter text-base sm:text-[17px] leading-relaxed text-[#637080]">
                Lo esencial para dar el primer paso con tranquilidad.
              </p>
            </div>

            {/* Right FAQs */}
            <div className="lg:col-span-8 flex flex-col divide-y divide-[#dde5e2] border-y border-[#dde5e2]">
              {/* FAQ 1 */}
              <div className="py-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(0)}
                  className="flex items-center justify-between text-left group w-full gap-4"
                >
                  <h3 className="font-manrope font-bold text-lg sm:text-[18px] leading-[25px] text-[#25426f] group-hover:text-[#087e63] transition">
                    ¿Necesito una tarjeta para probar Prado ERP?
                  </h3>
                  <div className="text-[#087e63] p-1 flex-shrink-0">
                    {openFaq.includes(0) ? (
                      <Minus className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>
                </button>
                {openFaq.includes(0) && (
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080] pr-6">
                    No. Puede probar Prado ERP durante 60 días sin tarjeta de crédito. No hay contratos y puede cancelar cuando quiera.
                  </p>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="py-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(1)}
                  className="flex items-center justify-between text-left group w-full gap-4"
                >
                  <h3 className="font-manrope font-bold text-lg sm:text-[18px] leading-[25px] text-[#25426f] group-hover:text-[#087e63] transition">
                    ¿Tengo que instalar algún programa?
                  </h3>
                  <div className="text-[#087e63] p-1 flex-shrink-0">
                    {openFaq.includes(1) ? (
                      <Minus className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>
                </button>
                {openFaq.includes(1) && (
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080] pr-6">
                    No. Prado ERP es una plataforma en la nube: puede facturar y administrar su empresa en línea, sin instalación.
                  </p>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="py-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(2)}
                  className="flex items-center justify-between text-left group w-full gap-4"
                >
                  <h3 className="font-manrope font-bold text-lg sm:text-[18px] leading-[25px] text-[#25426f] group-hover:text-[#087e63] transition">
                    ¿Está pensado para empresas en Honduras?
                  </h3>
                  <div className="text-[#087e63] p-1 flex-shrink-0">
                    {openFaq.includes(2) ? (
                      <Minus className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>
                </button>
                {openFaq.includes(2) && (
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080] pr-6">
                    Sí. Incluye numeración CAI autorizada por el SAR, cálculo de ISV, plan de cuentas hondureño y retenciones del SAR, según las funciones de su plan.
                  </p>
                )}
              </div>

              {/* FAQ 4 */}
              <div className="py-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(3)}
                  className="flex items-center justify-between text-left group w-full gap-4"
                >
                  <h3 className="font-manrope font-bold text-lg sm:text-[18px] leading-[25px] text-[#25426f] group-hover:text-[#087e63] transition">
                    ¿Cómo se facturan los planes que aparecen aquí?
                  </h3>
                  <div className="text-[#087e63] p-1 flex-shrink-0">
                    {openFaq.includes(3) ? (
                      <Minus className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>
                </button>
                {openFaq.includes(3) && (
                  <p className="font-inter text-[14px] leading-[24px] text-[#637080] pr-6">
                    Los precios mostrados son equivalentes mensuales con facturación anual: Básico, $96 USD/año; Profesional, $288 USD/año; Empresarial, $480 USD/año.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: Conversión final y Pie de página
          ========================================================================= */}
      {/* Final Callout (Invitación final) */}
      <section className="bg-[#eaf5ef] py-16 md:py-[72px]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex flex-col gap-[18px] max-w-[740px]">
              <span className="font-inter font-semibold text-[11px] leading-[13px] tracking-wider text-[#087e63] uppercase">
                SU PRÓXIMO PASO EMPIEZA AQUÍ
              </span>
              <h2 className="font-manrope font-bold text-4xl sm:text-5xl lg:text-[49px] leading-tight lg:leading-[55px] text-[#25426f]">
                Empiece a facturar
                <br />
                hoy mismo.
              </h2>
              <p className="font-inter text-base sm:text-[16px] leading-[26px] text-[#637080]">
                60 días para conocer una forma más simple de administrar su empresa.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-3.5 bg-[#087e63] hover:bg-[#076a53] text-white font-inter font-semibold text-[15px] leading-[18px] px-7 py-4 rounded-[6px] transition shadow-xs group"
              >
                <span>Crear cuenta gratis</span>
                <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="font-inter text-[12px] leading-[15px] text-[#637080]">
                Sin tarjeta. Sin instalación. Sin contratos.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
