"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAISettings } from "@/app/(trainer)/trainer/ai-settings/actions";
import { Bot, SendHorizonal, Sparkles } from "lucide-react";

interface Props {
  aiName: string;
  coachingStyle: string | null;
  aiSystemPrompt: string | null;
}

export function AISettingsForm({ aiName, coachingStyle, aiSystemPrompt }: Props) {
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const [testMsg, setTestMsg]     = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting]     = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const result = await updateAISettings(new FormData(formRef.current));
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleTest() {
    if (!testMsg.trim()) return;
    setTesting(true);
    setTestReply("");
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMsg }),
      });
      const data = await res.json();
      setTestReply(data.error ? `Error: ${data.error}` : data.reply);
    } catch {
      setTestReply("Error connecting to AI service.");
    }
    setTesting(false);
  }

  return (
    <div className="space-y-8">
      {/* Settings form */}
      <form ref={formRef} onSubmit={handleSave} className="space-y-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-name">AI Coach Name</Label>
          <Input
            id="ai-name"
            name="ai_name"
            defaultValue={aiName}
            placeholder="e.g. Aria, Max, Coach"
            required
          />
          <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
            What your clients call the AI coach
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="coaching-style">Coaching Style</Label>
          <Input
            id="coaching-style"
            name="coaching_style"
            defaultValue={coachingStyle || ""}
            placeholder="e.g. Motivational, strict accountability, gentle encouragement"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-prompt">System Prompt / Personality</Label>
          <Textarea
            id="ai-prompt"
            name="ai_system_prompt"
            defaultValue={aiSystemPrompt || ""}
            placeholder={`Describe your AI coach's personality, tone, and rules.\n\nExample:\nYou are an enthusiastic, no-excuses coach who pushes clients to their best. Always celebrate small wins. Never accept "I can't" — reframe it as "not yet". Focus on long-term consistency over perfection.`}
            rows={8}
          />
          <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
            This shapes how the AI talks with your clients. The platform's safety guardrails always apply on top of this.
          </p>
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[6px] px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
          {saved && <span className="text-[12px] text-green-400">Saved!</span>}
        </div>
      </form>

      {/* AI Preview */}
      <div className="border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-[7px] bg-[rgba(255,87,34,0.1)] flex items-center justify-center">
            <Sparkles size={13} className="text-[#FF8A65]" />
          </div>
          <h3 className="font-['Syne'] font-bold text-[14px]">Test Your AI</h3>
        </div>
        <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-4">
          Send a sample message to preview how your AI will respond. Save your settings first.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !testing && handleTest()}
            placeholder={`Ask "${aiName || "Coach"}" something…`}
            className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2.5 text-[13px] text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,87,34,0.4)]"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testMsg.trim()}
            className="w-9 h-9 rounded-[8px] bg-[#FF5722] hover:bg-[#FF8A65] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
          >
            {testing ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SendHorizonal size={14} className="text-white" />
            )}
          </button>
        </div>

        {testReply && (
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={12} className="text-[#FF8A65]" />
              <span className="text-[10px] font-['Syne'] font-bold uppercase tracking-[1.5px] text-[rgba(255,87,34,0.7)]">
                {aiName || "Coach"}
              </span>
            </div>
            <p className="text-[13px] text-[rgba(255,255,255,0.8)] leading-relaxed whitespace-pre-wrap">{testReply}</p>
          </div>
        )}
      </div>
    </div>
  );
}
