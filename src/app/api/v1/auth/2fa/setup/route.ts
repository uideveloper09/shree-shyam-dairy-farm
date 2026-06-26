import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import {
  generateTotpSecret,
  getTotpUri,
  encryptTotpSecret,
  verifyTotp,
  decryptTotpSecret,
} from "@/lib/security/totp";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Email required for 2FA" }, { status: 400 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA already enabled" }, { status: 400 });
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { totpSecretEnc: encryptTotpSecret(secret), twoFactorEnabled: false },
  });

  return NextResponse.json({
    secret,
    uri: getTotpUri(secret, user.email),
    message: "Scan QR in authenticator app, then verify with a code",
  });
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const code = typeof body.code === "string" ? body.code : "";
  if (!code) {
    return NextResponse.json({ error: "Verification code required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { totpSecretEnc: true, twoFactorEnabled: true },
  });

  if (!user?.totpSecretEnc) {
    return NextResponse.json({ error: "Run setup first" }, { status: 400 });
  }

  const secret = decryptTotpSecret(user.totpSecretEnc);
  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { twoFactorEnabled: true },
  });

  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.TWO_FA_ENABLED,
    severity: "warn",
  });

  return NextResponse.json({ success: true, twoFactorEnabled: true });
}
