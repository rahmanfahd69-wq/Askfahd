"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient_ } from "@/app/(admin)/admin/clients/actions";

interface Trainer {
  id: string;
  full_name: string;
}

export function CreateClientModal({ trainers }: { trainers: Trainer[] }) {
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [trainerId, setTrainerId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");

    const fd = new FormData(formRef.current);
    fd.set("trainer_id", trainerId);
    const result = await createClient_(fd);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      formRef.current.reset();
      setTrainerId("");
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add Client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Creates an account and client profile.</DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cc-name">Full Name</Label>
              <Input id="cc-name" name="full_name" placeholder="e.g. Sara Ali" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cc-email">Email</Label>
              <Input id="cc-email" name="email" type="email" placeholder="client@example.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cc-pw">Temporary Password</Label>
              <Input id="cc-pw" name="password" type="password" placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assign Trainer</Label>
              <Select value={trainerId} onValueChange={setTrainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trainer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
