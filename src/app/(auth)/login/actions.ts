"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email    = (formData.get("email")    as string).trim().toLowerCase();
  const password =  formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login action] signInWithPassword error:", error.message);
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
    };
  }

  console.log("[login action] session user:", data.session?.user?.id ?? "NO SESSION");
  console.log("[login action] session expires_at:", data.session?.expires_at ?? "N/A");

  // Explicitly verify Supabase actually wrote its cookies via setAll.
  // If this shows no sb- cookies, the setAll in server.ts threw silently.
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith("sb-"));
  console.log("[login action] all cookie names after login:", allCookies.map(c => c.name));
  if (sbCookies.length === 0) {
    console.error("[login action] PROBLEM: no sb- cookies written — setAll failed or was never called");
  } else {
    console.log("[login action] sb- cookies written OK:", sbCookies.map(c => c.name));
  }

  redirect("/");
}
