export type Faq = { q: string; a: string };

/** Fuente única de las FAQs — usada por el componente y por el JSON-LD (SEO). */
export const FAQS: Faq[] = [
  {
    q: "¿En cuánto tiempo está listo mi agente?",
    a: "En la mayoría de los casos, entre 3 y 7 días hábiles. Conectamos tu WhatsApp, entrenamos al agente con la info de tu negocio y lo dejamos atendiendo. Rápido y sin complicaciones.",
  },
  {
    q: "¿Funciona con mi WhatsApp actual?",
    a: "Sí. Usamos tu mismo número con WhatsApp Business. Tus clientes te siguen escribiendo al número de siempre, la diferencia es que ahora siempre hay alguien —bueno, algo— respondiendo al instante.",
  },
  {
    q: "¿Necesito conocimientos técnicos?",
    a: "Para nada. De la parte técnica nos encargamos nosotros 100%. Vos solo nos contás cómo funciona tu negocio y nosotros armamos, conectamos y entrenamos todo.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Claro. No hay contratos eternos ni letra chica. Es un servicio mensual y podés cancelar cuando quieras. Confiamos en que te vas a quedar por los resultados, no por obligación.",
  },
  {
    q: "¿El agente puede pasarme una conversación a mí?",
    a: "Sí. Cuando una consulta necesita atención humana o el cliente lo pide, el agente te deriva la conversación al instante. Vos tenés siempre el control y podés tomar el chat cuando quieras.",
  },
];
