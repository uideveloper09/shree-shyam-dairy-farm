import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  completeReminder,
  createReminder,
  listReminders,
  markOverdueReminders,
} from "@/services/fleet/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("fleet:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("sync") === "1") {
    const result = await markOverdueReminders();
    return NextResponse.json(result);
  }

  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  const reminders = await listReminders(vehicleId);
  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:fleet:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "complete" && body.id) {
    const reminder = await completeReminder(body.id);
    return NextResponse.json(reminder);
  }

  if (!body.vehicleId || !body.title || !body.dueAt) {
    return NextResponse.json({ error: "vehicleId, title, dueAt required" }, { status: 400 });
  }

  const reminder = await createReminder(body);
  return NextResponse.json(reminder, { status: 201 });
}
