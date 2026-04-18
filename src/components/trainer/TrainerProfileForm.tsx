"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { updateTrainerProfile } from "@/app/(trainer)/trainer/profile/actions";
import { getInitials } from "@/lib/utils";

interface Props {
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[];
  whatsapp: string | null;
  instagram: string | null;
}

export function TrainerProfileForm({ fullName, bio, photoUrl, specialties, whatsapp, instagram }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const result = await updateTrainerProfile(new FormData(formRef.current));
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-5 mb-6">
        <Avatar className="w-16 h-16 text-lg">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-['Syne'] font-bold text-[15px]">{fullName}</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.35)]">Coach Profile</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tp-name">Full Name</Label>
        <Input id="tp-name" name="full_name" defaultValue={fullName} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tp-bio">Bio</Label>
        <Textarea
          id="tp-bio"
          name="bio"
          defaultValue={bio || ""}
          placeholder="Tell clients about your background, experience, and coaching philosophy…"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tp-photo">Photo URL</Label>
        <Input id="tp-photo" name="photo_url" defaultValue={photoUrl || ""} placeholder="https://..." type="url" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tp-specialties">
          Specialties <span className="text-[rgba(255,255,255,0.3)] font-normal">(comma-separated)</span>
        </Label>
        <Input
          id="tp-specialties"
          name="specialties"
          defaultValue={specialties.join(", ")}
          placeholder="e.g. Weight loss, Strength training, HIIT"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tp-wa">WhatsApp Number</Label>
          <Input id="tp-wa" name="whatsapp_number" defaultValue={whatsapp || ""} placeholder="+971 50 000 0000" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tp-ig">Instagram Handle</Label>
          <Input id="tp-ig" name="instagram_handle" defaultValue={instagram || ""} placeholder="@username" />
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
        {saved && <span className="text-[12px] text-green-400">Saved!</span>}
      </div>
    </form>
  );
}
