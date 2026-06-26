import { prisma } from "@/repositories/prisma";
import { cacheGet, cacheSet } from "@/lib/ops/redis";
import { createAuthSession } from "@/lib/security/session-manager";
import type { RequestContext } from "@/lib/security/request-context";

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent,
    },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent },
  });
}

export async function removePushSubscription(endpoint: string) {
  return prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function sendPushToUser(userId: string, title: string, body: string, data?: object) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { sent: 0 };

  let sent = 0;
  const webpush = await import("web-push").catch(() => null);
  if (!webpush || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    await prisma.notification.create({
      data: { userId, channel: "PUSH", title, body, data: data as object, sentAt: new Date() },
    });
    return { sent: 0, queued: true };
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@shreeshyamdairyfarm.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, data })
      );
      sent++;
    } catch {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }

  await prisma.notification.create({
    data: { userId, channel: "PUSH", title, body, data: data as object, sentAt: new Date() },
  });

  return { sent };
}

export async function processSyncActions(
  userId: string,
  actions: { clientId: string; action: string; payload: Record<string, unknown> }[]
) {
  const results: { clientId: string; ok: boolean }[] = [];

  for (const item of actions) {
    try {
      const existing = await prisma.offlineSyncRecord.findUnique({
        where: { clientId: item.clientId },
      });
      if (!existing) {
        await prisma.offlineSyncRecord.create({
          data: {
            userId,
            clientId: item.clientId,
            action: item.action,
            payload: item.payload as object,
            status: "synced",
            syncedAt: new Date(),
          },
        });
      }
      results.push({ clientId: item.clientId, ok: true });
    } catch {
      results.push({ clientId: item.clientId, ok: false });
    }
  }

  return results;
}

export async function recordGpsPing(
  userId: string,
  data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    context?: string;
    metadata?: object;
  }
) {
  return prisma.gpsPing.create({
    data: {
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      context: data.context,
      metadata: data.metadata as object,
    },
  });
}

export async function recordBarcodeScan(
  userId: string,
  value: string,
  format?: string,
  context?: string
) {
  return prisma.barcodeScan.create({
    data: { userId, value, format, context },
  });
}

export async function storeChallenge(key: string, value: string, ttlSec = 300) {
  await cacheSet(`webauthn:${key}`, value, ttlSec);
}

export async function consumeChallenge(key: string): Promise<string | null> {
  const val = await cacheGet(`webauthn:${key}`);
  return val;
}

export async function registerWebAuthnCredential(
  userId: string,
  data: { credentialId: string; publicKey: string; deviceId: string; deviceLabel?: string }
) {
  await prisma.webAuthnCredential.upsert({
    where: { credentialId: data.credentialId },
    create: {
      userId,
      credentialId: data.credentialId,
      publicKey: data.publicKey,
      deviceLabel: data.deviceLabel,
    },
    update: { publicKey: data.publicKey, deviceLabel: data.deviceLabel },
  });

  await prisma.mobileDevice.upsert({
    where: { userId_deviceId: { userId, deviceId: data.deviceId } },
    create: {
      userId,
      deviceId: data.deviceId,
      platform: "web",
      biometricEnabled: true,
    },
    update: { biometricEnabled: true, lastSeenAt: new Date() },
  });
}

export async function loginWithWebAuthn(
  credentialId: string,
  clientDataJSON: string,
  challengeKey: string,
  ctx: RequestContext
) {
  const expected = await consumeChallenge(challengeKey);
  if (!expected) throw new Error("Challenge expired");

  const clientData = JSON.parse(Buffer.from(clientDataJSON, "base64").toString());
  if (clientData.challenge !== expected) throw new Error("Invalid challenge");

  const cred = await prisma.webAuthnCredential.findUnique({
    where: { credentialId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!cred?.user?.isActive || cred.user.deletedAt) throw new Error("Invalid credential");

  await createAuthSession(cred.user.id, { email: cred.user.email, role: cred.user.role }, ctx);

  return cred.user;
}
