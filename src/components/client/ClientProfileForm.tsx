"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClientProfile } from "@/app/(client)/client/profile/actions";
import { cn } from "@/lib/utils";

const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extremely active"];
const DIET_TYPES      = ["No restriction", "Vegetarian", "Vegan", "Halal", "Keto", "Paleo", "Gluten-free"];
const GENDER_OPTIONS  = ["Male", "Female", "Other", "Prefer not to say"];
const GOALS_LIST      = ["Weight loss", "Muscle gain", "Endurance", "Flexibility", "General fitness", "Stress relief", "Sport-specific"];

interface Props {
  data: {
    age: number | null;
    gender: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    goals: string[];
    activity_level: string | null;
    diet_type: string | null;
  };
}

export function ClientProfileForm({ data }: Props) {
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [gender, setGender]   = useState(data.gender || "");
  const [activity, setActivity] = useState(data.activity_level || "");
  const [diet, setDiet]       = useState(data.diet_type || "");
  const [goals, setGoals]     = useState<string[]>(data.goals || []);
  const formRef = useRef<HTMLFormElement>(null);

  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const fd = new FormData(formRef.current);
    fd.set("gender", gender);
    fd.set("activity_level", activity);
    fd.set("diet_type", diet);
    fd.set("goals", goals.join(","));

    const result = await updateClientProfile(fd);
    if (result.error) { setError(result.error); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Age</Label>
          <Input name="age" type="number" defaultValue={data.age ?? ""} min={10} max={100} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Gender</Label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  "flex-1 py-2 rounded-[7px] text-[12px] font-medium border transition-all",
                  gender === g
                    ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.45)]"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Height (cm)</Label>
          <Input name="height_cm" type="number" defaultValue={data.height_cm ?? ""} step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Weight (kg)</Label>
          <Input name="weight_kg" type="number" defaultValue={data.weight_kg ?? ""} step="0.1" />
        </div>
      </div>

      {/* Goals */}
      <div className="flex flex-col gap-2">
        <Label>Goals</Label>
        <div className="flex flex-wrap gap-2">
          {GOALS_LIST.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGoal(g)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                goals.includes(g)
                  ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                  : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.45)]"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Activity & Diet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label>Activity Level</Label>
          <div className="space-y-1.5">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActivity(a)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-[8px] text-[13px] border transition-all",
                  activity === a
                    ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)]"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Diet Type</Label>
          <div className="space-y-1.5">
            {DIET_TYPES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiet(d)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-[8px] text-[13px] border transition-all",
                  diet === d
                    ? "bg-[rgba(255,87,34,0.1)] border-[rgba(255,87,34,0.4)] text-[#FF8A65]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)]"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[12px] text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-4 py-3">
        Medical notes and injuries are managed by your trainer.
      </p>

      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto justify-center text-[14px] py-3 sm:py-2 min-h-[48px] sm:min-h-0"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="text-[13px] text-green-400 text-center sm:text-left">Saved!</span>}
      </div>
    </form>
  );
}
