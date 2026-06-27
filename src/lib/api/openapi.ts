import { CURRENT_API_VERSION } from "@/lib/api/versioning";
import { API_SCOPES, WEBHOOK_EVENTS } from "@/lib/api/scopes";
import { getSiteUrl, getPublicApiBaseUrl } from "@/lib/site-url";

export function buildOpenApiSpec() {
  const siteUrl = getSiteUrl();
  const apiBaseUrl = getPublicApiBaseUrl();
  return {
    openapi: "3.1.0",
    info: {
      title: "Kunwar Dairy Public API",
      version: CURRENT_API_VERSION,
      description:
        "REST API for products, orders, subscriptions, and webhooks. Authenticate with `Authorization: Bearer ssd_live_...`",
      contact: {
        name: "API Support",
        url: `${siteUrl}/developers`,
        email: "api@shreeshyamdairyfarm.com",
      },
      license: { name: "Proprietary" },
    },
    servers: [{ url: apiBaseUrl, description: "Production API v1 (same-origin App Router)" }],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    tags: [
      { name: "Products", description: "Product catalog" },
      { name: "Orders", description: "Order lookup" },
      { name: "Account", description: "Developer account" },
      { name: "Webhooks", description: "Webhook deliveries" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description: "API key prefixed with ssd_live_ or ssd_test_",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            unit: { type: "string" },
            inStock: { type: "boolean" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string" },
            orderNumber: { type: "string" },
            status: { type: "string" },
            total: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
      headers: {
        RateLimitLimit: { schema: { type: "integer" }, description: "Requests allowed per minute" },
        RateLimitRemaining: { schema: { type: "integer" } },
        ApiVersion: { schema: { type: "string" }, description: "API version" },
      },
    },
    paths: {
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List products",
          operationId: "listProducts",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": {
              description: "Product list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "429": { description: "Rate limited" },
          },
        },
      },
      "/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get product by ID or slug",
          operationId: "getProduct",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Product",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/orders/{orderNumber}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by order number",
          operationId: "getOrder",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "orderNumber", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Order",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Order" } },
                  },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/me": {
        get: {
          tags: ["Account"],
          summary: "Get API key & developer account info",
          operationId: "getMe",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Account info" } },
        },
      },
      "/webhooks/deliveries": {
        get: {
          tags: ["Webhooks"],
          summary: "List webhook delivery logs",
          operationId: "listWebhookDeliveries",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 20 } }],
          responses: { "200": { description: "Delivery logs" } },
        },
      },
    },
    "x-scopes": API_SCOPES,
    "x-webhook-events": WEBHOOK_EVENTS,
  };
}
