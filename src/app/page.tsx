// Root "/" — middleware handles the redirect based on auth state.
// This component only renders if middleware somehow misses (e.g. static export).
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
