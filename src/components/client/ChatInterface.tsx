"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizonal, Bot, User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  clientName: string;
  trainerName: string | null;
  hasTrainer: boolean;
}

export function ChatInterface({ clientName, trainerName, hasTrainer }: Props) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiName, setAiName]       = useState("Coach");
  const [error, setError]         = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
      } else {
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.aiName)    setAiName(data.aiName);
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      setError("Network error. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  if (!hasTrainer) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-12 h-12 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center mb-4">
          <Bot size={20} className="text-[#FF8A65]" />
        </div>
        <h2 className="font-['Syne'] font-bold text-[16px] mb-2">No trainer assigned yet</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] max-w-sm">
          The AI coach requires a trainer assignment. Contact your admin to get a trainer assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[rgba(255,255,255,0.07)] mb-4 shrink-0">
        <div className="w-9 h-9 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center">
          <Bot size={16} className="text-[#FF8A65]" />
        </div>
        <div>
          <p className="font-['Syne'] font-bold text-[14px]">{aiName}</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
            AI Fitness Coach · {trainerName ? `via ${trainerName}` : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[rgba(255,255,255,0.3)]">
          <ShieldAlert size={11} />
          <span>Guardrails active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-[rgba(255,87,34,0.08)] flex items-center justify-center mx-auto mb-4">
              <Bot size={22} className="text-[#FF8A65]" />
            </div>
            <p className="font-['Syne'] font-bold text-[15px] mb-1">Ask {aiName} anything</p>
            <p className="text-[13px] text-[rgba(255,255,255,0.35)] mb-5 max-w-xs mx-auto">
              Workouts, nutrition, recovery — personalised to your profile
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What's a good workout for today?",
                "How many calories should I eat?",
                "What should I do on rest days?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.45)] hover:border-[rgba(255,87,34,0.3)] hover:text-[rgba(255,255,255,0.7)] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-[#FF8A65]" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] md:max-w-[70%] rounded-[12px] px-4 py-3",
              msg.role === "user"
                ? "bg-[#FF5722] text-white rounded-br-[4px]"
                : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] rounded-bl-[4px]"
            )}>
              {msg.role === "assistant" && msg.content.includes("Based on your profile") && (
                <span className="inline-block text-[10px] font-['Syne'] font-bold uppercase tracking-[1px] text-[#FF8A65] bg-[rgba(255,87,34,0.08)] border border-[rgba(255,87,34,0.2)] rounded-[4px] px-2 py-0.5 mb-2">
                  Based on your profile and current plan
                </span>
              )}
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className={cn(
                "text-[10px] mt-1.5",
                msg.role === "user" ? "text-white/50" : "text-[rgba(255,255,255,0.25)]"
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-[rgba(255,255,255,0.6)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[rgba(255,87,34,0.1)] flex items-center justify-center shrink-0">
              <Bot size={13} className="text-[#FF8A65]" />
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] rounded-[12px] rounded-bl-[4px] px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.4)] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[8px] px-4 py-2.5 mb-2 shrink-0">
          {error}
        </p>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[rgba(255,255,255,0.07)] shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={`Message ${aiName}…`}
          disabled={loading}
          className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-4 py-3 text-[14px] text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,87,34,0.4)] disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-[10px] bg-[#FF5722] hover:bg-[#FF8A65] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
        >
          <SendHorizonal size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
