/**
 * Proxies the Objection Room page to the Anthropic API.
 *
 * The API key never reaches the browser — it lives in the ANTHROPIC_API_KEY
 * environment variable and is attached here. Because every call spends the
 * owner's credits, this endpoint is gated by a shared access code and refuses
 * anything it did not expect: unknown models, oversized requests, long
 * conversations.
 */

const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-5"
]);

const MAX_TOKENS_CEILING = 3200;
const MAX_MESSAGES = 60;
const MAX_BODY_CHARS = 120000;

function timingSafeEqual(a, b) {
  // Constant-time-ish compare so the code can't be guessed a character at a time.
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: { message: "POST only" } });
  }

  const expected = process.env.ACCESS_CODE;
  const key = process.env.ANTHROPIC_API_KEY;

  if (!expected || !key) {
    return res.status(500).json({
      error: { message: "Server isn't configured. ANTHROPIC_API_KEY and ACCESS_CODE must both be set." }
    });
  }

  const supplied = req.headers["x-access-code"];
  if (!timingSafeEqual(String(supplied || ""), expected)) {
    return res.status(401).json({ error: { message: "Bad access code" } });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: { message: "Expected a messages array" } });
  }
  if (body.messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: { message: "Conversation too long" } });
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: { message: "Model not allowed" } });
  }

  // Rebuild the request rather than forwarding it, so nothing unexpected passes through.
  const safe = {
    model: body.model,
    max_tokens: Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CEILING),
    messages: body.messages
  };
  if (body.tools) safe.tools = body.tools;
  if (body.tool_choice) safe.tool_choice = body.tool_choice;

  const payload = JSON.stringify(safe);
  if (payload.length > MAX_BODY_CHARS) {
    return res.status(400).json({ error: { message: "Request too large" } });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: payload
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: "Couldn't reach Claude. Try again in a moment." } });
  }
}
