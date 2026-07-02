/**
 * Buckets de Storage de AutoKing (ambos PÚBLICOS de lectura):
 *  - `images`: imágenes de la landing (logo, fotos, assets).
 *  - `videos`: videos renderizados con Remotion (MP4).
 *
 * Crear en Supabase (una vez), con estos ajustes recomendados:
 *  images → public, mime image/*, límite ~5 MB
 *  videos → public, mime video/mp4, límite ~100 MB
 */
export const BUCKETS = {
  images: "images",
  videos: "videos",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** URL pública de un archivo en un bucket público (para <img> / <video> / Player).
 *  Construye la URL directamente → usable en cliente y servidor sin instanciar cliente. */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
