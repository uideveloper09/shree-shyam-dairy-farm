import { NextResponse } from "next/server";
import { loginWithWebAuthn } from "@/services/mobile/platform.service";
import { getRequestContext } from "@/lib/security/request-context";
import { publicUser } from "@/lib/auth/session";
import { prisma } from "@/repositories/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.credentialId || !body.clientDataJSON) {
    return NextResponse.json({ error: "Invalid assertion" }, { status: 400 });
  }

  const cred = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: body.credentialId },
    include: { user: { include: { mobileDevices: true } } },
  });

  const deviceId = cred?.user?.mobileDevices[0]?.deviceId || "unknown";
  const ctx = getRequestContext(request);

  try {
    const user = await loginWithWebAuthn(
      body.credentialId,
      body.clientDataJSON,
      `login:${deviceId}`,
      ctx
    );

    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, phone: true, role: true, emailVerified: true },
    });

    return NextResponse.json({
      user: publicUser({ ...full!, emailVerified: Boolean(full!.emailVerified) }),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
}
