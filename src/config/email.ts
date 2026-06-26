import { z } from "zod";
import { isPlaceholder } from "./_shared";

export const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
});

export type EmailEnvInput = z.infer<typeof emailEnvSchema>;

export type EmailConfig = {
  resend: {
    apiKey: string | undefined;
    from: string;
    configured: boolean;
  };
  sms: {
    msg91AuthKey: string | undefined;
    msg91TemplateId: string | undefined;
    configured: boolean;
  };
};

export const DEFAULT_EMAIL_FROM = "noreply@shreeshyamdairyfarm.com" as const;

export function refineEmailEnv(data: EmailEnvInput, ctx: z.RefinementCtx): void {
  if (data.RESEND_API_KEY && !isPlaceholder(data.RESEND_API_KEY) && !data.EMAIL_FROM) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "EMAIL_FROM is required when RESEND_API_KEY is set",
      path: ["EMAIL_FROM"],
    });
  }
}

export function buildEmailConfig(data: EmailEnvInput): EmailConfig {
  const resendKey = data.RESEND_API_KEY;
  return {
    resend: {
      apiKey: resendKey,
      from: data.EMAIL_FROM || DEFAULT_EMAIL_FROM,
      configured: Boolean(resendKey && !isPlaceholder(resendKey)),
    },
    sms: {
      msg91AuthKey: data.MSG91_AUTH_KEY,
      msg91TemplateId: data.MSG91_TEMPLATE_ID,
      configured: Boolean(data.MSG91_AUTH_KEY && data.MSG91_TEMPLATE_ID),
    },
  };
}

export function validateEmailDev(email: EmailConfig, warnings: string[]): void {
  if (!email.resend.configured) {
    warnings.push("RESEND_API_KEY not configured — email notifications disabled");
  }
}
