#!/usr/bin/env bash
#
# AutoKing — health-check de los agentes en Hermes.
#
# Reemplaza al de OpenClaw, que desde la migración corría `openclaw gateway
# status` y fallaba siempre. Un chequeo que siempre falla no avisa de nada:
# es ruido con el que uno se acostumbra a convivir.
#
# ── DOS NIVELES, POR QUÉ ────────────────────────────────────────────────────
#
#   --rapido  (cada 5 min)  puertos, servicios, webhook público. No gasta
#                           cuota del modelo. Detecta el 90% de las caídas.
#   --profundo (cada hora)  además le pide a cada agente que responda de
#                           verdad. Detecta lo que el rápido no ve: token
#                           vencido, cuota agotada, MCP colgado.
#
# La inferencia real cuesta cuota de la suscripción. Cada 5 minutos serían
# ~576 llamadas por día entre los dos agentes, para vigilar algo que casi
# nunca cambia. Cada hora son 48.
#
# ── AVISA, NO SOLO LOGUEA ───────────────────────────────────────────────────
#
# El script viejo escribía al log y salía con código != 0. Nadie mira un log.
# Este manda email por Resend, con anti-repetición: mientras el problema siga
# siendo el mismo, avisa una vez por hora en vez de cada 5 minutos.
#
set -uo pipefail
export HOME=/root
export PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/bin

MODO="${1:---rapido}"
DIR=/root/autoking-ops
LOG=$DIR/health-hermes.log
ESTADO=$DIR/.health-ultimo-aviso
mkdir -p "$DIR"
ahora() { date -Is; }

FALLOS=()

anotar() { echo "$(ahora) $1" >> "$LOG"; }

# ── 1 · Servicios y puertos ─────────────────────────────────────────────────
declare -A PUERTO=( [king]=8648 [mayand]=8649 )

for perfil in king mayand; do
  p=${PUERTO[$perfil]}

  # El servicio vive en el systemd de USUARIO. Sin --user, `is-active`
  # responde "inactive" aunque el proceso esté atendiendo — el mismo bug que
  # hizo que `systemctl stop openclaw-gateway` no apagara OpenClaw.
  if ! systemctl --user is-active --quiet "hermes-gateway-$perfil" 2>/dev/null; then
    FALLOS+=("servicio hermes-gateway-$perfil caído")
  fi

  # El puerto es la verdad: un servicio "active" cuyo adaptador no conectó
  # deja el puerto cerrado y WhatsApp muerto, sin que systemd se entere.
  if ! ss -ltn 2>/dev/null | grep -q ":$p "; then
    FALLOS+=("puerto $p ($perfil) no escucha")
  fi
done

# ── 2 · Webhook público ─────────────────────────────────────────────────────
# 401 es la respuesta SANA: el adaptador está vivo y rechaza una firma
# inválida. Un 502 significa que nginx no encuentra a Hermes; un 200 sin
# firma sería peor todavía (aceptaría cualquier POST).
for ruta in /kapso/webhook /kapso/webhook-mayand; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 -X POST \
         "https://ia.autoking.pro$ruta" -d '{}' 2>/dev/null)
  [ "$code" = "401" ] || FALLOS+=("webhook $ruta devolvió $code (se esperaba 401)")
done

# ── 3 · Inferencia real (solo en modo profundo) ─────────────────────────────
if [ "$MODO" = "--profundo" ]; then
  for perfil in king mayand; do
    inicio=$(date +%s)
    salida=$(cd "/root/.hermes/profiles/$perfil/home" && \
             timeout 120 hermes -p "$perfil" -z "responde solo: ok" 2>/dev/null || true)
    dur=$(( $(date +%s) - inicio ))
    if echo "$salida" | grep -qi "ok"; then
      anotar "OK $perfil infer ${dur}s"
    else
      FALLOS+=("$perfil no respondió a la inferencia (${dur}s) — revisar token, cuota o MCP")
    fi
  done
fi

# ── 4 · Resultado ───────────────────────────────────────────────────────────
if [ ${#FALLOS[@]} -eq 0 ]; then
  anotar "OK ${MODO#--}"
  rm -f "$ESTADO"          # se recuperó: el próximo fallo avisa enseguida
  tail -n 500 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"
  exit 0
fi

TEXTO=$(printf '%s\n' "${FALLOS[@]}")
anotar "FALLO ${MODO#--}: $(printf '%s; ' "${FALLOS[@]}")"

# Anti-repetición: si es el mismo problema y ya se avisó hace menos de una
# hora, no se manda otro mail. Diez correos iguales no informan más que uno,
# y enseñan a ignorarlos.
HUELLA=$(printf '%s' "$TEXTO" | md5sum | cut -d' ' -f1)
if [ -f "$ESTADO" ]; then
  read -r huella_prev ts_prev < "$ESTADO" 2>/dev/null || true
  if [ "${huella_prev:-}" = "$HUELLA" ] && [ $(( $(date +%s) - ${ts_prev:-0} )) -lt 3600 ]; then
    exit 1
  fi
fi
echo "$HUELLA $(date +%s)" > "$ESTADO"

# ── 5 · Avisar por email ────────────────────────────────────────────────────
# Resend y no WhatsApp: si lo que se cayó es justamente WhatsApp, avisar por
# ahí no llega. Y no gasta una conversación paga de Meta.
KEY=$(grep -h '^RESEND_API_KEY=' /root/autoking-prospector/.env 2>/dev/null | cut -d= -f2- | tr -d '"'"'"'')
if [ -n "${KEY:-}" ]; then
  cuerpo=$(printf '%s\n' "${FALLOS[@]}" | sed 's/^/• /')
  curl -s -o /dev/null -m 30 -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d "$(python3 - <<PY
import json
print(json.dumps({
  "from": "AutoKing Ops <soporte@autoking.pro>",
  "to": ["asepulvedadev@gmail.com"],
  "subject": "🔴 Agentes de WhatsApp con problemas",
  "text": """Los agentes de AutoKing reportan fallas:

$cuerpo

Revisar en el VPS:
    systemctl --user status hermes-gateway-king hermes-gateway-mayand
    journalctl --user -u hermes-gateway-king -n 50

Rollback a OpenClaw si hace falta:
    systemctl --user enable --now openclaw-gateway
    cp /root/rollback-openclaw/nginx-ia.autoking.pro /etc/nginx/sites-enabled/ia.autoking.pro
    nginx -t && systemctl reload nginx

$(date -Is)
""",
}))
PY
)"
fi

exit 1
