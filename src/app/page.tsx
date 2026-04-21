import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  admin:   "/admin",
  trainer: "/trainer",
  client:  "/client",
};

// Middleware handles the redirect for most requests via getSession().
// This page is the fallback — if middleware passes "/" through for any
// reason, we do a full server-side auth check here so authenticated users
// never get bounced to /login.
export default async function RootPage() {
  const supabase = await createClient();

  // getSession() reads the cookie — fast, no network call
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  console.log("[root page] session:", session?.user?.id ?? "none", "error:", sessionError?.message ?? "none");

  if (!session) {
    console.log("[root page] no session → /login");
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  console.log("[root page] profile role:", profile?.role ?? "none", "error:", profileError?.message ?? "none");

  const home = profile?.role ? ROLE_HOME[profile.role] : null;
  console.log("[root page] redirecting to:", home ?? "/login");

  redirect(home ?? "/login");
}
