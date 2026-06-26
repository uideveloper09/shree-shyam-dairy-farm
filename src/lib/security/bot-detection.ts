export type BotCheckResult = { isBot: boolean; reason?: string };

const BOT_PATTERNS = [
  /curl\//i,
  /python-requests/i,
  /scrapy/i,
  /headless/i,
  /phantomjs/i,
  /selenium/i,
  /wget\//i,
];

export function detectBot(request: Request, body?: Record<string, unknown>): BotCheckResult {
  if (process.env.BOT_DETECTION_ENABLED === "false") {
    return { isBot: false };
  }

  const ua = request.headers.get("user-agent") || "";
  if (!ua || ua.length < 10) {
    return { isBot: true, reason: "missing_user_agent" };
  }

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(ua)) {
      return { isBot: true, reason: "suspicious_user_agent" };
    }
  }

  if (body && typeof body._hp === "string" && body._hp.length > 0) {
    return { isBot: true, reason: "honeypot_filled" };
  }

  return { isBot: false };
}
