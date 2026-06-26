import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getDocumentStats } from "@/services/documents/service";
import { getFolderTree } from "@/modules/documents/folders";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermission("admin:documents:read");
  if (auth.error) return auth.error;

  const [stats, folders] = await Promise.all([getDocumentStats(), getFolderTree()]);

  return NextResponse.json({ stats, folders });
}
