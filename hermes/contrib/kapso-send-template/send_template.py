"""Envío de plantillas de WhatsApp — propuesta para `gokapso/hermes-agent-plugin`.

Este archivo NO se importa: es el código a agregar a `adapter.py` del plugin
oficial, escrito en su mismo estilo (helper libre + método del adaptador) para
que entre como PR sin fricción. Ver README.md al lado.

## Por qué

El plugin oficial cubre texto y archivos, todo dentro de la **ventana de
conversación de 24 horas** de WhatsApp. Fuera de esa ventana Meta no acepta
mensajes libres: solo **plantillas aprobadas**.

Eso deja afuera todo lo que inicia el negocio y no el cliente:

- recordatorios de cita (el día antes)
- seguimientos de venta (retomar a quien dejó de responder)
- confirmaciones y avisos

Hoy un agente sobre este plugin **no puede iniciar** ninguna de esas
conversaciones. Puede responder, no puede volver a escribir.

## Detalles que importan

- Los parámetros son **posicionales**: van en el orden de los `{{1}}`, `{{2}}`
  de la plantilla aprobada. La cantidad equivocada devuelve error 132000 de
  Meta, no un mensaje a medias.
- Cada envío **abre una conversación paga**. No es una llamada gratis.
- Reusa `_resolve_chat_id`, así que hereda el soporte multi-número del plugin
  (`<phone_number_id>:<destinatario>` y `kapso:<b64>:<b64>`) sin código extra.
"""

from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# 1 · Helper libre — va junto a `_send_text_via_kapso`, mismo contrato:
#     devuelve {"success"/"message_id"/"raw"} o {"error"/"raw"/"retryable"}.
# ---------------------------------------------------------------------------


async def _send_template_via_kapso(
    *,
    session,
    base_url: str,
    graph_version: str,
    api_key: str,
    phone_number_id: str,
    recipient: str,
    template_name: str,
    language_code: str,
    body_params: Optional[List[str]] = None,
    header_params: Optional[List[str]] = None,
    button_url_params: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """POST de un mensaje ``type: template`` al passthrough de Kapso."""

    def _text_params(values: List[str]) -> List[Dict[str, str]]:
        return [{"type": "text", "text": str(v)} for v in values]

    components: List[Dict[str, Any]] = []
    if header_params:
        components.append({"type": "header", "parameters": _text_params(header_params)})
    if body_params:
        components.append({"type": "body", "parameters": _text_params(body_params)})
    for index, value in enumerate(button_url_params or []):
        # Solo botones de tipo URL con sufijo dinámico. Los de quick-reply no
        # llevan parámetros, y los de call no admiten variables.
        components.append(
            {
                "type": "button",
                "sub_type": "url",
                "index": str(index),
                "parameters": [{"type": "text", "text": str(value)}],
            }
        )

    template: Dict[str, Any] = {
        "name": template_name,
        "language": {"code": language_code},
    }
    if components:
        template["components"] = components

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "template",
        "template": template,
    }

    url = _messages_url(base_url, graph_version, phone_number_id)  # noqa: F821
    headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
    try:
        async with session.post(url, json=payload, headers=headers) as response:
            raw: Any
            try:
                raw = await response.json(content_type=None)
            except Exception:
                raw = await response.text()
            if response.status >= 300:
                return {
                    "error": f"Kapso API HTTP {response.status}: {_compact(raw)}",  # noqa: F821
                    "raw": raw,
                    # 4xx en una plantilla suele ser el nombre, el idioma o la
                    # cantidad de parámetros: reintentar no lo arregla.
                    "retryable": response.status >= 500,
                }
            return {
                "success": True,
                "message_id": _message_id_from_response(raw),  # noqa: F821
                "raw": raw,
            }
    except asyncio.CancelledError:  # noqa: F821
        raise
    except Exception as exc:
        return {"error": str(exc), "retryable": True}


# ---------------------------------------------------------------------------
# 2 · Método del adaptador — va en `KapsoAdapter`, junto a `send`.
# ---------------------------------------------------------------------------


async def send_template(
    self,
    chat_id: str,
    template_name: str,
    language_code: str = "en_US",
    body_params: Optional[List[str]] = None,
    header_params: Optional[List[str]] = None,
    button_url_params: Optional[List[str]] = None,
) -> "SendResult":  # noqa: F821
    """Envía una plantilla aprobada por Meta.

    Es la única forma de escribirle a alguien **fuera** de la ventana de
    conversación de 24 horas: recordatorios, seguimientos, confirmaciones.

    Los parámetros son POSICIONALES y siguen el orden de los ``{{1}}``,
    ``{{2}}`` de la plantilla. Mandar de más o de menos devuelve el error
    132000 de Meta.

    Cada llamada **abre una conversación paga**.
    """
    if not self._session:
        return SendResult(  # noqa: F821
            success=False,
            error="Kapso adapter is not connected",
            retryable=True,
        )

    resolved = self._resolve_chat_id(chat_id)
    if not resolved:
        return SendResult(  # noqa: F821
            success=False,
            error=(
                "Unrecognised chat_id. Use a phone number, "
                "phone_number_id:recipient, or kapso:<encoded_phone>:<encoded_recipient>"
            ),
        )

    phone_number_id, recipient = resolved
    if not phone_number_id:
        return SendResult(  # noqa: F821
            success=False,
            error="KAPSO_PHONE_NUMBER_ID is required when chat_id does not include a phone number ID",
        )

    if not str(template_name or "").strip():
        return SendResult(success=False, error="template_name is required")  # noqa: F821

    result = await _send_template_via_kapso(
        session=self._session,
        base_url=self.base_url,
        graph_version=self.graph_version,
        api_key=self.api_key,
        phone_number_id=phone_number_id,
        recipient=recipient,
        template_name=str(template_name).strip(),
        language_code=str(language_code or "en_US").strip(),
        body_params=body_params,
        header_params=header_params,
        button_url_params=button_url_params,
    )

    if result.get("error"):
        return SendResult(  # noqa: F821
            success=False,
            error=str(result["error"]),
            raw_response=result.get("raw"),
            retryable=bool(result.get("retryable")),
        )

    return SendResult(  # noqa: F821
        success=True,
        message_id=result.get("message_id"),
        raw_response=result.get("raw"),
    )
