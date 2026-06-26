import { NextResponse } from "next/server";
import { withPublicApi, publicJson } from "@/lib/api/public-handler";
import { getPublicOrder } from "@/services/api/public.service";

export const dynamic = "force-dynamic";

export const GET = withPublicApi(
  async (_request, { params }) => {
    const { orderNumber } = await params!;
    const order = await getPublicOrder(orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: "not_found", message: "Order not found" },
        { status: 404 }
      );
    }
    return publicJson(order);
  },
  { scope: "read:orders" }
);
