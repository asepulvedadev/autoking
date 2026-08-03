#!/usr/bin/env bash
# Skills del Imperio — parte 1: los 7 departamentos de la referencia.
# shaka · luis · alejandro · soliman · felipe · augusto · justiniano
#
# Idempotente: reescribe los SKILL.md generados. Correr COMO ROOT EN EL VPS:
#   bash /root/imperio/skills-parte1.sh
set -euo pipefail
PROFILES=/root/.hermes/profiles
OFICINA=/root/imperio/bin
N=0

# skill <perfil> <nombre> "<descripcion>"  <<'EOF' cuerpo EOF
skill() {
  local perfil=$1 nombre=$2 desc=$3
  local dir=$PROFILES/$perfil/skills/$nombre
  mkdir -p "$dir"
  { printf -- '---\nname: %s\ndescription: "%s"\nlicense: private\nmetadata:\n  author: autoking\n  imperio: %s\n---\n\n' \
      "$nombre" "$desc" "$perfil"; cat; } > "$dir/SKILL.md"
  N=$((N+1))
}

OFI="**Oficina del Imperio** (rutas absolutas, siempre disponibles):
\`$OFICINA/md2pdf entrada.md salida.pdf --titulo \"X\"\` · \`$OFICINA/mkxlsx spec.json salida.xlsx\` (fórmulas vivas) · \`$OFICINA/mkdocx entrada.md salida.docx\` (redlining con {+agregado+} {-eliminado-}) · \`$OFICINA/grafico spec.json salida.png\`"

# ═══════════════════════════ SHAKA — Desarrollo ═══════════════════════════
skill shaka tdd-ciclo "Planear e implementar con TDD: test que falla, código mínimo, refactor. Usala para cualquier feature o bug con lógica de negocio." <<EOF
## Cuándo
Cualquier cambio con lógica: cálculo, validación, máquina de estados, permisos.
No para renombrar variables ni mover archivos.

## El ciclo, sin saltear pasos
1. **Entendé el contrato.** Qué entra, qué sale, qué pasa cuando entra basura.
2. **Escribí el test que falla.** Si pasa de entrada, el test no prueba nada.
3. **Código mínimo para que pase.** Nada de "ya que estoy".
4. **Refactor con el test en verde.**
5. Repetí con el siguiente caso borde.

## Reglas
- El test describe **comportamiento**, no implementación: si refactorizás y el
  test se rompe, estaba mal escrito.
- Un test por caso. Un test que valida cinco cosas no dice cuál falló.
- Antes de escribir, **leé cómo testea el repo** y seguí ese patrón.
EOF

skill shaka docs-exactas "Traer documentación de la versión exacta de una librería antes de escribir código. Usala SIEMPRE antes de usar una API que no conocés de memoria." <<EOF
## Por qué existe
El stack se mueve rápido: Next.js 15, React 19, Tailwind **v4**, Supabase.
Lo que sabés de memoria suele ser de la versión anterior, y en Tailwind v4 la
configuración cambió de raíz.

## Cómo
1. Fijá la versión real: \`grep '"next"\|"react"\|"tailwindcss"' package.json\`.
2. Buscá la doc **de esa versión**, no la "latest" genérica.
3. Si hay MCP de documentación disponible, usalo antes que una búsqueda web.
4. Citá de dónde salió lo que vas a usar.

## Regla
Si no encontrás la doc de la versión exacta, **decilo** y marcá el código como
a verificar. No inventes la firma de una función.
EOF

skill shaka mcp-builder "Construir servidores MCP para darle herramientas nuevas a un agente. Usala cuando un agente necesite una capacidad que hoy no tiene." <<EOF
## Cuándo
Un agente necesita hacer algo que no está en sus toolsets: consultar una API,
leer una tabla acotada, disparar un proceso.

## Patrón que ya usamos en este repo
Hay tres MCP propios funcionando; copiá su forma antes de inventar otra:
- \`/root/autoking-king-tools/\` — tools de King (WhatsApp/CRM)
- \`/root/apps/j4/scripts/mcp-servers/j4-readonly-mcp.mjs\` — solo lectura
- \`j4-admin-mcp.mjs\` — con escrituras

Node + \`@modelcontextprotocol/sdk\`, stdio, y **llamando a la API real** en vez
de a la base directo: así toda la validación de negocio sigue aplicando.

## Reglas duras
- **Tools narrow, nunca genéricas.** Un \`run_sql\` es admin completo disfrazado.
- El MCP se declara en \`config.yaml\` del perfil con su \`env\` explícito.
- Si el MCP toca datos de tenants, tiene que fallar sin \`tenant_id\`, no
  devolver todo.
EOF

skill shaka skill-creator "Crear o mejorar skills de Hermes para el Imperio. Usala cuando un emperador repita un procedimiento que conviene dejar escrito." <<EOF
## Cuándo
Algo se hizo dos veces igual, o un emperador necesita un procedimiento que no
tiene.

## Formato
\`~/.hermes/profiles/<perfil>/skills/<nombre>/SKILL.md\` con frontmatter:
\`\`\`
---
name: <kebab-case>
description: "Qué hace + CUÁNDO usarla. Esto es lo que dispara la skill."
---
\`\`\`

## Lo que hace buena a una skill
- **La \`description\` es el disparador**: si no dice cuándo usarla, no se usa.
- Comandos concretos y copiables, no teoría.
- Las trampas que ya costaron tiempo. Eso es lo que no está en la doc oficial.
- Corta. Una skill de 300 líneas no se lee.

## Regla
Las skills del Imperio se generan desde \`hermes/imperio/skills-*.sh\` en el
repo. Editar el archivo del VPS a mano se pierde en el próximo provisionado.
EOF

skill shaka webapp-testing "Probar la app en un navegador real: flujos, formularios, consola y errores de red. Usala antes de dar por buena cualquier pantalla." <<EOF
## Cuándo
Cambiaste algo que el usuario VE o con lo que interactúa. Un typecheck en verde
no prueba que el formulario mande el dato.

## Qué verificar siempre
1. **El camino feliz**, de punta a punta.
2. **La consola**: cero errores, cero warnings nuevos.
3. **La pestaña de red**: ¿el 200 devolvió lo que esperabas? ¿hubo 4xx callados?
4. **El form vacío y el form con basura.**
5. **Móvil**: la mayoría del tráfico de AutoKing entra desde el celular.

## Trampa del proyecto
El insert público de leads usa \`Prefer: return=minimal\` a propósito. Si el
form "no hace nada", revisá si alguien agregó \`.select()\`: eso rompe la
captación y **falla en silencio**.
EOF

skill shaka code-review "Revisar código propio o ajeno buscando defectos reales, no estilo. Usala antes de commitear algo que toque producción." <<EOF
## Orden de revisión (de lo que más duele a lo que menos)
1. **Seguridad y tenancy.** ¿Usa \`service_role\` sin necesidad? ¿Filtra por
   \`tenant_id\`? ¿Expone algo con \`NEXT_PUBLIC_\`?
2. **Corrección.** Casos borde, nulos, errores tragados con \`catch {}\`.
3. **Contratos.** ¿Cambió una firma que otro llamador usa?
4. **Tests.** ¿Cubre el comportamiento nuevo o solo el camino feliz?
5. Recién al final: nombres y legibilidad.

## Cómo reportás
Defecto concreto + **cómo se rompe** (entrada → resultado real vs esperado).
Nada de "podría mejorarse". Si no sabés cómo falla, no es un hallazgo todavía.

## Regla
Si el cambio toca producción (King, Mayand, Johan atienden clientes AHORA),
decilo explícito en la revisión.
EOF

# ═══════════════════════════ LUIS XIV — Diseño ═══════════════════════════
skill luis frontend-design "Construir UI con React 19 + Tailwind v4 que no parezca plantilla. Usala para cualquier componente o pantalla nueva." <<EOF
## Antes de escribir una clase
Leé \`packages/ui\` y \`apps/web/src/app/globals.css\`. Los tokens son **CSS
variables**; Tailwind v4 se configura en CSS, no en \`tailwind.config.js\`.
Reusar el token existente le gana a inventar un color.

## Jerarquía primero
Una pantalla necesita **un** foco. Si todo grita, nada se lee. Decidí qué es lo
primero que el ojo tiene que ver y construí alrededor de eso.

## Lo que delata una plantilla
- Gradientes de morado a azul sin razón.
- Tres tarjetas iguales con íconos genéricos.
- Sombras en todo.
- Espaciado uniforme: sin ritmo no hay jerarquía.

## Regla
Un gradiente, una sombra o una animación **se justifican o se van**. Si no podés
decir qué comunica, es decoración.
EOF

skill luis design-system "Mantener el sistema de diseño: tokens, escalas, variantes y consistencia. Usala cuando un estilo se repita o cuando un componente necesite una variante." <<EOF
## Cuándo
Ves el mismo valor hardcodeado dos veces, o alguien pide "igual pero más chico".

## Cómo
1. **El token antes que el valor.** Si el color no está en los tokens, la
   pregunta es si falta el token, no si hardcodear.
2. **Variantes, no componentes nuevos.** \`size\` y \`tone\` sobre un botón, no
   \`BotonChicoAzul\`.
3. **Escala limitada.** Cinco pasos de espaciado que se respetan valen más que
   veinte que nadie recuerda.
4. Documentá **cuándo** usar cada variante, no solo que existe.

## Regla
Una pantalla linda que no es reutilizable es deuda. El sistema antes que el
pixel.
EOF

skill luis piezas-visuales "Generar piezas visuales terminadas: PDF, PNG y gráficos para propuestas, decks y reportes. Usala cuando el entregable es un archivo, no código." <<EOF
## Herramientas
$OFI

## Cómo se hace una pieza que no da vergüenza
1. Escribí el contenido en Markdown primero. Si el texto no funciona, el diseño
   no lo salva.
2. Rendí a PDF con \`md2pdf\` (el CSS ya está calibrado: tipografía, tablas,
   saltos de página con \`<div class="salto"></div>\`).
3. Los datos van en \`grafico\`, no en una tabla de veinte filas.
4. Revisá el PDF antes de entregarlo: viudas, tablas cortadas, títulos huérfanos.

## Regla
Un número en un gráfico y el mismo número en el texto **no pueden diferir**.
Si difieren, el cliente deja de creer todo lo demás.
EOF

skill luis arte-generativo "Arte generativo y visuales algorítmicas con canvas o p5.js. Usala para fondos, texturas y piezas de marca que no sean stock." <<EOF
## Cuándo
Hace falta un visual propio: fondo de sección, textura, patrón de marca, avatar
generado. Todo antes que una foto de banco de imágenes.

## Cómo
- Canvas HTML + JS, o p5.js si necesitás el loop de animación.
- **Semilla fija** para que el resultado sea reproducible. Un arte que no podés
  volver a generar igual no sirve para una marca.
- Exportá a PNG con transparencia, y a resolución 2x para pantallas retina.

## Regla estética
Restricción antes que ruido: dos colores de la paleta y una regla simple dan
mejor resultado que diez parámetros al azar.
EOF

skill luis web-artifacts "Páginas HTML autocontenidas para prototipos, demos y one-pagers. Usala cuando querés mostrar algo que funcione sin montar la app." <<EOF
## Cuándo
Validar una idea de UI, mandarle un prototipo a un cliente, o un one-pager que
se abra con doble clic.

## Reglas técnicas
- **Todo inline**: CSS, JS e imágenes como data URI. Un archivo, cero
  dependencias externas.
- Responsive de verdad: se va a abrir en un celular.
- Modo claro y oscuro si el contexto lo pide.

## Regla
Un prototipo tiene que **parecer** lo que va a ser. Si lo hacés con estilos
genéricos, la decisión que tome el cliente va a estar basada en algo falso.
EOF

skill luis revision-visual "Auditar una pantalla y decir qué está mal y por qué. Usala cuando algo 'no se ve bien' pero nadie sabe explicar el motivo." <<EOF
## Las seis preguntas
1. **¿Dónde va el ojo primero?** Si no hay respuesta clara, falta jerarquía.
2. **¿Qué se puede sacar?** Casi siempre algo.
3. **¿El espaciado tiene ritmo** o es todo el mismo margen?
4. **¿Cuántas tipografías y pesos hay?** Más de tres es desorden.
5. **¿Los colores significan algo** o son decorativos?
6. **¿Se lee en un celular** con una mano y a la luz del sol?

## Cómo lo reportás
Hallazgo → **por qué** molesta → arreglo concreto. Nada de "queda raro".

## Regla
"Huele a IA" es un diagnóstico válido, pero hay que traducirlo: casi siempre es
exceso de gradientes, simetría perfecta y copy genérico.
EOF

# ═══════════════════════ ALEJANDRO — Marketing ═══════════════════════
skill alejandro seo-audit "Auditar el SEO on-page de una página o sitio y priorizar arreglos. Usala cuando el tráfico orgánico no crece o antes de publicar contenido nuevo." <<EOF
## Qué revisar, en orden de impacto
1. **Intención**: ¿la página responde lo que busca quien llega? Si no, nada más
   importa.
2. **Title y meta description**: únicos, con la keyword, y que den ganas de
   clickear.
3. **Un solo H1**, jerarquía de H2/H3 real.
4. **Enlazado interno**: ¿esta página está huérfana?
5. **Velocidad y móvil**: Core Web Vitals.
6. **Indexación**: ¿está en el sitemap? ¿la bloquea robots.txt?

## Contexto del proyecto
\`apps/web\` ya tiene \`sitemap.ts\`, \`robots.ts\` y \`opengraph-image.tsx\`.
La landing es multi-idioma con next-intl: cada locale necesita sus metadatos.

## Regla
Priorizá por impacto sobre esfuerzo y decí cuánto vale cada arreglo. Una lista
de 40 hallazgos sin prioridad no se ejecuta nunca.
EOF

skill alejandro programmatic-seo "Generar páginas a escala desde datos, sin caer en contenido basura. Usala para cubrir familias de búsquedas (ciudad, rubro, caso de uso)." <<EOF
## Cuándo
Hay una familia de búsquedas con la misma forma: "agente de IA para barberías",
"...para spas", "...para consultorios" × ciudad.

## Cómo
1. **Los datos primero**: una tabla con las dimensiones reales (rubro, ciudad,
   dolor, testimonio, precio local).
2. Una plantilla con **secciones variables de verdad**, no un párrafo con el
   nombre cambiado.
3. Rutas dinámicas de Next.js + \`generateStaticParams\`, y cada página en el
   sitemap.
4. Empezá con 10, medí, y recién después escalá.

## Regla dura
Si dos páginas se leen igual cambiando una palabra, Google lo trata como
contenido duplicado y te penaliza el sitio entero. **Cada página necesita algo
propio de verdad**: un dato, un testimonio, un precio local.
EOF

skill alejandro ai-seo "Posicionar en respuestas de IA (ChatGPT, Perplexity, AI Overviews), no solo en el buscador. Usala cuando la marca no aparece donde la gente ya pregunta." <<EOF
## Por qué cambia el juego
Cada vez más gente pregunta a un modelo en vez de buscar. Ahí no hay diez
resultados: hay una respuesta y dos o tres fuentes citadas.

## Qué hace que te citen
- **Respuestas directas y extraíbles**: la afirmación primero, el desarrollo
  después.
- **Datos concretos y verificables**: números, fechas, nombres. Lo vago no se cita.
- **Estructura**: encabezados que son preguntas reales, listas, tablas.
- **Schema markup** (FAQ, Product, LocalBusiness).
- Ser mencionado en otros lados: los modelos pesan el consenso, no tu página.

## Regla
Escribí el párrafo que quisieras que el modelo copie textual. Si no lo podés
citar en dos oraciones, no está listo.
EOF

skill alejandro cro "Subir la conversión de una página o formulario. Usala cuando hay tráfico pero no leads." <<EOF
## Diagnóstico antes de tocar
Tráfico alto + conversión baja no siempre es la página: puede ser que el anuncio
prometa algo distinto. **Compará el mensaje del anuncio con el de la landing.**

## Palancas, de mayor a menor
1. **Claridad de la propuesta** arriba del pliegue: qué es, para quién, qué gana.
2. **Un solo CTA** por pantalla, con el verbo de la acción real.
3. **Menos campos.** Cada campo del form cuesta conversión. ¿Necesitás el teléfono?
4. **Prueba social cerca del CTA**, no en una sección lejana.
5. **Fricción invisible**: errores de validación poco claros, botón que no
   avisa que está cargando.

## Regla
Un cambio a la vez y medilo. Si movés cinco cosas y sube, no sabés qué funcionó
y no lo podés repetir.
EOF

skill alejandro ad-creative "Crear y escalar variaciones de anuncios para Meta y Google. Usala cuando haya que testear creatividades o revivir una campaña cansada." <<EOF
## Estructura de un anuncio que funciona
1. **Gancho** en los primeros 3 segundos o la primera línea: el dolor, no el
   producto.
2. **Prueba**: número, testimonio o demostración.
3. **Una sola acción.**

## Cómo escalar variaciones sin ruido
Cambiá **una** variable por vez: gancho, formato, prueba u oferta. Así sabés qué
movió la aguja. Doce anuncios que cambian todo a la vez no enseñan nada.

## Contexto AutoKing
Se vende a negocios de LatAm (spas, barberías, consultorios) en CO/MX/US, con
precios distintos por mercado. **Los precios salen de la base de datos**, nunca
de memoria. El dolor real: clientes que escriben y nadie responde.

## Regla
Cero promesas que el producto no cumple. Un lead engañado es una cancelación y
una reseña mala.
EOF

skill alejandro mktg-psychology "Aplicar disparadores de comportamiento con ética. Usala cuando el mensaje es correcto pero no mueve a nadie." <<EOF
## Los que funcionan de verdad
- **Especificidad**: "responde en 30 segundos a las 2 a.m." le gana a "mejora tu
  atención".
- **Costo de no actuar**: qué pierde hoy por no tenerlo, en plata.
- **Prueba social del par**: otro negocio como el suyo, no una marca global.
- **Reducción de riesgo**: qué pasa si no funciona.
- **Facilidad**: cuántos pasos hasta el resultado.

## Lo que no hacemos
Escasez inventada, contadores falsos, testimonios armados. Funciona una vez y
después la marca queda quemada.

## Regla
El disparador solo sirve si lo que hay detrás es cierto. La psicología acomoda
el orden del argumento, **no reemplaza el argumento**.
EOF

# ═══════════════════ SOLIMÁN — Contenido y social ═══════════════════
skill soliman social "Escribir posts adaptados a cada plataforma, no el mismo texto copiado. Usala para publicar en Instagram, LinkedIn, X o TikTok." <<EOF
## Una idea, formas distintas
| Plataforma | Qué premia |
|---|---|
| Instagram | lo visual manda; el copy sostiene. Carrusel = una idea por placa |
| LinkedIn | contexto profesional, primera línea que corta el "ver más" |
| X | una idea filosa, sin preámbulo |
| TikTok | los primeros 2 segundos o no hay video |

## Reglas
- **Una idea por pieza.** Tres ideas = ninguna.
- El gancho no es un resumen: es la razón para seguir leyendo.
- Español **neutro** (cero voseo): la audiencia es colombiana y mexicana.
- Cero *engagement bait* ("comenta SÍ si..."). Sube números, baja la marca.

## Regla
Si el post se puede publicar igual para cualquier empresa del rubro, no sirve.
Necesita algo que solo AutoKing pueda decir.
EOF

skill soliman copywriting "Escribir o reescribir copy de web, landing y anuncios. Usala cuando el texto suena a relleno o no dice nada concreto." <<EOF
## El método
1. **Escribí el beneficio, no la característica.** No "agente con IA
   multi-tenant": "responde a tus clientes a las 3 a.m. y te agenda la cita".
2. **Sacá la mitad.** Después sacá un poco más.
3. **Verbos concretos.** Si podés sacar un adjetivo sin perder sentido, era relleno.
4. **Leelo en voz alta.** Si te trabás, el cliente también.

## Lo que delata un texto de IA
"En un mundo donde...", "no solo X sino también Y", "desbloqueá el potencial",
tres adjetivos donde va uno, y párrafos que resumen lo que acabás de decir.

## Regla
Español neutro para todo lo que lee un cliente. Y **cero precios de memoria**:
salen de la base.
EOF

skill soliman content-strategy "Planear el mapa de temas y el calendario editorial. Usala cuando se publica sin criterio o antes de arrancar un canal nuevo." <<EOF
## Cómo se arma
1. **Las preguntas reales primero.** Lo que los prospectos preguntan por
   WhatsApp es el mejor insumo de contenido que existe. Está en la base.
2. **Agrupá por tema, no por formato**: un tema pilar y 5-8 satélites.
3. **Asigná intención**: descubrir / comparar / decidir. Sin las tres etapas,
   atraés gente que nunca compra.
4. **Cadencia sostenible.** Dos por semana durante un año le gana a diez por
   semana durante un mes.

## Regla
El calendario que no considera quién escribe y cuándo es una lista de deseos.
Planificá contra la capacidad real.
EOF

skill soliman video "Escribir y producir video corto: guion, estructura y edición. Usala para reels, demos y contenido vertical." <<EOF
## Estructura de un video que se ve completo
1. **0-2 s**: el gancho. Sin logo, sin intro, sin "hola qué tal".
2. **2-15 s**: el problema, concreto y reconocible.
3. **15-40 s**: la demostración. Mostrar > explicar.
4. **Cierre**: una sola acción.

## Producción
- **Vertical 1080x1920** por defecto.
- **Subtítulos siempre**: se ve sin sonido.
- \`ffmpeg\` está instalado en el VPS. Para composición programática, el repo
  tiene \`packages/video\` con Remotion.

## Regla
Una demo real del agente contestando un WhatsApp vale más que cualquier
animación. Mostrá el producto funcionando.
EOF

skill soliman pillar-content "Construir autoridad con contenido pilar y satélites (hub and cluster). Usala para dominar un tema completo en vez de publicar suelto." <<EOF
## La estructura
- **Pilar**: la guía completa del tema, la mejor de su categoría. Larga porque
  cubre todo, no porque se estira.
- **Satélites**: 5-8 piezas que profundizan un subtema y **enlazan al pilar**.
- El pilar enlaza a cada satélite. Ese ida y vuelta es lo que construye la
  autoridad temática.

## Cómo elegir el pilar
Un tema donde AutoKing pueda ser la mejor respuesta que existe en español. Si no
podés ganarle a lo que ya está publicado, elegí otro más específico.

## Regla
Primero el pilar, después los satélites. Al revés queda un montón de artículos
sin centro.
EOF

skill soliman email-sequences "Diseñar flujos de email por ciclo de vida: bienvenida, activación, recuperación. Usala cuando haya que automatizar seguimiento por correo." <<EOF
## Herramienta
El proyecto manda con **Resend** (\`apps/web/src/lib/email/\`). El dominio de
envío es \`autoking.pro\`.

## Secuencias que valen
| Momento | Objetivo | Cantidad |
|---|---|---|
| Bienvenida | que llegue al primer valor | 3 |
| Activación | que use lo que compró | 2-4 |
| Lead frío | recuperar sin rogar | 3 |
| Cliente feliz | referidos y testimonio | 1-2 |

## Reglas
- **Un objetivo por email**, y un solo enlace principal.
- El asunto promete lo que el cuerpo cumple. Si no, se marca como spam.
- Español neutro, y salida clara para dejar de recibirlos.
- **Espaciado en función de la señal**: quien no abrió tres, no quiere el cuarto.

## Regla
Antes de agregar un email, preguntate si un WhatsApp haría el trabajo mejor.
Muchas veces sí.
EOF

# ═══════════════════════ FELIPE II — Finanzas ═══════════════════════
skill felipe unit-economics "Calcular la economía por cliente: CAC, LTV, margen y payback. Usala antes de decidir cuánto gastar en adquisición o si un plan es rentable." <<EOF
## Los cinco números
1. **CAC**: todo lo gastado en adquirir ÷ clientes nuevos (incluí el tiempo de
   venta, no solo los anuncios).
2. **Ticket**: instalación + mensualidad. Los tres mercados por separado.
3. **Costo de servir**: modelo de IA, WhatsApp (Kapso), VPS, soporte.
4. **Margen bruto** por cliente por mes.
5. **Payback**: cuántos meses hasta recuperar el CAC.

## Herramienta
$OFI
Armá el modelo con \`mkxlsx\` y **fórmulas vivas**, para que quien lo abra pueda
cambiar un supuesto y ver el efecto.

## Regla dura
**Los precios y costos SIEMPRE salen de la base de datos** (\`planes\`,
\`plan_precios\`, \`plan_features\`). Si un número no está ahí, decilo y pará.
Nunca lo estimes de memoria. Y nunca mezcles COP, MXN y USD en la misma columna.
EOF

skill felipe pricing "Diseñar precios y empaquetado por mercado. Usala cuando haya que crear un plan, cambiar un precio o justificar el que hay." <<EOF
## Antes de tocar un precio
Leé la base: \`planes\`, \`plan_precios\`, \`plan_features\`. Hay tres mercados
(CO/MX/US) y tres monedas. El precio vive ahí, no en el código ni en la persona
del agente. Si cambia, cambia en la base **y** en el RAG de los agentes.

## Cómo se decide
1. **Valor, no costo.** Cuánto vale para el negocio no perder un cliente por no
   contestar. El costo es el piso, no el precio.
2. **Tres niveles como máximo.** Más opciones = menos decisiones.
3. **Que la diferencia sea obvia**: un eje claro entre planes.
4. **Instalación + mensualidad** es el modelo actual: la instalación cubre el
   trabajo real de montarlo.

## Regla
Un plan que promete algo que el producto no hace todavía es una cancelación
futura. Verificá que cada feature listada exista.
EOF

skill felipe proyeccion-financiera "Modelo de tres estados (resultados, flujo de caja, balance) y proyecciones. Usala para planear crecimiento o mostrarle números a un tercero." <<EOF
## Los tres estados, y por qué los tres
- **Resultados**: si el negocio gana plata.
- **Flujo de caja**: si tiene plata. No es lo mismo, y lo que mata es el flujo.
- **Balance**: qué tiene y qué debe.

## Cómo se arma
1. **Supuestos en una hoja aparte**, explícitos y editables. Todo lo demás son
   fórmulas que apuntan ahí.
2. Mensual el primer año, anual después.
3. **Tres escenarios**: conservador, base, optimista. El base es el que se usa.
4. \`$OFICINA/mkxlsx\` con fórmulas vivas — que se pueda auditar celda por celda.

## Regla
Un modelo con números tipeados a mano en vez de fórmulas es un dibujo. Si no se
puede cambiar un supuesto y ver el efecto, no es un modelo.
EOF

skill felipe valuacion "Valuar el negocio: flujo descontado (DCF) y comparables. Usala si aparece un inversor, un socio o una oferta de compra." <<EOF
## DCF, en orden
1. Proyectá el **flujo de caja libre** (no la utilidad contable).
2. Elegí la **tasa de descuento** y justificala. Es el supuesto más discutible.
3. **Valor terminal**: perpetuidad o múltiplo de salida.
4. Descontá y sumá.
5. **Sensibilidad**: una tabla del valor contra tasa y crecimiento. Un DCF sin
   sensibilidad es una opinión con decimales.

## Comparables
SaaS B2B de LatAm con ingreso recurrente. Múltiplo sobre ingreso anual
recurrente, ajustado por crecimiento y retención. Decí de dónde salió cada
comparable.

## Regla
Un DCF es un rango, no un número. Quien te dé un valor exacto te está vendiendo
algo.
EOF

skill felipe pitch-deck "Armar el deck para inversores o socios. Usala cuando haya que contar el negocio con números a alguien de afuera." <<EOF
## La secuencia que funciona
1. **El problema**, con un dato.
2. **La solución**, en una frase.
3. **Por qué ahora.**
4. **Producto**, mostrado (captura o demo real).
5. **Mercado**, de abajo hacia arriba: cuántos negocios reales, cuánto paga cada uno.
6. **Tracción**: clientes, ingreso recurrente, retención. Lo que haya, sin adornar.
7. **Modelo de negocio** y unit economics.
8. **Competencia**, honesta.
9. **Equipo.**
10. **Cuánto pedís y para qué.**

## Herramienta
$OFI
Escribilo en Markdown, los datos con \`grafico\`, y rendí con
\`md2pdf --horizontal\` (saltos con \`<div class="salto"></div>\`).

## Regla
Un número inflado que se cae en la primera pregunta te cuesta toda la reunión.
Si un dato es flojo, decilo antes de que lo encuentren.
EOF

skill felipe control-de-gastos "Seguir en qué se va la plata y detectar gasto que crece solo. Usala mensualmente y antes de sumar cualquier servicio nuevo." <<EOF
## Los costos reales del stack
| Qué | Dónde mirar |
|---|---|
| Modelo de IA | suscripción compartida; la cuota se gasta **por llamada** |
| WhatsApp | Kapso, plan Platform |
| VPS | Hostinger — compartido con J4 |
| Base de datos | Supabase |
| Email | Resend |
| Hosting web | Vercel |

## Qué buscar
- **Costo por cliente atendido**: si sube con el volumen, el modelo no escala.
- Servicios que nadie usa pero se cobran.
- Llamadas de IA desperdiciadas: un modelo chico que necesita 5 idas y vueltas
  sale **más caro** que uno grande que resuelve en 1.

## Regla
Antes de sumar un servicio, decí qué reemplaza. Si no reemplaza nada, es costo
nuevo permanente y tiene que justificarse contra el ingreso.
EOF

# ═══════════════════════ AUGUSTO — Operaciones ═══════════════════════
skill augusto sop-builder "Escribir procedimientos operativos que alguien nuevo pueda seguir sin preguntar. Usala cuando algo se hizo dos veces igual." <<EOF
## Estructura
1. **Cuándo se dispara** este procedimiento.
2. **Quién es el dueño.**
3. **Precondiciones**: qué tiene que ser cierto antes de empezar.
4. **Pasos numerados**, con el comando o la pantalla exacta.
5. **Cómo verificar que salió bien.** Sin esto no es un procedimiento.
6. **Qué hacer si falla.**

## Reglas
- Escribís para **el que llega mañana**, no para el que ya sabe.
- Un paso, una acción. Si un paso tiene "y", son dos pasos.
- Nada de "configurar correctamente": decí qué valor va.

## Regla
Un procedimiento sin dueño y sin disparador es un documento, no un proceso.
EOF

skill augusto incident-postmortem "Post-mortem de un incidente: causa raíz, cronología y qué evita que se repita. Usala después de cualquier caída o bug en producción." <<EOF
## Sin culpables
Se busca la **causa**, no a quién señalar. Si la gente teme el post-mortem,
esconde los incidentes y perdés la información que importa.

## Estructura
1. **Impacto**: qué no funcionó, para quién, cuánto tiempo.
2. **Cronología**: cuándo empezó, cuándo se detectó, cuándo se resolvió. La
   distancia entre empezó y se detectó es el dato más valioso.
3. **Causa raíz**: preguntá "por qué" hasta llegar a algo estructural.
4. **Qué lo detectó** — ¿un monitor o un cliente enojado?
5. **Acciones** con dueño y fecha.

## Contexto
Hay healthcheck cada 5 min y profundo cada hora (\`/root/autoking-ops/\`). Si un
incidente no lo detectó, esa es la primera acción a corregir.
EOF

skill augusto business-case "Justificar una inversión o proyecto con números. Usala antes de comprometer plata o semanas de trabajo." <<EOF
## Estructura
1. **El problema**, cuantificado. Cuánto cuesta hoy no resolverlo.
2. **Opciones**, incluida "no hacer nada" — que siempre es una opción real.
3. **Costo** de cada una: plata **y** tiempo de quién.
4. **Beneficio esperado**, con el supuesto explícito.
5. **Riesgos** y cómo se mitigan.
6. **Recomendación**, una sola.

## Reglas
- El costo incluye el mantenimiento, no solo el build. Casi todo lo que se
  construye hay que sostenerlo.
- Si el beneficio no se puede medir, decilo en vez de inventar un número.
- Coordiná con Felipe II para cualquier cifra: los precios salen de la base.

## Regla
Un caso de negocio sin "no hacer nada" como opción comparada es un pedido de
permiso disfrazado de análisis.
EOF

skill augusto launch-runbook "Runbook de salida a producción: pasos, verificaciones, DNS y plan de rollback. Usala antes de cualquier go-live." <<EOF
## Antes
- [ ] Verificado en un entorno que se parezca a producción
- [ ] **Backup** hecho y probado que se puede restaurar
- [ ] Rollback escrito, con los comandos exactos
- [ ] Ventana elegida: **NO** en hora pico de WhatsApp
- [ ] Avisado a quien atiende clientes

## Durante
Pasos numerados con el comando exacto y qué esperar de cada uno. Si un paso
falla, el runbook dice si se sigue o se aborta.

## DNS
Bajá el TTL **24 h antes** del cambio. Y confirmá que resuelve antes de dar por
bueno el corte: \`apij4.craftia.com.mx\` lleva meses sin resolver y nadie lo
notó.

## Después
- [ ] Smoke test del flujo crítico
- [ ] Logs sin errores nuevos
- [ ] Los agentes contestan (probá uno real)

## Regla
Si no hay rollback escrito, no hay lanzamiento.
EOF

skill augusto internal-comms "Reportes de estado, FAQs y comunicación interna que se entienda de una. Usala para informar avances, cambios o incidentes." <<EOF
## Reporte de estado
- **Lo importante primero.** Si alguien lee solo la primera línea, tiene que
  quedarse con lo esencial.
- **Hecho / En curso / Bloqueado.** Los bloqueos con quién los desbloquea.
- Números, no adjetivos. "3 de 5 clientes migrados", no "buen avance".
- Lo que salió mal **también se reporta**. Un reporte donde todo siempre va bien
  deja de creerse.

## FAQ
Escribí la pregunta **como la hace la gente**, no como te gustaría que la
hicieran. Respuesta directa arriba, detalle abajo.

## Regla
Si hace falta una reunión para entender el reporte, el reporte está mal escrito.
EOF

skill augusto planillas-operativas "Excel operativo con fórmulas vivas: seguimiento, inventarios, tableros. Usala cuando el entregable es una planilla que alguien va a usar y editar." <<EOF
## Herramienta
\`$OFICINA/mkxlsx spec.json salida.xlsx\`

\`\`\`json
{"hojas":[{"nombre":"Seguimiento","encabezado":true,
  "filas":[["Cliente","Plan","Mensual","Estado"],
           ["Spa Aurora","Pro",1200000,"activo"],
           ["Total",null,"=SUM(C2:C2)",null]],
  "formato":{"C2:C3":"moneda"},"anchos":{"A":28}}]}
\`\`\`
Cualquier string que arranca con \`=\` sale como **fórmula real**.
Formatos: moneda, moneda_usd, moneda_mxn, porcentaje, entero, decimal, fecha.

## Reglas
- **Fórmulas, no valores calculados por vos.** Quien la abra tiene que poder
  cambiar un dato y ver el total actualizarse.
- Encabezado congelado (lo hace solo con \`"encabezado": true\`).
- Una hoja de supuestos si hay cálculos.

## Regla
Una planilla que hay que rehacer cada mes está mal hecha. Que se actualice
cambiando datos, no fórmulas.
EOF

# ═══════════════════════ JUSTINIANO — Legal ═══════════════════════
skill justiniano contract-review "Revisar un contrato cláusula por cláusula y marcar riesgos. Usala antes de firmar cualquier cosa." <<EOF
## Orden de lectura (lo que más duele primero)
1. **Obligaciones y niveles de servicio**: ¿a qué te comprometés y qué pasa si
   no lo cumplís?
2. **Responsabilidad**: límites, indemnidades, exclusiones.
3. **Plazo, renovación y salida**: la renovación automática con aviso de 90 días
   es una trampa clásica.
4. **Datos personales**: quién es responsable y quién encargado.
5. **Propiedad intelectual**: de quién es lo que se construye.
6. **Pago**: mora, ajustes, moneda.
7. Ley aplicable y resolución de conflictos.

## Cómo reportás
Cláusula → **qué riesgo concreto crea** → redacción alternativa. Nada de "es
riesgoso" sin decir cómo se rompe.

## Entregable
\`$OFICINA/mkdocx revision.md salida.docx\` con \`{+agregado+}\` y
\`{-eliminado-}\`: sale subrayado en verde y tachado en rojo, que es lo que un
abogado espera ver.

## Regla
No sos el abogado de la empresa. Señalás exposición y decís **cuándo hace falta
uno de verdad con firma**.
EOF

skill justiniano nda-triage "Clasificar un NDA rápido: estándar, negociable o rechazar. Usala cuando llega un acuerdo de confidencialidad." <<EOF
## Los tres cajones
| Veredicto | Cuándo |
|---|---|
| **Estándar** | mutuo, 2-3 años, definición razonable, sin no-competencia |
| **Negociable** | unilateral, plazo largo, o definición muy amplia |
| **Rechazar** | perpetuo, con no-competencia, penalidades desproporcionadas, o
cede propiedad intelectual |

## Las banderas rojas
- **No-competencia escondida** dentro de un NDA. No va ahí.
- **Perpetuidad**: la confidencialidad tiene plazo.
- "Toda información" sin excepciones: lo público no puede ser confidencial.
- Jurisdicción en otro país sin razón.
- Falta la excepción por orden judicial.

## Regla
Un NDA que no podés cumplir operativamente es peor que no firmar. Si te obliga a
destruir toda copia y tenés backups automáticos, no lo vas a cumplir.
EOF

skill justiniano legal-risk "Detectar exposición legal en un producto, feature o práctica. Usala antes de lanzar algo que toque datos, pagos o comunicaciones." <<EOF
## Dónde está el riesgo en AutoKing
1. **Datos personales de terceros.** El agente conversa con los clientes DE
   nuestros clientes: teléfonos, citas, a veces salud. ¿Hay base legal? ¿Se
   informó? ¿Cuánto se retiene?
2. **Mensajería.** Mandar sin consentimiento es sanción y baneo del número.
3. **Cobro y facturación** en tres países.
4. **Promesas de marketing.** Lo que promete la landing es exigible.
5. **Multi-tenancy.** Una fuga entre empresas no es un bug: es una notificación
   de incidente y un problema legal.

## Cómo lo reportás
Riesgo → probabilidad → impacto → mitigación concreta. Separá **prohibido** de
**expone a riesgo**: no son lo mismo y confundirlos paraliza el negocio.

## Regla
Citá la norma o política concreta. "En general suele ser así" no sirve.
EOF

skill justiniano politicas-meta-whatsapp "Reglas de WhatsApp Business y Meta: ventana de 24 h, plantillas, calidad del número. Usala ante cualquier duda de qué se puede mandar." <<EOF
## Por qué es lo más crítico
Un número baneado **mata el producto de un cliente**. No es un incidente
técnico: es un cliente perdido y una reputación.

## La regla que gobierna todo
**Ventana de 24 h.** Dentro de las 24 h desde el último mensaje del usuario se
puede escribir libre. Fuera de la ventana **solo plantillas aprobadas**.

## Estado real del sistema
- Ni el plugin de Kapso ni el adaptador Cloud de Hermes mandan plantillas: los
  agentes **pueden responder pero no volver a escribir**.
- Recordatorios y seguimientos salen de crons que hablan con Kapso directo.
- Hay dos plantillas aprobadas **con voseo** (\`recordatorio_cita\`,
  \`demo_confirmada\`) — inconsistente con el español neutro del resto.

## Reglas
- Categoría correcta: marketing, utilidad o autenticación. Marketing disfrazado
  de utilidad se penaliza.
- Consentimiento antes del primer mensaje, siempre.
- Salida fácil. Quien pide no recibir más, no recibe más.
EOF

skill justiniano documentos-legales "Producir contratos, T&C y políticas en Word o PDF, listos para firmar. Usala cuando el entregable es el documento legal en sí." <<EOF
## Herramientas
$OFI

## Documentos que el negocio necesita
- **Contrato de servicio** (instalación + mensualidad, por mercado)
- **Términos y condiciones** de la plataforma
- **Política de privacidad** y tratamiento de datos
- **Acuerdo de encargado** de tratamiento (somos encargados de los datos que el
  agente maneja por cuenta del cliente)
- **Consentimiento** para mensajería

## Reglas de redacción
- Numeración jerárquica (1, 1.1, 1.1.1): un contrato se cita por número.
- Definiciones al principio, y usadas consistentemente.
- Español neutro, y frases que se entiendan sin abogado al lado.
- Lugar de firma, fecha e identificación de las partes.

## Regla
Una plantilla copiada de internet sin adaptar es peor que nada: da falsa
seguridad. Marcá explícitamente qué necesita revisión de un abogado con firma.
EOF

skill justiniano compliance "Chequeos regulatorios: protección de datos, consumidor y facturación en CO/MX/US. Usala antes de entrar a un mercado o lanzar algo que toque datos." <<EOF
## Marcos que aplican
| Mercado | Qué mirar |
|---|---|
| Colombia | Ley 1581 de protección de datos, habeas data, SIC |
| México | LFPDPPP, aviso de privacidad, INAI |
| USA | reglas estaduales (CCPA si hay California), TCPA para mensajería |
| Todos | políticas de Meta/WhatsApp, que aplican por encima de la ley local |

## Checklist mínimo
- [ ] Aviso de privacidad publicado y accesible
- [ ] Base legal para cada tratamiento
- [ ] Plazo de retención definido, y que se cumpla de verdad
- [ ] Vía para ejercer derechos (acceso, rectificación, supresión)
- [ ] Encargados y subencargados identificados
- [ ] Procedimiento de notificación de incidentes

## Regla
Cumplir en el papel y no en el sistema no es cumplir. Si la política dice que se
borra a los 12 meses, tiene que haber algo que lo borre.
EOF

echo "Parte 1 lista: $N skills escritas."
