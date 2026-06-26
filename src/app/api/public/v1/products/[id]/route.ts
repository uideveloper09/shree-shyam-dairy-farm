import { NextResponse } from "next/server";
import { withPublicApi, publicJson } from "@/lib/api/public-handler";
import { getPublicProduct } from "@/services/api/public.service";

export const dynamic = "force-dynamic";

export const GET = withPublicApi(
  async (_request, { params }) => {
    const { id } = await params!;
    const product = await getPublicProduct(id);
    if (!product) {
      return NextResponse.json(
        { error: "not_found", message: "Product not found" },
        { status: 404 }
      );
    }
    return publicJson(product);
  },
  { scope: "read:products" }
);
