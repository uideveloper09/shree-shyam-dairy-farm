import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/repositories/prisma";
import { storeChallenge } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

function toBase64Url(buf: Buffer) {
  return buf.toString("base64url");
}

export async function POST(request: Request) {
  const body = await request.json();
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : "unknown";
  const challenge = toBase64Url(randomBytes(32));
  await storeChallenge(`login:${deviceId}`, challenge);

  const device = await prisma.mobileDevice.findFirst({
    where: { deviceId, biometricEnabled: true },
    include: { user: { include: { webAuthnCredentials: true } } },
  });

  const credentials = device?.user?.webAuthnCredentials ?? [];

  return NextResponse.json({
    challenge,
    timeout: 60000,
    userVerification: "preferred",
    allowCredentials: credentials.map((c) => ({
      id: c.credentialId,
      type: "public-key",
    })),
  });
}
