// Configuración de los planes de suscripción.
// Pega aquí los Payment Links de Stripe cuando los tengas (paymentLink).
export interface Plan {
  id: string;
  name: string;
  price: number; // USD / mes
  description: string;
  features: string[];
  highlighted?: boolean;
  paymentLink: string; // Stripe Payment Link
}

export const TRIAL_DAYS = 30;

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 29,
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
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 79,
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
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: 149,
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
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
