import { prisma } from "@/repositories/prisma";
import { downloadFile } from "@/lib/ops/storage";

export type OcrField = {
  key: string;
  value: string;
  confidence?: number;
};

export async function runOcr(documentId: string, version?: number) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: true },
  });
  if (!doc) throw new Error("Document not found");

  const ver = version ?? doc.currentVersion;
  const versionRecord =
    doc.versions.find((v) => v.version === ver) ??
    (ver === doc.currentVersion
      ? {
          storageKey: doc.storageKey,
          mimeType: doc.mimeType,
        }
      : null);

  if (!versionRecord) throw new Error("Version not found");

  const buffer = await downloadFile(versionRecord.storageKey);
  if (!buffer) throw new Error("File not found in storage");

  const apiKey = process.env.OPENAI_API_KEY;
  let text = "";
  let fields: OcrField[] = [];
  let confidence = 0.5;
  let provider = "mock";

  if (apiKey && !apiKey.includes("your_")) {
    provider = "openai";
    const isPdf = doc.mimeType === "application/pdf";
    const isImage = doc.mimeType.startsWith("image/");

    if (isImage || isPdf) {
      const base64 = buffer.toString("base64");
      const mediaType = isPdf ? "application/pdf" : doc.mimeType;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'Extract all text from this document. Return JSON: { "text": "full text", "fields": [{"key":"invoice_number","value":"..."}], "confidence": 0.95 }. For invoices extract number, date, amount, vendor. For certificates extract name, date, issuer.',
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        try {
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}") as {
            text?: string;
            fields?: OcrField[];
            confidence?: number;
          };
          text = parsed.text || "";
          fields = parsed.fields || [];
          confidence = parsed.confidence ?? 0.85;
        } catch {
          text = data.choices?.[0]?.message?.content || "";
          confidence = 0.7;
        }
      }
    } else {
      text = buffer.toString("utf8").slice(0, 50_000);
      confidence = 0.6;
    }
  } else {
    text = `[OCR placeholder] ${doc.title} — configure OPENAI_API_KEY for full OCR`;
    fields = [{ key: "document_id", value: documentId }];
    confidence = 0.1;
  }

  return prisma.documentOcrResult.create({
    data: {
      documentId,
      version: ver,
      text,
      fields: fields as object,
      confidence,
      provider,
    },
  });
}

export async function getLatestOcr(documentId: string) {
  return prisma.documentOcrResult.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });
}
