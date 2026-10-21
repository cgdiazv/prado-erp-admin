"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

type Invoice = {
  date: string;
  total: number;
  status: string;
};

type Props = {
  invoices: Invoice[];
  formatCurrency: (amount: number) => string;
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function DashboardMonthlySalesChart({ invoices, formatCurrency }: Props) {
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    revenue: 0,
    invoiceCount: 0,
  }));

  invoices.forEach((invoice) => {
    const [invoiceYear, invoiceMonth] = invoice.date.split("-").map(Number);
    const status = invoice.status.trim().toLocaleLowerCase();
    if (
      invoiceYear !== year ||
      !invoiceMonth ||
      invoiceMonth > 12 ||
      status.includes("anulad") ||
      status.includes("borrador")
    ) {
      return;
    }

    const month = monthlyData[invoiceMonth - 1];
    month.revenue += Number(invoice.total) || 0;
    month.invoiceCount += 1;
  });

  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalInvoices = monthlyData.reduce((sum, month) => sum + month.invoiceCount, 0);
  const maxRevenue = Math.max(...monthlyData.map((month) => month.revenue), 0);
  const ceiling = maxRevenue > 0 ? maxRevenue * 1.15 : 1000;
  const yTicks = [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0];

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b426e]/20 bg-[#1b426e]/5 px-2.5 py-0.5 text-xs font-semibold text-[#1b426e]">
              <Calendar className="h-3 w-3" />
              YTD {year}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="truncate text-xs font-medium text-slate-500">
              {totalInvoices} {totalInvoices === 1 ? "factura" : "facturas"}
            </span>
          </div>
          <h2 className="mt-1.5 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Ventas Mensuales (YTD)
          </h2>
          <p className="text-xs text-slate-500">Evolución mensual de ventas facturadas durante {year}.</p>
        </div>
        <div className="self-start rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 sm:px-4 sm:py-2.5 sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            Total Facturado YTD
          </p>
          <p className="text-lg font-bold tracking-tight text-[#1b426e] sm:text-xl">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-5 w-full min-w-0 sm:mt-6">
        <div className="relative flex w-full min-w-0">
          <div className="hidden h-60 w-20 shrink-0 flex-col justify-between pr-3 text-right text-[10px] font-medium text-slate-400 sm:flex">
            {yTicks.map((tick, index) => (
              <span key={index} className="leading-none">{formatCurrency(tick)}</span>
            ))}
          </div>

          <div className="relative h-60 w-full min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {yTicks.map((_, index) => (
                <div
                  key={index}
                  className={`w-full border-b ${index === yTicks.length - 1 ? "border-slate-300" : "border-slate-100"}`}
                />
              ))}
            </div>

            <div className="relative flex h-full w-full items-end justify-between gap-1 px-0.5 sm:justify-around sm:gap-2 sm:px-2">
              {monthlyData.map((month) => {
                const isHovered = hoveredMonth === month.monthIndex;
                const isCurrent = month.monthIndex === currentMonth;
                const height = month.revenue > 0
                  ? `max(6px, ${(month.revenue / ceiling * 100).toFixed(1)}%)`
                  : "2px";
                const tooltipPosition = month.monthIndex < 2
                  ? "left-0"
                  : month.monthIndex > 9
                  ? "right-0"
                  : "left-1/2 -translate-x-1/2";

                return (
                  <button
                    key={month.monthIndex}
                    type="button"
                    aria-label={`${MONTHS_FULL[month.monthIndex]}: ${formatCurrency(month.revenue)}, ${month.invoiceCount} facturas`}
                    onClick={() => setHoveredMonth((previous) => previous === month.monthIndex ? null : month.monthIndex)}
                    onMouseEnter={() => setHoveredMonth(month.monthIndex)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="group relative flex h-full min-w-0 max-w-10 flex-1 cursor-pointer flex-col items-center justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b426e]"
                  >
                    {isHovered && (
                      <span className={`absolute bottom-[calc(100%+8px)] z-10 rounded-lg bg-slate-900 px-3 py-1.5 text-center text-white shadow-xl ${tooltipPosition}`}>
                        <span className="block whitespace-nowrap text-[10px] font-semibold text-blue-200">
                          {MONTHS_FULL[month.monthIndex]} {year}
                        </span>
                        <span className="block whitespace-nowrap text-xs font-bold">
                          {formatCurrency(month.revenue)}
                        </span>
                        <span className="block whitespace-nowrap text-[10px] text-slate-300">
                          {month.invoiceCount} {month.invoiceCount === 1 ? "factura" : "facturas"}
                        </span>
                      </span>
                    )}

                    <span
                      style={{ height }}
                      className={`w-full min-w-1 max-w-4 bg-[#1b426e] transition-colors duration-200 sm:max-w-7 ${
                        month.revenue === 0
                          ? "bg-slate-200"
                          : isHovered
                          ? "bg-blue-500"
                          : "bg-[#1b426e]"
                      } ${isCurrent ? "ring-2 ring-blue-300 ring-offset-1" : ""}`}
                    />
                    <span className={`mt-2 w-full truncate text-center text-[10px] font-semibold sm:text-xs ${
                      isCurrent ? "font-bold text-[#1b426e]" : isHovered ? "text-slate-900" : "text-slate-500"
                    }`}>
                      {MONTHS[month.monthIndex]}
                    </span>
                    {isCurrent && <span className="hidden text-[9px] font-medium uppercase text-blue-600 sm:block">Actual</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 bg-[#1b426e]" />
              Ventas realizadas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 bg-slate-200" />
              Sin ventas
            </span>
          </div>
          <span className="text-[11px] text-slate-400 sm:hidden">
            Máx: <span className="font-semibold text-slate-600">{formatCurrency(ceiling)}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
