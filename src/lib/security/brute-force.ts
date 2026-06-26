import { prisma } from "@/repositories/prisma";

const MAX_ATTEMPTS = Number(process.env.ACCOUNT_LOCK_ATTEMPTS || 5);
const LOCK_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES || 30);

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  if (!user?.lockedUntil) return false;
  if (user.lockedUntil > new Date()) return true;
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  });
  return false;
}

export async function recordFailedLogin(
  userId: string
): Promise<{ locked: boolean; attempts: number }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
    select: { failedLoginAttempts: true },
  });

  if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
    });
    return { locked: true, attempts: user.failedLoginAttempts };
  }

  return { locked: false, attempts: user.failedLoginAttempts };
}

export async function clearFailedLogins(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export async function updateLastLogin(userId: string, ip: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });
}
