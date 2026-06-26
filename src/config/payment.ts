import { z } from "zod";
import { isPlaceholder } from "./_shared";

export const paymentEnvSchema = z.object({
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_TENANT_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_CUSTOMER_CONTACT: z.string().optional(),
  RAZORPAY_CUSTOMER_EMAIL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type PaymentEnvInput = z.infer<typeof paymentEnvSchema>;

export type PaymentConfig = {
  razorpay: {
    keyId: string | undefined;
    keySecret: string | undefined;
    webhookSecret: string | undefined;
    tenantWebhookSecret: string | undefined;
    customerContact: string;
    customerEmail: string;
    configured: boolean;
    isTestMode: boolean;
  };
  stripe: {
    secretKey: string | undefined;
    webhookSecret: string | undefined;
    configured: boolean;
  };
};

export function refinePaymentEnv(data: PaymentEnvInput, ctx: z.RefinementCtx): void {
  const hasRzpId = Boolean(
    data.NEXT_PUBLIC_RAZORPAY_KEY_ID && !isPlaceholder(data.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  );
  const hasRzpSecret = Boolean(
    data.RAZORPAY_KEY_SECRET && !isPlaceholder(data.RAZORPAY_KEY_SECRET)
  );

  if (hasRzpId !== hasRzpSecret) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for payments",
      path: ["RAZORPAY_KEY_SECRET"],
    });
  }

  if (
    hasRzpId &&
    data.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    !data.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXT_PUBLIC_RAZORPAY_KEY_ID must start with rzp_",
      path: ["NEXT_PUBLIC_RAZORPAY_KEY_ID"],
    });
  }

  if (data.STRIPE_SECRET_KEY && isPlaceholder(data.STRIPE_SECRET_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "STRIPE_SECRET_KEY appears to be a placeholder",
      path: ["STRIPE_SECRET_KEY"],
    });
  }
}

export function buildPaymentConfig(data: PaymentEnvInput): PaymentConfig {
  const keyId = data.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = data.RAZORPAY_KEY_SECRET;
  const stripeKey = data.STRIPE_SECRET_KEY;

  return {
    razorpay: {
      keyId,
      keySecret,
      webhookSecret: data.RAZORPAY_WEBHOOK_SECRET,
      tenantWebhookSecret: data.RAZORPAY_TENANT_WEBHOOK_SECRET,
      customerContact: data.RAZORPAY_CUSTOMER_CONTACT || "9999999999",
      customerEmail: data.RAZORPAY_CUSTOMER_EMAIL || "shreeshyamdairyfarm@gmail.com",
      configured: Boolean(
        keyId &&
        keySecret &&
        !isPlaceholder(keyId) &&
        !isPlaceholder(keySecret) &&
        keyId.startsWith("rzp_")
      ),
      isTestMode: Boolean(keyId?.includes("_test_")),
    },
    stripe: {
      secretKey: stripeKey,
      webhookSecret: data.STRIPE_WEBHOOK_SECRET,
      configured: Boolean(stripeKey && !isPlaceholder(stripeKey)),
    },
  };
}

export function validatePaymentDev(payment: PaymentConfig, warnings: string[]): void {
  if (!payment.razorpay.configured) {
    warnings.push("Razorpay keys not configured — payments disabled");
  }
}
