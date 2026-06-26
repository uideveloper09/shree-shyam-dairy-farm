import { withPublicApi, publicJson } from "@/lib/api/public-handler";
import { listWebhookDeliveries } from "@/services/api/developer.service";

export const dynamic = "force-dynamic";

export const GET = withPublicApi(
  async (request, { apiKey }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || 20);
    const deliveries = await listWebhookDeliveries(apiKey.developerId, limit);
    return publicJson(deliveries);
  },
  { scope: "read:webhooks" }
);
