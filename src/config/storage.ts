import { z } from "zod";

export const storageEnvSchema = z.object({
  STORAGE_PROVIDER: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(),
});

export type StorageEnvInput = z.infer<typeof storageEnvSchema>;

export type StorageProvider = "local" | "s3" | "r2";

export type StorageConfig = {
  provider: StorageProvider;
  publicUrl: string;
  bucket: string | undefined;
  aws: {
    region: string;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    endpoint: string | undefined;
  };
  r2: {
    bucket: string | undefined;
    accountId: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    publicDomain: string | undefined;
  };
  isCloudConfigured: boolean;
};

export function refineStorageEnv(data: StorageEnvInput, ctx: z.RefinementCtx): void {
  const provider = data.STORAGE_PROVIDER || "local";
  if ((provider === "s3" || provider === "r2") && !data.STORAGE_BUCKET && !data.R2_BUCKET_NAME) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "STORAGE_BUCKET or R2_BUCKET_NAME is required when STORAGE_PROVIDER is s3/r2",
      path: ["STORAGE_BUCKET"],
    });
  }
}

export function buildStorageConfig(data: StorageEnvInput): StorageConfig {
  const raw = data.STORAGE_PROVIDER || "local";
  const provider: StorageProvider = raw === "s3" || raw === "r2" || raw === "local" ? raw : "local";
  const bucket = data.STORAGE_BUCKET || data.R2_BUCKET_NAME;

  return {
    provider,
    publicUrl: data.STORAGE_PUBLIC_URL || "/storage",
    bucket,
    aws: {
      region: data.AWS_REGION || "auto",
      accessKeyId: data.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.AWS_SECRET_ACCESS_KEY,
      endpoint: data.AWS_S3_ENDPOINT,
    },
    r2: {
      bucket: data.R2_BUCKET_NAME,
      accountId: data.R2_ACCOUNT_ID,
      accessKeyId: data.R2_ACCESS_KEY_ID,
      secretAccessKey: data.R2_SECRET_ACCESS_KEY,
      publicDomain: data.R2_PUBLIC_DOMAIN,
    },
    isCloudConfigured:
      provider !== "local" && Boolean(bucket && (data.AWS_ACCESS_KEY_ID || data.R2_ACCESS_KEY_ID)),
  };
}
