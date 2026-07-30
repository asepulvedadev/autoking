# Parche: `connect()` incompatible entre el plugin de Kapso y Hermes

## El error

Con `gokapso/hermes-agent-plugin` v0.2.2 sobre Hermes v0.19.0, el gateway
arranca pero **ninguna plataforma conecta**:

```
ERROR gateway.run: ✗ kapso error:
    KapsoAdapter.connect() got an unexpected keyword argument 'is_reconnect'
WARNING gateway.run: Gateway started with no connected platforms
    — 1 platform(s) queued for retry
```

Y reintenta para siempre con backoff (60s, 120s…), así que el servicio figura
`active` mientras WhatsApp no funciona.

## La causa

Hermes cambió la firma del método y el plugin quedó atrás:

| | firma |
|---|---|
| `gateway/platforms/base.py` (Hermes v0.19.0, 20-jul-2026) | `async def connect(self, *, is_reconnect: bool = False) -> bool` |
| `adapter.py` (plugin v0.2.2, 21-jun-2026) | `async def connect(self) -> bool` |

## El arreglo

En `adapter.py` del plugin:

```python
-    async def connect(self) -> bool:
+    async def connect(self, *, is_reconnect: bool = False) -> bool:
```

Se acepta y se ignora: el adaptador no necesita distinguir una conexión nueva
de una reconexión.

## Dónde aplicarlo

⚠️ **Cada perfil tiene su propia copia del plugin.** `HERMES_HOME` apunta al
perfil, así que un plugin instalado en el global es invisible para los
perfiles. Hay que parchear las tres:

```
~/.hermes/plugins/kapso/adapter.py
~/.hermes/profiles/king/plugins/kapso/adapter.py
~/.hermes/profiles/mayand/plugins/kapso/adapter.py
```

Y borrar las cachés: `find ~/.hermes -name __pycache__ -path '*kapso*' -exec rm -rf {} +`

## ⚠️ Se pierde al actualizar el plugin

`hermes plugins update kapso` lo revierte. Va como PR upstream, o hay que
volver a aplicarlo después de cada actualización.
