import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { logger } from "@/lib/ops/logger";

export type AuditEntry = {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: "info" | "warn" | "critical";
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  logger.audit(entry.action, {
    userId: entry.userId,
    actorId: entry.actorId,
    resource: entry.resource,
    resourceId: entry.resourceId,
    severity: entry.severity ?? "info",
    ...entry.metadata,
  });

  if (!isDatabaseConfigured()) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? undefined,
        actorId: entry.actorId ?? entry.userId ?? undefined,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata ? (entry.metadata as object) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        severity: entry.severity ?? "info",
      },
    });
  } catch (err) {
    logger.error("audit_persist_failed", { action: entry.action, error: (err as Error).message });
  }
}

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
  LOGIN_LOCKED: "auth.login.locked",
  LOGOUT: "auth.logout",
  REGISTER: "auth.register",
  REFRESH: "auth.refresh",
  PASSWORD_RESET_REQUEST: "auth.password.reset_request",
  PASSWORD_RESET: "auth.password.reset",
  OTP_REQUEST: "auth.otp.request",
  OTP_VERIFY: "auth.otp.verify",
  TWO_FA_ENABLED: "auth.2fa.enabled",
  TWO_FA_DISABLED: "auth.2fa.disabled",
  SESSION_REVOKED: "auth.session.revoked",
  OAUTH_LOGIN: "auth.oauth.login",
  EMAIL_VERIFIED: "auth.email.verified",
  EMAIL_VERIFY_SENT: "auth.email.verify_sent",
  GDPR_EXPORT: "gdpr.export",
  GDPR_DELETE: "gdpr.delete",
  GDPR_CONSENT: "gdpr.consent",
  RATE_LIMITED: "security.rate_limited",
  BOT_BLOCKED: "security.bot_blocked",
  GEO_BLOCKED: "security.geo_blocked",
  IP_BLOCKED: "security.ip_blocked",
} as const;
