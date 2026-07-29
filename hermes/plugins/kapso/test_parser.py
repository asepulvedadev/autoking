#!/usr/bin/env python3
"""Pruebas del parseo del webhook v2 de Kapso.

Corre SIN Hermes instalado: extrae la clase del adaptador con AST y ejecuta
solo los métodos de parseo, que no dependen de ``gateway.*``. Así el parser
—que es la parte que más fácil se rompe— se puede verificar en cualquier lado.

Las formas que se prueban NO son inventadas: salieron de leer el parser oficial
de Kapso para OpenClaw (`@kapso/openclaw-whatsapp`, dist/webhook.js), el mismo
que hoy atiende a King y Mayand en producción.

    python3 test_parser.py
"""
import ast
import re
import sys
from pathlib import Path

QUIERO = {
    "_extraer_eventos", "_cadena", "_sub", "_es_mensaje_valido",
    "_extraer_texto", "_extraer_transcripcion", "_extraer_media", "_clase_media",
}


def cargar_parser():
    arbol = ast.parse((Path(__file__).parent / "adapter.py").read_text())
    clase = next(
        n for n in arbol.body if isinstance(n, ast.ClassDef) and n.name == "KapsoAdapter"
    )
    metodos = [n for n in clase.body if isinstance(n, ast.FunctionDef) and n.name in QUIERO]
    falsa = ast.ClassDef(
        name="P", bases=[], keywords=[], body=metodos, decorator_list=[]
    )
    mod = ast.Module(body=[falsa], type_ignores=[])
    ast.fix_missing_locations(mod)
    ns = {"re": re, "Any": object, "Dict": dict, "List": list}
    exec(compile(mod, "<parser>", "exec"), ns)
    return ns["P"]


P = cargar_parser()
fallos = []


def check(nombre, obtenido, esperado):
    ok = obtenido == esperado
    print(f"{'OK  ' if ok else 'FALLA'} {nombre}: {obtenido!r}")
    if not ok:
        fallos.append(nombre)
        print(f"       esperaba: {esperado!r}")


# Lote vs evento único. Un webhook de Kapso puede traer varios eventos en
# `data[]`; tratarlo como uno solo pierde mensajes silenciosamente.
check("lote de 2", len(P._extraer_eventos({"data": [{"a": 1}, {"b": 2}]}, "")), 2)
check("evento único", len(P._extraer_eventos({"event": "x", "message": {}}, "")), 1)
check("lote vacío", len(P._extraer_eventos({"data": None}, "true")), 0)

# El texto llega en seis formas distintas según el tipo de mensaje.
check("texto normal", P._extraer_texto({"text": {"body": "hola"}}, "text"), "hola")
check("botón plantilla", P._extraer_texto({"button": {"text": "Confirmar"}}, "button"), "Confirmar")
check("botón interactivo camelCase", P._extraer_texto({"interactive": {"buttonReply": {"title": "Sí"}}}, "interactive"), "Sí")
check("botón interactivo snake_case", P._extraer_texto({"interactive": {"button_reply": {"title": "No"}}}, "interactive"), "No")
check("lista", P._extraer_texto({"interactive": {"list_reply": {"title": "Masaje"}}}, "interactive"), "Masaje")
check("reacción", P._extraer_texto({"reaction": {"emoji": "👍"}}, "reaction"), "Reacción: 👍")
check("epígrafe de imagen", P._extraer_texto({"image": {"caption": "mirá esto"}}, "image"), "mirá esto")
check("pedido de catálogo", P._extraer_texto({"kapso": {"order_text": "2 x corte"}}, "order"), "2 x corte")

# Notas de voz: Kapso ya las transcribe. Perder esto sería mandarle al modelo
# "[mensaje de audio]" cuando el texto real estaba disponible.
check("transcript objeto", P._extraer_transcripcion({"kapso": {"transcript": {"text": "quiero una cita"}}}), "quiero una cita")
check("transcript string", P._extraer_transcripcion({"kapso": {"transcription": "hola que tal"}}), "hola que tal")
check("transcript dentro de content", P._extraer_transcripcion({"kapso": {"content": "Audio 0:12\nTranscript: me interesa el plan"}}), "me interesa el plan")
check("sin transcript", P._extraer_transcripcion({"kapso": {}}), "")

# La URL del adjunto vive en tres lugares distintos según el tipo.
check("media en kapso.mediaUrl", P._extraer_media({"kapso": {"mediaUrl": "https://x/a.jpg"}}, "image"), [("https://x/a.jpg", "image")])
check("media en mediaData", P._extraer_media({"kapso": {"media_data": {"download_url": "https://x/b.pdf", "mime_type": "application/pdf"}}}, "document"), [("https://x/b.pdf", "document")])
check("media directa", P._extraer_media({"video": {"link": "https://x/c.mp4"}}, "video"), [("https://x/c.mp4", "video")])
check("sin media", P._extraer_media({"text": {"body": "hola"}}, "text"), [])

# Un acuse de recibo no es un mensaje: sin id+type+timestamp se descarta.
check("mensaje válido", P._es_mensaje_valido({"id": "wamid.X", "type": "text", "timestamp": "1753800000"}), True)
check("acuse sin type", P._es_mensaje_valido({"id": "wamid.X", "timestamp": "1"}), False)

print()
print("TODO OK" if not fallos else f"{len(fallos)} FALLO(S): {', '.join(fallos)}")
sys.exit(1 if fallos else 0)
