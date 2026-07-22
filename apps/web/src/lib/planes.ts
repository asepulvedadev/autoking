import "server-only";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Planes y precios leídos de la base (multi-mercado) + detección de país.
 * La landing muestra la divisa según la ubicación del visitante:
 * CO→COP, MX→MXN, US→USD, resto→USD.
 */

export type Pais = "CO" | "MX" | "US";

const MONEDA_LOCALE: Record<string, string> = { COP: "es-CO", MXN: "es-MX", USD: "en-US" };

/** País del visitante (header de geolocalización de Vercel). Default US (USD). */
export async function getPais(): Promise<Pais> {
  const h = await headers();
  const c = (h.get("x-vercel-ip-country") ?? "").toUpperCase();
  return c === "CO" || c === "MX" || c === "US" ? (c as Pais) : "US";
}

/** Formatea un monto según su moneda: 396000 COP → "$396.000". */
export function formatMoneda(monto: number, moneda: string, simbolo = "$"): string {
  const locale = MONEDA_LOCALE[moneda] ?? "en-US";
  return simbolo + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(monto);
}

export type PlanConPrecio = {
  slug: string;
  nombre: string;
  titulo: string;
  descripcion: string | null;
  destacado: boolean;
  moneda: string;
  simbolo: string;
  precioMensual: number;
  precioAnual: number | null;
  precioInstalacion: number;
  instalacionIncluye: string | null;
  features: { texto: string; destacado: boolean }[];
};

type PrecioRow = {
  moneda: string;
  simbolo: string;
  precio_mensual: number;
  precio_anual: number | null;
  precio_instalacion: number;
};

type PlanRow = {
  slug: string;
  nombre: string;
  titulo: string;
  descripcion: string | null;
  destacado: boolean;
  instalacion_incluye: string | null;
  plan_precios: PrecioRow | PrecioRow[];
  plan_features: { texto: string; destacado: boolean; orden: number }[];
};

/** Trae los planes activos con el precio del país pedido y sus features. */
export async function getPlanes(pais: Pais): Promise<PlanConPrecio[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("planes")
    .select(
      "slug, nombre, titulo, descripcion, destacado, orden, instalacion_incluye, " +
        "plan_precios!inner(moneda, simbolo, precio_mensual, precio_anual, precio_instalacion, pais), " +
        "plan_features(texto, destacado, orden)",
    )
    .eq("activo", true)
    .eq("plan_precios.pais", pais)
    .order("orden");

  if (error || !data) return [];

  return (data as unknown as PlanRow[]).map((p) => {
    const precio = (Array.isArray(p.plan_precios) ? p.plan_precios[0] : p.plan_precios) as PrecioRow;
    const features = (p.plan_features ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((f) => ({ texto: f.texto, destacado: f.destacado }));
    return {
      slug: p.slug,
      nombre: p.nombre,
      titulo: p.titulo,
      descripcion: p.descripcion,
      destacado: p.destacado,
      moneda: precio.moneda,
      simbolo: precio.simbolo,
      precioMensual: Number(precio.precio_mensual),
      precioAnual: precio.precio_anual != null ? Number(precio.precio_anual) : null,
      precioInstalacion: Number(precio.precio_instalacion),
      instalacionIncluye: p.instalacion_incluye,
      features,
    };
  });
}
