#!/usr/bin/env bash
# Poda las skills de fábrica que cada emperador no usa.
#
# POR QUÉ: Hermes mete la descripción de TODAS las skills del perfil en CADA
# llamada al modelo. Ya se midió en este VPS: bajar un perfil de 75 a 5 skills
# llevó la respuesta de 20 s a 11 s. Con 76 skills por emperador estábamos
# pagando ese peaje doce veces.
#
# Cada emperador queda con sus skills propias + las de fábrica que de verdad usa.
# Idempotente. Correr COMO ROOT EN EL VPS:  bash /root/imperio/podar-skills.sh
set -euo pipefail
PROFILES=/root/.hermes/profiles

# Paquetes de fábrica que se CONSERVAN, por perfil. Todo lo demás se borra.
# (las skills propias del emperador nunca se tocan: llevan metadata.imperio)
conservar() {
  case "$1" in
    shaka)      echo "github software-development" ;;
    ricardo)    echo "github software-development" ;;
    ciro)       echo "software-development" ;;
    alejandro)  echo "research" ;;
    justiniano) echo "research" ;;
    carlomagno) echo "research" ;;
    gengis)     echo "research" ;;
    soliman)    echo "email" ;;
    *)          echo "" ;;
  esac
}

total_antes=0
total_despues=0

for perfil in shaka luis alejandro soliman felipe augusto justiniano ramses ciro carlomagno ricardo gengis; do
  dir=$PROFILES/$perfil/skills
  [[ -d $dir ]] || continue

  antes=$(find "$dir" -name SKILL.md | wc -l)
  total_antes=$((total_antes + antes))

  keep=" $(conservar "$perfil") "
  for paquete in "$dir"/*; do
    [[ -d $paquete ]] || continue
    nombre=$(basename "$paquete")

    # Skill propia del Imperio → no se toca.
    if [[ -f "$paquete/SKILL.md" ]] && grep -q "imperio: $perfil" "$paquete/SKILL.md" 2>/dev/null; then
      continue
    fi
    # Paquete de fábrica en la lista de conservados → no se toca.
    [[ $keep == *" $nombre "* ]] && continue

    rm -rf "$paquete"
  done

  despues=$(find "$dir" -name SKILL.md | wc -l)
  total_despues=$((total_despues + despues))
  printf "  %-11s %2d → %2d skills\n" "$perfil" "$antes" "$despues"
done

echo
echo "Total del Imperio: $total_antes → $total_despues skills"
