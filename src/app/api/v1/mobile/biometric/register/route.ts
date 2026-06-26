import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { registerWebAuthnCredential } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.credentialId || !body.publicKey || !body.deviceId) {
    return NextResponse.json({ error: "Invalid credential" }, { status: 400 });
  }

  await registerWebAuthnCredential(auth.user!.id, {
    credentialId: body.credentialId,
    publicKey: body.publicKey,
    deviceId: body.deviceId,
    deviceLabel: body.deviceLabel,
  });

  return NextResponse.json({ success: true });
}
