#!/usr/bin/env python3
"""Evita que los avisos internos de Hermes lleguen al cliente por WhatsApp.

    python3 silenciar-avisos-internos.py king johan mayand
    python3 silenciar-avisos-internos.py --todos
    python3 silenciar-avisos-internos.py king --revertir

## El problema

Cuando el modelo falla, el núcleo de Hermes manda al chat cosas como:

    ⏱️ The model provider is rate-limiting requests. Please wait a moment and try again.
    ⚠️ Empty response from model — retrying (1/3)
    ❌ Model returned no content after all retries. No fallback providers configured.

Están pensadas para no filtrar el error crudo, pero para un agente de VENTAS cualquiera
de ellas ya es el problema: el cliente ve un aviso técnico en inglés y entiende que algo
está roto. Peor: al repetirse dispara el error 131056 de WhatsApp — *pair rate limit* —
porque son demasiados mensajes seguidos al mismo número, y ahí el agente queda mudo
aunque el modelo se recupere.

## Por qué se parchea el adaptador del perfil y NO el núcleo

`/usr/local/lib/hermes-agent/` lo comparten King, Mayand, Johan, los 12 del Imperio y
los 3 perfiles del ERP de Grupo J4. Un cambio ahí los afecta a todos. Cada perfil tiene
su propia copia del plugin de Kapso, así que el filtro queda acotado a quien se elija.

Un parche al núcleo se pierde al actualizar Hermes; este solo al actualizar el plugin,
y el script lo vuelve a aplicar. Es idempotente y **actualiza el bloque** si ya había una
versión anterior del parche instalada.
"""

import argparse
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

PERFILES = Path("/root/.hermes/profiles")
MARCA_INICIO = "# ── PARCHE AUTOKING: avisos internos fuera del chat ──"
MARCA_FIN = "# ── FIN PARCHE AUTOKING ──"

BLOQUE = f'''
{MARCA_INICIO}
# Frases con las que el núcleo de Hermes arma sus avisos. Van en inglés y los agentes
# atienden en español, así que un falso positivo sobre un mensaje real es
# prácticamente imposible.
_AVISOS_INTERNOS_RE = re.compile(
    r"the model provider"
    r"|provider authentication failed"
    r"|gateway logs"
    r"|failed after retries"
    r"|rate-limiting requests"
    r"|dangerous command requires approval"
    r"|smart deny"
    r"|requires approval"
    # Respuesta vacía del modelo: el ciclo de reintentos manda un mensaje por vuelta,
    # y son los que disparan el pair rate limit de WhatsApp.
    r"|empty response from model"
    r"|returned empty content"
    r"|returned no content"
    r"|no fallback providers"
    r"|no reply:"
    r"|switch model/provider"
    r"|inspect the tool output"
    r"|context (?:window )?(?:limit|overflow|exceeded)"
    r"|compressing context",
    re.IGNORECASE,
)


def _es_aviso_interno(texto: str) -> bool:
    """True si el texto es un aviso del gateway y no algo que dijo el agente.

    No se acota por longitud a propósito: el aviso de comando peligroso incluye el
    comando completo y puede ser largo, y ese es justamente el que menos debe llegarle
    a un cliente.
    """
    cuerpo = str(texto or "").strip()
    if not cuerpo:
        return False
    return bool(_AVISOS_INTERNOS_RE.search(cuerpo))
{MARCA_FIN}
'''

ANCLA = '        text = _to_whatsapp_text(content or "")'

GUARDIA = '''        text = _to_whatsapp_text(content or "")
        # PARCHE AUTOKING: se descarta en silencio, con éxito y sin message_id, para
        # que el gateway no lo reintente ni lo trate como fallo de entrega.
        if _es_aviso_interno(text):
            logger.warning("[kapso] aviso interno NO enviado al cliente: %s", text[:160])
            return SendResult(success=True, raw_response={"suppressed": True})
'''


def adaptador_de(perfil: str) -> Path:
    return PERFILES / perfil / "plugins" / "kapso" / "adapter.py"


def revertir(ruta: Path) -> bool:
    respaldos = sorted(ruta.parent.glob(f"{ruta.name}.bak-*"))
    if not respaldos:
        print(f"  {ruta.parent.parent.parent.name}: no hay respaldos")
        return False
    shutil.copy2(respaldos[-1], ruta)
    print(f"  restaurado desde {respaldos[-1].name}")
    return True


def aplicar(perfil: str) -> bool:
    ruta = adaptador_de(perfil)
    if not ruta.exists():
        print(f"  {perfil}: no tiene copia propia del plugin de Kapso — lo salto")
        return False

    fuente = ruta.read_text(encoding="utf-8")
    respaldo = ruta.with_name(f"{ruta.name}.bak-{datetime.now():%Y%m%d_%H%M%S}")
    shutil.copy2(ruta, respaldo)

    if MARCA_INICIO in fuente:
        # Ya había parche: se reemplaza el bloque en vez de duplicarlo, así se puede
        # ampliar la lista de frases sin desinstalar primero.
        inicio = fuente.index(MARCA_INICIO)
        fin = fuente.index(MARCA_FIN) + len(MARCA_FIN)
        fuente = fuente[:inicio] + BLOQUE.strip() + fuente[fin:]
        accion = "actualizado"
    else:
        m = re.search(r"^(logger\s*=\s*logging\.getLogger\([^\n]*\)\n)", fuente, re.MULTILINE)
        if not m:
            print(f"  {perfil}: no encontré la línea del logger — reviso el plugin a mano")
            return False
        fuente = fuente[:m.end()] + BLOQUE + fuente[m.end():]
        accion = "aplicado"

    if "_es_aviso_interno(text)" not in fuente:
        if ANCLA + "\n" not in fuente:
            print(f"  {perfil}: no encontré el punto de inserción en send() — sin tocar")
            shutil.copy2(respaldo, ruta)
            return False
        fuente = fuente.replace(ANCLA + "\n", GUARDIA, 1)

    ruta.write_text(fuente, encoding="utf-8")
    # Los .pyc viejos harían que Python siguiera usando la versión sin parche.
    for cache in ruta.parent.glob("__pycache__/adapter.*.pyc"):
        cache.unlink()
    print(f"  {perfil}: {accion} (respaldo {respaldo.name})")
    return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument("perfiles", nargs="*", help="perfiles a parchear, por nombre")
    p.add_argument("--todos", action="store_true",
                   help="todos los perfiles con copia propia del plugin de Kapso")
    p.add_argument("--revertir", action="store_true")
    args = p.parse_args()

    perfiles = list(args.perfiles)
    if args.todos:
        perfiles = sorted(d.name for d in PERFILES.iterdir()
                          if adaptador_de(d.name).exists())
    if not perfiles:
        print("Decime qué perfiles, o usá --todos.")
        return 2

    print(("Revirtiendo" if args.revertir else "Aplicando") + f" en: {', '.join(perfiles)}")
    ok = 0
    for perfil in perfiles:
        if args.revertir:
            ok += 1 if revertir(adaptador_de(perfil)) else 0
        else:
            ok += 1 if aplicar(perfil) else 0

    print(f"\n{ok} de {len(perfiles)} listos.")
    print("Reinicia los gateways afectados para que tomen el cambio:")
    print("  XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart hermes-gateway-<perfil>")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
