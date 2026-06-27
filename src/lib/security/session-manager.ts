import { nanoid } from "nanoid";
import { prisma } from "@/repositories/prisma";
import { signAccessToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import type { RequestContext } from "@/lib/security/request-context";

export type SessionBundle = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

export async function createAuthSession(
  userId: string,
  user: { email: string | null; role: string },
  ctx: RequestContext,
  remember = false
): Promise<SessionBundle> {
  const refreshDays = remember ? 30 : 7;
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  const refreshToken = nanoid(48);
  const sessionToken = nanoid(32);

  const session = await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ip,
      deviceLabel: ctx.deviceLabel,
      expiresAt,
    },
  });

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      remember,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ip,
      deviceLabel: ctx.deviceLabel,
      sessionId: session.id,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: userId,
    email: user.email,
    role: user.role,
  });

  await setAuthCookies(accessToken, refreshToken, remember);

  return { accessToken, refreshToken, sessionId: session.id };
}

export async function validateRefreshToken(token: string) {
  return prisma.refreshToken.findFirst({
    where: {
      token,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          emailVerified: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });
}

/** Issue a new opaque refresh token and revoke the previous one (rotation). */
export async function rotateRefreshToken(oldToken: string) {
  const record = await validateRefreshToken(oldToken);
  if (!record) return null;

  const newRefreshToken = nanoid(48);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: record.userId,
        token: newRefreshToken,
        remember: record.remember,
        userAgent: record.userAgent,
        ipAddress: record.ipAddress,
        deviceLabel: record.deviceLabel,
        sessionId: record.sessionId,
        expiresAt: record.expiresAt,
      },
    }),
  ]);

  return { record, newRefreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record) return;

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  if (record.sessionId) {
    await prisma.session.updateMany({
      where: { id: record.sessionId },
      data: { revokedAt: new Date() },
    });
  }
}

export async function revokeAllUserSessions(userId: string, exceptToken?: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptToken ? { token: { not: exceptToken } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function listUserSessions(userId: string) {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      deviceLabel: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
      token: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
