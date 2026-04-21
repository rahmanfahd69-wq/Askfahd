import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  admin:   "/admin",
  trainer: "/trainer",
  client:  "/client",
};

// DEBUG MODE — renders session state on screen instead of redirecting.
// Remove once login is confirmed working.
export default async function RootPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Find Supabase auth cookies
  const authCookies = allCookies.filter(c =>
    c.name.includes("supabase") || c.name.includes("sb-") || c.name.includes("farfit")
  );

  const supabase = await createClient();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user },    error: userError    } = await supabase.auth.getUser();

  let profileRole: string | null = null;
  let profileError: string | null = null;

  if (session?.user?.id) {
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    profileRole  = profile?.role ?? null;
    profileError = pErr?.message ?? null;
  }

  const debugData = {
    timestamp: new Date().toISOString(),
    cookies_total: allCookies.length,
    auth_cookies: authCookies.map(c => ({
      name: c.name,
      value_length: c.value.length,
      value_preview: c.value.slice(0, 60) + (c.value.length > 60 ? "…" : ""),
    })),
    getSession: {
      session_exists: !!session,
      user_id: session?.user?.id ?? null,
      user_email: session?.user?.email ?? null,
      expires_at: session?.expires_at ?? null,
      error: sessionError?.message ?? null,
    },
    getUser: {
      user_id: user?.id ?? null,
      error: userError?.message ?? null,
    },
    profiles_lookup: {
      role: profileRole,
      error: profileError,
    },
    would_redirect_to: profileRole ? (ROLE_HOME[profileRole] ?? "/login") : "/login",
  };

  // If everything looks good, actually redirect
  if (session && profileRole && ROLE_HOME[profileRole]) {
    redirect(ROLE_HOME[profileRole]);
  }

  // Otherwise render debug info so we can see what's missing
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "monospace",
    }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <div style={{
          background: "rgba(255,87,34,0.08)",
          border: "1px solid rgba(255,87,34,0.3)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
        }}>
          <p style={{ color: "#FF8A65", fontSize: 11, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Root Page Debug — {session ? "✓ Session found" : "✗ No session"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
            {session
              ? profileRole
                ? `Would redirect to ${ROLE_HOME[profileRole]} — but redirect blocked for debug`
                : `Session found but profile lookup failed: ${profileError}`
              : "No session found — check auth cookies below"}
          </p>
        </div>

        <pre style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 20,
          color: "rgba(255,255,255,0.75)",
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          overflowY: "auto",
          maxHeight: "80vh",
        }}>
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
