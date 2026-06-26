import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { storeChallenge } from "@/services/mobile/platform.service";

export const dynamic = "force-dynamic";

function toBase64Url(buf: Buffer) {
  return buf.toString("base64url");
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : "unknown";
  const challenge = toBase64Url(randomBytes(32));
  await storeChallenge(`reg:${deviceId}`, challenge);

  const host = new URL(request.url).hostname;

  return NextResponse.json({
    challenge,
    rp: { name: "Shree Shyam Dairy Farm", id: host === "localhost" ? "localhost" : host },
    user: {
      id: toBase64Url(Buffer.from(auth.user!.id)),
      name: auth.user!.email || auth.user!.id,
      displayName: auth.user!.name || "SSD User",
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
    timeout: 60000,
    attestation: "none",
  });
}
