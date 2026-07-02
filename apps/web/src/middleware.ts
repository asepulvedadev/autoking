import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zona admin: sesión de Supabase + protección de rutas.
  if (pathname.startsWith("/admin")) {
    const { response, user } = await updateSession(request);
    const isLogin = pathname === "/admin/login";

    if (!user && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (user && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Sitio público: i18n.
  return intlMiddleware(request);
}

export const config = {
  // Corre en todo menos api, assets internos, rutas de metadata y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)"],
};
