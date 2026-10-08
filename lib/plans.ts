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
    description: "Para emprendedores y negocios pequeños que inician su operación.",
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
    description: "Para operaciones con múltiples áreas y alto volumen transaccional.",
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
