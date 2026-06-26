import { z } from "zod";
import { isPlaceholder } from "./_shared";

export const aiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
});

export type AiEnvInput = z.infer<typeof aiEnvSchema>;

export type AiConfig = {
  apiKey: string | undefined;
  model: string;
  configured: boolean;
};

export const DEFAULT_AI_MODEL = "gpt-4o-mini" as const;

export function refineAiEnv(data: AiEnvInput, ctx: z.RefinementCtx): void {
  if (
    data.OPENAI_API_KEY &&
    !isPlaceholder(data.OPENAI_API_KEY) &&
    !data.OPENAI_API_KEY.startsWith("sk-")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "OPENAI_API_KEY must start with sk-",
      path: ["OPENAI_API_KEY"],
    });
  }
}

export function buildAiConfig(data: AiEnvInput): AiConfig {
  const apiKey = data.OPENAI_API_KEY;
  return {
    apiKey,
    model: data.OPENAI_MODEL || DEFAULT_AI_MODEL,
    configured: Boolean(apiKey && !isPlaceholder(apiKey)),
  };
}

export function validateAiDev(ai: AiConfig, warnings: string[]): void {
  if (!ai.configured) {
    warnings.push("OPENAI_API_KEY not configured — AI features use fallbacks");
  }
}
