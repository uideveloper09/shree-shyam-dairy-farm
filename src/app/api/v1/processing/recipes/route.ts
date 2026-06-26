import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { createRecipe, listRecipes } from "@/services/processing/service";
import type { ProcProductType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("processing:read");
  if (auth.error) return auth.error;

  const type = new URL(request.url).searchParams.get("productType") as ProcProductType | null;
  const recipes = await listRecipes(undefined, type ?? undefined);
  return NextResponse.json({ recipes });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:processing:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name || !body.productType || body.yieldQty == null) {
    return NextResponse.json({ error: "name, productType, yieldQty required" }, { status: 400 });
  }

  const recipe = await createRecipe(undefined, body);
  return NextResponse.json(recipe, { status: 201 });
}
