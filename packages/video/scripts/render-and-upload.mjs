/**
 * Pipeline de render de Remotion → Supabase Storage (bucket `videos`).
 *
 * Renderiza una composición a MP4 y la sube al bucket público `videos`.
 * Pensado para correr en un WORKER / VPS / Lambda / CI — NUNCA en una
 * función serverless de Vercel (Chromium es muy pesado).
 *
 * Requisitos:
 *   - Chrome Headless Shell:  npx remotion browser ensure
 *   - Env:  NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL) + SUPABASE_SECRET_KEY
 *           (o SUPABASE_SERVICE_ROLE_KEY)  — la key secreta, solo servidor.
 *
 * Uso:
 *   node --env-file=../../apps/web/.env.local scripts/render-and-upload.mjs [CompositionId] [rutaEnBucket]
 *   # o via pnpm:  pnpm --filter @autoking/video render:upload BrandClip clips/brand.mp4
 */
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const compositionId = process.argv[2] ?? "BrandClip";
const storagePath = process.argv[3] ?? `clips/${compositionId}.mp4`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Faltan credenciales. Necesitás NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY.\n" +
      "   Pasalas con: node --env-file=../../apps/web/.env.local ...",
  );
  process.exit(1);
}

async function main() {
  console.log(`🎬 Renderizando composición "${compositionId}"…`);

  // 1) Bundle del proyecto Remotion (reusable entre renders).
  const serveUrl = await bundle({
    entryPoint: path.resolve(projectRoot, "src/index.ts"),
    webpackOverride: (c) => c,
  });

  // 2) Seleccionar la composición.
  const composition = await selectComposition({ serveUrl, id: compositionId });

  // 3) Renderizar a un MP4 local.
  const outDir = path.resolve(projectRoot, "out");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.resolve(outDir, `${compositionId}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outFile,
    chromiumOptions: { enableMultiProcessOnLinux: true },
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  render: ${Math.round(progress * 100)}%   `);
    },
  });
  console.log("\n✅ Render listo:", outFile);

  // 4) Subir al bucket `videos` con la key secreta (bypassa RLS).
  console.log(`☁️  Subiendo a videos/${storagePath}…`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const file = readFileSync(outFile);
  const { error } = await supabase.storage
    .from("videos")
    .upload(storagePath, file, { contentType: "video/mp4", upsert: true });

  if (error) {
    console.error("❌ Falló el upload:", error.message);
    process.exit(1);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${storagePath}`;
  console.log("✅ Subido. URL pública:\n  " + publicUrl);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
