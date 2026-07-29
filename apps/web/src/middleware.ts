import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";
import { canAccessPath, roleHome, esStaff } from "./lib/roles";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zona admin: sesión de Supabase + protección de rutas + RBAC por rol.
  if (pathname.startsWith("/admin")) {
    const { response, user, role } = await updateSession(request);
    const isLogin = pathname === "/admin/login";

    if (!user && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (user && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = roleHome(role);
      return NextResponse.redirect(url);
    }
    // RBAC: si el rol no puede ver esta sección, lo mando a su home.
    if (user && !isLogin && !canAccessPath(role, pathname)) {
      const home = roleHome(role);
      if (home !== pathname) {
        const url = request.nextUrl.clone();
        url.pathname = home;
        return NextResponse.redirect(url);
      }
    }
    return response;
  }

  // Panel del CLIENTE: su propio espacio, separado del panel interno.
  // Acá no hay matriz de secciones por rol — lo que el cliente ve lo decide su
  // MEMBRESÍA (qué tenant y qué agente), y eso se resuelve adentro con RLS.
  // El middleware solo garantiza que haya sesión.
  if (pathname.startsWith("/panel")) {
    const { response, user, role } = await updateSession(request);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // Staff que entra por error: lo mandamos a su panel.
    if (esStaff(role) && pathname === "/panel") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Onboarding público del cliente (sin auth ni i18n): el token de la URL es la autorización.
  if (pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  // Sitio público: i18n.
  return intlMiddleware(request);
}

export const config = {
  // Corre en todo menos api, assets internos, rutas de metadata y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)"],
};
