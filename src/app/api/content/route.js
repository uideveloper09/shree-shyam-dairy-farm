import { NextResponse } from "next/server";
import { getContent, saveContent } from "@/utils/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function PUT(request) {
  const secret = request.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = await saveContent(body);
    return NextResponse.json({ ok: true, content });
  } catch {
    return NextResponse.json({ error: "Invalid content payload" }, { status: 400 });
  }
}
