# El adaptador de Kapso propio: por qué se descartó

Acá vivió un adaptador de Kapso escrito a mano para Hermes (542 líneas, commit `ea1e720`).
Se borró al descubrir que **Kapso ya publica un plugin oficial**:
[`gokapso/hermes-agent-plugin`](https://github.com/gokapso/hermes-agent-plugin).

```bash
hermes plugins install gokapso/hermes-agent-plugin --enable
hermes kapso setup --configure-webhook
```

## La comparación que decidió

| | oficial v0.2.2 | el propio |
|---|---|---|
| Líneas | 2.461 + **1.010 de tests** | 542 + 21 pruebas |
| Mantenido por | **Kapso** | nosotros |
| **Multi-número** | ✅ nativo (`phone_number_id:destinatario`, sesiones base64url) | ❌ un gateway por número |
| Setup del webhook | ✅ `--configure-webhook` | manual con curl |
| Envío de archivos | ✅ imagen, video, voz, audio, documento, sticker | heredado del padre |
| Templates | ❌ | ✅ |

El multi-número fue el que definió: **AutoKing es multi-tenant**. El oficial lo resuelve nativo;
el propio obligaba a un proceso por número.

Lo único que el propio tenía y el oficial no —el envío de plantillas— se rescató como propuesta
de PR upstream en [`hermes/contrib/kapso-send-template/`](../contrib/kapso-send-template/).

## El error, para no repetirlo

**No se buscó si la integración ya existía.** Se fue directo a "cómo escribo un adaptador" cuando
la primera pregunta era "¿esto ya está hecho?". La respuesta estaba en la documentación de Kapso
(`docs.kapso.ai/docs/whatsapp/hermes-agent`).

Antes de construir un puente entre dos productos, revisar si alguno de los dos ya lo publicó.

## Lo que sí sobrevive

Tres cosas del trabajo descartado siguen valiendo:

**Los tres bugs del sistema de plugins de Hermes**, que solo aparecieron al correrlo y no se ven
leyendo el código:

1. **Falta `__init__.py` → el plugin nunca carga**, pero **igual aparece** en
   `hermes plugins list` y se deja marcar como `enabled`, porque esa lista lee el `plugin.yaml`.
   Se ve instalado y activo mientras el cargador lo descarta con `No __init__.py in ...`.
2. **`validate_config` devuelve BOOL, no el motivo del error.** El registry hace
   `if not entry.validate_config(config)`. Devolver un string con el motivo (truthy) hace pasar
   una config rota; devolver `None` cuando está bien (falsy) rechaza una config buena.
3. **`ctx` no es el `platform_registry`.** La guía dice `ctx.register_platform()`, pero el
   registry expone `register(entry)`. `ctx` es el contexto del plugin, que lo envuelve.

**La auditoría del instalador de Hermes**: el riesgo real era el `ln -sf` de `node` en
`/usr/local/bin`, que hubiera podido pisar el Node con el que corre OpenClaw. No pasó porque el
Node del sistema (v24.15.0) ya cumple el mínimo de Hermes (≥22.12), así que el instalador ni lo
toca. Verificarlo antes es lo que hizo segura la instalación.

**Que Kapso transcribe las notas de voz** (`kapso.transcript`, o embebido tras `Transcript:` en
`kapso.content`), y que un webhook puede traer un **lote** de eventos en `data[]` — tratarlo como
un evento único hace desaparecer mensajes sin un solo error en el log.
