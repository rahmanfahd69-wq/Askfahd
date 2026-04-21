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

  // Debug: confirm session and what cookies are now set
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("[login action] session user:", data.session?.user?.id ?? "NO SESSION");
  console.log("[login action] session expires_at:", data.session?.expires_at ?? "N/A");
  console.log("[login action] all cookies after login:", JSON.stringify(
    allCookies.map(c => ({ name: c.name, valueLength: c.value.length }))
  ));
  const sbCookies = allCookies.filter(c => c.name.startsWith("sb-"));
  console.log("[login action] sb- cookies:", sbCookies.map(c => c.name));

  redirect("/");
}
