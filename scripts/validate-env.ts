/**
 * Validate environment variables (CI / local).
 * Usage: npm run env:validate
 */
import { validateEnv } from "../src/config";

const strict = process.argv.includes("--strict") || process.env.APP_ENV === "production";
const result = validateEnv({ strict });

for (const w of result.warnings) {
  console.warn(`⚠ ${w}`);
}

if (!result.ok) {
  for (const e of result.errors) {
    console.error(`✗ ${e}`);
  }
  console.error("\nEnvironment validation failed.");
  process.exit(1);
}

console.log("✓ Environment validation passed");
console.log(
  JSON.stringify(
    {
      appEnv: result.config.app.env,
      database: result.config.database.configured,
      jwt: Boolean(result.config.auth.jwt.accessSecret),
      razorpay: result.config.payment.razorpay.configured,
      openai: result.config.ai.configured,
      email: result.config.email.resend.configured,
      admin: result.config.app.admin.configured,
      storage: result.config.storage.provider,
    },
    null,
    2
  )
);
