import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { addCampaignMembers, createCampaign, listCampaigns } from "@/services/crm/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:crm:read");
  if (auth.error) return auth.error;

  const campaigns = await listCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:crm:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  if (body.members?.length && body.campaignId) {
    const count = await addCampaignMembers(body.campaignId, body.members);
    return NextResponse.json({ added: count.count });
  }

  const campaign = await createCampaign(undefined, auth.user!.id, body);
  return NextResponse.json(campaign, { status: 201 });
}
