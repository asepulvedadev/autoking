#!/usr/bin/env python3
"""Borra la conversación de un perfil con un contacto, como si nunca hubiera escrito.

    python3 olvidar-conversacion.py king 573024833333
    python3 olvidar-conversacion.py king --listar

Sirve para dos cosas: repetir una prueba de punta a punta, y desatascar una sesión
que quedó corrupta o gigante (Hermes empieza a devolver "Empty response from model"
cuando el historial de una conversación crece demasiado).

## Los DOS lugares donde vive una sesión

Esto es lo que más se olvida: el estado está duplicado.

1. **`state.db`** (SQLite) — tablas `messages`, `sessions` (identifica por `id`, NO por
   `session_id`), `session_model_usage`, `gateway_routing` y `delivery_obligations`.
2. **`sessions/sessions.json`** — el mapa en disco que el gateway lee al arrancar.

Borrar solo el primero deja al gateway apuntando a una sesión que ya no existe, y el
log se llena de `Session DB append_message failed: Session '<id>' not found`. Hay que
limpiar los dos y **reiniciar el gateway**, que tiene la sesión en memoria.

Siempre respalda antes de tocar nada.
"""

import argparse
import json
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

PERFILES = Path("/root/.hermes/profiles")


def solo_digitos(v):
    return "".join(c for c in str(v or "") if c.isdigit())


def rutas(perfil: str):
    base = PERFILES / perfil
    return base / "state.db", base / "sessions" / "sessions.json", base / "sessions"


def sesiones_de(db: Path, mapa: Path, numeros: set[str]):
    """Devuelve [(session_id, session_key, numero)] mirando las dos fuentes."""
    hallado = {}

    if db.exists():
        con = sqlite3.connect(db)
        try:
            for clave, crudo in con.execute("SELECT session_key, entry_json FROM gateway_routing"):
                try:
                    e = json.loads(crudo)
                except Exception:
                    continue
                num = solo_digitos(e.get("origin", {}).get("user_id"))
                if num in numeros:
                    hallado[clave] = (e.get("session_id"), clave, num)
        finally:
            con.close()

    if mapa.exists():
        try:
            d = json.loads(mapa.read_text(encoding="utf-8"))
        except Exception:
            d = {}
        for clave, e in d.items():
            if not isinstance(e, dict):
                continue
            num = solo_digitos((e.get("origin") or {}).get("user_id"))
            if num in numeros:
                hallado.setdefault(clave, (e.get("session_id"), clave, num))

    return list(hallado.values())


def listar(perfil: str):
    db, mapa, _ = rutas(perfil)
    filas = []
    if db.exists():
        con = sqlite3.connect(db)
        for clave, crudo in con.execute("SELECT session_key, entry_json FROM gateway_routing"):
            try:
                e = json.loads(crudo)
            except Exception:
                continue
            sid = e.get("session_id")
            n = con.execute("SELECT COUNT(*) FROM messages WHERE session_id=?", (sid,)).fetchone()[0]
            filas.append((solo_digitos((e.get("origin") or {}).get("user_id")),
                          e.get("display_name") or "?", sid, n,
                          e.get("last_prompt_tokens") or 0))
        con.close()
    filas.sort(key=lambda x: -x[3])
    print(f"{'numero':<14} {'nombre':<24} {'mensajes':>8} {'tokens':>8}  sesion")
    for num, nombre, sid, n, tok in filas:
        alerta = "  <-- gigante" if n > 150 or tok > 30000 else ""
        print(f"{num:<14} {str(nombre)[:23]:<24} {n:>8} {tok:>8}  {sid}{alerta}")


def olvidar(perfil: str, numeros: set[str]):
    db, mapa, dir_ses = rutas(perfil)
    sesiones = sesiones_de(db, mapa, numeros)
    if not sesiones:
        print(f"  no encontré conversaciones de {', '.join(sorted(numeros))} en {perfil}")
        return

    sello = datetime.now().strftime("%Y%m%d_%H%M%S")
    for f in [db, mapa]:
        if f.exists():
            shutil.copy2(f, f.with_name(f"{f.name}.bak-{sello}"))
    print(f"  respaldos con sello {sello}")

    # 1. state.db
    if db.exists():
        con = sqlite3.connect(db)
        try:
            borrados = 0
            for sid, clave, _ in sesiones:
                if sid:
                    borrados += con.execute("DELETE FROM messages WHERE session_id=?", (sid,)).rowcount
                    # `sessions` usa `id`; `session_id` solo existe en session_model_usage.
                    con.execute("DELETE FROM sessions WHERE id=?", (sid,))
                    con.execute("DELETE FROM session_model_usage WHERE session_id=?", (sid,))
                con.execute("DELETE FROM gateway_routing WHERE session_key=?", (clave,))
                con.execute("DELETE FROM delivery_obligations WHERE session_key=?", (clave,))
            con.commit()
            print(f"  state.db: {len(sesiones)} sesion(es), {borrados} mensajes")
            print("  integridad:", con.execute("PRAGMA integrity_check;").fetchone()[0])
        finally:
            con.close()

    # 2. sessions/sessions.json — el que se olvida y deja al gateway colgado
    if mapa.exists():
        d = json.loads(mapa.read_text(encoding="utf-8"))
        quitadas = 0
        for _, clave, _ in sesiones:
            if d.pop(clave, None) is not None:
                quitadas += 1
        tmp = mapa.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(mapa)
        print(f"  sessions.json: {quitadas} entrada(s) quitada(s)")

    # 3. Volcados de depuración de esas sesiones, que solo ocupan espacio.
    if dir_ses.exists():
        for sid, _, _ in sesiones:
            if not sid:
                continue
            for f in dir_ses.glob(f"request_dump_{sid}_*.json"):
                f.unlink()

    print(f"\nReinicia el gateway, que tiene la sesión en memoria:")
    print(f"  XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart hermes-gateway-{perfil}.service")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("perfil")
    p.add_argument("numeros", nargs="*")
    p.add_argument("--listar", action="store_true")
    args = p.parse_args()

    if not (PERFILES / args.perfil).exists():
        print(f"No existe el perfil {args.perfil}")
        return 1
    if args.listar or not args.numeros:
        listar(args.perfil)
        return 0
    olvidar(args.perfil, {solo_digitos(n) for n in args.numeros if solo_digitos(n)})
    return 0


if __name__ == "__main__":
    sys.exit(main())
