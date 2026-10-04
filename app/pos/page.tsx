"use client";

import React, { useEffect, useState } from "react";
import POSModule from "@/components/pos/POSModule";
import { InventoryItem, Customer, SalesRep, CompanySettings } from "@/types/dashboard";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function POSPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [invRes, custRes, repRes, compRes] = await Promise.all([
        fetch("/api/inventory").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/customers").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/sales-reps").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/company").then((r) => r.json()).catch(() => ({ data: null })),
      ]);

      if (invRes && invRes.data) {
        setInventory(
          invRes.data.map((item: any) => ({
            ...item,
            cost: Number(item.cost || 0),
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
          }))
        );
      }

      if (custRes && custRes.data) {
        setCustomers(custRes.data);
      }

      if (repRes && repRes.data) {
        setSalesReps(repRes.data);
      }

      if (compRes && compRes.data) {
        setCompanySettings(compRes.data);
      }
    } catch (err) {
      console.error("Error loading POS initial data:", err);
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

  return (
    <div className="min-h-screen bg-slate-900 p-2 sm:p-4 flex flex-col justify-center">
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
