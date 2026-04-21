"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createClientForTrainer } from "@/app/(trainer)/trainer/clients/actions";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export function AddClientModal() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");

    const result = await createClientForTrainer(new FormData(formRef.current));
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      formRef.current.reset();
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add Client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Creates a client account assigned to you.</DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Login credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="ac-name">Full Name</Label>
                <Input id="ac-name" name="full_name" placeholder="e.g. Sara Ali" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-email">Email</Label>
                <Input id="ac-email" name="email" type="email" placeholder="client@example.com" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-pw">Password</Label>
                <Input id="ac-pw" name="password" type="password" placeholder="Min 6 chars" required minLength={6} />
              </div>
            </div>

            {/* PT dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-ptstart">PT Start Date</Label>
                <Input id="ac-ptstart" name="pt_start_date" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-ptend">PT End Date</Label>
                <Input id="ac-ptend" name="pt_end_date" type="date" />
              </div>
            </div>

            {/* Biometrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-age">Age</Label>
                <Input id="ac-age" name="age" type="number" placeholder="e.g. 28" min={10} max={100} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-gender">Gender</Label>
                <select
                  id="ac-gender"
                  name="gender"
                  defaultValue=""
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-height">Height (cm)</Label>
                <Input id="ac-height" name="height_cm" type="number" placeholder="e.g. 170" step="0.1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-weight">Weight (kg)</Label>
                <Input id="ac-weight" name="weight_kg" type="number" placeholder="e.g. 70" step="0.1" />
              </div>
            </div>

            {/* Goals & injuries */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="ac-goals">Goals <span className="text-[rgba(255,255,255,0.3)] font-normal">(comma-separated)</span></Label>
              <Input id="ac-goals" name="goals" placeholder="e.g. Weight loss, Muscle gain" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ac-injuries">Injuries / Limitations <span className="text-[rgba(255,255,255,0.3)] font-normal">(comma-separated)</span></Label>
              <Input id="ac-injuries" name="injuries" placeholder="e.g. Lower back pain, Left knee" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ac-notes">Medical Notes</Label>
              <Textarea id="ac-notes" name="notes" placeholder="Any relevant medical history, medications, etc." rows={3} />
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
                {loading ? "Creating…" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
