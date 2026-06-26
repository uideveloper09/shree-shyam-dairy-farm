import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getPaymentDashboardMetrics } from "@/services/payment/admin-dashboard.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/payments/dashboard
 * Returns e-commerce payment KPIs for the admin dashboard.
 */
export async function GET() {
  const auth = await requirePermission("admin:ecommerce:read");
  if (auth.error) return auth.error;

  const metrics = await getPaymentDashboardMetrics();
  return NextResponse.json(metrics);
}
