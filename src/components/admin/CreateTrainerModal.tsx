"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createTrainer } from "@/app/(admin)/admin/trainers/actions";

export function CreateTrainerModal() {
  const [open, setOpen]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");

    const result = await createTrainer(new FormData(formRef.current));
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      formRef.current.reset();
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add Trainer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Trainer</DialogTitle>
            <DialogDescription>Creates a Supabase auth account and trainer profile.</DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-name">Full Name</Label>
              <Input id="ct-name" name="full_name" placeholder="e.g. Alex Johnson" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-email">Email</Label>
              <Input id="ct-email" name="email" type="email" placeholder="trainer@example.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-pw">Temporary Password</Label>
              <Input id="ct-pw" name="password" type="password" placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-style">Coaching Style</Label>
              <Input id="ct-style" name="coaching_style" placeholder="e.g. Strict & data-driven" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-spec">Specialties</Label>
              <Input id="ct-spec" name="specialties" placeholder="Fat Loss, Strength, Rehab (comma-separated)" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ct-bio">Bio</Label>
              <Textarea id="ct-bio" name="bio" placeholder="Short bio shown to clients…" rows={3} />
            </div>

            {error && (
              <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" size="sm" type="button">Cancel</Button>
              </DialogClose>
              <Button variant="primary" size="sm" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Trainer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
