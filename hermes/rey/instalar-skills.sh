#!/usr/bin/env bash
# Instala las skills propias de Rey (el perfil default) en el VPS.
#
# Idempotente. Correr COMO ROOT EN EL VPS:
#   scp -r hermes/rey root@2.24.115.58:/root/
#   ssh root@2.24.115.58 'bash /root/rey/instalar-skills.sh'
#
# Después hay que reiniciar el gateway para que las cargue:
#   XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart hermes-gateway.service
set -euo pipefail

DESTINO=/root/.hermes/skills/plataformas
ORIGEN="$(cd "$(dirname "$0")" && pwd)/skills"

mkdir -p "$DESTINO"
for skill in "$ORIGEN"/*/; do
  nombre=$(basename "$skill")
  mkdir -p "$DESTINO/$nombre"
  cp -f "$skill/SKILL.md" "$DESTINO/$nombre/SKILL.md"
  echo "  · $nombre"
done

echo
echo "Instaladas en $DESTINO"
echo "Reiniciá el gateway: XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart hermes-gateway.service"
