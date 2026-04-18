"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { assignTrainer, toggleClientActive } from "@/app/(admin)/admin/clients/actions";

interface Trainer { id: string; full_name: string; }

interface Props {
  clientId: string;
  currentTrainerId: string | null;
  isActive: boolean;
  trainers: Trainer[];
}

export function ClientDetailForm({ clientId, currentTrainerId, isActive, trainers }: Props) {
  const [trainerId, setTrainerId] = useState(currentTrainerId ?? "");
  const [active, setActive]       = useState(isActive);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");

  async function handleAssign() {
    setSaving(true); setMsg("");
    const result = await assignTrainer(clientId, trainerId || null);
    setSaving(false);
    setMsg(result.error ? `Error: ${result.error}` : "Trainer updated.");
  }

  async function handleToggleActive() {
    setSaving(true); setMsg("");
    const newVal = !active;
    const result = await toggleClientActive(clientId, newVal);
    setSaving(false);
    if (!result.error) setActive(newVal);
    setMsg(result.error ? `Error: ${result.error}` : `Client ${newVal ? "activated" : "deactivated"}.`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Assign trainer */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6">
        <p className="font-['Syne'] text-[11px] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.4)] mb-4">
          Trainer Assignment
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-2 flex-1">
            <Label>Assigned Trainer</Label>
            <Select value={trainerId} onValueChange={setTrainerId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {trainers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="primary" size="sm" onClick={handleAssign} disabled={saving}>
            Save
          </Button>
        </div>
      </div>

      {/* Active status */}
      <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6">
        <p className="font-['Syne'] text-[11px] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.4)] mb-4">
          Account Status
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">
              {active ? (
                <span className="text-green-400">Active</span>
              ) : (
                <span className="text-red-400">Deactivated</span>
              )}
            </p>
            <p className="text-[12px] text-[rgba(255,255,255,0.35)] mt-1">
              {active ? "Client can log in and access their dashboard." : "Client cannot log in."}
            </p>
          </div>
          <Button
            variant={active ? "destructive" : "secondary"}
            size="sm"
            onClick={handleToggleActive}
            disabled={saving}
          >
            {active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {msg && (
        <p className={`text-[13px] px-4 py-3 rounded-[6px] border ${
          msg.startsWith("Error")
            ? "text-red-400 bg-red-500/10 border-red-500/20"
            : "text-green-400 bg-green-500/10 border-green-500/20"
        }`}>
          {msg}
        </p>
      )}
    </div>
  );
}
