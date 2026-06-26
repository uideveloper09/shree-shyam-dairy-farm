import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createFolder, listFolders } from "@/modules/documents/folders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const parentId = new URL(request.url).searchParams.get("parentId");
  const folders = await listFolders(null, parentId || null);
  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:documents:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const folder = await createFolder({
    name: body.name,
    parentId: body.parentId,
    createdById: auth.user!.id,
  });

  return NextResponse.json({ folder }, { status: 201 });
}
