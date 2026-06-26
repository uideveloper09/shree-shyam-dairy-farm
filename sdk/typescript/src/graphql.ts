/**
 * GraphQL client for Shree Shyam Dairy Farm integrations API.
 * Usage: POST /api/graphql with { query, variables }
 */
export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export class ShreeShyamGraphQLClient {
  constructor(private baseUrl: string) {}

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return res.json() as Promise<GraphQLResponse<T>>;
  }

  async integrationCatalog() {
    return this.query<{ integrationCatalog: { id: string; name: string; configured: boolean }[] }>(
      `{ integrationCatalog { id name configured } }`
    );
  }

  async products(limit = 10) {
    return this.query<{ products: { id: string; name: string; price: number }[] }>(
      `{ products(limit: ${limit}) { id name price } }`
    );
  }
}
