"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Clock, ArrowRight } from "lucide-react";
import { getTrialDaysLeft, TRIAL_DAYS } from "@/lib/trialCheck";

interface TrialBannerProps {
  trialEndsAt?: string | Date | null;
  subscriptionStatus?: string | null;
  onUpgradeClick?: () => void;
}

export default function TrialBanner({
  trialEndsAt,
  subscriptionStatus,
  onUpgradeClick,
}: TrialBannerProps) {
  const router = useRouter();
  const pathname = usePathname();

  // If already active or not a trial, do not render
  const normalizedStatus = (subscriptionStatus || "").toUpperCase();
  if (normalizedStatus === "ACTIVE") return null;
  if (normalizedStatus !== "TRIAL") return null;
  if (!trialEndsAt) return null;

  const daysLeft = getTrialDaysLeft(trialEndsAt);

  // If expired, the BillingModal handles it
  if (daysLeft <= 0) return null;

  const handleOpenBilling = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
      return;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("billing", "true");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#1b426e] via-[#235894] to-[#2e72c0] text-white px-4 py-3 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white shrink-0 shadow-xs">
          <Clock className="w-5 h-5" />
        </span>
        <div>
          <p className="text-xs sm:text-sm font-bold tracking-tight">
            Prueba gratuita de {TRIAL_DAYS} días activa
          </p>
          <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
            {daysLeft === 1
              ? "Le queda 1 día de evaluación completa con todas las funciones habilitadas."
              : `Le quedan ${daysLeft} días de evaluación completa con todas las funciones habilitadas.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenBilling}
        className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#1b426e] text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs self-start sm:self-center cursor-pointer shrink-0"
      >
        <span>Elegir un plan</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
