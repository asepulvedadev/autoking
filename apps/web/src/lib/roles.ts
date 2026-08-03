/**
 * Roles de acceso al panel — son del EQUIPO INTERNO.
 * OJO: no confundir con la tabla `clientes` (las empresas que compran AutoKing).
 * Acá se define quién puede entrar al panel y qué ve; allá, a quién le vendemos.
 * El CHECK en la DB (profiles_role_check) espeja exactamente estos valores.
 */
export const ROLES = ["administrador", "dev", "vendedor", "cliente"] as const;
export type Role = (typeof ROLES)[number];

/** Roles del equipo interno: son los que entran a /admin. */
export const ROLES_STAFF = ["administrador", "dev", "vendedor"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  dev: "Desarrollador",
  vendedor: "Vendedor",
  cliente: "Cliente",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  administrador: "Acceso total: gestiona usuarios, infraestructura y todo el panel.",
  dev: "Acceso técnico total, incluida la gestión de usuarios e infraestructura.",
  vendedor: "Trabaja leads, clientes, prospección y conversaciones. No toca usuarios, recursos ni infraestructura.",
  cliente: "Dueño de un negocio con agente contratado. Entra a /panel y solo ve lo suyo.",
};

export const ROLE_BADGE: Record<Role, string> = {
  administrador: "bg-blue/[0.14] text-blue-bright border-[rgb(30_107_255_/_0.3)]",
  dev: "bg-[rgb(179_136_255_/_0.14)] text-[#b388ff] border-[rgb(179_136_255_/_0.3)]",
  vendedor: "bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)] border-[rgb(43_212_123_/_0.3)]",
  cliente: "bg-[rgb(255_193_7_/_0.14)] text-[var(--color-gold)] border-[rgb(255_193_7_/_0.3)]",
};

/** ¿Es del equipo interno? Los clientes NUNCA entran a /admin. */
export function esStaff(role?: string | null): boolean {
  return (ROLES_STAFF as readonly string[]).includes(role ?? "");
}

/** Roles con permiso para gestionar usuarios y ver infraestructura (secciones sensibles). */
export function isPrivileged(role?: string | null): boolean {
  return role === "administrador" || role === "dev";
}

export function roleLabel(role?: string | null): string {
  return ROLE_LABELS[(role ?? "") as Role] ?? "—";
}

// ============================================================
// RBAC — matriz de acceso por sección (fuente única de verdad).
// La usan el middleware (imposición) y el nav (visibilidad).
// Ordenada de prefijo MÁS específico a más general: gana el primero que matchea.
// ============================================================
const STAFF: Role[] = ["administrador", "dev", "vendedor"];
const PRIV: Role[] = ["administrador", "dev"];

export const SECTION_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin/usuarios", roles: PRIV },
  { prefix: "/admin/infraestructura", roles: PRIV },
  { prefix: "/admin/testimonios", roles: PRIV },
  { prefix: "/admin/equipo", roles: PRIV },
  // Los agentes los ve TODO el staff: adentro de cada uno viven sus leads,
  // conversaciones, prospección y creativos. Quién entra a cuál lo decide la
  // membresía (ver lib/agentes.ts), no el rol — un vendedor atado a Mayand
  // no puede abrir King aunque la ruta esté permitida para su rol.
  { prefix: "/admin/agentes", roles: STAFF },
  { prefix: "/admin/clientes", roles: STAFF },
  // Estas tres salieron del menú y viven dentro de cada agente. Las rutas siguen
  // habilitadas porque el detalle (ej. /admin/leads/<id>) se abre desde ahí.
  { prefix: "/admin/leads", roles: STAFF },
  { prefix: "/admin/conversaciones", roles: STAFF },
  { prefix: "/admin/prospeccion", roles: STAFF },
  { prefix: "/admin/perfil", roles: STAFF }, // el cliente tiene su perfil en /panel
  { prefix: "/admin", roles: STAFF }, // dashboard raíz (más general, va último)
];

/** Roles permitidos para una ruta del panel. Default: solo privilegiados. */
export function rolesForPath(pathname: string): Role[] {
  const hit = SECTION_ACCESS.find(
    (s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/"),
  );
  return hit?.roles ?? PRIV;
}

export function canAccessPath(role: string | null | undefined, pathname: string): boolean {
  return !!role && rolesForPath(pathname).includes(role as Role);
}

/**
 * Página de inicio del rol.
 * El cliente NO va a /admin: su casa es /panel, donde solo ve su agente.
 */
export function roleHome(role: string | null | undefined): string {
  if (role === "cliente") return "/panel";
  return esStaff(role) ? "/admin" : "/panel";
}
