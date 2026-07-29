# AutoKing — Precios, planes y estructura de costos

> Documento comercial y financiero. Última actualización: 2026-07-22.
> **Precios de venta**: reales, sincronizados con [ARGUMENTARIO-VENTA.md](./ARGUMENTARIO-VENTA.md) (fuente canónica) y con la DB (`plan_precios`).
> **Costos internos**: los de infraestructura son reales; los de OpenAI API están marcados como **ESTIMADOS (a validar con uso real)**.

---

## 1. Los 3 planes

| Plan | Título comercial | Para quién | Mensajes/mes | Destacado |
|---|---|---|---|---|
| **Básico** | Recepción | Que el negocio nunca deje un mensaje sin responder, día y noche | 3.000 | — |
| **Pro** | Agenda | El más elegido: atiende + agenda citas solo + recordatorios | 10.000 | ⭐ |
| **Imperio** | Ventas | Escalar: califica prospectos, recomienda servicios, vende multicanal | 30.000 | — |

---

## 2. Precios de venta por mercado

> **Plan anual = 10 meses** (pagando anual te ahorrás 2 meses).
> Precios estratégicos por mercado (no derivados de un tipo de cambio): USA está más alto a propósito.

### 🇨🇴 Colombia (COP)

| Plan | Instalación (única vez) | Mensual | Anual |
|---|---|---|---|
| Básico | $850.000 | $390.000 | $3.900.000 |
| **Pro** ⭐ | $1.400.000 | $690.000 | $6.900.000 |
| Imperio | $2.300.000 | $1.190.000 | $11.900.000 |

### 🇲🇽 México (MXN)

| Plan | Instalación (única vez) | Mensual | Anual |
|---|---|---|---|
| Básico | $4.500 | $2.100 | $21.000 |
| **Pro** ⭐ | $7.500 | $3.700 | $37.000 |
| Imperio | $12.500 | $6.400 | $64.000 |

### 🇺🇸 USA (USD)

| Plan | Instalación (única vez) | Mensual | Anual |
|---|---|---|---|
| Básico | $490 | $199 | $1.990 |
| **Pro** ⭐ | $890 | $379 | $3.790 |
| Imperio | $1.490 | $649 | $6.490 |

---

## 3. Qué incluye cada plan (features)

### Básico — "Recepción"
- ✅ Agente de IA que atiende tu WhatsApp **24/7**
- Responde precios, horarios, ubicación y preguntas frecuentes
- Entiende **fotos y notas de voz** que te manden
- Deriva a una persona cuando hace falta
- Entrenado con tu negocio, tu estilo y tono
- Hasta **3.000 mensajes/mes**
- Soporte por email

### Pro — "Agenda" ⭐ (el más elegido)
- ✅ **Todo lo del Básico**
- **Agenda citas solo**, conectado a tu calendario
- Recordatorios automáticos de citas
- Registro y base de datos de tus clientes
- ✅ **Panel de métricas** (mensajes, citas, conversiones)
- Hasta **10.000 mensajes/mes**
- Soporte prioritario

### Imperio — "Ventas"
- ✅ **Todo lo del Pro**
- **Califica prospectos**: te llegan los que están listos para comprar
- Recomienda servicios para vender más
- **Multicanal**: WhatsApp + Instagram
- ✅ **Reportes mensuales** de resultados
- Hasta **30.000 mensajes/mes** (no ilimitado)
- Soporte prioritario + asesoría de optimización

---

## 4. Qué incluye la instalación (única vez)

| Plan | La instalación incluye |
|---|---|
| **Básico** | Configuración completa del agente + conexión de tu WhatsApp actual (no cambiás de número) + entrenamiento con tu negocio (servicios, precios, horarios) + puesta en marcha y pruebas en vivo. |
| **Pro** | Todo lo del Básico + conexión de tu calendario para agendamiento automático + configuración de recordatorios de citas. |
| **Imperio** | Todo lo del Pro + configuración multicanal (Instagram y más) + montaje de calificación de prospectos + configuración de reportes mensuales. |

---

## 5. Estructura de costos (lo que nos cuesta a nosotros)

### 5.1 Costos fijos mensuales (toda la operación, compartidos entre todos los clientes)

| Concepto | Costo | En USD (~) | En COP (~) |
|---|---|---|---|
| **VPS** (Hostinger, 16 GB RAM) | $80.000 COP/semana | ~$87/mo | ~$346.700/mo |
| **Kapso Platform** (50 números, 1M mensajes, 50h transcripción) | $299 USD/mo | $299/mo | ~$1.196.000/mo |
| **Total fijo** | | **~$386/mo** | **~$1.542.700/mo** |

### 5.2 Costos variables por cliente

| Concepto | Costo estimado | Nota |
|---|---|---|
| **Número WhatsApp (slot Kapso)** | ~$6/mo (~$24.000 COP) | $299 ÷ 50 números. Solo se "gasta" si llenás los 50 slots. |
| **Share de VPS** | ~$2–3/mo (~$8.000–12.000 COP) | $87 ÷ nº de clientes activos. Baja cuanto más clientes. |
| **OpenAI API** (a futuro) | ⚠️ **ESTIMADO: ~$5–20/mo** (~$20.000–80.000 COP) | Depende del volumen de mensajes y del modelo. **A VALIDAR con uso real.** |
| **Total marginal/cliente** | ⚠️ **~$13–29/mo** (~$52.000–116.000 COP) | Estimación conservadora. |

> **⚠️ Importante sobre el modelo de IA:** hoy King corre sobre **suscripción de ChatGPT** (costo fijo, pero con techo de escala). El roadmap contempla migrar a **OpenAI API** (costo variable por tokens) para escalar a 30–50 clientes sin ese techo. Los números de arriba asumen ese escenario futuro.

---

## 6. Márgenes estimados (mercado Colombia, mensual)

> Usando el costo marginal estimado más alto (~$116.000 COP/cliente/mo) para ser conservadores.

| Plan | Ingreso mensual | Costo marginal (est.) | **Margen bruto** | **%** |
|---|---|---|---|---|
| Básico | $390.000 | ~$116.000 | **~$274.000** | **~70%** |
| Pro | $690.000 | ~$116.000 | **~$574.000** | **~83%** |
| Imperio | $1.190.000 | ~$116.000 | **~$1.074.000** | **~90%** |

> El costo marginal es casi fijo por cliente, así que **cuanto más caro el plan, mejor el margen %.** Empujá Pro e Imperio.

**Además**, la **instalación es ingreso casi puro** (es tu trabajo de setup, una vez): $850.000 – $2.300.000 COP por cliente según plan.

---

## 7. Punto de equilibrio (break-even)

Con costo fijo de operación ≈ **$1.542.700 COP/mo** (VPS + Kapso):

| Escenario | Clientes necesarios para cubrir lo fijo |
|---|---|
| Solo con planes **Básico** | **~6 clientes** ($274.000 margen c/u) |
| Solo con planes **Pro** | **~3 clientes** ($574.000 margen c/u) |
| Mix realista | **4–5 clientes** cubren toda la infraestructura |

> A partir de ahí, cada cliente nuevo es casi todo margen. La instalación acelera el recupero desde el día 1.

---

## 8. Notas y supuestos (para revisar)

- ✅ **Precios de venta**: reales, de la DB. La landing los muestra según el país detectado por IP.
- ⚠️ **Costo OpenAI API**: estimado. Hay que medir tokens reales por conversación (con RAG el contexto pesa) antes de fijarlo.
- ⚠️ **Costos de mensajería Meta**: el plan Kapso incluye 1M mensajes/mo; validar si hay cargos de Meta por conversación por fuera del plan según categoría.
- 💡 **Capacidad**: el plan Kapso da 50 números → **techo de ~50 clientes** con este plan. Al acercarse, evaluar upgrade de Kapso.
- 💡 **VPS 16 GB**: hoy sobra (13% RAM en uso con King). Al escalar a contenedor-por-cliente (infra híbrida premium), recalcular.
- 💡 **Estrategia de pricing**: el plan **anual regala 2 meses** — es la mejor palanca de caja (cobrás 10 meses por adelantado).

---

## 9. Referencias

- Precios en DB: tablas `planes`, `plan_precios`, `plan_features` (Supabase, proyecto `autoking`).
- Detalle de arquitectura y roadmap: [ESTADO-Y-ROADMAP.md](./ESTADO-Y-ROADMAP.md).
