# Plan de mejora de King — de vendedor correcto a cerrador

> Diagnóstico hecho el 2026-08-04 sobre **conversaciones reales** de King leídas de su
> `state.db` (690 mensajes), no sobre impresiones. Cada defecto de abajo tiene la cita
> textual que lo prueba.

---

## 0. La conclusión, primero

**King no escribe mal. King no cierra.**

En la conversación con Luis (spa masculino en Medellín, 300 consultas, una sola persona
atendiendo) King hizo un descubrimiento correcto en cinco turnos, recomendó el plan
adecuado con justificación, dio el precio con la promoción vigente… y **se detuvo ahí**.
No pidió la venta. No propuso un siguiente paso. No guardó el lead.

El lead se quedó callado porque nadie le pidió nada.

Su propio playbook dice *"Pido el cierre UNA vez, con claridad"* y *"Guardo el lead
apenas tengo nombre y negocio, no espero al final"*. Tiene el método escrito y no lo
ejecuta. **Ese es el problema central, y no se arregla agregando más documentación.**

---

## 1. Lo que ya funciona — no tocar

Antes de cambiar nada, esto está bien hecho y romperlo sería un retroceso:

- **Una pregunta por mensaje.** Nunca apiló tres preguntas.
- **Descubrimiento progresivo y ordenado**: ciudad → canal → volumen → quién atiende.
  Es la secuencia correcta y la respetó.
- **No tiró el precio antes de tiempo.** Se lo ganó con cuatro turnos de contexto.
- **Recomendación con motivo**: *"Para tu caso no pensaría en el Básico"* + por qué.
- **La promoción que aplicó es real** (fundadores, primeros 5 en Colombia, 30% en
  instalación → $980.000). Está en su playbook. No inventó nada.

## 2. Los ocho defectos, con la prueba

| # | Defecto | Evidencia textual |
|---|---|---|
| 1 | **No cierra.** Da el precio y se detiene. | Último mensaje: precio + qué incluye + promo. Cero pedido de acción. |
| 2 | **Muletilla de apertura en el 100% de los mensajes.** | *"Mucho gusto, Luis." / "Perfecto, Luis." / "Listo, eso me dice bastante." / "Ahí está la oportunidad, Luis." / "Uff, Luis," / "Claro, y…" / "De una, Luis."* — 7 de 7. |
| 3 | **Abusa del nombre**: 6 de 7 mensajes. Cadencia de telemercadeo. | *"Perfecto, Luis" / "Uff, Luis" / "De una, Luis"* |
| 4 | **Convierte suposiciones en hechos.** | El lead escribió solo `300`. King respondió *"300 mensajes al día"*. Nunca dijo al día. |
| 5 | **Pide permiso para cotizar**, regalando un turno y habilitando un "no". | *"¿Quieres que te pase el valor completo en COP?"* |
| 6 | **Vende funciones, no plata.** Tiene el argumento de costo por hora en el manual y no lo usó. | *"responde 24/7, agenda citas y manda recordatorios"* — ni un número del negocio del cliente. |
| 7 | **Cero reversión de riesgo y cero prueba social** en el momento del precio. | El mensaje del precio no menciona ningún otro cliente ni qué pasa si no funciona. |
| 8 | **No guardó el lead** aunque tenía nombre, ciudad, rubro y volumen. | Ninguna llamada a `guardar_lead` en toda la conversación. |

### Un defecto de sistema, no de King

Cada mensaje del lead llega con este bloque inyectado delante:

> *"WhatsApp del contacto actual: +57… Usá este número exacto para identificar_contacto,
> guardar_lead, marcar_cliente, escalar, enviar_imagen y cualquier herramienta que pida
> whatsapp. No uses números de conversaciones anteriores ni números del equipo."*

Se repite en **todos** los turnos. Gasta contexto y compite con lo que dijo el cliente.
Debería ir una vez en el prompt de sistema, no pegado a cada mensaje.

---

## 3. Plan de trabajo

### Fase 1 — El cierre (lo único que mueve la aguja hoy) — ✅ APLICADA 2026-08-04

Sin esto, todo lo demás es cosmética.

1. **Regla dura nueva: todo mensaje con precio termina en un pedido de acción.**
   Sin excepción. El precio nunca es el final del mensaje.
2. **Tres cierres escritos, para usar según temperatura**, con el texto literal:
   - *Alternativo*: "¿Arrancamos con el Pro o preferís que te arme el Básico y lo
     escalamos en dos meses?"
   - *De siguiente paso*: "Te dejo el cupo de fundador reservado 48 h mientras lo
     decidís. ¿Te sirve?"
   - *De permiso*: "¿Querés que te pase los datos para la instalación?"
3. **`guardar_lead` obligatorio en el turno en que aparezcan nombre + negocio.** Hoy es
   una recomendación; pasa a regla dura.
4. **Después del precio, si no hay respuesta: `programar_seguimiento` en el mismo turno.**
   No queda a criterio.

### Fase 2 — La escritura — ✅ APLICADA 2026-08-04

5. **Prohibir las muletillas de apertura.** Lista negra explícita: *Perfecto, Listo,
   Claro, De una, Uff, Ahí está, Excelente, Genial* como primera palabra.
6. **El nombre, como máximo una vez cada tres mensajes**, y nunca en dos seguidos.
7. **Nunca completar un dato que el cliente no dio.** Si dijo "300", se pregunta:
   *"¿300 al día o al mes?"*. Una suposición en un número es una cotización mal hecha.
8. **Máximo cuatro líneas por mensaje.** Si pasa, sobra algo.
9. **Prohibido pedir permiso para cotizar.** Si el momento llegó, se cotiza.

### Fase 3 — Especialización: vender plata, no funciones

10. **Aritmética obligatoria en el pitch.** Con el volumen que dio el cliente, King
    calcula delante de él: consultas perdidas × ticket del rubro × margen. El Pro cuesta
    $690.000/mes; el argumento se sostiene solo con recuperar 2-3 citas.
11. **Tabla de tickets por rubro** (spa, barbería, consultorio, clínica estética,
    veterinaria) para que la cuenta no dependa de que el cliente dé el dato.
12. **Prueba social por rubro**: una línea verificable por tipo de negocio. Si no hay
    caso real todavía, **no se inventa**: se omite.
13. **Reversión de riesgo**: qué pasa concretamente si no funciona. Hay que definirlo con
    Álvaro — hoy no existe y es el hueco más grande del argumento.

### Fase 4 — Medición

Sin esto no se sabe si mejoró; se cree que mejoró.

14. **Ya existe `eval-agent.mjs`** (corre los domingos a las 5am). Extenderlo con cinco
    escenarios de cierre: lead tibio, objeción de precio, "lo tengo que pensar",
    comparación con la competencia, y el que se calló después del precio.
15. **Métrica real, no impresión**: de cada 10 conversaciones que llegan al precio,
    cuántas terminan con (a) lead guardado, (b) cierre pedido, (c) seguimiento agendado.
    Hoy la conversación de Luis da 0 de 3.
16. **Antes/después con las mismas cinco conversaciones**, para poder comparar.

---

## 3.bis Resultado medido de las Fases 1 y 2

Las reglas de cierre entraron **dentro de las 9 reglas duras** (ahora 12), no en una
sección nueva al final. Es deliberado: King venía respetando las reglas duras
("nunca invento un precio", "una pregunta a la vez") e ignorando el método que estaba
suelto en otra parte del documento. El lugar importa tanto como el texto.

Tres pruebas contra el King real, mismas situaciones que fallaron antes:

| Prueba | Antes | Después |
|---|---|---|
| Momento del precio | Precio + qué incluye, y se detenía | *"…la instalación te queda en $980.000 COP. **¿Arrancamos con el Pro?**"* |
| El lead escribe solo `300` | *"300 mensajes al día"* (lo supuso) | *"**¿300 al día o al mes?**"* |
| "está muy caro" | — | Valida, reencuadra en citas recuperadas, y pregunta *"¿lo que más te frena es la instalación o la mensualidad?"* |

También desaparecieron las muletillas de apertura y el nombre repetido, y los mensajes
quedaron en tres líneas.

### Un error propio, corregido en el mismo paso

La sección de leads fríos que se había agregado el mismo día estaba escrita **en voseo**
("volvé", "pedí", "andá") y la regla de King es español neutro **sin vos**. Una
instrucción en voseo se filtra al habla del agente. Se corrigieron 15 formas.

---

## 4. Sobre "descargar documentos de venta"

**La metodología ya está escrita.** `MANUAL-OPERATIVO-AGENTE.md` v3.0 son 386 líneas con
el argumento de costo por hora, precios por mercado, cómo recomendar plan y manejo de
objeciones. El playbook de King son otras 426.

El problema no es falta de material: es que **hay demasiado y no se ejecuta lo que
importa**. Agregar un PDF de SPIN Selling o Sandler encima no va a hacer que pida el
cierre — va a diluir más el prompt.

Lo que sí falta y vale traer de afuera son **dos cosas puntuales**:

- **Cierres escritos y probados** para WhatsApp (no para llamada en frío ni para venta
  presencial, que es de donde viene casi toda la literatura).
- **Manejo de objeciones de precio en pyme LatAm**, donde la objeción real casi nunca es
  el precio sino la desconfianza en que funcione.

Eso entra en la Fase 1 y 3 como texto literal, no como teoría.

---

## 5. Riesgo a vigilar: la promoción de fundadores

La promo dice **"primeros 5 clientes Colombia"**, pero **nada cuenta cuántos cupos se
usaron**. Si King la ofrece en cada conversación, deja de ser una promoción de fundadores
y se convierte en el precio real, con $420.000 menos por instalación.

Hay que decidir: o se lleva la cuenta en la base y King la consulta antes de ofrecerla, o
se asume que es el precio de lanzamiento y se dice así.

---

## 6. Orden de ejecución

1. Fase 1 completa (cierre + guardar lead + seguimiento) → es donde está el dinero.
2. Fase 2 (escritura) → barata y de efecto inmediato en la percepción.
3. Fase 4 (medición) antes de la Fase 3, para poder demostrar el efecto.
4. Fase 3 (aritmética y prueba social) → necesita datos de Álvaro: tickets por rubro,
   casos reales y la política de garantía.

**Lo que hace falta de Álvaro para completar el plan:**

- Ticket promedio por rubro (o autorización para estimarlo y marcarlo como estimado).
- ¿Hay casos reales citables? Nombre del negocio y resultado.
- ¿Existe alguna garantía o devolución? Si no, ¿se puede crear?
- Cuántos cupos de fundador quedan.
