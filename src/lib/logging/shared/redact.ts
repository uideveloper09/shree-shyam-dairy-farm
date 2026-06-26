/** Paths redacted from all log output (payment secrets, tokens, PII). */
export const LOG_REDACT_PATHS = [
  "password",
  "secret",
  "token",
  "authorization",
  "apiKey",
  "keySecret",
  "razorpayKeySecret",
  "stripeSecretKey",
  "cardNumber",
  "cvv",
  "pan",
  "aadhaar",
  "*.password",
  "*.secret",
  "*.token",
  "*.authorization",
  "*.keySecret",
  "req.headers.authorization",
  "req.headers.cookie",
] as const;

export const LOG_REDACT_CENSOR = "[Redacted]";
