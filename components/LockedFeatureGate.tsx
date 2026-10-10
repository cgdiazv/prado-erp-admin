"use client";

import React from "react";
import { Lock, Sparkles, Check, ArrowLeft, ArrowUpRight } from "lucide-react";
import { PLANS, PlanTier, getPlan, getPlanDisplayName } from "@/lib/plans";

interface LockedFeatureGateProps {
  requiredPlan: PlanTier;
  featureName: string;
  currentPlan?: string | null;
  onUpgrade: () => void;
  onBack: () => void;
}

export default function LockedFeatureGate({
  requiredPlan,
  featureName,
  currentPlan,
  onUpgrade,
  onBack,
}: LockedFeatureGateProps) {
  const targetPlan = getPlan(requiredPlan);
  const currentPlanName = getPlanDisplayName(currentPlan);
  const targetPlanName = targetPlan?.name || (requiredPlan === "empresarial" ? "Empresarial" : "Profesional");

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 sm:p-10 bg-white border border-slate-200/90 rounded-3xl shadow-xl text-slate-900 animate-in fade-in duration-200">
      <div className="flex flex-col items-center text-center">
        {/* Icon & Badge */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#1b426e] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/70 mb-3">
          Requiere Plan {targetPlanName}
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Desbloquee {featureName}
        </h2>

        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
          Su empresa actualmente opera bajo el <span className="font-semibold text-slate-800">Plan {currentPlanName}</span>.
          El módulo de <span className="font-semibold text-slate-900">{featureName}</span> está disponible a partir del{" "}
          <span className="font-bold text-[#1b426e]">Plan {targetPlanName}</span>.
        </p>

        {/* Plan Feature Highlights */}
        {targetPlan && (
          <div className="mt-7 w-full max-w-md bg-slate-50 border border-slate-200/70 rounded-2xl p-5 text-left">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-3">
              Lo que incluye el Plan {targetPlan.name}:
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              {targetPlan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Inversión mensual</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">${targetPlan.price}</span>
                <span className="text-[11px] text-slate-500 font-medium">USD / mes</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={onUpgrade}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Actualizar a Plan {targetPlanName}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
