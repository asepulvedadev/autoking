#!/usr/bin/env bash
#
# Qué aprendieron King y Mayand esta semana.
#
# El bucle de aprendizaje de Hermes deja que los agentes escriban su propia
# memoria y creen skills nuevas. Eso es lo que hace a Hermes mejor que
# OpenClaw — y también lo que lo hace peligroso sin supervisión: un agente de
# ventas que se auto-modifica puede empezar a prometer cosas que no existen,
# o guardar como "aprendizaje" algo que fue un malentendido de un cliente.
#
# Este script no bloquea nada: reporta. Manda un email con lo que los agentes
# escribieron, para que un humano lo lea y decida si algo hay que borrar.
#
# Cron sugerido:  0 9 * * 1  /root/autoking-ops/revisar-aprendizaje.sh
#
set -uo pipefail
export HOME=/root
export PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/bin

DIR=/root/autoking-ops
REPORTE=$(mktemp)
HUBO_ALGO=0

for p in king mayand; do
  PERFIL=/root/.hermes/profiles/$p
  echo "════════ $p ════════" >> "$REPORTE"

  # ── Skills nuevas (comparadas contra la foto de base) ──────────────────
  BASE=$DIR/.skills-base-$p
  ACTUAL=$(mktemp)
  find "$PERFIL/skills" -name SKILL.md 2>/dev/null | sort > "$ACTUAL"
  if [ -f "$BASE" ]; then
    NUEVAS=$(comm -13 "$BASE" "$ACTUAL" 2>/dev/null)
    if [ -n "$NUEVAS" ]; then
      HUBO_ALGO=1
      echo "" >> "$REPORTE"
      echo "SKILLS QUE SE CREÓ SOLO:" >> "$REPORTE"
      while read -r f; do
        [ -z "$f" ] && continue
        nombre=$(grep -m1 '^name:' "$f" 2>/dev/null | cut -d: -f2- | xargs)
        desc=$(grep -m1 '^description:' "$f" 2>/dev/null | cut -d: -f2- | xargs)
        echo "  • ${nombre:-$(basename $(dirname $f))}" >> "$REPORTE"
        echo "    ${desc:0:160}" >> "$REPORTE"
        echo "    → $f" >> "$REPORTE"
      done <<< "$NUEVAS"
    else
      echo "  (sin skills nuevas)" >> "$REPORTE"
    fi
  fi
  rm -f "$ACTUAL"

  # ── Memoria del agente ─────────────────────────────────────────────────
  MEM="$PERFIL/memories/MEMORY.md"
  if [ -s "$MEM" ]; then
    HUBO_ALGO=1
    echo "" >> "$REPORTE"
    echo "LO QUE ANOTÓ EN SU MEMORIA ($(wc -c < "$MEM") de 2200 caracteres):" >> "$REPORTE"
    sed 's/^/  /' "$MEM" >> "$REPORTE"
  else
    echo "  (memoria vacía)" >> "$REPORTE"
  fi

  # ⚠️ USER.md no debería existir: user_profile_enabled está en false porque
  # el store es global y mezclaría datos entre clientes distintos. Si aparece,
  # alguien lo activó y hay que revisarlo.
  if [ -s "$PERFIL/memories/USER.md" ]; then
    HUBO_ALGO=1
    echo "" >> "$REPORTE"
    echo "  ⚠️ HAY UN USER.md — no debería. El perfil de usuario es GLOBAL:" >> "$REPORTE"
    echo "     mezcla datos entre clientes. Revisar user_profile_enabled." >> "$REPORTE"
  fi
  echo "" >> "$REPORTE"
done

if [ "$HUBO_ALGO" = "0" ]; then
  echo "$(date -Is) sin novedades" >> "$DIR/aprendizaje.log"
  rm -f "$REPORTE"; exit 0
fi

cat "$REPORTE" >> "$DIR/aprendizaje.log"

KEY=$(grep -h '^RESEND_API_KEY=' /root/autoking-prospector/.env 2>/dev/null | cut -d= -f2- | tr -d '"'"'"'')
if [ -n "${KEY:-}" ]; then
  python3 - "$REPORTE" "$KEY" <<'PY'
import json, sys, urllib.request
cuerpo = open(sys.argv[1]).read()
payload = json.dumps({
    "from": "AutoKing Ops <soporte@autoking.pro>",
    "to": ["asepulvedadev@gmail.com"],
    "subject": "🧠 Qué aprendieron King y Mayand esta semana",
    "text": cuerpo + """
─────────────────────────────────────────
Esto es para LEER, no para archivar. Si alguna skill o memoria dice algo que
no querés que el agente repita frente a un cliente, borrala:

    rm -rf /root/.hermes/profiles/<perfil>/skills/<la-skill>
    nano   /root/.hermes/profiles/<perfil>/memories/MEMORY.md
    systemctl --user restart hermes-gateway-<perfil>

Y si una skill está BUENA, copiala al paquete del agente para que sobreviva:
    /root/autoking-platform/agents/<perfil>/skills/
""",
}).encode()
req = urllib.request.Request("https://api.resend.com/emails", data=payload,
    headers={"Authorization": f"Bearer {sys.argv[2]}", "Content-Type": "application/json"})
try:
    urllib.request.urlopen(req, timeout=30)
    print("reporte enviado")
except Exception as e:
    print("no se pudo enviar:", e)
PY
fi
rm -f "$REPORTE"
