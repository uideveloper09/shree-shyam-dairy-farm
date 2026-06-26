import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { getDocumentById } from "@/services/documents/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const document = await getDocumentById(id);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canSeeAll = hasPermission(auth.user!.role, "admin:documents:read");
  if (!canSeeAll && document.uploadedById !== auth.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ document });
}
