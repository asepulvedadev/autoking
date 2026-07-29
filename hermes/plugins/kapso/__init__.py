"""Plugin de plataforma Kapso para Hermes Agent.

Sin este archivo el cargador de plugins descarta el directorio con
"No __init__.py in ...". Lo vale saber: el plugin aparece igual en
``hermes plugins list`` (que lee el ``plugin.yaml``), así que se ve
"descubierto" y "enabled" mientras en realidad nunca se carga.
"""

from .adapter import register

__all__ = ["register"]
