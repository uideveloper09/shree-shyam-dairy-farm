import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { runOcr, getLatestOcr } from "@/modules/documents/ocr";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const result = await getLatestOcr(id);
  return NextResponse.json({ ocr: result });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:write");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const ocr = await runOcr(id, body.version);
    return NextResponse.json({ ocr });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
