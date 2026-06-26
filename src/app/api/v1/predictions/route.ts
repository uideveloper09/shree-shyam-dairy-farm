import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import { verifyCronSecret } from "@/lib/farm/api-keys";
import {
  getLatestPredictions,
  runDailyPredictions,
  runMilkForecast,
  runDemandForecast,
  runInventoryForecast,
  runProfitForecast,
  runProductionPlan,
} from "@/services/farm/prediction.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ predictions: [] }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") as Parameters<typeof getLatestPredictions>[0];
  const predictions = await getLatestPredictions(domain || undefined);
  return NextResponse.json({ predictions });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const isCron = verifyCronSecret(request);
  if (!isCron) {
    const { error } = await requireFarmOperator();
    if (error) return error;
  }

  const body = await request.json().catch(() => ({}));
  const type = body.type || "daily";

  switch (type) {
    case "milk":
      return NextResponse.json({ result: await runMilkForecast() });
    case "demand":
      return NextResponse.json({ result: await runDemandForecast() });
    case "inventory":
      return NextResponse.json({ result: await runInventoryForecast() });
    case "profit":
      return NextResponse.json({ result: await runProfitForecast() });
    case "production-plan":
      return NextResponse.json({ result: await runProductionPlan() });
    case "daily":
    default:
      return NextResponse.json({ result: await runDailyPredictions() });
  }
}
