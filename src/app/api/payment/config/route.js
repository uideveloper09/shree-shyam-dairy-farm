import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const configured =
    Boolean(keyId) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    !keyId.includes("your_key") &&
    keyId.startsWith("rzp_");

  return NextResponse.json({
    configured,
    keyId: configured ? keyId : null,
  });
}
