import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Corre en todo menos api, assets internos, rutas de metadata sin extensión
  // (opengraph-image / twitter-image) y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)"],
};
