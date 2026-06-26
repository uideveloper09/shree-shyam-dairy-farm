import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  createSchedule,
  listSchedules,
  startScheduleProduction,
} from "@/services/processing/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("processing:read");
  if (auth.error) return auth.error;

  const from = new URL(request.url).searchParams.get("from") ?? undefined;
  const schedules = await listSchedules(undefined, from);
  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "start" && body.scheduleId) {
    try {
      const batch = await startScheduleProduction(body.scheduleId, auth.user!.id);
      return NextResponse.json(batch);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (!body.productType || !body.plannedQty || !body.scheduledDate) {
    return NextResponse.json(
      { error: "productType, plannedQty, scheduledDate required" },
      { status: 400 }
    );
  }

  const schedule = await createSchedule(undefined, body);
  return NextResponse.json(schedule, { status: 201 });
}
