"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dumbbell, Utensils, Moon, ChevronDown, ChevronUp } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  notes?: string;
}

interface WorkoutDay {
  name: string;
  type?: string;
  warmup?: string;
  cooldown?: string;
  exercises: Exercise[];
}

interface Meal {
  name: string;
  time?: string;
  foods: Array<{ item: string; amount?: string; calories?: number }>;
  total_calories?: number;
}

interface PlanContent {
  summary?: string;
  duration_weeks?: number;
  workout?: {
    frequency?: string;
    days?: WorkoutDay[];
  };
  days?: WorkoutDay[];
  nutrition?: {
    daily_calories?: number;
    macros?: { protein_g?: number; carbs_g?: number; fats_g?: number };
    meals?: Meal[];
    hydration?: string;
    supplements?: string[];
    tips?: string[];
  };
  daily_calories?: number;
  macros?: { protein_g?: number; carbs_g?: number; fats_g?: number };
  meals?: Meal[];
  recovery?: {
    sleep_target?: string;
    rest_days?: string[];
    tips?: string[];
    active_recovery?: string;
  };
}

interface Plan {
  id: string;
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  generated_by: string;
  created_at: string;
}

interface Props {
  plans: Plan[];
}

type Tab = "workout" | "nutrition" | "recovery";

export function PlanView({ plans }: Props) {
  const [tab, setTab] = useState<Tab>("workout");

  const activePlan = plans[0];

  if (!activePlan) {
    return (
      <div className="text-center py-20 border border-dashed border-[rgba(255,255,255,0.08)] rounded-[16px]">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,87,34,0.06)] flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={26} className="text-[rgba(255,87,34,0.35)]" />
        </div>
        <p className="font-['Syne'] font-bold text-[16px] text-[rgba(255,255,255,0.45)] mb-2">No plan created yet</p>
        <p className="text-[13px] text-[rgba(255,255,255,0.25)] max-w-xs mx-auto leading-relaxed">
          Complete your assessment so your coach can build a personalised plan.
        </p>
        <a
          href="/client/assessment/new"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-[8px] bg-[#FF5722] hover:bg-[#FF8A65] text-white font-['Syne'] font-bold text-[13px] transition-colors"
        >
          Complete Assessment →
        </a>
      </div>
    );
  }

  const content = activePlan.content as PlanContent;
  const workoutDays = content.workout?.days || content.days || [];
  const nutrition = content.nutrition || (content.daily_calories ? content as unknown as PlanContent["nutrition"] : null);
  const recovery = content.recovery;

  const tabs: { id: Tab; label: string; icon: React.FC<{ size: number; className?: string }> }[] = [
    { id: "workout",   label: "Workout",   icon: Dumbbell  },
    { id: "nutrition", label: "Nutrition", icon: Utensils  },
    { id: "recovery",  label: "Recovery",  icon: Moon      },
  ];

  return (
    <div>
      {/* Plan meta */}
      {content.summary && (
        <div className="mb-6 bg-[rgba(255,87,34,0.04)] border border-[rgba(255,87,34,0.1)] rounded-[10px] px-5 py-4">
          <p className="text-[13px] text-[rgba(255,255,255,0.65)] leading-relaxed">{content.summary}</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-2">
            {content.duration_weeks ? `${content.duration_weeks}-week plan · ` : ""}
            AI generated · {new Date(activePlan.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.07)] mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-['Outfit'] font-medium transition-all border-b-2 -mb-px",
              tab === id
                ? "text-[#FF8A65] border-[#FF5722]"
                : "text-[rgba(255,255,255,0.4)] border-transparent hover:text-[rgba(255,255,255,0.7)]"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Workout Tab */}
      {tab === "workout" && (
        <div className="space-y-3">
          {content.workout?.frequency && (
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-4">
              {content.workout.frequency}
            </p>
          )}
          {workoutDays.length === 0 ? (
            <p className="text-[13px] text-[rgba(255,255,255,0.35)]">No workout days in this plan.</p>
          ) : (
            workoutDays.map((day, i) => <WorkoutDayCard key={i} day={day} />)
          )}
        </div>
      )}

      {/* Nutrition Tab */}
      {tab === "nutrition" && (
        <div className="space-y-5">
          {nutrition ? (
            <>
              {/* Macro summary */}
              {(nutrition.daily_calories || nutrition.macros) && (
                <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-5">
                  {nutrition.daily_calories && (
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-['Syne'] font-black text-[36px] text-[#FF5722] leading-none">
                        {nutrition.daily_calories}
                      </span>
                      <span className="text-[14px] text-[rgba(255,255,255,0.4)]">kcal / day</span>
                    </div>
                  )}
                  {nutrition.macros && (
                    <div className="space-y-3">
                      {([
                        { label: "Protein", value: nutrition.macros.protein_g, color: "#FF5722" },
                        { label: "Carbs",   value: nutrition.macros.carbs_g,   color: "#3B82F6" },
                        { label: "Fats",    value: nutrition.macros.fats_g,    color: "#F59E0B" },
                      ] as const).filter(m => m.value).map(({ label, value, color }) => {
                        const total = (nutrition.macros?.protein_g || 0) + (nutrition.macros?.carbs_g || 0) + (nutrition.macros?.fats_g || 0);
                        const pct = total > 0 ? Math.round(((value ?? 0) / total) * 100) : 0;
                        return (
                          <div key={label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[12px] font-['Syne'] font-bold text-[rgba(255,255,255,0.6)]">{label}</span>
                              <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{value}g <span className="text-[rgba(255,255,255,0.3)]">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Meals */}
              {nutrition.meals?.map((meal, i) => (
                <div key={i} className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-['Syne'] font-bold text-[13px]">{meal.name}</p>
                    <div className="flex items-center gap-3">
                      {meal.time && <span className="text-[11px] text-[rgba(255,255,255,0.35)]">{meal.time}</span>}
                      {meal.total_calories && <span className="text-[11px] text-[#FF8A65]">{meal.total_calories} kcal</span>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {meal.foods.map((food, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <p className="text-[13px] text-[rgba(255,255,255,0.7)]">{food.item}</p>
                        <div className="flex items-center gap-3">
                          {food.amount && <span className="text-[11px] text-[rgba(255,255,255,0.35)]">{food.amount}</span>}
                          {food.calories && <span className="text-[11px] text-[rgba(255,255,255,0.4)]">{food.calories} kcal</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {nutrition.hydration && (
                <p className="text-[12px] text-[rgba(255,255,255,0.4)]">
                  💧 {nutrition.hydration}
                </p>
              )}
              {nutrition.tips?.length && (
                <div className="space-y-1">
                  {nutrition.tips.map((tip, i) => (
                    <p key={i} className="text-[12px] text-[rgba(255,255,255,0.45)]">• {tip}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-[rgba(255,255,255,0.35)]">No nutrition plan yet.</p>
          )}
        </div>
      )}

      {/* Recovery Tab */}
      {tab === "recovery" && (
        <div className="space-y-5">
          {recovery ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {recovery.sleep_target && (
                  <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-4">
                    <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-1">Sleep Target</p>
                    <p className="font-['Syne'] font-bold text-[16px]">{recovery.sleep_target}</p>
                  </div>
                )}
                {recovery.active_recovery && (
                  <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-4">
                    <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-1">Active Recovery</p>
                    <p className="text-[13px] text-[rgba(255,255,255,0.7)]">{recovery.active_recovery}</p>
                  </div>
                )}
              </div>
              {recovery.rest_days?.length && (
                <div>
                  <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-2">Rest Days</p>
                  <div className="flex flex-wrap gap-2">
                    {recovery.rest_days.map((day) => (
                      <span key={day} className="text-[12px] px-3 py-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.6)]">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {recovery.tips?.length && (
                <div>
                  <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-2">Recovery Tips</p>
                  <div className="space-y-1.5">
                    {recovery.tips.map((tip, i) => (
                      <p key={i} className="text-[13px] text-[rgba(255,255,255,0.55)]">• {tip}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-[rgba(255,255,255,0.35)]">No recovery plan yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MacroCard({ label, value, unit, accent = false }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-4 text-center">
      <div className={`font-['Syne'] font-black text-[24px] leading-none mb-0.5 ${accent ? "text-[#FF5722]" : "text-white"}`}>
        {value}<span className="text-[14px] font-normal ml-0.5">{unit}</span>
      </div>
      <p className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1px] text-[rgba(255,255,255,0.35)]">{label}</p>
    </div>
  );
}

function WorkoutDayCard({ day }: { day: WorkoutDay }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[10px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="font-['Syne'] font-bold text-[13px]">{day.name}</p>
          {day.type && <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">{day.type} · {day.exercises.length} exercises</p>}
        </div>
        {expanded ? <ChevronUp size={14} className="text-[rgba(255,255,255,0.3)]" /> : <ChevronDown size={14} className="text-[rgba(255,255,255,0.3)]" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-[rgba(255,255,255,0.06)]">
          {day.warmup && <p className="text-[12px] text-[rgba(255,255,255,0.4)] mt-3 mb-3">🔥 Warmup: {day.warmup}</p>}
          <div className="space-y-2">
            {day.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{ex.name}</p>
                  {ex.notes && <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">{ex.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-[#FF8A65]">{ex.sets} × {ex.reps}</p>
                  {ex.rest && <p className="text-[11px] text-[rgba(255,255,255,0.3)]">Rest: {ex.rest}</p>}
                </div>
              </div>
            ))}
          </div>
          {day.cooldown && <p className="text-[12px] text-[rgba(255,255,255,0.4)] mt-3">❄️ Cooldown: {day.cooldown}</p>}
        </div>
      )}
    </div>
  );
}
