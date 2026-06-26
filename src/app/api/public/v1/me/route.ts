import { withPublicApi, publicJson } from "@/lib/api/public-handler";
import { prisma } from "@/repositories/prisma";

export const dynamic = "force-dynamic";

export const GET = withPublicApi(
  async (_request, { apiKey }) => {
    const developer = await prisma.developerAccount.findUnique({
      where: { id: apiKey.developerId },
      select: { id: true, company: true, tier: true, createdAt: true },
    });

    return publicJson({
      keyPrefix: apiKey.keyPrefix,
      tier: apiKey.tier,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      developer,
    });
  },
  { scope: "read:account" }
);
