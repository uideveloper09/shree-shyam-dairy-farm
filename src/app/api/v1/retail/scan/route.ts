import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { scanCode } from "@/services/retail/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;

  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const result = await scanCode(code);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
