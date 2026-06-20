import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rutas que requieren sesión activa
const PROTECTED_PATHS = ["/concerts/new", "/concerts/", "/me/"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some(
    (p) =>
      pathname.startsWith(p) &&
      // /concerts/[id] es público; solo /concerts/new y /concerts/[id]/edit están protegidos
      (p !== "/concerts/" || pathname.endsWith("/edit") || pathname === "/concerts/new")
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
