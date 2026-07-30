# Plantillas de WhatsApp: cómo tocarlas sin romperlas

Aprendido a los golpes el 2026-07-30, recreando `recordatorio_cita`.

## La regla: CREAR primero, BORRAR después

Un template aprobado **no se puede editar**. Kapso responde:

```
422 · "Only draft templates can be updated"
```

Así que para cambiar un texto hay que reemplazarlo. Y el orden importa:

**❌ Lo que hice mal:** borrar y después crear. Meta contesta

```
error_subcode 2388023
"New Spanish (COL) content can't be added while the existing
 Spanish (COL) content is being deleted"
```

El borrado queda "en proceso" del lado de Meta y **bloquea el nombre+idioma**.
Reintenté a los 75 segundos y seguía bloqueado. Quedás sin template y sin poder
recrearlo, sin saber cuánto va a durar.

**✅ Lo correcto:** crear el nuevo primero. Si Meta lo rechaza, el viejo sigue
vivo y no perdiste nada. Recién cuando el nuevo esté aprobado, borrás el viejo.

Solo funciona si el nuevo difiere en **nombre o idioma** del viejo — Meta no
admite dos veces la misma combinación:

```
error_subcode 2388024 · "There is already Spanish content for this template."
```

## Endpoint: el passthrough de Meta, no la Platform API

```bash
POST https://api.kapso.ai/meta/whatsapp/v24.0/<BUSINESS_ACCOUNT_ID>/message_templates
     -H "X-API-Key: $KAPSO_API_KEY"
```

⚠️ Va el **`business_account_id` (WABA)**, no el `phone_number_id`. Para
*enviar* mensajes es al revés.

La Platform API (`app.kapso.ai/api/v1/whatsapp_templates`) sirve para **listar
y borrar**, no para crear: devuelve `422 "Configs must share a WhatsApp
Business Account"`.

## Parámetros NOMBRADOS, no posicionales

Los templates de AutoKing usan `{{nombre}}`, `{{servicio}}`, no `{{1}}`, `{{2}}`.
Hay que declararlo:

```json
{ "parameter_format": "NAMED",
  "components": [{
    "type": "BODY",
    "text": "Hola {{nombre}} 👋 …",
    "example": { "body_text_named_params": [
      { "param_name": "nombre", "example": "Laura" } ] } }] }
```

Y al **enviar**, cada parámetro lleva su nombre:

```json
"parameters": [{ "type": "text", "parameter_name": "nombre", "text": "María" }]
```

## Idioma: `es`, no `es_CO`

Un solo template sirve para Colombia y México. Con `es_CO` habría que mantener
dos textos idénticos, y duplica la superficie donde se escapa un modismo.

## Español NEUTRO, siempre

Los leen clientes colombianos y mexicanos. `recordatorio_cita` decía
*"¿Nos confirmás que venís?"* y venía **hardcodeado en
`apps/web/src/lib/kapso.ts`**, la función que crea el template en la WABA de
cada cliente nuevo: no era un texto suelto, se propagaba a cada alta.

## Estado al 2026-07-30

| template | idioma | estado | texto |
|---|---|---|---|
| `recordatorio_cita` | `es` | **submitted** | ✅ neutro (recreado) |
| `seguimiento_lead` | `es` | approved | ✅ ya era neutro |
| `demo_confirmada` | `es` | approved | ⚠️ **voseo**: *"Si necesitás reprogramar, respondé por acá"* |

`demo_confirmada` quedó pendiente a propósito: ya ocupa el idioma `es`, así que
reemplazarlo obliga a borrar primero y comerse el mismo bloqueo. Por una frase
de confirmación no vale el riesgo. Cuando se haga, seguir el orden de arriba y
tener en cuenta que el nombre queda bloqueado un rato.

## Y lo que todavía nadie puede hacer

**Ni el plugin de Kapso ni Hermes envían templates.** Los agentes pueden
responder pero no volver a escribir fuera de la ventana de 24 h. Propuesta de
PR en `hermes/contrib/kapso-send-template/` — **con un bug**: manda los
parámetros posicionales y acá son nombrados.
