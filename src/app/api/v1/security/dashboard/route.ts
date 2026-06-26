import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { requireSecurityAdmin } from "@/lib/auth/session";
import { isAdminIpAllowed } from "@/lib/security/ip-filter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!isAdminIpAllowed(request)) {
    return NextResponse.json({ error: "Access denied from this IP" }, { status: 403 });
  }

  const auth = await requireSecurityAdmin();
  if (auth.error) return auth.error;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    lockedAccounts,
    twoFactorUsers,
    failedLogins24h,
    auditEvents24h,
    recentAudits,
    activeSessions,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { isActive: true, deletedAt: null } }),
    prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
    prisma.user.count({ where: { twoFactorEnabled: true } }),
    prisma.auditLog.count({
      where: { action: "auth.login.failed", createdAt: { gte: since24h } },
    }),
    prisma.auditLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        severity: true,
        ipAddress: true,
        userId: true,
        createdAt: true,
      },
    }),
    prisma.refreshToken.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  return NextResponse.json({
    summary: {
      totalUsers,
      activeUsers,
      lockedAccounts,
      twoFactorUsers,
      failedLogins24h,
      auditEvents24h,
      activeSessions,
      twoFactorAdoptionPct: totalUsers ? Math.round((twoFactorUsers / totalUsers) * 100) : 0,
    },
    recentAudits,
    controls: {
      rateLimiting: true,
      bruteForceProtection: true,
      botDetection: process.env.BOT_DETECTION_ENABLED !== "false",
      geoBlocking: process.env.GEO_BLOCKING_ENABLED === "true",
      ipWhitelist: Boolean(process.env.IP_WHITELIST || process.env.ADMIN_IP_WHITELIST),
      gdprRetentionDays: Number(process.env.GDPR_RETENTION_DAYS || 365),
    },
  });
}
