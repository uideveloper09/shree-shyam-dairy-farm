import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  convertReferral,
  listReferrals,
  recordReferral,
  syncUserReferrals,
} from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("crm:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("sync") === "1") {
    const result = await syncUserReferrals();
    return NextResponse.json(result);
  }

  const referrals = await listReferrals();
  return NextResponse.json({ referrals });
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "convert" && body.id && body.customerId) {
    const referral = await convertReferral(body.id, body.customerId, body.rewardAmount);
    return NextResponse.json(referral);
  }

  const referral = await recordReferral({
    ...body,
    referrerUserId: body.referrerUserId ?? auth.user!.id,
  });
  return NextResponse.json(referral, { status: 201 });
}
