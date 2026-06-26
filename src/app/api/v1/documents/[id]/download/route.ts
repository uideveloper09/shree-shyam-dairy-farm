import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/repositories/prisma";
import { downloadFile } from "@/lib/ops/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const versionParam = new URL(request.url).searchParams.get("version");
  const inline = new URL(request.url).searchParams.get("inline") === "true";

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { versions: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canSeeAll = hasPermission(auth.user!.role, "admin:documents:read");
  if (!canSeeAll && doc.uploadedById !== auth.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versionNum = versionParam ? Number(versionParam) : doc.currentVersion;
  const versionRow = doc.versions.find((v) => v.version === versionNum);

  const storageKey = versionRow?.storageKey ?? doc.storageKey;
  const mimeType = versionRow?.mimeType ?? doc.mimeType;
  const fileName = versionRow?.fileName ?? doc.fileName;

  const buffer = await downloadFile(storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "File not in storage" }, { status: 404 });
  }

  const disposition = inline ? "inline" : `attachment; filename="${fileName}"`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
