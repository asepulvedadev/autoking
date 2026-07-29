"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { agregarMcp, quitarMcp, probarMcp, loginMcp, asignarMcp } from "@/lib/control";

export type McpState = { ok?: boolean; error?: string; detalle?: string; url?: string };

/** Los MCP los maneja solo el equipo: dan herramientas reales a los agentes. */
async function guard() {
  const me = await getSessionProfile();
  return me && isPrivileged(me.role) ? me : null;
}

/** "clave=valor" por línea → objeto. */
function pares(texto: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const linea of texto.split("\n")) {
    const i = linea.indexOf("=");
    if (i > 0) {
      const k = linea.slice(0, i).trim();
      const v = linea.slice(i + 1).trim();
      if (k) out[k] = v;
    }
  }
  return out;
}

export async function conectarMcp(_prev: McpState, fd: FormData): Promise<McpState> {
  if (!(await guard())) return { error: "Solo un administrador puede conectar MCP." };

  const nombre = String(fd.get("nombre") ?? "").trim();
  const tipo = (String(fd.get("tipo") ?? "stdio") === "http" ? "http" : "stdio") as "stdio" | "http";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,48}$/.test(nombre))
    return { error: "El nombre solo admite letras, números, guion y guion bajo." };

  try {
    if (tipo === "http") {
      const url = String(fd.get("url") ?? "").trim();
      if (!url) return { error: "Falta la URL del servidor." };
      const usaOauth = String(fd.get("auth") ?? "") === "oauth";
      const r = await agregarMcp({
        nombre,
        tipo,
        url,
        auth: usaOauth ? "oauth" : undefined,
        headers: pares(String(fd.get("headers") ?? "")),
      });
      revalidatePath("/admin/mcp");
      return {
        ok: true,
        detalle: usaOauth
          ? `"${r.nombre}" conectado. Falta autorizarlo: tocá "Autorizar".`
          : `"${r.nombre}" conectado.`,
      };
    }

    const command = String(fd.get("command") ?? "").trim();
    if (!command) return { error: "Falta el comando a ejecutar." };
    const r = await agregarMcp({
      nombre,
      tipo,
      command,
      args: String(fd.get("args") ?? "").split("\n").map((a) => a.trim()).filter(Boolean),
      env: pares(String(fd.get("env") ?? "")),
    });
    revalidatePath("/admin/mcp");
    return { ok: true, detalle: `"${r.nombre}" conectado. Ahora asignalo a los agentes que lo necesiten.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function desconectarMcp(fd: FormData) {
  if (!(await guard())) return;
  try {
    await quitarMcp(String(fd.get("nombre") ?? ""));
  } catch {
    /* la vista se recarga y muestra el estado real */
  }
  revalidatePath("/admin/mcp");
}

export async function probarConexion(_prev: McpState, fd: FormData): Promise<McpState> {
  if (!(await guard())) return { error: "No autorizado." };
  try {
    const r = await probarMcp(String(fd.get("nombre") ?? ""));
    return { ok: true, detalle: r.salida || "Conectó, pero no reportó herramientas." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Autorización OAuth en dos pasos.
 * Sin código devuelve la URL para abrir; con código la completa.
 */
export async function autorizarMcp(_prev: McpState, fd: FormData): Promise<McpState> {
  if (!(await guard())) return { error: "No autorizado." };
  const nombre = String(fd.get("nombre") ?? "");
  const code = String(fd.get("code") ?? "").trim();
  try {
    const r = await loginMcp(nombre, code || undefined);
    revalidatePath("/admin/mcp");
    if (code) return { ok: true, detalle: "Autorizado ✅ Ya podés asignarlo a un agente." };
    return r.url
      ? { ok: true, url: r.url, detalle: "Abrí este link, autorizá, y pegá el código que te devuelva." }
      : { ok: true, detalle: r.salida || "No devolvió una URL de autorización." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function cambiarAsignacion(fd: FormData) {
  if (!(await guard())) return;
  try {
    await asignarMcp(
      String(fd.get("nombre") ?? ""),
      String(fd.get("agentId") ?? ""),
      String(fd.get("permitir") ?? "") === "true",
    );
  } catch {
    /* idem */
  }
  revalidatePath("/admin/mcp");
}
