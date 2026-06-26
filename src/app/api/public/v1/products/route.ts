import { withPublicApi, publicJson } from "@/lib/api/public-handler";
import { listPublicProducts } from "@/services/api/public.service";

export const dynamic = "force-dynamic";

export const GET = withPublicApi(
  async (request) => {
    const url = new URL(request.url);
    const products = await listPublicProducts({
      category: url.searchParams.get("category") || undefined,
      limit: Number(url.searchParams.get("limit") || 50),
      offset: Number(url.searchParams.get("offset") || 0),
    });
    return publicJson(products);
  },
  { scope: "read:products" }
);
