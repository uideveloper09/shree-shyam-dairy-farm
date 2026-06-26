import { getProviderCatalog } from "@/modules/integrations/registry";
import { prisma } from "@/repositories/prisma";
import { isDatabaseConfigured } from "@/repositories/prisma";

export const GRAPHQL_SCHEMA = `
type Query {
  integrationCatalog: [Integration!]!
  products(limit: Int): [Product!]!
  health: Health!
}

type Integration {
  id: String!
  name: String!
  category: String!
  configured: Boolean!
}

type Product {
  id: String!
  name: String!
  slug: String!
  price: Float!
  category: String
}

type Health {
  status: String!
  integrations: Int!
}
`;

export async function executeGraphQL(
  query: string,
  _variables?: Record<string, unknown>
): Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }> {
  const q = query.replace(/\s+/g, " ").trim();

  if (q.includes("integrationCatalog")) {
    const catalog = getProviderCatalog();
    return {
      data: {
        integrationCatalog: catalog.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          configured: c.status.configured,
        })),
      },
    };
  }

  if (q.includes("health")) {
    const catalog = getProviderCatalog();
    return {
      data: {
        health: {
          status: "ok",
          integrations: catalog.length,
        },
      },
    };
  }

  if (q.includes("products")) {
    if (!isDatabaseConfigured()) {
      return { data: { products: [] } };
    }
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: { select: { name: true } },
      },
    });
    return {
      data: {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          category: p.category?.name,
        })),
      },
    };
  }

  return {
    errors: [{ message: "Unsupported query. Try integrationCatalog, products, or health." }],
  };
}
