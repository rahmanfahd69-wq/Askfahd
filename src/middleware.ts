import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/supabase/types";

type CookieItem = { name: string; value: string; options?: CookieOptions };

const ROLE_HOME: Record<string, string> = {
  admin:   "/admin",
  trainer: "/trainer",
  client:  "/client",
};

const ROLE_PREFIXES: Record<string, string> = {
  admin:   "/admin",
  trainer: "/trainer",
  client:  "/client",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — essential so tokens are rotated
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute = pathname === "/login" || pathname === "/auth/callback";

  // ── No session ──
  if (!user) {
    if (isAuthRoute) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Has session — fetch role ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as Role | undefined;

  // Logged-in user hitting /login → send to their dashboard
  if (isAuthRoute || pathname === "/") {
    const home = role ? ROLE_HOME[role] : "/login";
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // ── Enforce role-prefixed routes ──
  if (role) {
    const ownPrefix = ROLE_PREFIXES[role];
    const otherPrefixes = Object.values(ROLE_PREFIXES).filter((p) => p !== ownPrefix);
    const trespass = otherPrefixes.some((p) => pathname.startsWith(p));

    if (trespass) {
      const url = request.nextUrl.clone();
      url.pathname = ownPrefix;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
