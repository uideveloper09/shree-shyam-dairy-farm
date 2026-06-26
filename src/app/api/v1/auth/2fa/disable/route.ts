import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { requireUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { decryptTotpSecret, verifyTotp } from "@/lib/security/totp";
import { writeAudit, AUDIT_ACTIONS } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code : "";

  const user = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { passwordHash: true, totpSecretEnc: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.totpSecretEnc) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  if (user.passwordHash) {
    if (!password || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  }

  if (!verifyTotp(decryptTotpSecret(user.totpSecretEnc), code)) {
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { twoFactorEnabled: false, totpSecretEnc: null },
  });

  await writeAudit({
    userId: auth.user!.id,
    actorId: auth.user!.id,
    action: AUDIT_ACTIONS.TWO_FA_DISABLED,
    severity: "warn",
  });

  return NextResponse.json({ success: true, twoFactorEnabled: false });
}
