"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminProfile } from "@/app/(admin)/admin/settings/actions";

export function AdminProfileForm({ currentName }: { currentName: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setStatus("saving");
    setErrMsg("");

    const result = await updateAdminProfile(new FormData(formRef.current));
    if (result.error) {
      setErrMsg(result.error);
      setStatus("error");
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ap-name">Display Name</Label>
        <Input id="ap-name" name="full_name" defaultValue={currentName} required />
      </div>

      <p className="text-[12px] text-[rgba(255,255,255,0.3)]">
        Email changes must be done through Supabase Auth dashboard.
      </p>

      {errMsg && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
          {errMsg}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button variant="primary" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save Changes"}
        </Button>
        {status === "saved" && (
          <span className="text-[13px] text-green-400">✓ Saved</span>
        )}
      </div>
    </form>
  );
}
