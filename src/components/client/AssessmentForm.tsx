"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAssessmentData } from "@/app/(client)/client/assessment/new/actions";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const GOALS          = ["Weight loss", "Muscle gain", "Endurance", "Flexibility", "General fitness", "Stress relief", "Sport-specific"];
const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extremely active"];
const GYM_OPTIONS    = ["Full gym", "Home gym", "No equipment", "Outdoor only"];
const DIET_TYPES     = ["No restriction", "Vegetarian", "Kerala vegetarian", "Vegan", "Halal", "Keto", "Paleo", "Gluten-free"];
const SLEEP_OPTIONS  = ["Less than 6h", "6-7h", "7-8h", "8h+"];
const STRESS_OPTIONS = ["Low", "Moderate", "High", "Very high"];
const WORK_OPTIONS   = ["Part-time (<30h)", "Full-time (30-45h)", "Overtime (45h+)"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const STEPS = [
  { title: "Basic Info",       subtitle: "Tell us about yourself" },
  { title: "Body Stats",       subtitle: "Your measurements" },
  { title: "Goals & Activity", subtitle: "What are you training for?" },
  { title: "Lifestyle",        subtitle: "Sleep, diet, and schedule" },
  { title: "Health",           subtitle: "Injuries and medical notes" },
];

interface Props {
  defaultValues?: {
    age?: number | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    goals?: string[];
    activity_level?: string | null;
    gym_access?: string | null;
    diet_type?: string | null;
    sleep_hours?: string | null;
    stress_level?: string | null;
    work_hours?: string | null;
    injuries?: string[];
  };
  isRetake?: boolean;
}

export function AssessmentForm({ defaultValues, isRetake }: Props) {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [error, setError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  // Form state
  const [age, setAge]           = useState(defaultValues?.age?.toString() || "");
  const [gender, setGender]     = useState(defaultValues?.gender || "");
  const [heightCm, setHeightCm] = useState(defaultValues?.height_cm?.toString() || "");
  const [weightKg, setWeightKg] = useState(defaultValues?.weight_kg?.toString() || "");
  const [goals, setGoals]       = useState<string[]>(defaultValues?.goals || []);
  const [activity, setActivity] = useState(defaultValues?.activity_level || "");
  const [gym, setGym]           = useState(defaultValues?.gym_access || "");
  const [diet, setDiet]         = useState(defaultValues?.diet_type || "");
  const [sleep, setSleep]       = useState(defaultValues?.sleep_hours || "");
  const [stress, setStress]     = useState(defaultValues?.stress_level || "");
  const [workHours, setWorkHours] = useState(defaultValues?.work_hours || "");
  const [injuries, setInjuries] = useState(defaultValues?.injuries?.join(", ") || "");

  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  async function handleFinalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPlanError("");
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    goals.forEach((g) => fd.append("goals", g));

    // Step 1: Save assessment data to DB
    const result = await saveAssessmentData(fd);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Step 2: Show loading screen while generating plan
    setSubmitting(false);
    setGeneratingPlan(true);

    try {
      const res = await fetch("/api/generate-plan-from-assessment", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Plan generation failed:", data.error);
        // Non-fatal: proceed to plan page even if generation fails
      }
    } catch (err) {
      console.error("Plan generation network error:", err);
      // Non-fatal: redirect anyway
    }

    router.refresh();
    router.push("/client/plan");
  }

  // ── Loading screen while generating plan ──────────────────
  if (generatingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-up">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-4 border-[rgba(255,87,34,0.15)] flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#FF5722]" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF5722] animate-spin" style={{ animationDuration: "1.5s" }} />
        </div>
        <h2 className="font-['Syne'] font-black text-[24px] mb-3">
          Generating your personalised plan...
        </h2>
        <p className="text-[14px] text-[rgba(255,255,255,0.45)] max-w-xs mb-2">
          Your AI coach is building a custom workout and nutrition plan based on your assessment.
        </p>
        <p className="text-[12px] text-[rgba(255,255,255,0.25)]">This takes about 15–20 seconds</p>
        {planError && (
          <p className="mt-4 text-[12px] text-red-400">{planError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Step circles */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-['Syne'] font-black border-2 transition-all",
                i < step  ? "bg-[#FF5722] border-[#FF5722] text-white"
                : i === step ? "bg-transparent border-[#FF5722] text-[#FF5722]"
                             : "bg-transparent border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.25)]"
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn(
                "text-[9px] font-['Syne'] font-bold uppercase tracking-[1px] whitespace-nowrap",
                i === step ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(255,255,255,0.2)]"
              )}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-2 mb-4 transition-all",
                i < step ? "bg-[#FF5722]" : "bg-[rgba(255,255,255,0.1)]"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="font-['Syne'] font-black text-[24px]">{STEPS[step].title}</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-1">{STEPS[step].subtitle}</p>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-4">
        {/* Hidden fields to carry all data */}
        <input type="hidden" name="age" value={age} />
        <input type="hidden" name="gender" value={gender} />
        <input type="hidden" name="height_cm" value={heightCm} />
        <input type="hidden" name="weight_kg" value={weightKg} />
        <input type="hidden" name="activity_level" value={activity} />
        <input type="hidden" name="gym_access" value={gym} />
        <input type="hidden" name="diet_type" value={diet} />
        <input type="hidden" name="sleep_hours" value={sleep} />
        <input type="hidden" name="stress_level" value={stress} />
        <input type="hidden" name="work_hours" value={workHours} />
        <input type="hidden" name="injuries" value={injuries} />

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Age</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28" min={10} max={100} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Gender</Label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={cn(
                      "py-2.5 rounded-[8px] text-[13px] font-medium border transition-all",
                      gender === g
                        ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                        : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(255,255,255,0.15)]"
                    )}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Body Stats */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Height (cm)</Label>
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 175" step="0.1" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Weight (kg)</Label>
              <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 75" step="0.1" />
            </div>
          </div>
        )}

        {/* Step 2: Goals & Activity */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label>Goals <span className="text-[rgba(255,255,255,0.3)] font-normal">(select all that apply)</span></Label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                      goals.includes(g)
                        ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                        : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(255,255,255,0.15)]"
                    )}>{g}</button>
                ))}
              </div>
            </div>
            <SelectField label="Activity Level" value={activity} onChange={setActivity} options={ACTIVITY_LEVELS} />
            <SelectField label="Gym Access" value={gym} onChange={setGym} options={GYM_OPTIONS} />
          </div>
        )}

        {/* Step 3: Lifestyle */}
        {step === 3 && (
          <div className="space-y-4">
            <SelectField label="Diet Type" value={diet} onChange={setDiet} options={DIET_TYPES} />
            <SelectField label="Average Sleep" value={sleep} onChange={setSleep} options={SLEEP_OPTIONS} />
            <SelectField label="Stress Level" value={stress} onChange={setStress} options={STRESS_OPTIONS} />
            <SelectField label="Weekly Work Hours" value={workHours} onChange={setWorkHours} options={WORK_OPTIONS} />
          </div>
        )}

        {/* Step 4: Health */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Injuries / Physical Limitations</Label>
              <Input
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                placeholder="e.g. Lower back pain, Left knee (comma-separated, or 'None')"
              />
              <p className="text-[11px] text-[rgba(255,255,255,0.3)]">
                This helps your AI coach avoid exercises that could worsen these.
              </p>
            </div>
            {error && (
              <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3.5 rounded-[10px] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] font-['Syne'] font-bold text-[14px] hover:bg-[rgba(255,255,255,0.05)] transition-colors min-h-[48px]"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-[2] py-3.5 rounded-[10px] bg-[#FF5722] hover:bg-[#FF8A65] text-white font-['Syne'] font-bold text-[14px] transition-colors min-h-[48px]"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-3.5 rounded-[10px] bg-[#FF5722] hover:bg-[#FF8A65] disabled:opacity-50 disabled:cursor-not-allowed text-white font-['Syne'] font-bold text-[14px] transition-colors min-h-[48px] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : isRetake ? "Update Assessment" : "Complete Assessment →"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "py-2.5 px-3 rounded-[8px] text-[13px] font-medium border transition-all text-left",
              value === opt
                ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(255,255,255,0.15)]"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
