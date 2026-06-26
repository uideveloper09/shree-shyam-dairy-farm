import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { logger } from "@/lib/ops/logger";

export type StorageProvider = "local" | "s3" | "r2";

export function getStorageProvider(): StorageProvider {
  const p = process.env.STORAGE_PROVIDER || "local";
  if (p === "s3" || p === "r2") return p;
  return "local";
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const provider = getStorageProvider();

  if (provider === "s3" || provider === "r2") {
    return uploadToS3Compatible(key, body, contentType, provider);
  }

  const dir = path.join(process.cwd(), "storage", path.dirname(key));
  await mkdir(dir, { recursive: true });
  const filePath = path.join(process.cwd(), "storage", key);
  await writeFile(filePath, body);
  const baseUrl = process.env.STORAGE_PUBLIC_URL || "/storage";
  return { key, url: `${baseUrl}/${key}` };
}

async function uploadToS3Compatible(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  provider: "s3" | "r2"
) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const bucket = process.env.STORAGE_BUCKET || process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("STORAGE_BUCKET not configured");

  const endpoint =
    provider === "r2"
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : process.env.AWS_S3_ENDPOINT;

  const client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicUrl =
    process.env.STORAGE_PUBLIC_URL ||
    (provider === "r2"
      ? `https://${process.env.R2_PUBLIC_DOMAIN}`
      : `https://${bucket}.s3.amazonaws.com`);

  logger.info("storage_uploaded", { key, provider });
  return { key, url: `${publicUrl}/${key}` };
}

export async function readLocalFile(key: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "storage", key));
  } catch {
    return null;
  }
}

export async function downloadFile(key: string): Promise<Buffer | null> {
  const provider = getStorageProvider();
  if (provider === "local") {
    return readLocalFile(key);
  }

  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.STORAGE_BUCKET || process.env.R2_BUCKET_NAME;
    if (!bucket) return null;

    const endpoint =
      provider === "r2"
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : process.env.AWS_S3_ENDPOINT;

    const client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<boolean> {
  const provider = getStorageProvider();
  if (provider === "local") {
    try {
      const { unlink } = await import("fs/promises");
      await unlink(path.join(process.cwd(), "storage", key));
      return true;
    } catch {
      return false;
    }
  }

  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.STORAGE_BUCKET || process.env.R2_BUCKET_NAME;
    if (!bucket) return false;

    const endpoint =
      provider === "r2"
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : process.env.AWS_S3_ENDPOINT;

    const client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
