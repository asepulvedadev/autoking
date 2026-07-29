"""
Adaptador de plataforma Kapso para Hermes Agent — WhatsApp Business API oficial.

POR QUÉ ESTO ES UNA SUBCLASE Y NO 2.000 LÍNEAS NUEVAS
=====================================================
Kapso expone un *passthrough* que **espeja la Graph API de Meta v24.0**:

    https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages

Los cuerpos de los mensajes son idénticos a los de Meta. Entonces
``gateway/platforms/whatsapp_cloud.py`` — 2.097 líneas de Nous que ya resuelven
media, notas de voz en opus, botones, listas, respuestas citadas y todo el
gating del ``WhatsAppBehaviorMixin`` — sirve tal cual. Solo cambian TRES cosas:

  1. La URL base            → ``_graph_url()``
  2. El header de auth      → ``X-API-Key`` en vez de ``Authorization: Bearer``
  3. El formato del webhook → eventos de Kapso, no ``entry[].changes[].value``

Reescribir todo eso sería duplicar código ajeno que Nous mantiene, y quedarse
atrás en cada arreglo que ellos hagan.

EL HEADER DE AUTH SE INYECTA CON UN EVENT HOOK, NO PARCHEANDO CALL SITES
------------------------------------------------------------------------
El padre escribe ``"Authorization": f"Bearer {self._access_token}"`` en SEIS
lugares distintos, inline. Sobrescribir los seis métodos sería frágil: en
cuanto Nous agregue un séptimo, ese request sale sin autenticar y falla en
producción sin aviso.

En vez de eso se usa un ``event_hook`` de httpx, que corre sobre CADA request
del cliente — incluidos los que todavía no existen. Es el único punto donde
esto se puede hacer una sola vez y que siga funcionando.

LO QUE ESTE ADAPTADOR AGREGA Y EL DE HERMES NO TIENE
-----------------------------------------------------
**Envío de plantillas.** El docstring de ``whatsapp_cloud.py`` anuncia
"Phase 5 — 24-hour conversation window + template fallback", pero no existe un
solo payload ``"type": "template"`` en todo ``gateway/``: está declarado, no
implementado.

AutoKing lo necesita sí o sí. Fuera de la ventana de 24 horas WhatsApp NO deja
mandar texto libre — solo plantillas aprobadas por Meta. Los recordatorios de
cita y los seguimientos de venta son mensajes que inicia el negocio, casi
siempre fuera de esa ventana. Sin ``send_template`` esas dos funciones del
plan Pro no existen.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
from typing import Any, Dict, List, Optional

try:
    from aiohttp import web
except ImportError:  # pragma: no cover - el gateway ya exige aiohttp
    web = None  # type: ignore[assignment]

import httpx

from gateway.config import Platform, PlatformConfig
from gateway.platforms.base import MessageEvent, MessageType, SendResult
from gateway.platforms.whatsapp_cloud import WhatsAppCloudAdapter

logger = logging.getLogger(__name__)

KAPSO_META_BASE = "https://api.kapso.ai/meta/whatsapp"
KAPSO_PLATFORM_BASE = "https://api.kapso.ai/platform/v1"
DEFAULT_API_VERSION = "v24.0"
DEFAULT_WEBHOOK_PORT = 8091
DEFAULT_WEBHOOK_PATH = "/kapso/webhook"

# Kapso reintenta a los 10s, 40s y 90s si el endpoint no responde 200. Ese
# reintento puede reentregar un mensaje que YA se procesó, y el agente
# contestaría dos veces. El de-dup va por X-Idempotency-Key.
IDEMPOTENCY_CACHE_SIZE = 512

# El único evento que despierta al agente. Los de estado (.sent, .delivered,
# .read) llegan igual si están suscritos, pero no generan turno: reaccionar a
# un acuse de recibo haría que el agente se conteste a sí mismo.
INBOUND_EVENT = "whatsapp.message.received"

# Tipo de mensaje de Kapso → tipo de Hermes. Lo que no está acá cae en TEXT,
# que es el comportamiento correcto: el texto ya lo extrajo _extraer_texto.
_TIPOS = {
    "image": MessageType.PHOTO,
    "video": MessageType.VIDEO,
    "audio": MessageType.VOICE,
    "document": MessageType.DOCUMENT,
    "sticker": MessageType.STICKER,
}


class KapsoAdapter(WhatsAppCloudAdapter):
    """WhatsApp Business API vía Kapso.

    Hereda el transporte de ``WhatsAppCloudAdapter`` y le cambia el destino,
    la autenticación y el parseo del webhook.
    """

    def __init__(self, config: PlatformConfig):
        extra = dict(config.extra or {})

        # El padre exige phone_number_id y access_token para considerarse
        # configurado. Se le pasa la API key de Kapso como access_token para
        # satisfacer esa validación; el event hook la convierte después en
        # X-API-Key, así que el Bearer nunca sale a la red.
        api_key = str(
            extra.get("api_key") or os.getenv("KAPSO_API_KEY", "")
        ).strip()
        extra.setdefault("access_token", api_key)
        extra.setdefault("api_version", os.getenv("KAPSO_API_VERSION", DEFAULT_API_VERSION))
        extra.setdefault("webhook_port", int(os.getenv("KAPSO_WEBHOOK_PORT", DEFAULT_WEBHOOK_PORT)))
        extra.setdefault("webhook_path", os.getenv("KAPSO_WEBHOOK_PATH", DEFAULT_WEBHOOK_PATH))

        # --- Gating del mixin -------------------------------------------
        # El WhatsAppBehaviorMixin lee _allow_from y _dm_policy, y el padre
        # los arma leyendo PRIMERO `extra` y recién después las env
        # WHATSAPP_CLOUD_*. Sembrando `extra` acá, la política sale de las
        # variables KAPSO_* sin tener que reasignar atributos privados
        # después del __init__ — que es lo que se rompería en cuanto Nous
        # cambie cómo las calcula.
        permitidos = os.getenv("KAPSO_ALLOWED_USERS", "").strip()
        if permitidos and "allow_from" not in extra:
            extra["allow_from"] = permitidos
        permitir_todos = os.getenv("KAPSO_ALLOW_ALL_USERS", "").strip().lower() in {
            "1", "true", "yes",
        }
        if "dm_policy" not in extra:
            # En AutoKing el agente atiende público: dm_policy=open. Si hay
            # allowlist y NO se pidió abrir a todos, se respeta la lista.
            extra["dm_policy"] = "open" if permitir_todos or not permitidos else "allowlist"

        config.extra = extra
        super().__init__(config)

        # El padre se identifica como Platform.WHATSAPP_CLOUD (lo tiene
        # hardcodeado). Sin esto, el gateway lo mostraría como "whatsapp_cloud"
        # en `hermes gateway status`, el ruteo por perfil `platform: kapso` no
        # matchearía, y los dos adaptadores colisionarían si corren juntos.
        # El enum admite miembros dinámicos vía _missing_(), así que
        # Platform("kapso") es válido sin tocar el core.
        self.platform = Platform("kapso")

        self._kapso_api_key: str = api_key
        self._webhook_secret: str = str(
            extra.get("webhook_secret") or os.getenv("KAPSO_WEBHOOK_SECRET", "")
        ).strip()
        # FIFO acotado: sin tope, un webhook ruidoso crece sin techo.
        self._seen_idempotency_keys: "list[str]" = []

    # ------------------------------------------------------------- transporte

    def _graph_url(self, path: str) -> str:
        """Misma forma que Graph, otro host.

        El padre arma ``graph.facebook.com/<version>/<phone_id>/<path>``.
        Kapso espeja esa ruta bajo su propio dominio, así que alcanza con
        cambiar la base y todos los métodos heredados apuntan solo.
        """
        if path.startswith("/"):
            path = path[1:]
        return f"{KAPSO_META_BASE}/{self._api_version}/{self._phone_number_id}/{path}"

    async def connect(self, *, is_reconnect: bool = False) -> bool:
        ok = await super().connect(is_reconnect=is_reconnect)
        if ok and self._http_client is not None:
            # Se engancha DESPUÉS de que el padre creó el cliente. El hook
            # corre en cada request, así que cubre también los métodos que
            # Nous agregue en el futuro sin que haya que tocar nada acá.
            self._http_client.event_hooks.setdefault("request", []).append(
                self._swap_auth_header
            )
        if not self._webhook_secret:
            logger.warning(
                "[kapso] KAPSO_WEBHOOK_SECRET vacío: el endpoint acepta "
                "cualquier POST. No dejarlo así en producción."
            )
        return ok

    async def _swap_auth_header(self, request: httpx.Request) -> None:
        """Cambia el Bearer de Meta por el X-API-Key de Kapso.

        Kapso rechaza ``Authorization: Bearer``; hay que sacarlo, no solo
        agregar el header nuevo al lado.
        """
        request.headers.pop("Authorization", None)
        request.headers["X-API-Key"] = self._kapso_api_key

    # --------------------------------------------------------------- webhook

    def _verify_signature(self, raw_body: bytes, header: str) -> bool:
        """HMAC-SHA256 hex sobre el body CRUDO, comparado en tiempo constante.

        Kapso usa ``X-Webhook-Signature`` con hex plano. Meta usa
        ``X-Hub-Signature-256`` con prefijo ``sha256=``. Por eso este método
        se sobreescribe entero en vez de reusar el del padre.

        El body tiene que ser el crudo: si se parsea y se vuelve a serializar,
        cualquier diferencia de espacios o de orden de claves cambia el HMAC y
        la firma no valida nunca.
        """
        if not self._webhook_secret:
            # Sin secreto configurado no hay nada que verificar. Se avisó al
            # conectar; acá se deja pasar para no romper un entorno de prueba.
            return True
        if not header:
            return False
        esperado = hmac.new(
            self._webhook_secret.encode("utf-8"), raw_body, hashlib.sha256
        ).hexdigest()
        # compare_digest y no ==: la comparación normal corta apenas encuentra
        # un byte distinto, y ese tiempo filtra la firma byte por byte.
        return hmac.compare_digest(esperado, header.strip())

    async def _handle_webhook(self, request: "web.Request") -> "web.Response":
        """Recibe un webhook de Kapso.

        Siempre responde 200 una vez que la firma validó. Kapso reintenta ante
        cualquier respuesta que no sea 200 (10s, 40s, 90s), y un bug transitorio
        acá no debe multiplicar el trabajo del agente ni sus respuestas.
        """
        raw = await request.read()

        firma = request.headers.get("X-Webhook-Signature", "")
        if not self._verify_signature(raw, firma):
            logger.warning("[kapso] firma inválida — descartado")
            return web.Response(status=401)

        # De-dup por el header de idempotencia de Kapso.
        clave = request.headers.get("X-Idempotency-Key", "")
        if clave:
            if clave in self._seen_idempotency_keys:
                return web.Response(status=200, text="duplicado")
            self._seen_idempotency_keys.append(clave)
            if len(self._seen_idempotency_keys) > IDEMPOTENCY_CACHE_SIZE:
                self._seen_idempotency_keys.pop(0)

        try:
            payload = await request.json()
        except Exception:
            logger.exception("[kapso] body no es JSON válido")
            return web.Response(status=400)

        # Kapso manda el nombre del evento y la marca de lote por header,
        # no solo en el cuerpo.
        cabecera_evento = request.headers.get("X-Webhook-Event", "")
        cabecera_lote = request.headers.get("X-Webhook-Batch", "")

        try:
            for evento in self._extraer_eventos(payload, cabecera_lote):
                await self._despachar_evento(evento, cabecera_evento)
        except Exception:
            # Se traga la excepción a propósito: ver el docstring.
            logger.exception("[kapso] fallo despachando el webhook")

        return web.Response(status=200, text="ok")

    # --- parseo del payload v2 -------------------------------------------
    # Todo lo que sigue está calcado del parser OFICIAL de Kapso para OpenClaw
    # (`@kapso/openclaw-whatsapp`, dist/webhook.js). No se dedujo de la
    # documentación: se leyó la implementación que hoy atiende a King y Mayand
    # en producción. Las formas alternativas de cada campo (snake_case y
    # camelCase, `kapso.*` y raíz) están porque el original las contempla —
    # Kapso las manda mezcladas según el tipo de mensaje.

    @staticmethod
    def _extraer_eventos(payload: Any, cabecera_lote: str) -> List[Dict[str, Any]]:
        """Un webhook puede traer UN evento o un LOTE.

        Si ``data`` es una lista, cada elemento es un evento. Si no lo es, el
        cuerpo entero ES el evento — salvo que el header diga que era un lote,
        en cuyo caso venía vacío y no hay nada que hacer.
        """
        if not isinstance(payload, dict):
            return []
        datos = payload.get("data")
        if isinstance(datos, list):
            return [e for e in datos if isinstance(e, dict)]
        if str(cabecera_lote).strip().lower() == "true":
            return []
        return [payload]

    async def _despachar_evento(self, evento: Dict[str, Any], cabecera_evento: str) -> None:
        """Traduce un evento de Kapso a un MessageEvent de Hermes."""
        nombre = (
            self._cadena(evento, "event", "type")
            or cabecera_evento.strip()
            or INBOUND_EVENT
        )
        if nombre != INBOUND_EVENT:
            # Acuses de recibo y lifecycle: no generan turno del agente.
            logger.debug("[kapso] evento ignorado: %s", nombre)
            return

        mensaje = evento.get("message")
        if not isinstance(mensaje, dict) or not self._es_mensaje_valido(mensaje):
            return
        conversacion = evento.get("conversation")
        if not isinstance(conversacion, dict):
            conversacion = {}

        # El remitente puede venir en el mensaje o solo en la conversación.
        remitente = self._cadena(mensaje, "from") or self._cadena(
            conversacion, "phone_number", "phoneNumber"
        )
        if not remitente:
            logger.warning("[kapso] evento sin remitente — descartado")
            return

        tipo = self._cadena(mensaje, "type") or "unknown"

        # Kapso transcribe las notas de voz. Si hay transcripción, ESA es el
        # texto: mandarle al modelo "Received a audio message" cuando Kapso ya
        # transcribió sería tirar la información que importa.
        texto = ""
        if tipo == "audio":
            texto = self._extraer_transcripcion(mensaje) or ""
        if not texto:
            texto = self._extraer_texto(mensaje, tipo)

        media = self._extraer_media(mensaje, tipo)
        if not texto:
            clase = media[0][1] if media else tipo
            texto = f"[mensaje de {clase}]"

        kapso_meta = mensaje.get("kapso") if isinstance(mensaje.get("kapso"), dict) else {}
        conv_kapso = conversacion.get("kapso") if isinstance(conversacion.get("kapso"), dict) else {}
        nombre_contacto = (
            self._cadena(kapso_meta, "contactName", "contact_name")
            or self._cadena(conv_kapso, "contactName", "contact_name")
            or self._cadena(conversacion, "contactName", "contact_name")
        )

        mid = self._cadena(mensaje, "id")

        # chat_id == número del remitente: en un DM de WhatsApp la conversación
        # ES la persona. El padre usa la misma convención, así que el gating
        # del mixin (allowlists, menciones) funciona sin tocar nada.
        source = self.build_source(
            chat_id=remitente,
            chat_name=nombre_contacto or remitente,
            chat_type="dm",
            user_id=remitente,
            user_name=nombre_contacto or remitente,
            message_id=mid,
        )

        await self.handle_message(
            MessageEvent(
                text=texto,
                message_type=_TIPOS.get(tipo, MessageType.TEXT),
                source=source,
                raw_message=evento,
                message_id=mid,
                media_urls=[u for u, _ in media],
                media_types=[k for _, k in media],
            )
        )

    # --- helpers de lectura tolerante ------------------------------------

    @staticmethod
    def _cadena(origen: Any, *claves: str) -> str:
        """Primera clave que traiga un string no vacío. '' si ninguna."""
        if not isinstance(origen, dict):
            return ""
        for clave in claves:
            valor = origen.get(clave)
            if isinstance(valor, str) and valor.strip():
                return valor.strip()
        return ""

    @staticmethod
    def _sub(origen: Any, clave: str) -> Dict[str, Any]:
        """Sub-diccionario, o {} si no lo es. Evita isinstance en cada uso."""
        if isinstance(origen, dict):
            valor = origen.get(clave)
            if isinstance(valor, dict):
                return valor
        return {}

    @staticmethod
    def _es_mensaje_valido(mensaje: Dict[str, Any]) -> bool:
        """Kapso garantiza id, type y timestamp como strings en un mensaje.

        Sin los tres, el objeto no es un mensaje (puede ser un acuse o un
        evento de lifecycle que se coló). Mismo criterio que el parser oficial.
        """
        return all(
            isinstance(mensaje.get(c), str) for c in ("id", "type", "timestamp")
        )

    @classmethod
    def _extraer_texto(cls, mensaje: Dict[str, Any], tipo: str) -> str:
        """El texto útil, en el mismo orden de precedencia que usa Kapso."""
        # 1 · texto normal
        texto = cls._cadena(cls._sub(mensaje, "text"), "body")
        if texto:
            return texto
        # 2 · botón de plantilla
        texto = cls._cadena(cls._sub(mensaje, "button"), "text", "payload")
        if texto:
            return texto
        # 3 · respuesta a botón o lista interactiva: vale la ETIQUETA que tocó
        #     el usuario, no el id interno.
        interactivo = cls._sub(mensaje, "interactive")
        for camel, snake, claves in (
            ("buttonReply", "button_reply", ("title", "id")),
            ("listReply", "list_reply", ("title", "id", "description")),
        ):
            bloque = cls._sub(interactivo, camel) or cls._sub(interactivo, snake)
            texto = cls._cadena(bloque, *claves)
            if texto:
                return texto
        # 4 · reacción con emoji
        emoji = cls._cadena(cls._sub(mensaje, "reaction"), "emoji")
        if emoji:
            return f"Reacción: {emoji}"
        # 5 · epígrafe de una imagen/video/documento
        texto = cls._cadena(cls._sub(mensaje, tipo), "caption")
        if texto:
            return texto
        # 6 · pedido del catálogo
        return cls._cadena(cls._sub(mensaje, "kapso"), "orderText", "order_text")

    @classmethod
    def _extraer_transcripcion(cls, mensaje: Dict[str, Any]) -> str:
        """Transcripción de una nota de voz, si Kapso la hizo.

        Viene de dos formas: un objeto ``kapso.transcript`` con el texto
        adentro, o embebida al final de ``kapso.content`` después de la
        palabra "Transcript:".
        """
        kapso = cls._sub(mensaje, "kapso")
        if not kapso:
            return ""

        bloque = cls._sub(kapso, "transcript") or cls._sub(kapso, "transcription")
        texto = cls._cadena(bloque, "text", "body", "content") or cls._cadena(
            kapso, "transcript", "transcription"
        )
        if texto:
            return texto

        contenido = kapso.get("content")
        if not isinstance(contenido, str):
            contenido = cls._cadena(cls._sub(kapso, "content"), "text", "body", "content")
        if isinstance(contenido, str) and contenido.strip():
            m = re.search(r"\bTranscript:\s*([\s\S]*)$", contenido, re.IGNORECASE)
            if m and m.group(1).strip():
                return m.group(1).strip()
        return ""

    @classmethod
    def _extraer_media(cls, mensaje: Dict[str, Any], tipo: str) -> List[tuple]:
        """[(url, clase)] de los adjuntos. Lista vacía si no hay.

        La URL puede estar en tres lugares distintos según el tipo de mensaje;
        se prueban en el mismo orden que el parser oficial.
        """
        directo = cls._sub(mensaje, tipo)
        kapso = cls._sub(mensaje, "kapso")
        datos = cls._sub(kapso, "mediaData") or cls._sub(kapso, "media_data")

        url = (
            cls._cadena(kapso, "mediaUrl", "media_url")
            or cls._cadena(datos, "url", "downloadUrl", "download_url")
            or cls._cadena(directo, "link", "url")
        )
        if not url:
            # Sin URL descargable no hay nada que pasarle al modelo. Kapso
            # puede mandar solo un id de Meta; resolverlo requiere otra llamada
            # y hoy no se hace — el texto ya dice que llegó un adjunto.
            return []

        mime = (
            cls._cadena(datos, "mimeType", "mime_type", "contentType", "content_type")
            or cls._cadena(directo, "mimeType", "mime_type", "contentType", "content_type")
        )
        return [(url, cls._clase_media(tipo, mime))]

    @staticmethod
    def _clase_media(tipo: str, mime: str) -> str:
        if tipo == "image" or mime.startswith("image/"):
            return "image"
        if tipo == "video" or mime.startswith("video/"):
            return "video"
        if tipo == "audio" or mime.startswith("audio/"):
            return "audio"
        if tipo == "document" or mime == "application/pdf":
            return "document"
        return "unknown"

    # ------------------------------------------------------------- plantillas

    async def send_template(
        self,
        chat_id: str,
        template_name: str,
        language_code: str = "es",
        body_params: Optional[List[str]] = None,
        header_params: Optional[List[str]] = None,
        button_params: Optional[List[str]] = None,
    ) -> SendResult:
        """Manda una plantilla aprobada por Meta.

        **Esto es lo que el adaptador Cloud de Hermes no tiene**, y sin ello no
        hay recordatorios de cita ni seguimientos de venta: fuera de la ventana
        de 24 horas WhatsApp solo acepta plantillas.

        Los parámetros son POSICIONALES: van en el orden en que aparecen los
        ``{{1}}``, ``{{2}}``… de la plantilla aprobada. Mandar la cantidad
        equivocada da error 132000 de Meta, no un mensaje a medias.

        Cada envío de plantilla **abre una conversación paga** con Meta. No es
        una llamada gratis: hay que llamarla con criterio, no en un bucle.
        """
        if self._http_client is None:
            return SendResult(success=False, error="Not connected")

        componentes: List[Dict[str, Any]] = []

        def _texto(valores: List[str]) -> List[Dict[str, str]]:
            return [{"type": "text", "text": str(v)} for v in valores]

        if header_params:
            componentes.append({"type": "header", "parameters": _texto(header_params)})
        if body_params:
            componentes.append({"type": "body", "parameters": _texto(body_params)})
        if button_params:
            for indice, valor in enumerate(button_params):
                componentes.append(
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": str(indice),
                        "parameters": [{"type": "text", "text": str(valor)}],
                    }
                )

        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": chat_id,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
            },
        }
        if componentes:
            payload["template"]["components"] = componentes

        try:
            resp = await self._http_client.post(
                self._graph_url("messages"),
                headers={"Content-Type": "application/json"},
                json=payload,
            )
        except Exception as exc:
            logger.exception("[kapso] falló el envío de plantilla")
            # retryable: el gateway reintenta solo los errores de transporte.
            return SendResult(success=False, error=str(exc), retryable=True)

        if resp.status_code >= 400:
            logger.error(
                "[kapso] plantilla '%s' rechazada (%s): %s",
                template_name,
                resp.status_code,
                resp.text[:400],
            )
            return SendResult(
                success=False,
                error=f"HTTP {resp.status_code}: {resp.text[:200]}",
                # 429 y 5xx son transitorios; un 400 por plantilla mal armada
                # no se arregla reintentando.
                retryable=resp.status_code == 429 or resp.status_code >= 500,
            )

        try:
            cuerpo = resp.json()
            mid = (cuerpo.get("messages") or [{}])[0].get("id")
        except Exception:
            cuerpo, mid = None, None

        return SendResult(success=True, message_id=mid, raw_response=cuerpo)


# ------------------------------------------------------------------ registro


def _check_for_registry() -> bool:
    """¿Está habilitado? Lo consulta el registro de plataformas al arrancar."""
    return os.getenv("KAPSO_ENABLED", "").strip().lower() in {"1", "true", "yes"}


def _validate_config(cfg: PlatformConfig) -> bool:
    """True si hay config suficiente para arrancar.

    ⚠️ Devuelve BOOL, no el motivo del error. El registry hace
    ``if not entry.validate_config(config): return None`` — o sea que
    devolver un string con el motivo (truthy) haría pasar una config rota, y
    devolver None cuando está todo bien (falsy) rechazaría una config buena.
    Las dos cosas al revés, y sin más pista que un
    "config validation failed" en el log.
    """
    extra = getattr(cfg, "extra", {}) or {}
    return bool(
        (extra.get("api_key") or os.getenv("KAPSO_API_KEY"))
        and (extra.get("phone_number_id") or os.getenv("KAPSO_PHONE_NUMBER_ID"))
    )


def _env_enablement() -> Optional[dict]:
    """Siembra PlatformConfig.extra desde el entorno.

    Sin este hook, una instalación configurada solo por variables de entorno
    no aparece en ``hermes gateway status`` ni en ``get_connected_platforms()``
    hasta que el SDK instancia el adaptador — y da la falsa impresión de que
    Kapso no está configurado.
    """
    if not _check_for_registry():
        return None
    extra = {
        "api_key": os.getenv("KAPSO_API_KEY", "").strip(),
        "phone_number_id": os.getenv("KAPSO_PHONE_NUMBER_ID", "").strip(),
        "webhook_secret": os.getenv("KAPSO_WEBHOOK_SECRET", "").strip(),
        "api_version": os.getenv("KAPSO_API_VERSION", DEFAULT_API_VERSION),
        "webhook_port": int(os.getenv("KAPSO_WEBHOOK_PORT", DEFAULT_WEBHOOK_PORT)),
        "webhook_path": os.getenv("KAPSO_WEBHOOK_PATH", DEFAULT_WEBHOOK_PATH),
    }
    # webhook_host se omite a propósito cuando está vacío: el default de
    # Hermes (None) bindea IPv4 + IPv6. Pasar "0.0.0.0" bindearía solo IPv4.
    host = os.getenv("KAPSO_WEBHOOK_HOST", "").strip()
    if host:
        extra["webhook_host"] = host

    resultado: Dict[str, Any] = {"extra": extra}
    home = os.getenv("KAPSO_HOME_CHANNEL", "").strip()
    if home:
        resultado["home_channel"] = {"chat_id": home, "name": "WhatsApp (Kapso)"}
    return resultado


def register(ctx) -> None:
    """Punto de entrada del plugin. Lo llama Hermes al arrancar.

    El gateway consulta este registro ANTES de su cadena if/elif interna, así
    que registrarse acá alcanza para que el adaptador se cree en runtime.
    No hace falta tocar el core.
    """
    ctx.register_platform(
        name="kapso",
        label="Kapso (WhatsApp Business API)",
        adapter_factory=lambda cfg: KapsoAdapter(cfg),
        check_fn=_check_for_registry,
        validate_config=_validate_config,
        env_enablement_fn=_env_enablement,
        required_env=["KAPSO_API_KEY", "KAPSO_PHONE_NUMBER_ID"],
        install_hint="Configurar KAPSO_ENABLED, KAPSO_API_KEY y KAPSO_PHONE_NUMBER_ID.",
        cron_deliver_env_var="KAPSO_HOME_CHANNEL",
        allowed_users_env="KAPSO_ALLOWED_USERS",
        allow_all_env="KAPSO_ALLOW_ALL_USERS",
        # WhatsApp corta el texto en 4096; se deja margen para el sufijo que
        # agrega el gateway al partir respuestas largas.
        max_message_length=4000,
        emoji="💬",
        platform_hint=(
            "Estás en WhatsApp a través de Kapso (API oficial de Meta). "
            "Formato: *negrita*, _cursiva_, ~tachado~, ```código```. No hay "
            "encabezados ni tablas: no los uses, se ven como basura. "
            "Límite 4000 caracteres por mensaje; los más largos se parten. "
            "Escribí como en un chat: mensajes cortos, una idea por mensaje. "
            "IMPORTANTE: fuera de la ventana de 24 horas desde el último "
            "mensaje del usuario, WhatsApp NO permite texto libre — solo "
            "plantillas aprobadas. No prometas 'te escribo mañana' salvo que "
            "haya una plantilla para eso."
        ),
    )
