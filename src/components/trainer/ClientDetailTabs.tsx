"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateClientProfile, updateTrainerNotes } from "@/app/(trainer)/trainer/clients/actions";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "plan" | "chat" | "notes";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Plan {
  id: string;
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  is_active: boolean;
  generated_by: string;
  created_at: string;
}

interface Props {
  clientId: string;
  clientName: string;
  profile: {
    age: number | null;
    gender: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    goals: string[];
    activity_level: string | null;
    gym_access: string | null;
    diet_type: string | null;
    injuries: string[];
    notes: string | null;
    trainer_notes: string | null;
    pt_start_date: string | null;
    pt_end_date: string | null;
  };
  plans: Plan[];
  chatMessages: ChatMessage[];
}

export function ClientDetailTabs({ clientId, clientName, profile, plans, chatMessages }: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "plan",    label: "Plan" },
    { id: "chat",    label: "Chat History" },
    { id: "notes",   label: "Notes" },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.07)] mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-['Outfit'] font-medium transition-all border-b-2 -mb-px",
              tab === t.id
                ? "text-[#FF8A65] border-[#FF5722]"
                : "text-[rgba(255,255,255,0.4)] border-transparent hover:text-[rgba(255,255,255,0.7)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab clientId={clientId} profile={profile} />
      )}
      {tab === "plan" && (
        <PlanTab clientId={clientId} clientName={clientName} plans={plans} />
      )}
      {tab === "chat" && (
        <ChatTab clientName={clientName} messages={chatMessages} />
      )}
      {tab === "notes" && (
        <NotesTab clientId={clientId} initialNotes={profile.trainer_notes || ""} />
      )}
    </div>
  );
}

// ── Profile Tab ──────────────────────────────────────────────

function ProfileTab({ clientId, profile }: { clientId: string; profile: Props["profile"] }) {
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
    const result = await updateClientProfile(clientId, new FormData(formRef.current));
    if (result.error) { setError(result.error); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extremely active"];
  const GYM_OPTIONS     = ["Full gym", "Home gym", "No equipment", "Outdoor only"];
  const DIET_TYPES      = ["No restriction", "Vegetarian", "Vegan", "Halal", "Keto", "Paleo", "Gluten-free"];
  const GENDER_OPTIONS  = ["Male", "Female", "Other", "Prefer not to say"];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-age">Age</Label>
          <Input id="pr-age" name="age" type="number" defaultValue={profile.age ?? ""} min={10} max={100} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-gender">Gender</Label>
          <select
            id="pr-gender"
            name="gender"
            defaultValue={profile.gender || ""}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
          >
            <option value="">Select…</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-height">Height (cm)</Label>
          <Input id="pr-height" name="height_cm" type="number" defaultValue={profile.height_cm ?? ""} step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-weight">Weight (kg)</Label>
          <Input id="pr-weight" name="weight_kg" type="number" defaultValue={profile.weight_kg ?? ""} step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-ptstart">PT Start Date</Label>
          <Input id="pr-ptstart" name="pt_start_date" type="date" defaultValue={profile.pt_start_date || ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-ptend">PT End Date</Label>
          <Input id="pr-ptend" name="pt_end_date" type="date" defaultValue={profile.pt_end_date || ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pr-goals">
          Goals <span className="text-[rgba(255,255,255,0.3)] font-normal">(comma-separated)</span>
        </Label>
        <Input id="pr-goals" name="goals" defaultValue={profile.goals.join(", ")} placeholder="Weight loss, Muscle gain…" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-activity">Activity Level</Label>
          <select
            id="pr-activity"
            name="activity_level"
            defaultValue={profile.activity_level || ""}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
          >
            <option value="">Select…</option>
            {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-gym">Gym Access</Label>
          <select
            id="pr-gym"
            name="gym_access"
            defaultValue={profile.gym_access || ""}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
          >
            <option value="">Select…</option>
            {GYM_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pr-diet">Diet Type</Label>
          <select
            id="pr-diet"
            name="diet_type"
            defaultValue={profile.diet_type || ""}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
          >
            <option value="">Select…</option>
            {DIET_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pr-injuries">
          Injuries / Limitations <span className="text-[rgba(255,255,255,0.3)] font-normal">(comma-separated)</span>
        </Label>
        <Input id="pr-injuries" name="injuries" defaultValue={profile.injuries.join(", ")} placeholder="Lower back pain, Left knee…" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pr-notes">Medical Notes</Label>
        <Textarea id="pr-notes" name="notes" defaultValue={profile.notes || ""} placeholder="Medical history, medications…" rows={3} />
      </div>

      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">{error}</p>
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

// ── Plan Tab ─────────────────────────────────────────────────

function PlanTab({ clientId, clientName, plans }: { clientId: string; clientName: string; plans: Plan[] }) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");
  const [planType, setPlanType]     = useState<"full" | "workout" | "nutrition">("full");
  const [localPlans, setLocalPlans] = useState(plans);
  const [expanded, setExpanded]     = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, planType }),
      });
      const data = await res.json();
      if (data.error) {
        setGenError(data.error);
      } else {
        const newPlan: Plan = {
          id: data.planId,
          type: planType,
          title: `${clientName}'s ${planType} Plan`,
          content: data.planContent,
          is_active: true,
          generated_by: "ai",
          created_at: new Date().toISOString(),
        };
        setLocalPlans((prev) => [newPlan, ...prev.map((p) => p.type === planType ? { ...p, is_active: false } : p)]);
        setExpanded(newPlan.id);
      }
    } catch {
      setGenError("Failed to generate plan. Please try again.");
    }
    setGenerating(false);
  }

  const activePlans = localPlans.filter((p) => p.is_active);

  return (
    <div className="space-y-5">
      {/* Generate button */}
      <div className="bg-[rgba(255,87,34,0.04)] border border-[rgba(255,87,34,0.12)] rounded-[12px] p-5">
        <h3 className="font-['Syne'] font-bold text-[14px] mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-[#FF8A65]" />
          Generate AI Plan
        </h3>
        <div className="flex gap-2 mb-3">
          {(["full", "workout", "nutrition"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPlanType(type)}
              className={cn(
                "px-3 py-1.5 rounded-[6px] text-[11px] font-['Syne'] font-bold uppercase tracking-[1px] transition-colors",
                planType === type
                  ? "bg-[#FF5722] text-white"
                  : "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.45)] hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <><Loader2 size={13} className="animate-spin" /> Generating…</>
          ) : (
            <>Generate {planType} plan</>
          )}
        </Button>
        {genError && (
          <p className="mt-3 text-[12px] text-red-400">{genError}</p>
        )}
      </div>

      {/* Active plans */}
      {activePlans.length === 0 ? (
        <p className="text-[13px] text-[rgba(255,255,255,0.35)]">No active plans yet. Generate one above.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)]">
            Active Plans
          </p>
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              expanded={expanded === plan.id}
              onToggle={() => setExpanded(expanded === plan.id ? null : plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, expanded, onToggle }: { plan: Plan; expanded: boolean; onToggle: () => void }) {
  const content = plan.content as Record<string, unknown>;

  return (
    <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="font-['Syne'] font-bold text-[13px]">{plan.title || "Plan"}</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">
            {plan.type} · AI generated · {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>
        {expanded ? <ChevronUp size={15} className="text-[rgba(255,255,255,0.3)]" /> : <ChevronDown size={15} className="text-[rgba(255,255,255,0.3)]" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)]">
          {typeof content.summary === "string" && (
            <p className="text-[13px] text-[rgba(255,255,255,0.6)] mt-4 mb-4 leading-relaxed">
              {content.summary}
            </p>
          )}
          <pre className="text-[11px] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.02)] rounded-[8px] p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Chat History Tab ──────────────────────────────────────────

function ChatTab({ clientName, messages }: { clientName: string; messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[rgba(255,255,255,0.35)]">{clientName} hasn&apos;t chatted with the AI yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
      <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.3)] mb-4">
        {messages.length} messages — read only
      </p>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[75%] rounded-[10px] px-4 py-3",
              msg.role === "user"
                ? "bg-[rgba(255,87,34,0.12)] border border-[rgba(255,87,34,0.2)]"
                : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]"
            )}
          >
            <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1px] mb-1.5 text-[rgba(255,255,255,0.35)]">
              {msg.role === "user" ? clientName : "AI Coach"}
            </p>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-1.5">
              {new Date(msg.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notes Tab ────────────────────────────────────────────────

function NotesTab({ clientId, initialNotes }: { clientId: string; initialNotes: string }) {
  const [notes, setNotes]   = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    const result = await updateTrainerNotes(clientId, notes);
    if (result.error) { setError(result.error); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-[12px] text-[rgba(255,255,255,0.35)]">
        Private notes — only visible to you. Clients cannot see this.
      </p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Session observations, progress notes, reminders for next check-in…"
        rows={12}
      />
      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Notes"}
        </Button>
        {saved && <span className="text-[12px] text-green-400">Saved!</span>}
      </div>
    </div>
  );
}
