import { NextResponse } from "next/server";
import { addInquiry } from "@/utils/data";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, comment } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const inquiry = await addInquiry({
      name: name?.trim() || "",
      email: email.trim(),
      phone: phone?.trim() || "",
      comment: comment?.trim() || "",
    });

    return NextResponse.json({ ok: true, inquiry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
