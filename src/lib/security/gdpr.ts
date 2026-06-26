import { prisma } from "@/repositories/prisma";

const RETENTION_DAYS = Number(process.env.GDPR_RETENTION_DAYS || 365);

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      orders: { include: { items: true, payments: true } },
      subscriptions: { include: { deliveries: true } },
      reviews: true,
      notifications: true,
      walletTxns: true,
      paymentMethods: {
        select: { id: true, type: true, last4: true, brand: true, createdAt: true },
      },
    },
  });

  if (!user) return null;

  const { passwordHash: _, totpSecretEnc: __, ...safe } = user;
  return {
    exportedAt: new Date().toISOString(),
    retentionPolicyDays: RETENTION_DAYS,
    user: safe,
  };
}

export async function requestDataExport(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return prisma.dataExportRequest.create({
    data: { userId, status: "ready", expiresAt, completedAt: new Date() },
  });
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const anonymized = `deleted_${userId.slice(0, 8)}@anonymized.local`;

  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    }),
    prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymized,
        phone: null,
        name: "Deleted User",
        passwordHash: null,
        avatar: null,
        googleId: null,
        appleId: null,
        totpSecretEnc: null,
        twoFactorEnabled: false,
        isActive: false,
        deletedAt: new Date(),
        walletBalance: 0,
      },
    }),
  ]);
}

export async function recordGdprConsent(userId: string, version = "1.0") {
  return prisma.user.update({
    where: { id: userId },
    data: { gdprConsentAt: new Date(), gdprConsentVersion: version },
  });
}

export async function purgeExpiredAuditLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}
