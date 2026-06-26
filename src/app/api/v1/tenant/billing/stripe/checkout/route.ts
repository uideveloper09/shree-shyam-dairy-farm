import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";
import { createStripeCheckoutSession } from "@/lib/billing/stripe";
import type { TenantPlan } from "@/constants/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (!["OWNER", "ADMIN"].includes(auth.user!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const plan = (body.plan as TenantPlan) || "growth";
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await createStripeCheckoutSession(
      tenant.id,
      plan,
      `${base}/admin/tenant?billing=success`,
      `${base}/admin/tenant?billing=cancelled`
    );
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
