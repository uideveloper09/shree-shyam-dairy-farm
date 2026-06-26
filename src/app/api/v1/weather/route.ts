import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/repositories/prisma";
import { requireFarmOperator } from "@/lib/auth/farm-session";
import {
  authenticateWeatherStation,
  getCurrentWeather,
  ingestWeatherReadings,
  provisionWeatherStation,
} from "@/services/farm/weather.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ weather: null }, { status: 503 });
  }
  const { error } = await requireFarmOperator();
  if (error) return error;
  const weather = await getCurrentWeather();
  return NextResponse.json({ weather });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const stationKey = body.stationKey || request.headers.get("x-station-id");
  const apiKey =
    request.headers.get("x-station-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (body.readings && stationKey && apiKey) {
    const station = await authenticateWeatherStation(stationKey, apiKey);
    if (!station) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await ingestWeatherReadings(stationKey, body.readings);
    return NextResponse.json({ ok: true, ...result });
  }

  const { error } = await requireFarmOperator();
  if (error) return error;

  if (body.action === "provision") {
    const result = await provisionWeatherStation(body.name || "Main Weather Station");
    return NextResponse.json({ station: result.station, apiKey: result.apiKeyPlain });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
