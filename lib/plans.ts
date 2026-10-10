// Configuración de los planes de suscripción.
// Pega aquí los Payment Links de Stripe cuando los tengas (paymentLink).
export interface Plan {
  id: string;
  name: string;
  price: number; // USD / mes
  annualPrice: number; // USD / mes (facturado anualmente)
  annualPaymentLink?: string;
  originalPrice?: number; // Precio regular cuando hay promoción
  description: string;
  features: string[];
  highlighted?: boolean;
  paymentLink: string; // Stripe Payment Link (Mensual)
  maxUsers: number | null; // null = ilimitados
}

export const TRIAL_DAYS = 60;

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 10,
    annualPrice: 8, // $8/mes = $96/año
    originalPrice: 29,
    description: "Para profesionales independientes y empresas de servicios que no requieren control de bodegas.",
    features: [
      "1 usuario",
      "Facturación y cotizaciones",
      "Clientes y proveedores",
      "Plan de cuentas y Libro Diario",
      "Reportes básicos",
      "Soporte por correo",
    ],
    paymentLink: "https://pay.delvalletradings.com/b/bJe14mfWL5A0cTc0Qd4Ni0a",
    annualPaymentLink: "https://pay.delvalletradings.com/b/fZufZg11RbYo1au1Uh4Ni0d",
    maxUsers: 1,
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 29,
    annualPrice: 24, // $24/mes = $288/año
    originalPrice: 79,
    description: "Para comercios, retail y empresas que gestionan inventario, mostrador (POS) y compras.",
    features: [
      "Hasta 5 usuarios",
      "Todo lo del plan Básico",
      "Punto de Venta (POS)",
      "Pedidos de venta y despachos",
      "Inventario y órdenes de compra",
      "Bancos y conciliación bancaria",
      "Caja chica y retenciones",
      "Reportes avanzados",
      "Soporte prioritario",
    ],
    highlighted: true,
    paymentLink: "https://pay.delvalletradings.com/b/fZucN49yn2nO9H042p4Ni0b",
    annualPaymentLink: "https://pay.delvalletradings.com/b/aFa14m7qfe6wf1kdCZ4Ni0e",
    maxUsers: 5,
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: 49,
    annualPrice: 40, // $40/mes = $480/año
    originalPrice: 179,
    description: "Para empresas con múltiples vendedores, multi-divisa y alto volumen transaccional.",
    features: [
      "Usuarios ilimitados",
      "Todo lo del plan Profesional",
      "Comisiones y vendedores",
      "Multi-divisa avanzada",
      "Notas de crédito/débito",
      "Soporte dedicado",
    ],
    paymentLink: "https://pay.delvalletradings.com/b/cNiaEW5i75A0dXg56t4Ni0c",
    annualPaymentLink: "https://pay.delvalletradings.com/b/bJecN4fWL8Mc8CW56t4Ni0f",
    maxUsers: null,
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  if (!id) return undefined;
  const normalized = id.toLowerCase();
  return PLANS.find((p) => p.id === normalized || (p.id === "empresarial" && normalized === "enterprise"));
}

/**
 * Límite de usuarios según el plan. Durante la prueba se otorga el nivel Profesional (5).
 * null = usuarios ilimitados.
 */
export function getUserLimit(planId: string | null | undefined, subscriptionStatus?: string | null): number | null {
  const plan = getPlan(planId);
  if (plan) return plan.maxUsers;
  if (subscriptionStatus === "TRIAL") return 5;
  return 1;
}

export type PlanTier = "basico" | "profesional" | "empresarial";

export type FeatureKey =
  | "pos"                // Punto de Venta (POS)
  | "sales_orders"       // Pedidos de venta y despachos
  | "inventory"          // Catálogo de existencias, lotes, series
  | "purchase_orders"    // Órdenes de compra, facturas de compra, devoluciones, pagos prov.
  | "banking"            // Bancos, transacciones, depósitos, conciliación bancaria
  | "caja_chica"         // Caja chica y arqueos
  | "retentions"         // Retenciones SAR / ISV
  | "advanced_reports"   // Antigüedad de saldos clientes/proveedores, estado de cuenta
  | "commissions"        // Vendedores y comisiones
  | "credit_debit_notes" // Notas de crédito y débito
  | "multi_currency";    // Multi-divisa avanzada

export const FEATURE_MIN_PLAN: Record<FeatureKey, PlanTier> = {
  pos: "profesional",
  sales_orders: "profesional",
  inventory: "profesional",
  purchase_orders: "profesional",
  banking: "profesional",
  caja_chica: "profesional",
  retentions: "profesional",
  advanced_reports: "profesional",
  commissions: "empresarial",
  credit_debit_notes: "empresarial",
  multi_currency: "empresarial",
};

export const FEATURE_TITLES: Record<FeatureKey, string> = {
  pos: "Punto de Venta (POS)",
  sales_orders: "Pedidos de Venta y Despachos",
  inventory: "Inventario y Control de Stock",
  purchase_orders: "Órdenes de Compra y Facturas de Proveedores",
  banking: "Bancos y Conciliación Bancaria",
  caja_chica: "Caja Chica y Arqueos",
  retentions: "Retenciones de Impuestos ISV / SAR",
  advanced_reports: "Reportes Avanzados de Antigüedad",
  commissions: "Vendedores y Comisiones",
  credit_debit_notes: "Notas de Crédito y Débito",
  multi_currency: "Multi-divisa Avanzada",
};

/**
 * Determina si una empresa tiene acceso a una funcionalidad específica.
 * Durante el período de prueba (TRIAL) se otorga acceso a todas las funcionalidades.
 */
export function hasFeatureAccess(
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
  feature: FeatureKey
): boolean {
  if (subscriptionStatus === "TRIAL") return true;

  const normalized = (planId || "").toLowerCase();
  const planKey = normalized === "enterprise" ? "empresarial" : normalized;

  // Si no tiene plan o es básico
  const minTier = FEATURE_MIN_PLAN[feature];

  if (planKey === "empresarial") return true;

  if (planKey === "profesional") {
    return minTier === "profesional";
  }

  // Plan Básico sólo tiene acceso a lo que no requiera Profesional ni Empresarial
  return false;
}

/**
 * Retorna el plan mínimo requerido para un ítem de navegación del dashboard, o null si está en Básico.
 */
export function getRequiredPlanForNav(navItem: string): { tier: PlanTier; featureName: string; featureKey: FeatureKey } | null {
  switch (navItem) {
    case "pos":
      return { tier: "profesional", featureName: "Punto de Venta (POS)", featureKey: "pos" };

    case "pedidos-venta":
      return { tier: "profesional", featureName: "Pedidos de Venta y Despachos", featureKey: "sales_orders" };

    case "inventario":
    case "lotes":
    case "series":
      return { tier: "profesional", featureName: "Inventario y Control de Stock", featureKey: "inventory" };

    case "lista-ordenes-compra":
    case "orden-compra-editor":
    case "factura-compra-lista":
    case "factura-compra-editor":
    case "pagos-proveedores":
    case "pagar-proveedor":
    case "devoluciones-proveedor":
      return { tier: "profesional", featureName: "Órdenes de Compra y Gestión de Compras", featureKey: "purchase_orders" };

    case "transacciones":
    case "conciliacion-bancaria":
    case "deposito-bancario":
      return { tier: "profesional", featureName: "Bancos y Conciliación Bancaria", featureKey: "banking" };

    case "caja-chica":
    case "agregar-gasto":
      return { tier: "profesional", featureName: "Caja Chica y Arqueos", featureKey: "caja_chica" };

    case "retenciones-isv":
      return { tier: "profesional", featureName: "Retenciones ISV / SAR", featureKey: "retentions" };

    case "antiguedad-saldos":
    case "antiguedad-saldos-proveedores":
      return { tier: "profesional", featureName: "Reportes Avanzados de Antigüedad", featureKey: "advanced_reports" };

    case "vendedores":
    case "comisiones":
      return { tier: "empresarial", featureName: "Vendedores y Comisiones", featureKey: "commissions" };

    case "notas-credito-debito":
      return { tier: "empresarial", featureName: "Notas de Crédito y Débito", featureKey: "credit_debit_notes" };

    default:
      return null;
  }
}

/**
 * Determina si un usuario puede navegar a una vista específica del dashboard.
 */
export function canAccessNav(
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
  navItem: string
): boolean {
  const req = getRequiredPlanForNav(navItem);
  if (!req) return true; // Pertenece a Básico
  return hasFeatureAccess(planId, subscriptionStatus, req.featureKey);
}

export function getPlanDisplayName(planId: string | null | undefined): string {
  const p = getPlan(planId);
  if (p) return p.name;
  return "Básico";
}
