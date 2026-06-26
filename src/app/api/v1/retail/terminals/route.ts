import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createTerminal, listTerminals } from "@/services/retail/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("retail:read");
  if (auth.error) return auth.error;
  return NextResponse.json({ terminals: await listTerminals() });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:retail:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const terminal = await createTerminal(undefined, body);
  return NextResponse.json(terminal, { status: 201 });
}
