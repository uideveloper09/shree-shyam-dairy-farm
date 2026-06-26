import { NextResponse } from "next/server";
import { processScheduledJobs } from "@/modules/notifications/scheduler";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processScheduledJobs();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return POST(request);
}
