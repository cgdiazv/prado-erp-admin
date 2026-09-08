// Configuración de los planes de suscripción.
// Pega aquí los Payment Links de Stripe cuando los tengas (paymentLink).
export interface Plan {
  id: string;
  name: string;
  price: number; // USD / mes
  originalPrice?: number; // Precio regular cuando hay promoción
  description: string;
  features: string[];
  highlighted?: boolean;
  paymentLink: string; // Stripe Payment Link
  maxUsers: number | null; // null = ilimitados
}

export const TRIAL_DAYS = 30;

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 10,
    originalPrice: 29,
    description: "Para emprendedores y negocios pequeños que inician su operación.",
    features: [
      "1 usuario",
      "Facturación y cotizaciones",
      "Clientes y proveedores",
      "Plan de cuentas y Libro Diario",
      "Reportes básicos",
      "Soporte por correo",
    ],
    paymentLink: "https://pay.delvalletradings.com/b/3cI3cuaCrfaAg5o1Uh4Ni07",
    maxUsers: 1,
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 29,
    originalPrice: 79,
    description: "Para empresas en crecimiento que necesitan control contable completo.",
    features: [
      "Hasta 5 usuarios",
      "Todo lo del plan Básico",
      "Inventario y órdenes de compra",
      "Bancos y conciliación bancaria",
      "Caja chica y retenciones",
      "Reportes avanzados",
      "Soporte prioritario",
    ],
    highlighted: true,
    paymentLink: "https://pay.delvalletradings.com/b/14A3cueSH5A09H08iF4Ni08",
    maxUsers: 5,
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: 49,
    originalPrice: 179,
    description: "Para operaciones con múltiples áreas y alto volumen transaccional.",
    features: [
      "Usuarios ilimitados",
      "Todo lo del plan Profesional",
      "Comisiones y vendedores",
      "Multi-divisa avanzada",
      "Notas de crédito/débito",
      "Soporte dedicado",
    ],
    paymentLink: "https://pay.delvalletradings.com/b/eVqcN4cKz6E4cTceH34Ni09",
    maxUsers: null,
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
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
