#!/usr/bin/env python3
"""Propaga el pool de credenciales de la raíz a los perfiles de AutoKing.

    python3 propagar-credencial.py --listar     # ver qué tiene cada perfil
    python3 propagar-credencial.py              # propagar (con respaldo)

## Por qué existe este script

`~/.hermes/auth.json` **NO se comparte** entre perfiles, al contrario de lo que decía
la documentación de este repo. Cuando un perfil tiene su propio `auth.json`, ese gana
y el de la raíz se ignora por completo.

Consecuencia práctica: `hermes auth add` actualiza **solo la raíz**, así que agregar
una cuenta nueva no llega a King, Mayand, Johan ni a los 12 del Imperio. Se ve así:

    hermes --profile default -z "..."   → funciona
    hermes --profile king    -z "..."   → "Codex provider quota exhausted (429)"

Ese contraste es el síntoma: si `default` responde y los agentes no, el pool de los
perfiles quedó viejo.

## Qué NO toca

Los perfiles `j4-*` son el asistente del ERP de Grupo J4 y usan **otra cuenta de
Codex** (`openai-codex-oauth-2`). Se excluyen a propósito: cambiarles la credencial
mezclaría la facturación de otra empresa. Para incluirlos hace falta `--incluir-j4`,
y hay que quererlo de verdad.
"""

import argparse
import glob
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path("/root/.hermes/auth.json")
PERFILES = Path("/root/.hermes/profiles")
EXCLUIDOS = ("j4-",)


def resumen(ruta: Path) -> str:
    try:
        d = json.loads(ruta.read_text())
    except Exception as e:
        return f"ilegible ({e})"
    partes = []
    for prov, creds in (d.get("credential_pool") or {}).items():
        if not isinstance(creds, list):
            continue
        for c in creds:
            partes.append(f"{c.get('label')}[{prov}] estado={c.get('last_status')}")
    return "; ".join(partes) or "sin credenciales"


def excluido(nombre: str) -> bool:
    return any(nombre.startswith(p) for p in EXCLUIDOS)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--listar", action="store_true")
    p.add_argument("--incluir-j4", action="store_true",
                   help="también sobrescribe los perfiles de Grupo J4 (otra cuenta)")
    args = p.parse_args()

    if not RAIZ.exists():
        print(f"No encuentro {RAIZ}")
        return 1

    rutas = sorted(Path(x) for x in glob.glob(str(PERFILES / "*" / "auth.json")))

    if args.listar:
        print(f"{'RAIZ':<14}: {resumen(RAIZ)}")
        for r in rutas:
            nombre = r.parent.name
            marca = "  (excluido)" if excluido(nombre) else ""
            print(f"{nombre:<14}: {resumen(r)}{marca}")
        return 0

    sello = datetime.now().strftime("%Y%m%d_%H%M%S")
    hechos, saltados = [], []

    for r in rutas:
        nombre = r.parent.name
        if excluido(nombre) and not args.incluir_j4:
            saltados.append(nombre)
            continue
        shutil.copy2(r, r.with_name(f"auth.json.bak-{sello}"))
        shutil.copy2(RAIZ, r)
        os.chmod(r, 0o600)
        hechos.append(nombre)

    print(f"Propagado a {len(hechos)} perfil(es): {', '.join(hechos)}")
    if saltados:
        print(f"Sin tocar (cuenta de otra empresa): {', '.join(saltados)}")
    print(f"Respaldos: auth.json.bak-{sello} dentro de cada perfil")
    print("\nHay que reiniciar los gateways para que suelten la credencial vieja:")
    print("  XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart "
          "hermes-gateway-king hermes-gateway-mayand hermes-gateway-johan")
    return 0


if __name__ == "__main__":
    sys.exit(main())
