#!/usr/bin/env bash
# La Oficina del Imperio — herramientas de documentos compartidas por los 12.
#
# Se instala en su propio venv (/root/imperio/venv) para NO contaminar el venv de
# Hermes: si `hermes update` lo reconstruye, esto sigue en pie.
#
# Correr COMO ROOT EN EL VPS:  bash /root/imperio/oficina/instalar.sh
set -euo pipefail

BASE=/root/imperio
VENV=$BASE/venv
BIN=$BASE/bin

echo "== Oficina del Imperio =="

# 1 · venv propio
if [[ ! -x $VENV/bin/python ]]; then
  echo "  + creando venv en $VENV"
  python3 -m venv "$VENV"
fi

echo "  + instalando librerías de documentos"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet \
  reportlab openpyxl python-docx pypdf markdown matplotlib pandas Pillow

# 2 · scripts al PATH de los emperadores
mkdir -p "$BIN"
cp -f "$BASE/oficina/bin/"* "$BIN/"
chmod +x "$BIN"/*

# 3 · Chrome headless es lo que rinde el PDF. Verificamos que esté.
command -v google-chrome >/dev/null || { echo "  ⚠ FALTA google-chrome — md2pdf/html2pdf no van a funcionar"; }

echo
echo "== Verificación =="
"$VENV/bin/python" - <<'EOF'
import importlib
faltan = []
for m in ("reportlab","openpyxl","docx","pypdf","markdown","matplotlib","pandas","PIL"):
    try: importlib.import_module(m)
    except Exception: faltan.append(m)
print("  librerías:", "todas OK" if not faltan else f"FALTAN {faltan}")
EOF

echo "  scripts:  $(ls "$BIN" | tr '\n' ' ')"
echo
echo "Listo. Los emperadores los llaman por ruta absoluta: $BIN/<script>"
