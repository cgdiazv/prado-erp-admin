import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, Next.js internals, and login/auth/recovery routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("admin_session");

  // If not authenticated, redirect to /login
  if (!session || !session.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Trial/subscription gate: block expired trials without an active subscription
  try {
    const decoded = JSON.parse(atob(session.value));
    const isActiveSub = decoded?.subscriptionStatus === "ACTIVE";
    const trialEnds = decoded?.trialEndsAt ? Date.parse(decoded.trialEndsAt) : null;
    if (!isActiveSub && trialEnds && Date.now() > trialEnds) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { success: false, error: "Período de prueba finalizado. Suscríbase a un plan para continuar." },
          { status: 402 }
        );
      }
      return NextResponse.redirect(new URL("/pricing?expired=1", request.url));
    }
  } catch {
    // Cookie ilegible: dejar pasar; las APIs validan la sesión contra la BD
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
