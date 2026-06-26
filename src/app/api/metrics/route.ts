import { NextResponse } from "next/server";
import { metrics } from "@/lib/ops/metrics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return new NextResponse(metrics.toPrometheus(), {
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
}
