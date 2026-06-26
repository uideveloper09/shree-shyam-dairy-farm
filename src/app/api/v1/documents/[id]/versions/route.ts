import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getDocumentVersions } from "@/services/documents/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const versions = await getDocumentVersions(id);
  return NextResponse.json({ versions });
}
