// Vercel serverless function for AI proxy
// Rate limiting, origin checking, input validation, admin bypass

const usageMap = new Map();

function checkUsage(ip) {
  const now = Date.now();
  const record = usageMap.get(ip);
  if (!record) { usageMap.set(ip, { requests: [now] }); return { allowed: true }; }
  record.requests = record.requests.filter(t => now - t < 24*60*60*1000);
  const total = record.requests.length;
  const last = record.requests[record.requests.length - 1] || 0;

  if (total < 5) { record.requests.push(now); return { allowed: true }; }
  if (total < 8) {
    const recent = record.requests.filter(t => now - t < 2*60*60*1000).length;
    if (now - last < 2*60*60*1000 && recent >= 3) return { allowed: false, waitMs: last + 2*60*60*1000 - now, tier: "tier2_cooldown" };
    record.requests.push(now); return { allowed: true };
  }
  if (total < 11) {
    const recent = record.requests.filter(t => now - t < 6*60*60*1000).length;
    if (now - last < 6*60*60*1000 && recent >= 3) return { allowed: false, waitMs: last + 6*60*60*1000 - now, tier: "tier3_cooldown" };
    record.requests.push(now); return { allowed: true };
  }
  if (now - last < 24*60*60*1000) return { allowed: false, waitMs: last + 24*60*60*1000 - now, tier: "tier4_cooldown" };
  record.requests = [now]; return { allowed: true };
}

export default async function handler(req, res) {
  // CORS
  const ALLOWED_ORIGINS = [
    "https://farfit.vercel.app",
    "https://askfahd.vercel.app",
  ];
  const origin = req.headers.origin || "";
  // Allow exact matches + your project's preview URLs (askfahd-*.vercel.app)
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || origin.match(/^https:\/\/askfahd-[a-z0-9]+\.vercel\.app$/) || origin === "";
  const corsOrigin = isAllowed ? origin || "*" : ALLOWED_ORIGINS[0];

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAllowed) return res.status(403).json({ error: "Forbidden" });

  // Admin bypass
  const ADMIN_KEY = process.env.ADMIN_KEY || "";
  const isAdmin = ADMIN_KEY && req.body?.adminKey === ADMIN_KEY;

  // Rate limit (skip for admin)
  if (!isAdmin) {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const usage = checkUsage(ip);
    if (!usage.allowed) {
      const wH = Math.ceil(usage.waitMs / 3600000);
      const wM = Math.ceil(usage.waitMs / 60000);
      const wait = wH >= 1 ? `${wH} hour${wH > 1 ? 's' : ''}` : `${wM} minutes`;
      return res.status(429).json({ error: "rate_limited", wait, waitMs: usage.waitMs, tier: usage.tier });
    }
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const { messages, system, model, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid request" });

    // Validate messages
    for (const msg of messages) {
      if (!msg.role || !msg.content) return res.status(400).json({ error: "Invalid message" });
      if (typeof msg.content === "string" && msg.content.length > 5000) return res.status(400).json({ error: "Message too long" });
      if (!["user", "assistant"].includes(msg.role)) return res.status(400).json({ error: "Invalid role" });
    }
    if (messages.length > 20) return res.status(400).json({ error: "Too many messages" });

    const ALLOWED_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-20250514"];
    const safeModel = ALLOWED_MODELS.includes(model) ? model : "claude-haiku-4-5-20251001";

    const body = {
      model: safeModel,
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

export const config = {
  maxDuration: 30,
};
