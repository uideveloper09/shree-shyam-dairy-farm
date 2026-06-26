import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  getDeliveryAssignments,
  getTodayDeliveryStats,
  updateDeliveryAssignment,
} from "@/services/mobile/delivery.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("delivery:read");
  if (auth.error) return auth.error;

  const [assignments, stats] = await Promise.all([
    getDeliveryAssignments(auth.user!.id),
    getTodayDeliveryStats(auth.user!.id),
  ]);

  return NextResponse.json({ assignments, stats });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("delivery:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Assignment id required" }, { status: 400 });
  }

  const updated = await updateDeliveryAssignment(body.id, auth.user!.id, {
    status: body.status,
    latitude: body.latitude,
    longitude: body.longitude,
    proofPhotoUrl: body.proofPhotoUrl,
    notes: body.notes,
    scannedAt: body.scannedAt ? new Date(body.scannedAt) : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ assignment: updated });
}
