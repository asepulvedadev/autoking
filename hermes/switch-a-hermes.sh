#!/usr/bin/env bash
#
# Switch de OpenClaw a Hermes — King y Mayand.
#
# Correr COMO ROOT EN EL VPS (2.24.115.58). Revisalo antes: cada paso está
# comentado y hay un rollback al final que revierte todo en dos comandos.
#
#   scp hermes/switch-a-hermes.sh root@2.24.115.58:/root/
#   ssh root@2.24.115.58 'bash /root/switch-a-hermes.sh'
#
# ── POR QUÉ DOS GATEWAYS Y NO UNO ───────────────────────────────────────────
#
# Hermes puede rutear varios perfiles en un solo gateway con `profile_routes`,
# pero matchea por `chat_id`. El plugin de Kapso arma el chat_id así:
#
#     kapso:<b64(phone_number_id)>:<b64(wa_id)>:<b64(conversation_id)>
#
# El `wa_id` es el número DEL CLIENTE, distinto en cada conversación. No hay
# una clave estable por número de AutoKing —el plugin no setea `guild_id`—
# así que no se puede escribir una regla "todo lo del número X va a King".
#
# La salida es un gateway por perfil, cada uno con su KAPSO_PHONE_NUMBER_ID y
# su puerto. Encaja solo: Kapso YA tiene dos webhooks registrados, uno por
# número. Solo hay que apuntar cada uno a su puerto.
#
#     King   (57 304 4643461)  →  :8648  →  /kapso/webhook
#     Mayand (52 81 15298722)  →  :8649  →  /kapso/webhook-mayand
#
set -euo pipefail

HOY=$(date +%Y%m%d-%H%M%S)
RB=/root/rollback-openclaw
mkdir -p "$RB"

echo "════ 1 · Respaldo para rollback ════"
cp -n ~/.openclaw/openclaw.json "$RB/" 2>/dev/null || true
cp -n /etc/nginx/sites-enabled/ia.autoking.pro "$RB/nginx-ia.autoking.pro" 2>/dev/null || true
systemctl is-enabled openclaw-gateway > "$RB/systemd-estado.txt" 2>&1 || true
echo "  → $RB"

echo "════ 2 · Config de Kapso por perfil ════"
# Las credenciales se leen del .env que ya está en el VPS; no se escriben acá.
K=$(grep '^KAPSO_API_KEY=' ~/.hermes/.env | cut -d= -f2- || true)
S=$(grep '^KAPSO_WEBHOOK_SECRET=' ~/.hermes/.env | cut -d= -f2- || true)
if [ -z "$K" ] || [ -z "$S" ]; then
  echo "  ✗ Faltan KAPSO_API_KEY o KAPSO_WEBHOOK_SECRET en ~/.hermes/.env"; exit 1
fi

escribir_env() {  # $1=perfil  $2=phone_number_id  $3=puerto
  local f=/root/.hermes/profiles/$1/.env
  cat > "$f" <<EOF
KAPSO_ENABLED=true
KAPSO_API_KEY=$K
KAPSO_WEBHOOK_SECRET=$S
KAPSO_PHONE_NUMBER_ID=$2
KAPSO_PORT=$3
KAPSO_WEBHOOK_PATH=/kapso/webhook
KAPSO_ALLOW_ALL_USERS=true
EOF
  chmod 600 "$f"
  echo "  → $1: número $2, puerto $3"
}
escribir_env king   744911478716558  8648
escribir_env mayand 1227363337127290 8649

# Kapso sale del .env global: ahora cada perfil manda el suyo. Si queda acá,
# los dos gateways heredarían el MISMO phone_number_id y Mayand respondería
# por el WhatsApp de King.
sed -i '/^KAPSO_/d' ~/.hermes/.env

# Solo UN gateway puede tener el despachador de kanban. Con los dos en true,
# cada uno abre conexiones SQLite por tablero y se pelean por el WAL.
python3 - <<'PY'
import yaml
p = "/root/.hermes/profiles/mayand/config.yaml"
d = yaml.safe_load(open(p)) or {}
d["kanban"] = {"dispatch_in_gateway": False}
yaml.safe_dump(d, open(p, "w"), sort_keys=False, allow_unicode=True)
print("  → mayand: dispatch_in_gateway=false")
PY

echo "════ 3 · nginx: ruta para el segundo número ════"
N=/etc/nginx/sites-enabled/ia.autoking.pro
cp "$N" "$RB/nginx-$HOY.bak"
if ! grep -q 'kapso/webhook-mayand' "$N"; then
  # La ruta más específica va ANTES: nginx elige el prefijo más largo, pero
  # dejarlo explícito evita sorpresas si alguien reordena el archivo.
  sed -i 's|location /bridge/ {|location /kapso/webhook-mayand {\n        proxy_pass http://127.0.0.1:8649/kapso/webhook;\n        proxy_set_header X-Webhook-Signature $http_x_webhook_signature;\n        proxy_set_header X-Webhook-Event $http_x_webhook_event;\n        proxy_set_header X-Idempotency-Key $http_x_idempotency_key;\n    }\n\n    location /kapso/webhook {\n        proxy_pass http://127.0.0.1:8648;\n        proxy_set_header X-Webhook-Signature $http_x_webhook_signature;\n        proxy_set_header X-Webhook-Event $http_x_webhook_event;\n        proxy_set_header X-Idempotency-Key $http_x_idempotency_key;\n    }\n\n    location /bridge/ {|' "$N"
fi
nginx -t && echo "  → nginx OK (sin recargar todavía)"

echo "════ 4 · Levantar los gateways de Hermes ════"
# Se levantan ANTES de apagar OpenClaw: si alguno falla, se aborta con
# OpenClaw todavía atendiendo y no hubo downtime.
hermes -p king   gateway start
hermes -p mayand gateway start
sleep 12
for p in 8648 8649; do
  ss -ltn | grep -q ":$p " || { echo "  ✗ el puerto $p no escucha — ABORTANDO, OpenClaw sigue vivo"; exit 1; }
  echo "  → :$p escuchando"
done

echo "════ 5 · Apagar OpenClaw ════"
systemctl stop openclaw-gateway || true
systemctl disable openclaw-gateway || true    # que no vuelva solo al reiniciar
echo "  → detenido y deshabilitado (los archivos quedan para rollback)"

echo "════ 6 · Recargar nginx: el tráfico pasa a Hermes ════"
systemctl reload nginx
echo "  → recargado"

echo "════ 7 · Apuntar el webhook de Mayand a su ruta ════"
# El de King ya apunta a /kapso/webhook, que ahora va al 8648. Solo hay que
# mover el de Mayand, que hoy comparte la misma URL que King.
WH_MAYAND=d3775f84-f9ed-4f3c-952c-19f88357e1db   # el del número 1227363337127290
curl -s -X PATCH "https://api.kapso.ai/platform/v1/whatsapp/webhooks/$WH_MAYAND" \
  -H "X-API-Key: $K" -H "Content-Type: application/json" \
  -d '{"whatsapp_webhook":{"url":"https://ia.autoking.pro/kapso/webhook-mayand"}}' \
  -o /tmp/wh.json -w "  → HTTP %{http_code}\n"
head -c 200 /tmp/wh.json; echo; rm -f /tmp/wh.json

echo
echo "════ LISTO ════"
echo "Probá mandando un WhatsApp a cada número y mirá los logs:"
echo "    hermes -p king   gateway logs -f"
echo "    hermes -p mayand gateway logs -f"
echo
cat <<'ROLLBACK'
════ ROLLBACK (si algo sale mal) ════

    # 1 · volver el webhook de Mayand a la URL de antes
    curl -X PATCH "https://api.kapso.ai/platform/v1/whatsapp/webhooks/d3775f84-f9ed-4f3c-952c-19f88357e1db" \
      -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
      -d '{"whatsapp_webhook":{"url":"https://ia.autoking.pro/kapso/webhook"}}'

    # 2 · nginx y OpenClaw como estaban
    cp /root/rollback-openclaw/nginx-ia.autoking.pro /etc/nginx/sites-enabled/ia.autoking.pro
    nginx -t && systemctl reload nginx
    hermes -p king gateway stop; hermes -p mayand gateway stop
    systemctl enable --now openclaw-gateway

Vuelve a estar como antes en menos de un minuto. Los archivos de OpenClaw
nunca se borraron.
ROLLBACK
