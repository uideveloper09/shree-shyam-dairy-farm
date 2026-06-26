import { nanoid } from "nanoid";
import { prisma } from "@/repositories/prisma";
import { hashOtp } from "@/lib/security/encryption";
import { TOKEN_TTL } from "@/constants/auth";
import { logger } from "@/lib/ops/logger";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSms(phone: string, code: string): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (authKey && templateId) {
    try {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: { authkey: authKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          recipients: [{ mobiles: `91${phone}`, var: code }],
        }),
      });
      return res.ok;
    } catch (err) {
      logger.error("otp_sms_failed", { phone, error: (err as Error).message });
      return false;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    logger.info("otp_dev_code", { phone, code });
    return true;
  }

  return false;
}

export async function createOtp(phone: string, purpose: string, userId?: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + TOKEN_TTL.otp * 1000);

  await prisma.otpCode.create({
    data: {
      phone,
      code: hashOtp(code),
      purpose,
      userId,
      expiresAt,
    },
  });

  await sendSms(phone, code);
  return { expiresAt, devCode: process.env.NODE_ENV !== "production" ? code : undefined };
}

export async function verifyOtp(phone: string, code: string, purpose: string) {
  const hashed = hashOtp(code);
  const record = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.code !== hashed) {
    return { valid: false as const };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { valid: true as const, userId: record.userId };
}

export async function createEmailToken(userId: string, purpose: string, hours = 1) {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.emailToken.create({
    data: { userId, token, purpose, expiresAt },
  });

  return token;
}

export async function consumeEmailToken(token: string, purpose: string) {
  const record = await prisma.emailToken.findFirst({
    where: { token, purpose, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) return null;

  await prisma.emailToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}
