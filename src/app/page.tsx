import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  admin:   "/admin",
  trainer: "/trainer",
  client:  "/client",
};

// Middleware handles the redirect for most requests, but this page acts as
// a fallback so "/" never bounces an authenticated user back to /login.
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const home = profile?.role ? ROLE_HOME[profile.role] : null;
  redirect(home ?? "/login");
}
