import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sectionId = searchParams.get("section");
  const idsParam = searchParams.get("ids");

  const ids = idsParam
    ? idsParam.split(",").map((id) => Number(id.trim())).filter(Boolean)
    : undefined;

  const products = await getProducts({
    category: category || undefined,
    sectionId: sectionId || undefined,
    ids,
  });

  return NextResponse.json({ products });
}
