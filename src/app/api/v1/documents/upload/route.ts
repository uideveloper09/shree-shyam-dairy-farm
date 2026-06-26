import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { uploadDocument } from "@/services/documents/service";
import { findFolderByCategory } from "@/modules/documents/folders";
import type { DocumentCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("documents:write");
  if (auth.error) return auth.error;

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const title = String(form.get("title") || file.name);
  const category = (form.get("category") as DocumentCategory) || "GENERAL";
  let folderId = form.get("folderId") ? String(form.get("folderId")) : undefined;

  if (!folderId) {
    const folder = await findFolderByCategory(category);
    folderId = folder?.id;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const tags = form.get("tags")
    ? String(form.get("tags"))
        .split(",")
        .map((t) => t.trim())
    : [];

  const document = await uploadDocument({
    title,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
    category,
    folderId,
    uploadedById: auth.user!.id,
    tags,
  });

  return NextResponse.json({ document }, { status: 201 });
}
