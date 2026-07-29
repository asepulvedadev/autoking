# `send_template` para el plugin oficial de Kapso

Propuesta de PR para [`gokapso/hermes-agent-plugin`](https://github.com/gokapso/hermes-agent-plugin)
(revisado en v0.2.2, commit `080c81c`).

## El hueco

El plugin oficial cubre texto y archivos — todo lo que se puede mandar **dentro** de la ventana
de conversación de 24 horas de WhatsApp. Busqué `"template"`, `template_name` y `"components"` en
`adapter.py`: **cero resultados**.

Fuera de esa ventana Meta no acepta mensajes libres, solo **plantillas aprobadas**. Eso deja
afuera todo lo que **inicia el negocio** en vez del cliente:

- recordatorios de cita
- seguimientos de venta (retomar a quien dejó de responder)
- confirmaciones y avisos

Un agente sobre este plugin **puede responder, pero no puede volver a escribir.**

> El mismo hueco existe en el adaptador Cloud del propio Hermes
> (`gateway/platforms/whatsapp_cloud.py`): su docstring anuncia
> *"Phase 5 — 24-hour conversation window + template fallback"*, pero tampoco hay un payload
> `"type": "template"` en todo `gateway/`.

## Qué agrega

`send_template.py` trae dos piezas, escritas en el estilo del plugin (helper libre + método del
adaptador) para que entren sin fricción:

| pieza | dónde va |
|---|---|
| `_send_template_via_kapso(...)` | junto a `_send_text_via_kapso`, mismo contrato de retorno |
| `KapsoAdapter.send_template(...)` | junto a `send` |

Reusa `_resolve_chat_id`, así que **hereda el multi-número del plugin** gratis:
`<phone_number_id>:<destinatario>` y `kapso:<b64>:<b64>`.

```python
await adapter.send_template(
    chat_id="573001112233",
    template_name="recordatorio_cita",
    language_code="es",
    body_params=["María", "mañana a las 10:00"],   # {{1}}, {{2}} — POSICIONALES
)
```

## Dos cosas que el código documenta y conviene repetir

**Los parámetros son posicionales.** Van en el orden de los `{{1}}`, `{{2}}` de la plantilla
aprobada. Mandar de más o de menos devuelve el error **132000** de Meta — no un mensaje a medias,
un rechazo.

**Cada envío abre una conversación paga.** No es una llamada gratis: no va en un bucle.

Por eso el 4xx se marca `retryable=False` y solo el 5xx reintenta: un nombre de plantilla mal
escrito o un idioma inexistente no se arregla insistiendo, y cada intento cuesta.

## Estado

**Sin probar contra la API.** Escrito leyendo el plugin oficial y la referencia de plantillas de
la Cloud API. Antes de mandar el PR habría que:

1. Correrlo contra una plantilla real aprobada, a un número propio, **una vez**.
2. Verificar el error 132000 mandando la cantidad equivocada de parámetros.
3. Probar el camino multi-número con `<phone_number_id>:<destinatario>`.

## Nota para AutoKing

**Esto no desbloquea nada que hoy funcione.** Los recordatorios y seguimientos salen de
`scripts/enviar-recordatorios.mjs` y `enviar-seguimientos.mjs`, cron jobs que le hablan a Kapso
directo sin pasar por el agente. Van a seguir andando igual.

Lo que habilita es distinto: que **el agente decida por sí mismo** retomar una conversación, en
vez de depender de un cron externo que lo haga por él.
