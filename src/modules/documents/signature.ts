import { createHash } from "crypto";
import type { SignDocumentInput } from "@/modules/documents/types";
import { prisma } from "@/repositories/prisma";

export function hashSignature(data: string, documentId: string, signerId: string): string {
  return createHash("sha256").update(`${documentId}:${signerId}:${data}`).digest("hex");
}

export async function signDocument(input: SignDocumentInput) {
  const doc = await prisma.document.findUnique({ where: { id: input.documentId } });
  if (!doc) throw new Error("Document not found");

  const version = input.version ?? doc.currentVersion;
  const signatureHash = hashSignature(input.signatureData, input.documentId, input.signerId);

  return prisma.documentSignature.create({
    data: {
      documentId: input.documentId,
      version,
      signerId: input.signerId,
      signerName: input.signerName,
      signatureHash,
      signatureData: input.signatureData,
      ipAddress: input.ipAddress,
      verified: true,
    },
  });
}

export async function verifySignature(signatureId: string): Promise<boolean> {
  const sig = await prisma.documentSignature.findUnique({ where: { id: signatureId } });
  if (!sig?.signatureData) return false;

  const expected = hashSignature(sig.signatureData, sig.documentId, sig.signerId);
  const valid = expected === sig.signatureHash;

  if (sig.verified !== valid) {
    await prisma.documentSignature.update({
      where: { id: signatureId },
      data: { verified: valid },
    });
  }

  return valid;
}

export async function listSignatures(documentId: string) {
  return prisma.documentSignature.findMany({
    where: { documentId },
    orderBy: { signedAt: "desc" },
    include: { signer: { select: { id: true, name: true, email: true } } },
  });
}
