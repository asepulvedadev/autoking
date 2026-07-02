import { createClient } from "@supabase/supabase-js";
import { getPublicUrl, type BucketName } from "./storage";

/**
 * Cliente Supabase con SERVICE ROLE / SECRET key — SOLO servidor.
 * Bypassa RLS. Usalo para operaciones privilegiadas: subir archivos al
 * Storage (ej: el render de Remotion sube el MP4 al bucket `videos`),
 * seeds, tareas administrativas.
 *
 * ⚠️ NUNCA importar en Client Components ni exponer la key al navegador.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY (solo servidor).");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Sube un archivo a un bucket público y devuelve su URL pública.
 * Solo servidor (usa el cliente admin). Ideal para el pipeline de render.
 */
export async function uploadPublicFile(
  bucket: BucketName,
  path: string,
  file: ArrayBuffer | Blob | Buffer,
  contentType: string,
): Promise<string> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload a ${bucket}/${path} falló: ${error.message}`);
  return getPublicUrl(bucket, path);
}
