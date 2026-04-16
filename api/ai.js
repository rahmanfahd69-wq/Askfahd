// api/ai.js — Vercel serverless function
// Proxies requests to Anthropic API with rate limiting and security

const usageMap = new Map();

function checkUsage(ip) {
  const now = Date.now();
  const record = usageMap.get(ip);
  if (!record) { usageMap.set(ip, { requests: [now] }); return { allowed: true }; }
  record.requests = record.requests.filter(t => now - t < 24 * 60 * 60 * 1000);
  const total = record.requests.length;
  const last = record.requests[record.requests.length - 1] || 0;

  if (total < 5) { record.requests.push(now); return { allowed: true }; }
  if (total < 8) {
    const recent = record.requests.filter(t => now - t < 2 * 60 * 60 * 1000).length;
    if (now - last < 2 * 60 * 60 * 1000 && recent >= 3) return { allowed: false, waitMs: last + 2*60*60*1000 - now, tier: "tier2_cooldown" };
    record.requests.push(now); return { allowed: true };
  }
  if (total < 11) {
    const recent = record.requests.filter(t => now - t < 6 * 60 * 60 * 1000).length;
    if (now - last < 6 * 60 * 60 * 1000 && recent >= 3) return { allowed: false, waitMs: last + 6*60*60*1000 - now, tier: "tier3_cooldown" };
    record.requests.push(now); return { allowed: true };
  }
  if (now - last < 24 * 60 * 60 * 1000) return { allowed: false, waitMs: last + 24*60*60*1000 - now, tier: "tier4_cooldown" };
  record.requests = [now]; return { allowed: true };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Admin bypass
  const ADMIN_KEY = process.env.ADMIN_KEY || "";
  const isAdmin = ADMIN_KEY && req.body?.adminKey === ADMIN_KEY;

  if (!isAdmin) {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
    const usage = checkUsage(ip);
    if (!usage.allowed) {
      const h = Math.ceil(usage.waitMs / 3600000);
      const m = Math.ceil(usage.waitMs / 60000);
      const wait = h >= 1 ? `${h} hour${h > 1 ? 's' : ''}` : `${m} minutes`;
      return res.status(429).json({ error: "rate_limited", wait, waitMs: usage.waitMs, tier: usage.tier });
    }
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const { messages, system, model, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid request" });

    for (const msg of messages) {
      if (!msg.role || !msg.content) return res.status(400).json({ error: "Invalid message" });
      if (typeof msg.content === "string" && msg.content.length > 5000) return res.status(400).json({ error: "Message too long" });
      if (!["user", "assistant"].includes(msg.role)) return res.status(400).json({ error: "Invalid role" });
    }
    if (messages.length > 20) return res.status(400).json({ error: "Too many messages" });

    const ALLOWED = ["claude-haiku-4-5-20251001", "claude-sonnet-4-20250514"];
    const body = {
      model: ALLOWED.includes(model) ? model : "claude-haiku-4-5-20251001",
      max_tokens: Math.min(max_tokens || 1000, 4096),
      messages,
    };
    if (system && typeof system === "string" && system.length < 3000) body.system = system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "API error" });
    return res.status(200).json(data);

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
