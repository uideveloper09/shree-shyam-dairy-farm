import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  getCustomerMobileData,
  getFarmManagerMobileData,
  getOwnerDashboard,
  getVetMobileData,
} from "@/services/mobile/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const app = url.searchParams.get("app") || "customer";

  if (app === "owner") {
    const auth = await requirePermission("mobile:owner");
    if (auth.error) return auth.error;
    return NextResponse.json(await getOwnerDashboard());
  }

  if (app === "farm") {
    const auth = await requirePermission("mobile:farm");
    if (auth.error) return auth.error;
    return NextResponse.json(await getFarmManagerMobileData());
  }

  if (app === "vet") {
    const auth = await requirePermission("mobile:vet");
    if (auth.error) return auth.error;
    return NextResponse.json(await getVetMobileData());
  }

  const auth = await requirePermission("mobile:customer");
  if (auth.error) return auth.error;
  return NextResponse.json(await getCustomerMobileData(auth.user!.id));
}
