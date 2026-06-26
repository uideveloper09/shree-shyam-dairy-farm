import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listDocuments } from "@/services/documents/service";
import type { DocumentCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as DocumentCategory | null;
  const folderId = searchParams.get("folderId") || undefined;

  const canSeeAll =
    auth.user!.role === "ADMIN" ||
    auth.user!.role === "OWNER" ||
    auth.user!.role === "FARM_MANAGER" ||
    auth.user!.role === "ACCOUNTANT";

  const documents = await listDocuments({
    category: category || undefined,
    folderId,
    uploadedById: canSeeAll ? undefined : auth.user!.id,
  });

  return NextResponse.json({ documents });
}
