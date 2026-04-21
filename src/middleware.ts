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

  // Debug: log every cookie arriving at middleware
  const allIncoming = request.cookies.getAll();
  console.log("[middleware] path:", pathname);
  console.log("[middleware] all cookies:", JSON.stringify(
    allIncoming.map(c => ({ name: c.name, valueLength: c.value.length }))
  ));
  console.log("[middleware] sb- cookies:", allIncoming.filter(c => c.name.startsWith("sb-")).map(c => c.name));

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

  // Use getSession() — reads from cookie with no network call, so it never
  // fails due to a Supabase auth server timeout. getUser() (which makes a
  // live HTTP request to verify the JWT) belongs in pages/server actions
  // where cryptographic verification matters, not in every middleware hop.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[middleware] getSession error:", sessionError.message);
  }

  const user = session?.user ?? null;

  // ── No session ──
  if (!user) {
    // Clear stale role cache so next login starts fresh
    response.cookies.delete("farfit-role");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Has session — get role (cached in cookie to avoid a DB hit every request) ──
  const VALID_ROLES = ["admin", "trainer", "client"] as const;
  const cached = request.cookies.get("farfit-role")?.value ?? "";
  const sepIdx = cached.indexOf(":");
  const cachedUid  = cached.slice(0, sepIdx);
  const cachedRole = cached.slice(sepIdx + 1) as Role;

  let role: Role | undefined;

  if (cachedUid === user.id && VALID_ROLES.includes(cachedRole)) {
    role = cachedRole;
  } else {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[middleware] profiles lookup error:", profileError.message);
    }

    role = profile?.role as Role | undefined;
    if (role) {
      response.cookies.set("farfit-role", `${user.id}:${role}`, {
        path: "/",
        maxAge: 3600,
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  // ── Logged-in user hitting / → send to their dashboard ──
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : "/login";
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
  // Exclude /login and /auth/callback from middleware entirely — they must
  // never be intercepted or the redirect-to-login guard creates an infinite loop.
  // Also exclude _next internals, API routes, and static files.
  matcher: [
    "/((?!login|auth/callback|_next/static|_next/image|favicon\\.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
