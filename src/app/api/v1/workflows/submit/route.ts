import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  submitExpenseRequest,
  submitPurchaseRequest,
  submitLeaveRequest,
  submitRefundRequest,
  submitSubscriptionApproval,
} from "@/services/workflows/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission("workflows:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const type = body.type as string;

  try {
    let result;
    switch (type) {
      case "EXPENSE":
        result = await submitExpenseRequest(auth.user!.id, body);
        break;
      case "PURCHASE":
        result = await submitPurchaseRequest(auth.user!.id, body);
        break;
      case "LEAVE":
        result = await submitLeaveRequest(auth.user!.id, body);
        break;
      case "REFUND":
        result = await submitRefundRequest(auth.user!.id, body);
        break;
      case "SUBSCRIPTION":
        result = await submitSubscriptionApproval(auth.user!.id, body);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
