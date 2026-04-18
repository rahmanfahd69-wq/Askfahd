"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTrainer } from "@/app/(admin)/admin/trainers/actions";

interface TrainerData {
  id: string;
  full_name: string;
  bio: string | null;
  coaching_style: string | null;
  ai_name: string;
  ai_system_prompt: string | null;
  photo_url: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  specialties: string[];
}

export function TrainerBrandingForm({ trainer }: { trainer: TrainerData }) {
  const [status, setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg]   = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setStatus("saving");
    setErrMsg("");

    const result = await updateTrainer(trainer.id, new FormData(formRef.current));
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
      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tb-name">Full Name</Label>
          <Input id="tb-name" name="full_name" defaultValue={trainer.full_name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tb-photo">Photo URL</Label>
          <Input id="tb-photo" name="photo_url" defaultValue={trainer.photo_url ?? ""} placeholder="https://…" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tb-bio">Bio</Label>
        <Textarea id="tb-bio" name="bio" defaultValue={trainer.bio ?? ""} placeholder="Shown to clients on their dashboard…" rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tb-style">Coaching Style</Label>
          <Input id="tb-style" name="coaching_style" defaultValue={trainer.coaching_style ?? ""} placeholder="e.g. Strict & data-driven" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tb-spec">Specialties</Label>
          <Input id="tb-spec" name="specialties" defaultValue={trainer.specialties.join(", ")} placeholder="Fat Loss, Strength (comma-separated)" />
        </div>
      </div>

      {/* AI Persona */}
      <div className="pt-2 border-t border-[rgba(255,255,255,0.07)]">
        <p className="font-['Syne'] text-[11px] font-bold uppercase tracking-[2px] text-[rgba(255,87,34,0.7)] mb-4">
          AI Coach Persona
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tb-ainame">AI Coach Name</Label>
            <Input id="tb-ainame" name="ai_name" defaultValue={trainer.ai_name} placeholder="e.g. Coach Alex" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tb-aiprompt">System Prompt</Label>
            <Textarea
              id="tb-aiprompt"
              name="ai_system_prompt"
              defaultValue={trainer.ai_system_prompt ?? ""}
              placeholder="You are [AI Name], a fitness coach built by [Trainer Name]…"
              rows={5}
              className="min-h-[120px] font-mono text-[13px]"
            />
            <p className="text-[11px] text-[rgba(255,255,255,0.3)]">
              This is injected as the system prompt in every client chat session.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="pt-2 border-t border-[rgba(255,255,255,0.07)]">
        <p className="font-['Syne'] text-[11px] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)] mb-4">
          Contact & Socials
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tb-wa">WhatsApp Number</Label>
            <Input id="tb-wa" name="whatsapp_number" defaultValue={trainer.whatsapp_number ?? ""} placeholder="+971555000000" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tb-ig">Instagram Handle</Label>
            <Input id="tb-ig" name="instagram_handle" defaultValue={trainer.instagram_handle ?? ""} placeholder="@handle" />
          </div>
        </div>
      </div>

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
