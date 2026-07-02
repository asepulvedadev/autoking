import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Packages del workspace que se distribuyen como TS/TSX sin compilar → Next los transpila.
  transpilePackages: ["@autoking/ui", "@autoking/video"],
  // Ancla el file-tracing a la raíz del monorepo (evita que Next elija
  // un lockfile de un directorio padre). Clave para el deploy en Vercel.
  outputFileTracingRoot: resolve(here, "../../"),
};

export default nextConfig;
