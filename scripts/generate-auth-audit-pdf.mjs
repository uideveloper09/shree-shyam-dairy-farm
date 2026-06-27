import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "docs", "AUTHENTICATION_AUTHORIZATION_AUDIT.pdf");

const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const colors = {
  title: "#082F63",
  heading: "#0B3D7A",
  body: "#333333",
  muted: "#666666",
};

function ensureSpace(h = 80) {
  if (doc.y > doc.page.height - h) doc.addPage();
}

function title(text) {
  doc.fillColor(colors.title).fontSize(20).font("Helvetica-Bold").text(text, { align: "center" });
  doc.moveDown(0.4);
}

function meta(text) {
  doc.fillColor(colors.muted).fontSize(9).font("Helvetica").text(text, { align: "center" });
  doc.moveDown(0.2);
}

function h2(text) {
  ensureSpace();
  doc.moveDown(0.4);
  doc.fillColor(colors.heading).fontSize(13).font("Helvetica-Bold").text(text);
  doc.moveDown(0.25);
}

function h3(text) {
  ensureSpace();
  doc.fillColor(colors.heading).fontSize(10).font("Helvetica-Bold").text(text);
  doc.moveDown(0.15);
}

function p(text) {
  ensureSpace();
  doc.fillColor(colors.body).fontSize(9).font("Helvetica").text(text, { lineGap: 2 });
  doc.moveDown(0.25);
}

function bullets(items) {
  ensureSpace();
  doc.fillColor(colors.body).fontSize(9).font("Helvetica");
  for (const item of items) {
    ensureSpace(30);
    doc.text(`  •  ${item}`, { lineGap: 1 });
  }
  doc.moveDown(0.25);
}

function table(headers, rows, colWidths) {
  ensureSpace(60);
  const total = colWidths.reduce((a, b) => a + b, 0);
  const startX = 50;
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.heading);
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x, y, { width: colWidths[i] - 4 });
    x += colWidths[i];
  });
  y += 14;

  doc.font("Helvetica").fontSize(8).fillColor(colors.body);
  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 50;
    }
    x = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell), x, y, { width: colWidths[i] - 4, lineGap: 1 });
      x += colWidths[i];
    });
    y += Math.max(12, Math.ceil(String(row[0]).length / 40) * 10);
  }
  doc.y = y + 6;
}

// Cover
title("Authentication & Authorization Audit");
meta("Shree Shyam Dairy Farm · June 27, 2026");
meta("Next.js 16 App Router · Prisma · PostgreSQL · Custom JWT (jose)");
meta("Read-only audit — no code modified");
doc.moveDown(0.5);
p(
  "Final score: 6.5 / 10. Production uses custom JWT (not NextAuth). Access JWT in HttpOnly cookies; refresh tokens are opaque DB tokens. RBAC is mature; email verification and Google OAuth UI are incomplete."
);

h2("1. Authentication");
table(
  ["Check", "Status", "Details"],
  [
    ["Auth library", "Custom JWT", "jose — not NextAuth/Auth.js"],
    ["Session strategy", "Hybrid", "JWT access + DB refresh"],
    ["Credentials login", "Yes", "POST /api/v1/auth/login"],
    ["Google OAuth", "Partial", "Backend only, no login UI"],
    ["Email verification", "No flow", "Schema only, not enforced"],
    ["Forgot password", "Yes", "/forgot-password + API"],
    ["Password reset", "Yes", "/reset-password + API"],
    ["bcrypt", "Yes", "bcryptjs, 12 rounds"],
  ],
  [110, 70, 305]
);
bullets([
  "Key files: src/lib/auth/jwt.ts, session-manager.ts, src/app/api/v1/auth/*",
  "NEXTAUTH_SECRET is legacy alias for JWT_ACCESS_SECRET",
  "Phone OTP and 2FA TOTP also implemented (API level)",
]);

h2("2. JWT");
table(
  ["Check", "Status", "Details"],
  [
    ["JWT used", "Yes (access)", "Refresh = opaque nanoid in DB"],
    ["Generated in", "signAccessToken()", "src/lib/auth/jwt.ts"],
    ["Secret", "JWT_ACCESS_SECRET", "Fallback NEXTAUTH_SECRET"],
    ["Cookies", "HttpOnly", "ssd_access, ssd_refresh"],
    ["Signed/encrypted", "Signed HS256", "Not encrypted (JWE)"],
  ],
  [100, 80, 305]
);
p("Dead code: signRefreshToken/verifyRefreshToken in jwt.ts never used.");

h2("3. Access & Refresh Tokens");
table(
  ["Feature", "Status", "Notes"],
  [
    ["Access token", "Yes", "JWT in ssd_access cookie"],
    ["Refresh token", "Yes", "Opaque in DB + ssd_refresh cookie"],
    ["Refresh API", "Yes", "POST /api/v1/auth/refresh"],
    ["Auto refresh client", "Partial", "fetchWithSession — subscriptions only"],
    ["Refresh rotation", "No", "Same token reused"],
    ["Session revoke", "Yes", "GET/DELETE /auth/sessions"],
  ],
  [120, 70, 295]
);
p("Gap: Access cookie maxAge hardcoded 900s; JWT expiry is env-configurable.");

doc.addPage();

h2("4. Authorization");
h3("requireUser() — src/lib/auth/session.ts");
bullets([
  "Read ssd_access → verifyAccessToken (JWT) → DB user lookup",
  "Returns 401 if missing, invalid, inactive, or deleted user",
]);
h3("requirePermission() — RBAC + ABAC");
bullets([
  "68 permissions in permissions.ts",
  "8 roles: CUSTOMER, ADMIN, DELIVERY, FARM_MANAGER, VETERINARIAN, ACCOUNTANT, IOT_OPERATOR, OWNER",
  "ADMIN/OWNER get all permissions; unknown role → CUSTOMER",
  "requireAdmin() = admin:farm:read (misnamed, unused in APIs)",
]);
h3("Protected routes");
bullets([
  "Middleware: /account, /admin, /m/* — cookie presence only (no JWT verify)",
  "Layout guards: per-module hasPermission in admin layouts",
  "API: ~150+ routes use requireUser/requirePermission per handler",
]);

h2("5. Session & Cookies");
table(
  ["Cookie", "HttpOnly", "Secure", "SameSite", "MaxAge"],
  [
    ["ssd_access", "true", "prod", "lax", "15 min"],
    ["ssd_refresh", "true", "prod", "lax", "7d / 30d remember"],
  ],
  [90, 70, 60, 70, 245]
);

h2("6. Security");
table(
  ["Control", "Status", "Notes"],
  [
    ["CSRF", "Partial", "SameSite=lax only, no tokens"],
    ["XSS/CSP", "Partial", "unsafe-inline/eval in CSP"],
    ["Rate limiting", "Partial", "Auth routes only via securityGate"],
    ["Brute-force", "Yes", "Login lockout"],
    ["Password reset", "Yes", "SHA-256 hash, 15 min, revoke sessions"],
    ["2FA TOTP", "Yes", "API + login support"],
    ["Audit log", "Yes", "audit.ts"],
  ],
  [100, 70, 315]
);

doc.addPage();

h2("7. Multi-tenant Security");
bullets([
  "Resolved via host subdomain → x-tenant-slug header + ssd_tenant cookie",
  "assertTenantMember() on tenant admin APIs only",
  "withTenantScope() defined but NEVER called",
  "x-tenant-slug header spoofable on direct API calls",
  "Farm services often hardcode farmId: default",
]);

h2("8. Razorpay");
bullets([
  "Payment verify: HMAC SHA-256 with timingSafeEqual",
  "Webhook: src/app/api/payment/webhook/route.ts — signature verified",
  "Subscription auto-pay: partial — needs Razorpay Subscriptions on live account",
]);

h2("9. Feature Assessment");
table(
  ["Feature", "Status", "Prod Ready"],
  [
    ["Custom JWT auth", "Done", "Yes"],
    ["Credentials login", "Done", "Yes"],
    ["Refresh token DB", "Done", "Yes"],
    ["Auto client refresh", "Partial", "No"],
    ["Google OAuth", "Partial", "No"],
    ["Email verification", "Missing", "No"],
    ["Forgot/reset password", "Done", "Yes*"],
    ["RBAC 8 roles", "Done", "Yes"],
    ["CSRF", "Missing", "No"],
    ["Multi-tenant isolation", "Partial", "No"],
    ["Razorpay webhook HMAC", "Done", "Yes"],
  ],
  [180, 80, 225]
);
p("*Forgot password needs RESEND_API_KEY on Vercel production.");

h2("10. Final Score: 6.5 / 10");
h3("Strengths");
bullets([
  "JWT access + opaque DB refresh pattern",
  "HttpOnly cookies, bcrypt, brute-force, TOTP 2FA",
  "68-permission RBAC, secure password reset",
  "Razorpay webhook HMAC, auth rate limiting",
]);
h3("Missing for enterprise");
bullets([
  "Email verification enforced on login/sensitive actions",
  "Google OAuth login UI + app-wide token auto-refresh",
  "Refresh token rotation, CSRF tokens, middleware JWT verify",
  "Global API rate limits, multi-tenant row isolation",
  "Resend on Vercel, CSP hardening (remove unsafe-inline)",
  "ABAC ownership on orders/subscriptions; remove dead jwt refresh code",
]);

doc.moveDown(0.5);
doc
  .fillColor(colors.muted)
  .fontSize(8)
  .font("Helvetica-Oblique")
  .text(
    "Full markdown for ChatGPT: docs/AUTHENTICATION_AUTHORIZATION_AUDIT.md · Generated June 27, 2026",
    { align: "center" }
  );

doc.end();

stream.on("finish", () => {
  console.log(`PDF created: ${outPath}`);
});
