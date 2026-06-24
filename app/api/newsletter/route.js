import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await addSubscriber(email);

    if (result.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
