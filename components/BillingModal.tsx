"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, ShieldCheck, Check, X } from "lucide-react";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

interface BillingModalProps {
  userEmail?: string;
  companyId?: string;
  isExpiredOverride?: boolean;
  isOpenOverride?: boolean;
  onClose?: () => void;
}

export default function BillingModal({
  userEmail = "",
  companyId = "",
  isExpiredOverride = false,
  isOpenOverride = false,
  onClose,
}: BillingModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isExpiredParam =
    searchParams.get("expired") === "true" ||
    searchParams.get("expired") === "1" ||
    isExpiredOverride;
  const isBillingParam =
    searchParams.get("billing") === "true" ||
    searchParams.get("billing") === "1" ||
    isOpenOverride;

  const [isOpen, setIsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (isExpiredParam || isBillingParam || isOpenOverride) {
      setIsOpen(true);
    }
  }, [isExpiredParam, isBillingParam, isOpenOverride]);

  if (!isOpen && !isOpenOverride) return null;

  const buildPlanCheckoutUrl = (paymentLink: string) => {
    if (!paymentLink) return "";
    try {
      const url = new URL(paymentLink);
      if (companyId) url.searchParams.set("client_reference_id", companyId);
      if (userEmail) url.searchParams.set("prefilled_email", userEmail);
      return url.toString();
    } catch {
      const glue = paymentLink.includes("?") ? "&" : "?";
      return `${paymentLink}${glue}client_reference_id=${encodeURIComponent(companyId)}&prefilled_email=${encodeURIComponent(userEmail)}`;
    }
  };

  const handleClose = () => {
    if (!isExpiredParam) {
      setIsOpen(false);
      if (onClose) onClose();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("billing");
      params.delete("expired");
      const nextQuery = params.toString() ? `?${params.toString()}` : "";
      router.push(`/dashboard${nextQuery}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-2xl relative text-slate-900 font-sans">
        {/* Botón de cierre: sólo si la prueba NO está vencida */}
        {!isExpiredParam && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icono de estado */}
        <div
          className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
            isExpiredParam
              ? "bg-amber-50 border border-amber-200 text-amber-600"
              : "bg-emerald-50 border border-emerald-200 text-emerald-600"
          }`}
        >
          {isExpiredParam ? (
            <Lock className="w-7 h-7" />
          ) : (
            <ShieldCheck className="w-7 h-7" />
          )}
        </div>

        {/* Textos principales */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {isExpiredParam
              ? `Su período de prueba de ${TRIAL_DAYS} días ha finalizado`
              : "Seleccione su Plan de Suscripción"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {isExpiredParam
              ? "Para desbloquear y continuar operando sus módulos contables, facturación, compras, inventario y reportes, elija uno de los siguientes planes."
              : "Elija el plan operativo ideal para su empresa con acceso completo a todas las funcionalidades."}
          </p>
          <p className="text-[11px] text-slate-400">
            Los pagos se procesan de forma segura a través de Stripe por Del Valle Tradings LLC.
          </p>
        </div>

        {/* Checkbox de términos */}
        <label className="flex items-start gap-2.5 text-xs text-slate-700 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-600 cursor-pointer"
          />
          <span className="leading-snug">
            Acepto los{" "}
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1b426e] font-semibold underline hover:text-[#143355]"
            >
              Términos de Servicio
            </a>{" "}
            y la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1b426e] font-semibold underline hover:text-[#143355]"
            >
              Política de Privacidad
            </a>{" "}
            de Prado ERP.
          </span>
        </label>

        {/* Los 3 planes */}
        <div className="space-y-2.5 pt-1">
          {PLANS.map((plan) => {
            const checkoutUrl = buildPlanCheckoutUrl(plan.paymentLink);
            const isHighlighted = plan.highlighted;

            return (
              <a
                key={plan.id}
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!acceptedTerms}
                onClick={(e) => {
                  if (!acceptedTerms) e.preventDefault();
                }}
                className={`block w-full p-3.5 rounded-2xl transition border text-left relative ${
                  !acceptedTerms
                    ? "opacity-50 cursor-not-allowed pointer-events-none bg-slate-50 border-slate-200"
                    : isHighlighted
                    ? "bg-[#1b426e] hover:bg-[#143355] text-white border-[#1b426e] shadow-md hover:shadow-lg shadow-[#1b426e]/15 cursor-pointer"
                    : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isHighlighted ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Plan {plan.name}
                      </span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isHighlighted ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="flex items-baseline gap-1 justify-end">
                      {plan.originalPrice && (
                        <span
                          className={`text-xs line-through ${
                            isHighlighted ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span
                        className={`text-base font-black ${
                          isHighlighted ? "text-white" : "text-slate-900"
                        }`}
                      >
                        ${plan.price}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isHighlighted ? "text-white/80" : "text-slate-500"
                        }`}
                      >
                        /mes
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold block mt-0.5 ${
                        isHighlighted ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      Activar ahora →
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
