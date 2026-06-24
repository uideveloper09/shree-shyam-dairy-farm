import { NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import { getAiReply } from "@/lib/chatAssistant";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 1000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const sanitized = messages
      .slice(-MAX_MESSAGES)
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, MAX_CONTENT_LENGTH),
      }));

    if (!sanitized.some((m) => m.role === "user")) {
      return NextResponse.json({ error: "At least one user message required" }, { status: 400 });
    }

    const content = await getContent();
    const { reply, mode } = await getAiReply(sanitized, content);

    return NextResponse.json({ reply, mode });
  } catch {
    return NextResponse.json({ error: "Failed to get reply" }, { status: 500 });
  }
}
