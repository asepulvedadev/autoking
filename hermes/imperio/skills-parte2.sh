#!/usr/bin/env bash
# Skills del Imperio — parte 2: los departamentos que la referencia no tenía y
# este sistema sí necesita.
# ramses · ciro · carlomagno · ricardo · gengis
#
# Idempotente. Correr COMO ROOT EN EL VPS:  bash /root/imperio/skills-parte2.sh
set -euo pipefail
PROFILES=/root/.hermes/profiles
OFICINA=/root/imperio/bin
N=0

skill() {
  local perfil=$1 nombre=$2 desc=$3
  local dir=$PROFILES/$perfil/skills/$nombre
  mkdir -p "$dir"
  { printf -- '---\nname: %s\ndescription: "%s"\nlicense: private\nmetadata:\n  author: autoking\n  imperio: %s\n---\n\n' \
      "$nombre" "$desc" "$perfil"; cat; } > "$dir/SKILL.md"
  N=$((N+1))
}

OFI="**Oficina del Imperio**: \`$OFICINA/md2pdf\` · \`$OFICINA/mkxlsx\` · \`$OFICINA/mkdocx\` · \`$OFICINA/grafico\`"

# ═══════════════════════ RAMSÉS II — Infraestructura ═══════════════════════
skill ramses diagnostico-vps "Diagnosticar el estado del VPS sin romper nada: servicios, puertos, recursos, logs. Usala como PRIMER paso ante cualquier síntoma." <<EOF
## Regla número uno
**Verificá el puerto, no el estado del servicio.** Los servicios corren bajo
\`systemctl --user\`; sin \`--user\` el comando **devuelve éxito y miente**. Así
OpenClaw siguió atendiendo WhatsApp mientras \`is-active\` decía \`inactive\`.

## Barrido de diagnóstico
\`\`\`bash
export XDG_RUNTIME_DIR=/run/user/0
systemctl --user list-units --type=service --no-pager | grep hermes
ss -tlnp | grep -E ':(8080|8643|8644|8645|8648|8649|8650|8790|8791) '
free -h; df -h /; uptime
journalctl --user -u hermes-gateway-king -n 50 --no-pager
\`\`\`

## Traducción de códigos HTTP
**405** = gateway vivo (rechaza GET) · **401** = servicio vivo pidiendo firma ·
**502** = upstream muerto. Un 401 o 405 es **buena** señal.

## Antes de tocar
Leé \`/root/INFRA.md\`. El VPS lo comparten AutoKing y J4 y no se conocen entre
sí. El 502 en la raíz de \`ia.autoking.pro\` es **preexistente** (nada escucha en
:18789), no lo persigas.
EOF

skill ramses nginx-y-tls "Editar nginx y manejar certificados sin cortar el servicio. Usala para agregar un dominio, cambiar un proxy o renovar TLS." <<EOF
## Sitios
\`/etc/nginx/sites-enabled/\` — \`ia.autoking.pro\`, \`api.grupoj4.com\`,
\`apij4.craftia.com.mx\`, \`default\`.

## Siempre, en este orden
\`\`\`bash
cp /etc/nginx/sites-enabled/<sitio> /root/backups/<sitio>.\$(date +%F)
# editar
nginx -t                      # NUNCA saltear
systemctl reload nginx        # reload, no restart
\`\`\`
\`nginx -t\` antes de recargar. Un reload con config inválida deja el sitio caído.

## Timeouts
El asistente de J4 tarda 40-90 s (tool-calling real). Los bloques de J4 tienen
\`proxy_read_timeout\`/\`proxy_send_timeout\` en 120 s. **Si los bajás, nginx
corta antes que el backend** y el usuario ve un error aunque todo funcionó.

## DNS
Confirmá que el dominio **resuelve** antes de darlo por bueno.
\`apij4.craftia.com.mx\` lleva meses roto en el registrador y nadie lo notó.
EOF

skill ramses systemd-y-gateways "Manejar los gateways de Hermes y los servicios de AutoKing. Usala para reiniciar, ver logs o diagnosticar un agente que no responde." <<EOF
## Qué scope tiene cada cosa
| Servicio | Scope |
|---|---|
| \`hermes-gateway-{king,mayand,johan}\` | **usuario** (\`--user\`) |
| \`hermes-gateway-{j4-admin,j4-dev,j4-readonly}\` | **usuario** |
| \`hermes-gateway\` (Rey / default) | **usuario** |
| \`autoking-control\` | **usuario** |
| \`autoking-bridge\` | **sistema** ← la excepción |

\`\`\`bash
export XDG_RUNTIME_DIR=/run/user/0
systemctl --user restart hermes-gateway-king
journalctl --user -u hermes-gateway-king -n 50 --no-pager
\`\`\`

## Trampa de lectura de logs
Al reiniciar aparece \`Main process exited, status=1/FAILURE\` **del proceso
viejo**, antes de \`Started\`. No es una falla del nuevo. Confirmá con
\`NRestarts=0\` y \`SubState=running\`.

## Antes de reiniciar
**King, Mayand y Johan atienden clientes reales.** Un reinicio corta
conversaciones en curso. Avisá antes. Reiniciar el de Rey (default) es seguro.
EOF

skill ramses backup-y-restore "Backup y restauración de verdad probada. Usala ANTES de cualquier cambio riesgoso y para verificar que los backups sirven." <<EOF
## Lo que ya corre
\`/root/autoking-ops/backup.sh\` — diario 4 a.m. Salida en \`/root/autoking-backups/\`.

## Antes de tocar algo
\`\`\`bash
cp <archivo> <archivo>.bak-\$(date +%Y%m%d)     # config puntual
bash /root/autoking-ops/backup.sh              # backup completo
\`\`\`

## La única pregunta que importa
**¿Alguien probó restaurarlo?** Un backup no verificado es una carpeta que
ocupa disco. Probá la restauración en un directorio aparte, nunca encima del
original.

## Rollback disponible
\`/root/rollback-openclaw/\` — la vuelta atrás a OpenClaw. Última opción, no
primera. **No borres \`.openclaw/\`** sin confirmar que la migración cerró bien.

## Regla
Backup antes de tocar. Siempre. Sin excepción, ni "esto es chiquito".
EOF

skill ramses firewall-y-puertos "Manejar UFW y el mapa de puertos sin dejar nada expuesto. Usala antes de abrir cualquier puerto." <<EOF
## Estado
UFW **activo** desde 2026-08-03. Solo entra 22, 80 y 443. Todo lo demás
(8080, 8643-8645, 8648-8650, 8790, 8791) queda bloqueado desde afuera. UFW no
filtra loopback: nginx → localhost sigue funcionando.

## Mapa de puertos ocupados
\`8080\` J4 backend · \`8643/44/45\` Hermes J4 (dev/readonly/admin) ·
\`8648/49/50\` King/Mayand/Johan · \`8790\` bridge · \`8791\` control.

## Antes de abrir un puerto
1. ¿Ya está ocupado? Mirá la tabla y \`ss -tlnp\`.
2. ¿Puede ir detrás de nginx con TLS? **Entonces va detrás de nginx.**
3. Si de verdad necesita exposición directa: \`ufw allow <puerto>/tcp\` y
   **documentalo en \`/root/INFRA.md\`**.

## Regla
Los gateways de Hermes escuchan en \`0.0.0.0\` por decisión de Hermes, no
nuestra. Lo único que los tapa es UFW. Si desactivás el firewall, quedan
expuestos a internet sin TLS.
EOF

skill ramses deploy-y-rollback "Desplegar cambios en el VPS y volver atrás si falla. Usala para deploys del backend de J4 o de los servicios de AutoKing." <<EOF
## J4
\`\`\`bash
cd /root/apps/j4 && git pull && docker compose up -d --build
./scripts/smoke-test.sh https://api.grupoj4.com
\`\`\`
Usá \`api.grupoj4.com\`, **nunca** \`apij4.craftia.com.mx\` (DNS roto).
Las migraciones goose van embebidas en el binario y se aplican al boot; si una
falla, el proceso hace \`os.Exit(1)\` en vez de arrancar con schema viejo.

## Web (AutoKing)
Vive en **Vercel**, no acá. Deploy desde la raíz del monorepo.

## Antes de cualquier deploy
- [ ] Backup hecho
- [ ] Rollback escrito con comandos exactos
- [ ] No es hora pico de WhatsApp
- [ ] Avisado a quien atiende clientes

## Regla
Si no podés escribir el comando de rollback antes de deployar, no estás listo
para deployar.
EOF

# ═══════════════════════ CIRO — Datos y multi-tenant ═══════════════════════
skill ciro rls-y-aislamiento "Revisar y escribir políticas RLS que aíslen tenants de verdad. Usala ante CUALQUIER cambio de permisos o tabla nueva." <<EOF
## Por qué es la ley
RLS es **lo único** que separa legalmente a una empresa de otra. Una fuga entre
tenants no es un bug: es una notificación de incidente.

## El error que ya pasó
Todas las políticas chequeaban \`profiles.role = 'admin'\`. Los roles reales son
\`administrador | dev | vendedor | cliente\`. **\`admin\` nunca existió** → las
políticas evaluaban FALSE siempre y RLS era decorativo. La app andaba solo porque
usa \`service_role\`, que bypassea RLS.

## Los helpers
\`app.tenant_ids()\`, \`app.es_staff()\`, \`app.manda_en(t)\` — todos
**SECURITY DEFINER**, que es obligatorio: si no, la policy de \`memberships\`
recursa infinitamente.

## Checklist para una tabla nueva
- [ ] \`tenant_id\` NOT NULL con default \`app.tenant_actual()\`
- [ ] Política \`tenant_rw\` como las otras 8 tablas
- [ ] FORCE RLS
- [ ] Probado con un usuario de OTRO tenant: tiene que ver **0 filas**
- [ ] Ninguna política \`TO public\` (incluye \`anon\`, y la anon key viaja en el
      bundle del browser)
EOF

skill ciro migraciones-supabase "Escribir y aplicar migraciones sin romper lo que ya funciona. Usala para cualquier cambio de esquema." <<EOF
## La trampa que ya rompió todo
Poner \`tenant_id NOT NULL\` **sin default** en 7 tablas rompió TODOS los INSERT
del panel. La solución fue \`app.tenant_actual()\` como DEFAULT: devuelve el
tenant del que escribe si tiene exactamente una membresía, y **null si hay
ambigüedad** (fail-closed).

**No se usó default=autoking a propósito**: eso escribiría datos de una empresa
dentro de otra en silencio.

## Orden de trabajo
1. Escribí la migración pensando en qué pasa con las filas **que ya existen**.
2. ¿Es reversible? Escribí el down.
3. Probá en una rama o base de prueba, no en producción.
4. Después de aplicar, probá una **escritura real desde el panel**. Un select en
   verde no prueba que el insert funcione.

## Regla
Una función con parámetro de tenant va **sin default** (\`match_knowledge\` tiene
\`filter_tenant uuid\` obligatorio). Si un caller lo olvida, tiene que fallar, no
devolver todo.
EOF

skill ciro sql-queries "Extraer datos con SQL de forma segura y eficiente. Usala para reportes, auditorías y responder preguntas de negocio con datos." <<EOF
## Antes de escribir
Mirá el esquema real, no lo que recordás. Las 8 tablas de negocio tienen
\`tenant_id\` y RLS.

## Reglas duras
- **Filtrá por \`tenant_id\` SIEMPRE**, incluso si RLS ya lo haría. Defensa en
  profundidad, y si corrés con \`service_role\` RLS no te protege.
- \`SELECT\` con columnas explícitas, nunca \`*\` en algo que va a producción.
- \`LIMIT\` mientras explorás.
- **Nada de \`UPDATE\`/\`DELETE\` sin \`WHERE\` probado primero como \`SELECT\`.**

## Para reportes
\`$OFICINA/mkxlsx\` con fórmulas vivas, para que quien lo reciba pueda mirar
distinto sin pedirte otra consulta.

## Regla
Si la consulta responde una pregunta de negocio, escribí **la pregunta** arriba
en un comentario. En seis meses nadie va a saber qué se estaba buscando.
EOF

skill ciro auditoria-esquema "Auditar el esquema buscando riesgos: grants, SECURITY DEFINER, políticas laxas. Usala periódicamente y después de cambios grandes." <<EOF
## Lo que encontró la última auditoría
Las vistas \`citas_para_recordar\` y \`seguimientos_a_enviar\` (SECURITY DEFINER,
multi-tenant a propósito para un cron externo) tenían grants de
\`anon\`/\`authenticated\` **mucho más amplios** de lo que nadie pensaba: no solo
SELECT, también INSERT/UPDATE/DELETE/TRUNCATE. Cualquiera sin autenticar podía
leer citas de **todos** los tenants vía PostgREST.

**La lección**: no confiar en "probablemente ya está bien acotado". Correr la
query de grants.

## Checklist
- [ ] Grants reales de \`anon\` y \`authenticated\` (tabla por tabla, no asumir)
- [ ] Funciones SECURITY DEFINER: ¿tienen \`SET search_path\`?
- [ ] Políticas \`TO public\` — ninguna debería existir sobre datos de negocio
- [ ] Extensiones en \`public\`
- [ ] Buckets de Storage marcados públicos

## Pendientes conocidos
\`agente_assets\` tiene \`assets_public_read TO public USING(true)\`. Y el RPC
\`search_youtube_learning\` es SECURITY DEFINER ejecutable por \`anon\` sin
llamador en el repo — probable consumidor externo, confirmar antes de tocar.
EOF

skill ciro performance-postgres "Diagnosticar y arreglar consultas lentas. Usala cuando algo tarda o antes de que el volumen crezca." <<EOF
## Orden de diagnóstico
1. **\`EXPLAIN (ANALYZE, BUFFERS)\`** de la consulta real, con datos reales. Sin
   esto estás adivinando.
2. Buscá \`Seq Scan\` sobre tablas grandes.
3. ¿El índice existe y **se está usando**? Un índice que el planner ignora no
   sirve.
4. ¿La consulta trae más filas de las que necesita?

## Índices en un esquema multi-tenant
Casi siempre el índice útil es **compuesto empezando por \`tenant_id\`**: toda
consulta filtra por ahí primero. Las 8 tablas ya tienen índice en \`tenant_id\`.

## pgvector (RAG)
\`knowledge_base\` usa embeddings \`gte-small\` de 384 dimensiones. Si las
búsquedas semánticas van lentas, revisá el índice vectorial y el
\`match_count\`: traer 50 chunks para usar 3 es desperdicio.

## Regla
Medí antes y después. "Quedó más rápido" sin número no es un resultado.
EOF

skill ciro integridad-datos "Garantizar que los datos sean consistentes: constraints, foreign keys, datos huérfanos. Usala cuando aparezcan datos raros o antes de un modelo nuevo." <<EOF
## La base defiende, no la app
Un constraint en la base vale más que diez validaciones en el frontend: la app
se puede saltear, la base no.

## Qué revisar
- **Foreign keys** con \`ON DELETE\` explícito. ¿Qué pasa con las citas si se
  borra el cliente?
- **CHECK** para estados válidos. El CHECK de \`profiles.role\` es lo que espeja
  \`ROLES\` en \`lib/roles.ts\`: si cambia uno, cambia el otro.
- **UNIQUE** donde la lógica lo exige.
- **NOT NULL** con default pensado (ver \`app.tenant_actual()\`).
- **Huérfanos**: filas apuntando a algo que ya no existe.

## Semántica que ya se confundió
\`ctx.tenantId\` tenía **dos significados** distintos en el código: en algunos
adapters era \`clientes.id\` y en otros la identidad del tenant. Se separó:
\`tenantId\` = frontera dura (\`tenants\`), \`clienteId\` = namespace adentro.
**Cuidado con reutilizar un nombre para dos conceptos.**

## Regla
Antes de agregar un constraint a una tabla con datos, contá cuántas filas lo
violan. Si hay alguna, la migración falla.
EOF

# ═══════════════════ CARLOMAGNO — Documentación y RAG ═══════════════════
skill carlomagno documentacion-tecnica "Escribir documentación que se lea y sirva. Usala después de construir algo o cuando algo se explicó dos veces." <<EOF
## Qué documentar (y qué no)
**Sí**: el por qué de una decisión, las trampas que costaron tiempo, cómo se
opera algo, qué NO hacer y por qué.
**No**: lo que el código ya dice. Un doc que lista funciones queda viejo en una
semana y nadie lo actualiza.

## Estructura
1. Qué es y para quién, en dos líneas.
2. Lo que alguien necesita para **empezar**.
3. El detalle.
4. Las trampas. Esta es la sección más valiosa y la que casi nadie escribe.

## Reglas
- Comandos copiables y probados. Un comando que no corriste no va.
- Fechá lo que sea estado ("verificado el 2026-08-03").
- Enlazá en vez de repetir: dos docs que dicen lo mismo se van a contradecir.

## Regla
Si al releerlo en tres meses no entendés por qué se decidió algo, faltaba el
por qué.
EOF

skill carlomagno rag-knowledge-base "Mantener la base de conocimiento que alimenta a los agentes. Usala cuando un agente responda mal, desactualizado o inventando." <<EOF
## Cómo funciona
Tabla \`knowledge_base\` en Supabase, embeddings \`gte-small\` (384 dim), edge
function \`embed\`, RPC \`match_knowledge\`.

## Por qué es crítico
Si el chunk está mal, **el agente miente con total seguridad**. Un cliente recibe
un precio viejo y lo toma como cierto. El RAG no es documentación interna: es lo
que el agente le dice a un cliente que está por comprar.

## Reglas de un buen chunk
- **Autocontenido.** Se recupera solo, sin el párrafo anterior.
- **Un tema por chunk.** Mezclar dos hace que no gane ninguno.
- **Sin precios escritos a mano.** Los precios salen de \`plan_precios\`. Si un
  chunk tiene un precio, se desactualiza en silencio.
- Español neutro: lo lee un cliente a través del agente.

## Al actualizar
\`match_knowledge\` lleva \`filter_tenant\` **obligatorio**. Y después de cambiar
precios en la base, hay que **re-sincronizar el RAG y la persona del agente**: son
tres lugares, no uno.
EOF

skill carlomagno manual-operativo "Escribir y mantener los manuales de operación diaria. Usala cuando alguien tiene que hacer algo recurrente sin supervisión." <<EOF
## Diferencia con un SOP
El SOP es el procedimiento exacto de una tarea. El manual operativo es el mapa:
qué existe, quién se ocupa, dónde mirar cuando algo falla.

## Lo que tiene que responder
1. ¿Qué piezas hay y qué hace cada una?
2. ¿Qué mirar todos los días para saber si está bien?
3. ¿Cuáles son los síntomas típicos y qué significan?
4. ¿A quién se escala y cuándo?

## Docs que ya existen
\`docs/MANUAL-OPERATIVO-AGENTE.md\`, \`docs/ARQUITECTURA-MULTITENANT.md\`,
\`/root/INFRA.md\` (el del VPS, el más actualizado). Antes de escribir uno nuevo,
mirá si el que falta es una sección de uno de estos.

## Regla
Un manual que no se actualiza cuando cambia el sistema es peor que no tenerlo:
manda a la gente a buscar cosas que ya no están.
EOF

skill carlomagno curaduria-y-drift "Detectar documentación desactualizada o que contradice al sistema real. Usala periódicamente y cuando dos docs no coincidan." <<EOF
## Por qué importa
Un doc que describe una arquitectura que ya no existe hace que la gente **razone
sobre un sistema imaginario**. Es peor que no tener doc.

## Drift ya detectado
- \`docs/ESTADO-Y-ROADMAP.md\` describe **OpenClaw**, que está apagado desde el
  2026-07-30. Todo lo que dice de arquitectura es histórico.
- \`j4/backend/SPEC.md\` dice que el backend corre en una EC2
  (\`3.223.242.188\`). **Corre en este VPS**, en un contenedor. El puerto 22 de
  esa EC2 está cerrado.
- \`hermes/perfiles/asistente-AGENTS.md\` del repo está **18 líneas atrás** del
  \`AGENTS.md\` del VPS (le falta la sección de Engram). **Nunca sobreescribir el
  del VPS con la plantilla del repo.**

## Método
1. Tomá la afirmación del doc.
2. Verificala contra el sistema (comando, archivo, endpoint).
3. Si no coincide: **marcá el doc como desactualizado y decí qué lo reemplaza**.
   Borrar pierde el contexto histórico.
4. Comparar md5 antes de copiar cualquier plantilla sobre un archivo vivo.

## Regla
Una sola fuente de verdad por tema. Si hay dos, decidí cuál manda y anotá en la
otra que no manda.
EOF

skill carlomagno changelog-releases "Escribir changelogs y notas de versión que le sirvan a alguien. Usala al cerrar un ciclo de cambios." <<EOF
## Para quién escribís
- **Changelog interno**: qué cambió y qué hay que saber para operarlo.
- **Notas para el cliente**: qué gana. No le importa el refactor.

## Estructura
Agrupá por **impacto**, no por commit:
- **Nuevo** — lo que antes no se podía hacer
- **Arreglado** — con el síntoma que veía el usuario, no el nombre del bug
- **Cambiado** — y si hay que hacer algo al respecto
- **Atención** — lo que rompe compatibilidad

## Reglas
- El síntoma antes que la causa: "el formulario de leads no guardaba" le gana a
  "faltaba Prefer: return=minimal".
- Fechá cada versión.
- Si algo requiere acción manual, va **arriba y en negrita**.

## Regla
Un changelog que es una lista de mensajes de commit no es un changelog. Si nadie
lo puede leer sin conocer el código, está mal escrito.
EOF

skill carlomagno onboarding-equipo "Preparar la documentación para que alguien nuevo arranque solo. Usala cuando entra alguien al equipo o toma un área nueva." <<EOF
## El objetivo
Que la persona llegue al **primer aporte real** sin tener que interrumpir a nadie
tres veces por hora.

## Qué necesita, en orden
1. **Qué es el negocio** y quién es el cliente. Sin esto, el código no tiene
   sentido.
2. **Levantar el entorno**, con comandos probados de punta a punta.
3. **El mapa**: qué hay dónde y por qué está así.
4. **Las reglas no negociables** (RLS, precios desde la base, español neutro
   para clientes, producción tiene clientes atendiendo).
5. **Una primera tarea real**, chica y con dueño para preguntas.

## Contexto
\`CLAUDE.md\` en la raíz del repo ya concentra las reglas y las trampas. El
onboarding debería **apuntar ahí**, no repetirlo.

## Regla
Probá tu propio onboarding en una máquina limpia. Los pasos que "obviamente
funcionan" son los que fallan.
EOF

# ═══════════════════════ RICARDO — QA y seguridad ═══════════════════════
skill ricardo tests-comportamiento "Escribir tests que prueben comportamiento y no implementación. Usala cuando haya que cubrir lógica nueva o un bug que volvió." <<EOF
## La diferencia
Un test de **comportamiento** describe qué hace el sistema desde afuera. Un test
de **implementación** espeja el código: si refactorizás, se rompe sin que nada
esté mal. Eso hace que el equipo deje de confiar en los tests.

## Cómo se escribe
1. **Arrange**: el estado mínimo necesario.
2. **Act**: una sola acción.
3. **Assert**: el resultado observable, no el interno.

El nombre del test dice el comportamiento: \`no_permite_leer_datos_de_otro_tenant\`,
no \`test_rls_1\`.

## Prioridad en este proyecto
1. Aislamiento entre tenants (lo que más duele si falla)
2. Cálculo de precios
3. Captación de leads de la landing
4. Permisos por rol y por membresía

## Regla
Un bug arreglado sin test que lo cubra va a volver. Escribí el test que falla
**antes** del arreglo.
EOF

skill ricardo casos-borde "Encontrar los casos que nadie probó. Usala antes de dar por terminada cualquier feature." <<EOF
## El catálogo
**Vacío**: lista sin elementos, string vacío, null, undefined.
**Uno**: muchas cosas se rompen con exactamente un elemento.
**Muchos**: 10.000 filas, ¿pagina? ¿timeout?
**Límites**: 0, -1, el máximo, el máximo + 1.
**Texto**: emojis, acentos, comillas, saltos de línea, RTL. Un nombre con
apóstrofo rompe más cosas de las que se cree.
**Tiempo**: zona horaria, cambio de día, fin de mes, año bisiesto.
**Concurrencia**: dos personas guardando lo mismo a la vez.
**Red**: se cae a mitad, responde lento, responde 200 con basura.

## Específicos de AutoKing
- Un WhatsApp que llega **fuera** de la ventana de 24 h
- Un usuario con **cero** membresías, y otro con **dos** (\`app.tenant_actual()\`
  devuelve null a propósito — fail-closed)
- Un tenant intentando leer datos de otro
- Un lead con el mismo teléfono que un cliente existente

## Regla
Empezá por el borde, no por el camino feliz. El camino feliz ya lo probó quien
lo escribió.
EOF

skill ricardo pruebas-navegador "Probar la app en un navegador real: flujos, consola, red y móvil. Usala antes de aprobar cualquier cambio visible." <<EOF
## Qué se verifica siempre
1. **El flujo completo**, como lo haría un usuario.
2. **Consola limpia**: cero errores nuevos.
3. **Pestaña de red**: ¿el 200 trajo lo que esperabas? ¿hay 4xx callados?
4. **Formularios**: vacío, con basura, con el campo al límite, doble submit.
5. **Móvil**: es de donde entra la mayoría del tráfico.

## Trampa del proyecto
El insert de leads necesita \`Prefer: return=minimal\`. Si alguien agrega
\`.select()\`, PostgREST hace \`INSERT ... RETURNING\`, que exige una policy de
SELECT que \`anon\` no tiene a propósito → **la captación de leads se rompe en
silencio**. El form parece funcionar y no guarda nada.

## Regla
"Anda en mi máquina" no es una verificación. Decí en qué navegador, qué
resolución y qué flujo exacto probaste.
EOF

skill ricardo auditoria-seguridad "Auditar seguridad de un cambio o del sistema. Usala antes de mergear algo que toque auth, datos o permisos." <<EOF
## Orden de revisión
1. **Secretos**: ¿algo con \`NEXT_PUBLIC_\` que no debería? La anon key viaja en
   el bundle del browser.
2. **\`service_role\`**: bypassea RLS. Solo 4 usos legítimos en la web
   (onboarding, creativos, usuarios, factory). **Un quinto se justifica o no va.**
3. **RLS**: ¿la tabla nueva tiene política? ¿alguna \`TO public\`?
4. **Autorización, no solo autenticación**: estar logueado no es tener permiso.
   El rol habilita la ruta; la **membresía** decide a qué agente.
5. **Entrada del usuario**: inyección, path traversal, XSS.
6. **Rutas públicas**: \`/onboarding/[token]\` usa \`service_role\` con el token
   como única auth. ¿El token expira? ¿es adivinable?

## Regla
Reportá con **cómo se explota**, no con "es inseguro". Un hallazgo sin vector de
ataque no se prioriza nunca.
EOF

skill ricardo pentest-multitenant "Atacar activamente el aislamiento entre tenants. Usala después de cualquier cambio de RLS, permisos o esquema." <<EOF
## Por qué existe esta skill
Es el riesgo más grave del producto. Una fuga entre empresas no es un bug: es
una notificación de incidente, un problema legal y la pérdida de confianza de
todos los clientes a la vez.

## El ataque, paso a paso
1. Creá (o usá) un usuario del tenant **A**.
2. Conseguí un ID real de un recurso del tenant **B**.
3. Pedí ese recurso como A: por la UI, por la API y por **PostgREST directo con
   la anon key**.
4. Repetí con INSERT, UPDATE y DELETE, no solo lectura.
5. Probá también sin autenticar.

**Resultado esperado: 0 filas o error. Nunca datos.**

## Verificado antes con curl
La fuga de \`knowledge_base\` se probó con \`curl\` antes (http 200, 3 filas
reales) y después (0 filas). **Ese es el estándar**: se prueba con la herramienta
cruda, no confiando en que la UI filtre.

## Regla
Si corriste la prueba con \`service_role\`, no probaste nada: bypassea RLS por
diseño. Usá la anon key y un JWT de usuario real.
EOF

skill ricardo prevenir-regresiones "Evitar que un bug arreglado vuelva. Usala cada vez que se arregla algo." <<EOF
## El ciclo correcto
1. **Reproducí** el bug primero. Si no lo podés reproducir, no sabés si lo
   arreglaste.
2. **Escribí el test que falla** por ese motivo exacto.
3. Arreglá.
4. El test pasa. Y **los demás siguen pasando**.

## Los que más vuelven en este proyecto
- El \`.select()\` en el form de leads (rompe la captación en silencio)
- Políticas RLS con el rol \`admin\`, que no existe
- \`systemctl\` sin \`--user\` (parece que apagó y no apagó)
- Sobreescribir el \`AGENTS.md\` del VPS con la plantilla del repo
- Precios hardcodeados en vez de leídos de la base
- El parche \`is_reconnect\` del plugin de Kapso, que se pierde al actualizar

## Regla
Un arreglo sin test es una promesa. Y si el bug ya volvió una vez, el test no es
opcional: es la única razón por la que no va a volver una tercera.
EOF

# ═══════════════════════ GENGIS KAN — Prospección ═══════════════════════
skill gengis encontrar-negocios "Encontrar negocios objetivo con datos reales. Usala para armar listas de prospección." <<EOF
## El perfil que compra
Negocios de LatAm que **atienden por WhatsApp y pierden clientes por no
contestar**: spas, barberías, consultorios, clínicas estéticas, veterinarias,
talleres. Con volumen suficiente para que perder un cliente duela, y sin equipo
para atender 24/7.

## Señales de que es buen prospecto
- WhatsApp Business publicado
- Reseñas que mencionan "no contestan" o "no me respondieron"
- Agenda por turnos (la cita es el corazón del negocio)
- Activo en redes: entiende que el canal digital le trae plata

## Señales de que no
- Sin presencia digital (el ciclo de venta es larguísimo)
- Cadena grande con proveedor corporativo
- Negocio sin citas ni seguimiento

## Herramienta
El panel tiene **Prospección** con Google Maps vía Outscraper →
\`prospects\` + \`prospect_outreach\`. Ahí se registra todo.

## Regla
Cien prospectos calificados le ganan a mil nombres. La lista larga sin criterio
quema la reputación del número.
EOF

skill gengis calificar-leads "Calificar rápido y descartar sin culpa. Usala antes de invertir tiempo en cualquier prospecto." <<EOF
## Las cuatro preguntas
1. **¿Tiene el dolor?** ¿Pierde clientes por no contestar? Si no lo siente, no
   compra.
2. **¿Decide?** ¿Hablás con el dueño o con alguien que "lo va a comentar"?
3. **¿Le alcanza?** Instalación + mensualidad, en su moneda.
4. **¿Ahora?** ¿Hay una razón para hacerlo este mes?

## Descartar rápido es ganar
Es mejor un "no" hoy que tres semanas persiguiendo a alguien que nunca iba a
comprar. Un "no" libera tiempo para el que sí.

## Contexto
El pipeline con etapas vive en \`features/crm/pipeline.ts\`. La calificación se
registra ahí, no en la cabeza de nadie.

## Regla
**Los precios salen de la base** (\`planes\`, \`plan_precios\`), en la moneda del
mercado del prospecto. Nunca de memoria y nunca improvisando un descuento.
EOF

skill gengis primer-contacto "Escribir el primer mensaje que consigue una respuesta. Usala antes de escribirle a cualquier prospecto nuevo." <<EOF
## La regla que nadie cumple
**Investigá antes de escribir.** Un mensaje genérico quema el contacto para
siempre: ya te leyó y ya te descartó. No hay segunda impresión.

## Estructura
1. **Algo específico de SU negocio** — algo que solo alguien que miró podría
   decir. Una reseña, un horario, algo que ofrecen.
2. **El dolor, en una frase**, sin acusar.
3. **Una pregunta fácil de responder.** No pidas una reunión de entrada.

Cortísimo. Cuatro líneas. Si necesita scroll, no se lee.

## Lo que mata la respuesta
"Espero que estés bien", presentarte durante tres líneas antes de decir para qué
escribís, mandar el catálogo completo, o pedir 30 minutos de entrada.

## Reglas duras
- **Español neutro** (cero voseo): son colombianos y mexicanos.
- **Consentimiento**: sin opt-in, no se manda. Un reporte de spam degrada el
  número.
- Nunca prometas lo que el producto no hace.
EOF

skill gengis secuencias-outbound "Diseñar la secuencia de seguimiento sin volverse molesto. Usala cuando el primer mensaje no tuvo respuesta." <<EOF
## Cuántos y cuándo
Tres o cuatro contactos, espaciados, y **cada uno aporta algo nuevo**. Un "¿viste
mi mensaje?" no es seguimiento: es presión sin valor.

| # | Cuándo | Qué aporta |
|---|---|---|
| 1 | día 0 | el gancho específico |
| 2 | día 3 | una prueba: caso de un negocio parecido |
| 3 | día 8 | otro ángulo del dolor |
| 4 | día 15 | cierre elegante: "cierro el tema, avisame si cambia" |

Ese último suele traer más respuestas que los tres anteriores.

## Reglas
- **Cada mensaje se sostiene solo.** Puede que no haya leído los anteriores.
- Si no responde en cuatro, **se cierra**. Insistir daña la marca y el número.
- Un "no" se respeta la primera vez.

## Contexto
Hay seguimiento automático para ventas perdidas por silencio, y los crons de
seguimientos hablan con Kapso directo. **Fuera de la ventana de 24 h solo entran
plantillas aprobadas** — y hoy nadie manda plantillas desde el agente.
EOF

skill gengis enriquecer-datos "Completar la información de un prospecto antes de contactarlo. Usala entre encontrar y escribir." <<EOF
## Qué buscar
- **Quién decide** y cómo se llama
- **Volumen aproximado**: reseñas, horarios, cantidad de sedes
- **Canal principal**: ¿WhatsApp está publicado?
- **Dolor visible**: reseñas que mencionan demoras o falta de respuesta
- **Contexto local**: ciudad, moneda, rubro exacto

## De dónde
Google Maps (ya integrado vía Outscraper), el sitio propio, redes sociales,
reseñas. Las reseñas negativas son la mejor fuente de dolor real que existe.

## Reglas
- **Solo información pública.** Nada de datos obtenidos de forma dudosa.
- Registrá **la fuente** de cada dato: en dos meses nadie va a saber de dónde
  salió.
- Si un dato no lo pudiste verificar, marcalo como no verificado. Un dato falso
  en el primer mensaje te quema.

## Regla
Enriquecer tiene un techo. Si llevás 20 minutos en un prospecto que factura
poco, la matemática no cierra.
EOF

skill gengis registro-crm "Registrar todo en el CRM para que el pipeline sea real. Usala después de CADA interacción." <<EOF
## Por qué
Un pipeline que no refleja la realidad es peor que ninguno: se toman decisiones
sobre datos falsos. El dashboard muestra leads por etapa, tasa de conversión y
valor del embudo — todo sale de acá.

## Dónde vive
- \`leads\` — de la landing y del agente
- \`prospects\` + \`prospect_outreach\` — prospección de Google Maps
- \`clientes\` — los que compraron
- Pipeline con etapas y notas por contacto: \`features/crm/pipeline.ts\`

## Qué se registra, siempre
Quién, cuándo, por qué canal, **qué se dijo**, en qué etapa quedó y **cuál es el
próximo paso con fecha**. Sin próximo paso, el prospecto se pierde por olvido, no
por decisión.

## Reglas
- Registrá **al terminar**, no "después". El después no llega.
- Una etapa refleja lo que pasó, no lo que esperás que pase.
- Un prospecto sin actividad en 30 días **no está en el pipeline**: está muerto.
  Sacalo o reactivalo, pero no lo dejes inflando el número.
EOF

echo "Parte 2 lista: $N skills escritas."
