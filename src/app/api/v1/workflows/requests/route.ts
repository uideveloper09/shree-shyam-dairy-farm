import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listUserRequests } from "@/services/workflows/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("workflows:read");
  if (auth.error) return auth.error;

  const requests = await listUserRequests(auth.user!.id);
  return NextResponse.json({ requests });
}
