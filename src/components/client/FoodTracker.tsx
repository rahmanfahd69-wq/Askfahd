"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveFoodLog, deleteFoodLog, getFoodLogsByDate, type FoodItem } from "@/app/(client)/client/tracker/actions";

interface FoodLog {
  id: string;
  food_description: string;
  items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

interface Targets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface Props {
  today: string;
  initialLogs: FoodLog[];
  targets: Targets;
}

interface NutritionEstimate {
  items: FoodItem[];
  total: { calories: number; protein: number; carbs: number; fat: number };
}

interface Suggestion {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function CalorieRing({ consumed, target }: { consumed: number; target: number | null }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target && target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = circ * (1 - pct);
  const color = pct >= 1 ? "#ef4444" : pct >= 0.9 ? "#f59e0b" : "#FF5722";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {pct > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Syne'] font-black text-[30px] leading-none" style={{ color }}>
          {Math.round(consumed).toLocaleString()}
        </span>
        <span className="text-[11px] text-[rgba(255,255,255,0.35)] mt-1.5">
          {target ? `of ${Math.round(target).toLocaleString()} kcal` : "kcal logged"}
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number | null; color: string }) {
  const pct = target && target > 0 ? Math.min(consumed / target, 1) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[12px] font-['Syne'] font-bold text-[rgba(255,255,255,0.5)]">{label}</span>
        <span className="text-[12px] font-medium" style={{ color }}>
          {Math.round(consumed)}g{target ? ` / ${Math.round(target)}g` : ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function FoodTracker({ today, initialLogs, targets }: Props) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs]                 = useState<FoodLog[]>(initialLogs);
  const [showModal, setShowModal]       = useState(false);
  const [description, setDescription]  = useState("");
  const [estimate, setEstimate]         = useState<NutritionEstimate | null>(null);
  const [estimating, setEstimating]     = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [suggestions, setSuggestions]   = useState<{ macro: string; items: Suggestion[] } | null>(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [isPending, startTransition]    = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const totalConsumed = {
    calories: logs.reduce((s, l) => s + Number(l.total_calories), 0),
    protein:  logs.reduce((s, l) => s + Number(l.total_protein), 0),
    carbs:    logs.reduce((s, l) => s + Number(l.total_carbs), 0),
    fat:      logs.reduce((s, l) => s + Number(l.total_fat), 0),
  };

  const calPct = targets.calories && targets.calories > 0
    ? totalConsumed.calories / targets.calories
    : null;

  // Smart macro warning: calories at 90%+ but any macro < 70%
  const lowMacro = calPct !== null && calPct >= 0.9 ? (
    targets.protein && (totalConsumed.protein / targets.protein) < 0.7 ? "protein" :
    targets.carbs   && (totalConsumed.carbs   / targets.carbs)   < 0.7 ? "carbs"   :
    targets.fat     && (totalConsumed.fat     / targets.fat)     < 0.7 ? "fat"     : null
  ) : null;

  async function changeDate(newDate: string) {
    if (newDate > today) return;
    setSelectedDate(newDate);
    startTransition(async () => {
      const { logs: fetched } = await getFoodLogsByDate(newDate);
      setLogs((fetched as FoodLog[]) || []);
      setDismissedWarning(false);
      setSuggestions(null);
    });
  }

  async function handleEstimate() {
    if (!description.trim()) return;
    setEstimating(true);
    setEstimateError("");
    setEstimate(null);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (data.error) { setEstimateError(data.error); }
      else { setEstimate(data); }
    } catch {
      setEstimateError("Network error. Please try again.");
    }
    setEstimating(false);
  }

  async function handleConfirmLog() {
    if (!estimate) return;
    setSaving(true);
    const result = await saveFoodLog({
      date: selectedDate,
      food_description: description.trim(),
      items: estimate.items,
      total_calories: estimate.total.calories,
      total_protein: estimate.total.protein,
      total_carbs: estimate.total.carbs,
      total_fat: estimate.total.fat,
    });
    if (!result.error) {
      const newLog: FoodLog = {
        id: crypto.randomUUID(),
        food_description: description.trim(),
        items: estimate.items,
        total_calories: estimate.total.calories,
        total_protein: estimate.total.protein,
        total_carbs: estimate.total.carbs,
        total_fat: estimate.total.fat,
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, newLog]);
      setShowModal(false);
      setDescription("");
      setEstimate(null);
      setDismissedWarning(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteFoodLog(id);
    if (!result.error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
    setDeletingId(null);
  }

  async function loadSuggestions(macro: string) {
    const consumed = macro === "protein" ? totalConsumed.protein : macro === "carbs" ? totalConsumed.carbs : totalConsumed.fat;
    const target   = macro === "protein" ? targets.protein       : macro === "carbs" ? targets.carbs       : targets.fat;
    if (!target) return;
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest", macro, current: consumed, target }),
      });
      const data = await res.json();
      if (data.suggestions) setSuggestions({ macro, items: data.suggestions });
    } catch { /* silent */ }
  }

  function openModal() {
    setShowModal(true);
    setDescription("");
    setEstimate(null);
    setEstimateError("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const isToday = selectedDate === today;

  return (
    <div className="animate-fade-up space-y-6 max-w-lg">
      {/* Header */}
      <div>
        <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[3px] text-[rgba(255,87,34,0.7)] mb-2">
          Food Tracker
        </p>
        <h1 className="font-['Syne'] font-black text-[clamp(24px,4vw,36px)] leading-tight">Daily Log</h1>
      </div>

      {/* Date selector */}
      <div className="flex items-center justify-between bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] px-4 py-3">
        <button
          onClick={() => changeDate(shiftDate(selectedDate, -1))}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-['Syne'] font-bold text-[16px]">
          {isPending ? <Loader2 size={16} className="animate-spin text-[rgba(255,255,255,0.4)]" /> : formatDate(selectedDate)}
        </span>
        <button
          onClick={() => changeDate(shiftDate(selectedDate, 1))}
          disabled={isToday}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Progress section */}
      {targets.calories ? (
        <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6">
          <CalorieRing consumed={totalConsumed.calories} target={targets.calories} />
          <div className="mt-6 space-y-4">
            <MacroBar label="Protein" consumed={totalConsumed.protein} target={targets.protein} color="#60a5fa" />
            <MacroBar label="Carbs"   consumed={totalConsumed.carbs}   target={targets.carbs}   color="#34d399" />
            <MacroBar label="Fat"     consumed={totalConsumed.fat}      target={targets.fat}     color="#fbbf24" />
          </div>
        </div>
      ) : (
        <div className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6 text-center">
          <CalorieRing consumed={totalConsumed.calories} target={null} />
          <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-4">
            Complete your assessment so your trainer can set nutrition targets.
          </p>
        </div>
      )}

      {/* Warning banners */}
      {!dismissedWarning && calPct !== null && (
        <>
          {calPct >= 1 && (
            <div className="bg-red-500/8 border border-red-500/25 rounded-[14px] px-5 py-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-['Syne'] font-bold text-red-400">Calorie goal reached!</p>
                <p className="text-[12px] text-[rgba(255,255,255,0.45)] mt-0.5">You&apos;ve hit your daily calorie target.</p>
              </div>
              <button onClick={() => setDismissedWarning(true)} className="text-[rgba(255,255,255,0.3)] hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}

          {calPct >= 0.9 && calPct < 1 && !lowMacro && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-[14px] px-5 py-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-['Syne'] font-bold text-amber-400">Approaching calorie limit</p>
                <p className="text-[12px] text-[rgba(255,255,255,0.45)] mt-0.5">
                  {Math.round((targets.calories! - totalConsumed.calories))} kcal remaining.
                </p>
              </div>
              <button onClick={() => setDismissedWarning(true)} className="text-[rgba(255,255,255,0.3)] hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}

          {calPct >= 0.9 && lowMacro && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-[14px] p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-['Syne'] font-bold text-amber-400">Calories almost up — {lowMacro} low</p>
                  <p className="text-[12px] text-[rgba(255,255,255,0.45)] mt-0.5">
                    Your {lowMacro} is at{" "}
                    {Math.round(
                      ((lowMacro === "protein" ? totalConsumed.protein / targets.protein! :
                        lowMacro === "carbs"   ? totalConsumed.carbs   / targets.carbs!   :
                                                 totalConsumed.fat     / targets.fat!) * 100)
                    )}% of target. Consider high-{lowMacro}, lower-calorie options:
                  </p>
                </div>
                <button onClick={() => setDismissedWarning(true)} className="text-[rgba(255,255,255,0.3)] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {suggestions?.macro === lowMacro ? (
                <div className="space-y-2 mt-3">
                  {suggestions.items.map((s, i) => (
                    <div key={i} className="bg-[rgba(255,255,255,0.04)] rounded-[8px] px-3 py-2 flex justify-between text-[12px]">
                      <span className="text-[rgba(255,255,255,0.7)]">{s.name}</span>
                      <span className="text-amber-400 font-medium">{s.calories} kcal</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => loadSuggestions(lowMacro)}
                  className="mt-2 text-[12px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Load food suggestions →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Log Food CTA */}
      {isToday && (
        <button
          onClick={openModal}
          className="w-full flex items-center justify-center gap-2.5 bg-[#FF5722] hover:bg-[#FF8A65] text-white font-['Syne'] font-bold text-[15px] px-5 py-4 rounded-[14px] transition-colors min-h-[56px]"
        >
          <Plus size={20} />
          Log Food
        </button>
      )}

      {/* Food log list */}
      <div>
        {logs.length > 0 ? (
          <>
            <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[2px] text-[rgba(255,255,255,0.25)] mb-3">
              {formatDate(selectedDate)}&apos;s Log · {logs.length} item{logs.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[rgba(255,255,255,0.028)] border border-[rgba(255,255,255,0.07)] rounded-[12px] px-4 py-3.5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium leading-snug truncate">{log.food_description}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-[rgba(255,255,255,0.4)]">
                      <span className="font-['Syne'] font-bold text-[#FF8A65]">{Math.round(log.total_calories)} kcal</span>
                      <span>P {Math.round(log.total_protein)}g</span>
                      <span>C {Math.round(log.total_carbs)}g</span>
                      <span>F {Math.round(log.total_fat)}g</span>
                    </div>
                  </div>
                  {isToday && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-[8px] text-[rgba(255,255,255,0.25)] hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                    >
                      {deletingId === log.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-[rgba(255,255,255,0.25)]">
            <p className="text-[14px]">No food logged {isToday ? "today" : "on this day"}</p>
            {isToday && <p className="text-[12px] mt-1">Tap &quot;Log Food&quot; to start tracking</p>}
          </div>
        )}
      </div>

      {/* Log Food Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowModal(false); setEstimate(null); }} />
          <div className="relative bg-[#0d0d0d] border border-[rgba(255,255,255,0.1)] rounded-t-[24px] sm:rounded-[20px] w-full sm:max-w-md p-6 z-10 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-['Syne'] font-black text-[18px]">Log Food</h2>
              <button
                onClick={() => { setShowModal(false); setEstimate(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.08)]"
              >
                <X size={16} />
              </button>
            </div>

            {!estimate ? (
              <>
                <textarea
                  ref={inputRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 big idly, 1 cup coconut chutney, 200ml sambar"
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] rounded-[12px] px-4 py-3 text-[14px] text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,87,34,0.4)] resize-none"
                />
                <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-2 mb-4">
                  Be specific with quantities for accurate tracking (e.g. &quot;200g chicken breast&quot;, not just &quot;chicken&quot;)
                </p>

                {estimateError && (
                  <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[8px] px-4 py-3 mb-4">
                    {estimateError}
                  </p>
                )}

                <button
                  onClick={handleEstimate}
                  disabled={estimating || !description.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#FF8A65] disabled:opacity-40 text-white font-['Syne'] font-bold text-[14px] py-3.5 rounded-[12px] transition-colors min-h-[52px]"
                >
                  {estimating ? <><Loader2 size={16} className="animate-spin" /> Estimating…</> : "Estimate Nutrition →"}
                </button>
              </>
            ) : (
              <>
                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-4 mb-4">
                  <p className="text-[11px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,255,255,0.3)] mb-3">
                    Breakdown
                  </p>
                  <div className="space-y-2">
                    {estimate.items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 text-[13px]">
                        <span className="text-[rgba(255,255,255,0.7)]">
                          {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}
                        </span>
                        <span className="text-[rgba(255,255,255,0.5)] shrink-0">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[rgba(255,255,255,0.07)] mt-3 pt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Calories", value: `${estimate.total.calories}`, unit: "kcal", color: "#FF8A65" },
                      { label: "Protein",  value: `${estimate.total.protein}`,  unit: "g",    color: "#60a5fa" },
                      { label: "Carbs",    value: `${estimate.total.carbs}`,    unit: "g",    color: "#34d399" },
                      { label: "Fat",      value: `${estimate.total.fat}`,      unit: "g",    color: "#fbbf24" },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label}>
                        <p className="font-['Syne'] font-black text-[16px]" style={{ color }}>{value}</p>
                        <p className="text-[9px] text-[rgba(255,255,255,0.3)] uppercase tracking-[1px]">{unit} {label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEstimate(null)}
                    className="flex-1 py-3 rounded-[12px] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] text-[14px] font-['Syne'] font-bold hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirmLog}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] bg-[#FF5722] hover:bg-[#FF8A65] text-white text-[14px] font-['Syne'] font-bold transition-colors disabled:opacity-50 min-h-[48px]"
                  >
                    {saving
                      ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                      : <><CheckCircle2 size={15} /> Add to log</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
