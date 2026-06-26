import type { ProviderStatus } from "@/modules/integrations/types";

export function envStatus(envKeys: string[], message?: string): ProviderStatus {
  const configured = envKeys.every((k) => {
    const v = process.env[k];
    return Boolean(v && !v.includes("your_") && !v.includes("xxxxx"));
  });
  return {
    configured,
    status: configured ? "active" : "pending",
    message: configured ? message : `Set: ${envKeys.join(", ")}`,
    envKeys,
  };
}

export function hasEnv(...keys: string[]) {
  return keys.every((k) => {
    const v = process.env[k];
    return Boolean(v && !v.includes("your_"));
  });
}
