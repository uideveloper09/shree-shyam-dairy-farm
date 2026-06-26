import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ops/rate-limit";
import { detectBot } from "@/lib/security/bot-detection";
import { isGeoBlocked } from "@/lib/security/geo";
import { isIpAllowed } from "@/lib/security/ip-filter";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";
import { getRequestContext } from "@/lib/security/request-context";

export type SecurityGateResult =
  | { ok: true; ctx: ReturnType<typeof getRequestContext> }
  | { ok: false; response: NextResponse };

type GateOptions = {
  rateLimit?: { limit: number; windowSec: number; key?: string };
  checkBot?: boolean;
  body?: Record<string, unknown>;
};

export async function securityGate(
  request: Request,
  options?: GateOptions
): Promise<SecurityGateResult> {
  const ctx = getRequestContext(request);

  const ipCheck = isIpAllowed(request);
  if (!ipCheck.allowed) {
    await writeAudit({
      action: AUDIT_ACTIONS.IP_BLOCKED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { reason: ipCheck.reason },
      severity: "warn",
    });
    return { ok: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  const geo = isGeoBlocked(request);
  if (geo.blocked) {
    await writeAudit({
      action: AUDIT_ACTIONS.GEO_BLOCKED,
      ipAddress: ctx.ip,
      metadata: { country: geo.country },
      severity: "warn",
    });
    return {
      ok: false,
      response: NextResponse.json({ error: "Access denied in your region" }, { status: 403 }),
    };
  }

  if (options?.checkBot !== false) {
    const bot = detectBot(request, options?.body);
    if (bot.isBot) {
      await writeAudit({
        action: AUDIT_ACTIONS.BOT_BLOCKED,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: bot.reason },
        severity: "warn",
      });
      return {
        ok: false,
        response: NextResponse.json({ error: "Request blocked" }, { status: 403 }),
      };
    }
  }

  if (options?.rateLimit) {
    const key = options.rateLimit.key || ctx.ip;
    const rl = await rateLimit(key, options.rateLimit.limit, options.rateLimit.windowSec);
    if (!rl.success) {
      await writeAudit({
        action: AUDIT_ACTIONS.RATE_LIMITED,
        ipAddress: ctx.ip,
        metadata: { key },
        severity: "warn",
      });
      return {
        ok: false,
        response: NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      };
    }
  }

  return { ok: true, ctx };
}
