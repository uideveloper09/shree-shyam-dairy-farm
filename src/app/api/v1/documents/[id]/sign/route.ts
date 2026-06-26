import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { signDocument, listSignatures } from "@/modules/documents/signature";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:read");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const signatures = await listSignatures(id);
  return NextResponse.json({ signatures });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("documents:sign");
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();

  if (!body.signatureData) {
    return NextResponse.json({ error: "signatureData required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || undefined;

  const signature = await signDocument({
    documentId: id,
    signerId: auth.user!.id,
    signerName: body.signerName || auth.user!.name || auth.user!.email || "Signer",
    signatureData: body.signatureData,
    ipAddress: ip,
    version: body.version,
  });

  return NextResponse.json({ signature }, { status: 201 });
}
