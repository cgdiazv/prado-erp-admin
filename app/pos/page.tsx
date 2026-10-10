"use client";

import React, { useEffect, useState } from "react";
import POSModule from "@/components/pos/POSModule";
import { InventoryItem, Customer, SalesRep, CompanySettings } from "@/types/dashboard";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import LockedFeatureGate from "@/components/LockedFeatureGate";
import { canAccessNav } from "@/lib/plans";
import {
  getLocalInventory,
  getLocalCustomers,
  getLocalSalesReps,
  getLocalMeta,
} from "@/lib/offline-db";
import { offlineSync } from "@/lib/offline-sync";

export default function POSPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | undefined>(undefined);
  const [subInfo, setSubInfo] = useState<{ plan?: string; subscriptionStatus?: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // 1. Intentar cargar desde el servidor
      const [invRes, custRes, repRes, compRes, subRes] = await Promise.all([
        fetch("/api/inventory").then((r) => r.json()).catch(() => null),
        fetch("/api/customers").then((r) => r.json()).catch(() => null),
        fetch("/api/sales-reps").then((r) => r.json()).catch(() => null),
        fetch("/api/company").then((r) => r.json()).catch(() => null),
        fetch("/api/billing/subscription").then((r) => r.json()).catch(() => null),
      ]);

      let finalInventory = null;
      let finalCustomers = null;
      let finalSalesReps = null;
      let finalCompanySettings = null;
      let finalSubInfo = null;

      if (invRes && invRes.data) {
        finalInventory = invRes.data.map((item: any) => ({
          ...item,
          cost: Number(item.cost || 0),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
        }));
      }

      if (custRes && custRes.data) {
        finalCustomers = custRes.data;
      }

      if (repRes && repRes.data) {
        finalSalesReps = repRes.data;
      }

      if (compRes && compRes.data) {
        finalCompanySettings = compRes.data;
      }

      if (subRes && subRes.success) {
        finalSubInfo = subRes.data;
      }

      // 2. Si no hay internet o falló alguna petición, cargar respaldo desde IndexedDB local
      if (!finalInventory || finalInventory.length === 0) {
        const localInv = await getLocalInventory();
        if (localInv && localInv.length > 0) {
          finalInventory = localInv;
        }
      }

      if (!finalCustomers || finalCustomers.length === 0) {
        const localCust = await getLocalCustomers();
        if (localCust && localCust.length > 0) {
          finalCustomers = localCust;
        }
      }

      if (!finalSalesReps || finalSalesReps.length === 0) {
        const localReps = await getLocalSalesReps();
        if (localReps && localReps.length > 0) {
          finalSalesReps = localReps;
        }
      }

      if (!finalCompanySettings) {
        const localComp = await getLocalMeta("companySettings");
        if (localComp) {
          finalCompanySettings = localComp;
        }
      }

      if (!finalSubInfo) {
        const localSub = await getLocalMeta("subInfo");
        if (localSub) {
          finalSubInfo = localSub;
        }
      }

      // Validar acceso por suscripción (permite si la sesión previa en caché era válida)
      if (finalSubInfo) {
        setSubInfo(finalSubInfo);
        const allowed = canAccessNav(finalSubInfo?.plan, finalSubInfo?.subscriptionStatus, "pos");
        if (!allowed) {
          setIsLocked(true);
          setLoading(false);
          return;
        }
      }

      if (finalInventory) setInventory(finalInventory);
      if (finalCustomers) setCustomers(finalCustomers);
      if (finalSalesReps) setSalesReps(finalSalesReps);
      if (finalCompanySettings) setCompanySettings(finalCompanySettings);

      // 3. Guardar en caché local para futuros arranques sin internet
      await offlineSync.cacheCatalogs({
        inventory: finalInventory || [],
        customers: finalCustomers || [],
        salesReps: finalSalesReps || [],
        companySettings: finalCompanySettings || undefined,
        subInfo: finalSubInfo || undefined,
      });
    } catch (err) {
      console.error("Error loading POS data:", err);
      // Fallback de emergencia a IndexedDB
      try {
        const [localInv, localCust, localReps, localComp] = await Promise.all([
          getLocalInventory(),
          getLocalCustomers(),
          getLocalSalesReps(),
          getLocalMeta("companySettings"),
        ]);
        if (localInv && localInv.length > 0) setInventory(localInv);
        if (localCust && localCust.length > 0) setCustomers(localCust);
        if (localReps && localReps.length > 0) setSalesReps(localReps);
        if (localComp) setCompanySettings(localComp);
      } catch (dbErr) {
        console.error("IndexedDB fallback error:", dbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
        <h2 className="font-bold text-lg">Iniciando Terminal Punto de Venta...</h2>
        <p className="text-xs text-slate-400 mt-1">Cargando catálogo de inventario y configuración de caja</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <LockedFeatureGate
          requiredPlan="profesional"
          featureName="Punto de Venta (POS)"
          currentPlan={subInfo?.plan}
          onUpgrade={() => router.push("/dashboard")}
          onBack={() => router.push("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-slate-900 overflow-hidden select-none overscroll-none flex flex-col justify-center">
      <POSModule
        inventory={inventory}
        setInventory={setInventory}
        customers={customers}
        salesReps={salesReps}
        companySettings={companySettings}
        onRefreshData={loadData}
        onNavigateBack={() => router.push("/dashboard")}
        isStandalone={true}
      />
    </div>
  );
}
