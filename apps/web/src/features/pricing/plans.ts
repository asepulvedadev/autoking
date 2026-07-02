export type PlanFeature = { text: string; strong?: boolean };

export type Plan = {
  level: 1 | 2 | 3;
  name: string;
  title: string;
  price: string;
  featured?: boolean;
  cta: string;
  features: PlanFeature[];
};

export const PLANS: Plan[] = [
  {
    level: 1,
    name: "Básico",
    title: "Recepción",
    price: "$90",
    cta: "Empezar con Recepción",
    features: [
      { text: "Atención 24/7 por WhatsApp", strong: true },
      { text: "Responde info de tu negocio (precios, horarios, ubicación)" },
      { text: "Deriva a una persona cuando hace falta" },
      { text: "Entrenado con tu estilo y tono" },
    ],
  },
  {
    level: 2,
    name: "Pro",
    title: "Agenda",
    price: "$150",
    featured: true,
    cta: "Quiero el plan Agenda",
    features: [
      { text: "Todo lo del plan Recepción", strong: true },
      { text: "Agendamiento conectado a tu calendario" },
      { text: "Recordatorios automáticos de citas" },
      { text: "Registro y base de datos de clientes" },
      { text: "Panel de métricas", strong: true },
    ],
  },
  {
    level: 3,
    name: "Imperio",
    title: "Ventas",
    price: "$250",
    cta: "Construir mi Imperio",
    features: [
      { text: "Todo lo del plan Agenda", strong: true },
      { text: "Calificación inteligente de prospectos" },
      { text: "Recomendación de servicios (más venta)" },
      { text: "Multicanal (WhatsApp, Instagram y más)" },
      { text: "Reportes mensuales de resultados", strong: true },
    ],
  },
];
