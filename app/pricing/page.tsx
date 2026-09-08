"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

interface MeUser {
  companyId: string;
  email: string;
}

export default function PricingPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setExpired(params.get("expired") === "1");

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setMe({ companyId: data.user.companyId, email: data.user.email });
        }
      })
      .catch(() => {});
  }, []);

  const buildCheckoutUrl = (paymentLink: string) => {
    if (!paymentLink) return "";
    const url = new URL(paymentLink);
    if (me) {
      // client_reference_id vincula el pago con la empresa en el webhook
      url.searchParams.set("client_reference_id", me.companyId);
      url.searchParams.set("prefilled_email", me.email);
    }
    return url.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {expired && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center shadow-xs">
            <p className="font-bold">Su período de prueba de {TRIAL_DAYS} días ha finalizado.</p>
            <p className="text-xs mt-1">
              Para continuar usando Prado ERP, suscríbase a uno de los planes a continuación. Después de completar el
              pago, vuelva a iniciar sesión.
            </p>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Planes y Precios</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Todos los planes incluyen <span className="font-semibold text-slate-700">{TRIAL_DAYS} días de prueba gratis</span>.
            No se requiere tarjeta de crédito para comenzar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const checkoutUrl = buildCheckoutUrl(plan.paymentLink);
            return (
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

                <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="text-lg font-bold text-slate-400 line-through">${plan.originalPrice}</span>
                  )}
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-xs text-slate-500 font-medium">USD / mes</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {TRIAL_DAYS} días gratis — sin tarjeta de crédito
                </p>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2">
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      className={`block text-center px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        plan.highlighted
                          ? "bg-[#1b426e] hover:bg-[#143355] text-white"
                          : "bg-white border border-[#1b426e] text-[#1b426e] hover:bg-slate-50"
                      }`}
                    >
                      Suscribirse a {plan.name}
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                      title="Enlace de pago próximamente"
                    >
                      Suscripción disponible pronto
                    </button>
                  )}
                  {!me && (
                    <Link
                      href="/signup"
                      className="block text-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                      Comenzar prueba gratis →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-10">
          Los pagos se procesan de forma segura a través de Stripe. Puede cancelar su suscripción en cualquier momento.
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}
