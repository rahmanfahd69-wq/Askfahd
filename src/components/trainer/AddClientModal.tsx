"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createClientForTrainer } from "@/app/(trainer)/trainer/clients/actions";

export function AddClientModal() {
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-ptstart">PT Start Date</Label>
                <Input id="ac-ptstart" name="pt_start_date" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ac-ptend">PT End Date</Label>
                <Input id="ac-ptend" name="pt_end_date" type="date" />
              </div>
            </div>

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
