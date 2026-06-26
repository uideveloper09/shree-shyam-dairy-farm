import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { getOrCreateDeveloperAccount } from "@/services/api/developer.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  return NextResponse.json({ account });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const account = await getOrCreateDeveloperAccount(
    auth.user!.id,
    typeof body.company === "string" ? body.company : undefined
  );

  return NextResponse.json({ account, message: "Developer account ready" });
}
