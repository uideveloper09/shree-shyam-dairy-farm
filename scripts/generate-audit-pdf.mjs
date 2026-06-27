import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "docs", "RAZORPAY_INTEGRATION_AUDIT.pdf");

const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const colors = {
  title: "#082F63",
  heading: "#0B3D7A",
  accent: "#C89B3C",
  body: "#333333",
  muted: "#666666",
};

function title(text) {
  doc.fillColor(colors.title).fontSize(22).font("Helvetica-Bold").text(text, { align: "center" });
  doc.moveDown(0.5);
}

function meta(text) {
  doc.fillColor(colors.muted).fontSize(10).font("Helvetica").text(text, { align: "center" });
  doc.moveDown(1);
}

function h2(text) {
  doc.moveDown(0.5);
  doc.fillColor(colors.heading).fontSize(14).font("Helvetica-Bold").text(text);
  doc.moveDown(0.3);
}

function h3(text) {
  doc.fillColor(colors.heading).fontSize(11).font("Helvetica-Bold").text(text);
  doc.moveDown(0.2);
}

function p(text) {
  doc.fillColor(colors.body).fontSize(10).font("Helvetica").text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bullet(items) {
  doc.fillColor(colors.body).fontSize(10).font("Helvetica");
  for (const item of items) {
    doc.text(`  •  ${item}`, { lineGap: 2 });
  }
  doc.moveDown(0.3);
}

function table(headers, rows) {
  const colWidth = (doc.page.width - 100) / headers.length;
  let y = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.heading);
  headers.forEach((h, i) => doc.text(h, 50 + i * colWidth, y, { width: colWidth - 5 }));
  y += 16;
  doc.font("Helvetica").fontSize(9).fillColor(colors.body);
  for (const row of rows) {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    row.forEach((cell, i) => doc.text(String(cell), 50 + i * colWidth, y, { width: colWidth - 5 }));
    y += 14;
  }
  doc.y = y + 8;
}

// Cover
title("Razorpay Integration Audit");
meta("Shree Shyam Dairy Farm · June 27, 2026");
meta("Next.js 16 · TypeScript · Vercel · Neon PostgreSQL");
doc.moveDown(0.5);
p("Overall completion: ~82% — Steps 1–6 implemented and deployed on production.");

h2("Executive Summary");
p(
  "Razorpay integration Steps 1–6 are implemented and deployed. Create-order, verify, checkout UI, payment persistence, inventory, notifications, and webhook routes all exist. Main gaps: no confirmed live payment in DB yet, webhook Dashboard registration unverified, public /test-payment page should be removed after testing."
);

h2("1. Environment Variables");
table(
  ["Variable", "Status", "Usage"],
  [
    ["NEXT_PUBLIC_RAZORPAY_KEY_ID", "Configured", "Public key, checkout popup"],
    ["RAZORPAY_KEY_SECRET", "Configured", "Server-only, verify & create-order"],
    ["RAZORPAY_WEBHOOK_SECRET", "Configured", "Webhook signature verification"],
  ]
);
bullet([
  "Production /api/payment/config returns configured: true, live key rzp_live_...",
  "Secret never exposed in API responses",
  "Zod validation in src/config/payment.ts",
]);

h2("2. Razorpay SDK");
bullet([
  "Package: razorpay@^2.9.6 in package.json",
  "Client: src/lib/razorpay.ts with server-only guard",
  "Singleton with HMR-safe caching",
]);

h2("3. Create Order API");
p("Path: src/app/api/payment/create-order/route.ts");
bullet([
  "Validates amount > 0, currency, receipt",
  "INR major unit to paise conversion",
  "Production tested — returns Razorpay order ID",
  "Links internal DB order to razorpayOrderId",
]);

h2("4. Frontend Checkout");
table(
  ["Component", "Path", "Status"],
  [
    ["Cart modal", "PaymentCheckoutModal.jsx", "Active"],
    ["Reusable", "RazorpayCheckout.tsx", "Active"],
    ["Test page", "/test-payment", "Deployed"],
  ]
);
p("Flow: checkout → config → create-order → checkout.js → popup → verify");

h2("5. Payment Verification");
p("Path: src/app/api/payment/verify/route.ts");
bullet([
  "HMAC SHA-256 with timingSafeEqual",
  "Persists payment, marks order PAID",
  "Inventory, invoice, notifications",
  "Idempotent duplicate payment handling",
]);

h2("6. Webhook");
p("Path: src/app/api/payment/webhook/route.ts");
bullet([
  "Raw body + x-razorpay-signature verification",
  "Events: payment.*, order.paid, refund.*",
  "Production: GET → 405, POST without sig → 401 (route exists)",
  "404 was from old deployment before route existed",
]);
p("Register URL: https://shree-shyam-dairy-farm.vercel.app/api/payment/webhook");

doc.addPage();

h2("Completed");
bullet([
  "All 3 env vars on Vercel",
  "SDK singleton (src/lib/razorpay.ts)",
  "Create Order API (TS, validated, prod-tested)",
  "Frontend checkout (modal, component, test page)",
  "Verification (HMAC + persistence + inventory)",
  "Webhook (signature, events, idempotency)",
  "Database (Neon, 5 migrations)",
  "Production deploy on main branch",
]);

h2("Partially Completed");
bullet([
  "Legacy JS routes (config, upi-qr, qr-status) not migrated",
  "Duplicate SDK client (razorpayServer.js)",
  "Dual checkout paths (tsx vs js utility)",
  "0 Payment rows in DB — no live payment confirmed",
  "No payment route integration tests",
  "No rate limiting on payment APIs",
]);

h2("Missing");
bullet([
  "Payment E2E / integration tests",
  "Razorpay Dashboard webhook registration confirmed",
  "Customer order history UI",
  "Rate limiting on /api/payment/*",
  "CI gate on deploy",
  "Remove /test-payment after testing",
]);

h2("Bugs");
table(
  ["Severity", "Issue"],
  [
    ["Medium", "No completed payments in DB despite pending orders"],
    ["Low", "Dual checkout implementations (drift risk)"],
    ["Low", "Client estimatedTotal trusted for order total"],
  ]
);

h2("Security Issues");
table(
  ["Severity", "Issue"],
  [
    ["High", "Public /test-payment allows live ₹1 charges"],
    ["Medium", "No rate limit on create-order"],
    ["Medium", "Client-supplied amount in verify"],
    ["Low", "Legacy razorpayServer.js without server-only"],
  ]
);

h2("Deployment Issues");
bullet([
  "Webhook 404 was stale deploy — now live (401/405)",
  "Register webhook URL + secret in Razorpay Dashboard",
  "CI tests red; deploy not gated",
]);

h2("Production Readiness Scores");
table(
  ["Dimension", "Score /10"],
  [
    ["Environment", "8.5"],
    ["SDK", "8.5"],
    ["Create Order API", "9.0"],
    ["Checkout", "8.5"],
    ["Verification", "9.0"],
    ["Webhook", "7.5"],
    ["Deployment", "8.0"],
    ["Security", "7.0"],
    ["Code Quality", "7.5"],
    ["Overall", "~82%"],
  ]
);

h2("Next Steps (P0 Critical)");
bullet([
  "Complete ₹1 live payment test via /test-payment",
  "Register webhook in Razorpay Dashboard",
  "Verify webhook delivery returns 200",
  "Remove or protect /test-payment page",
]);

doc.moveDown(1);
doc
  .fillColor(colors.muted)
  .fontSize(9)
  .font("Helvetica-Oblique")
  .text("Generated June 27, 2026 — Shree Shyam Dairy Farm · Read-only audit, no code modified.", {
    align: "center",
  });

doc.end();

stream.on("finish", () => {
  console.log(`PDF created: ${outPath}`);
});
