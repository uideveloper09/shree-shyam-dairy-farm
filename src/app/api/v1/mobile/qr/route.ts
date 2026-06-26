import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data") || "ssd://customer";
  const size = Math.min(Number(url.searchParams.get("size") || 200), 512);

  const svg = await QRCode.toString(data, {
    type: "svg",
    width: size,
    margin: 1,
    color: { dark: "#082F63", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
