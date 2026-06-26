import type { IntegrationPluginHandler, PluginContext } from "@/modules/integrations/types";
import { prisma } from "@/repositories/prisma";

const RUNTIME_PLUGINS = new Map<string, IntegrationPluginHandler>();

export function registerPlugin(handler: IntegrationPluginHandler) {
  RUNTIME_PLUGINS.set(handler.slug, handler);
}

export async function loadPluginsFromDb() {
  const rows = await prisma.integrationPlugin.findMany({ where: { isEnabled: true } });
  return rows;
}

export async function invokePlugin(slug: string, hook: string, ctx: PluginContext) {
  const runtime = RUNTIME_PLUGINS.get(slug);
  if (runtime) {
    if (!runtime.hooks.includes(hook) && !runtime.hooks.includes("*")) {
      throw new Error(`Hook ${hook} not registered on plugin ${slug}`);
    }
    return runtime.execute(hook, ctx);
  }

  const dbPlugin = await prisma.integrationPlugin.findUnique({ where: { slug } });
  if (!dbPlugin?.isEnabled) throw new Error(`Plugin ${slug} not found or disabled`);

  return {
    slug,
    hook,
    executed: true,
    message: `Plugin ${dbPlugin.entryPoint} invoked (DB-registered)`,
    ctx,
  };
}

export async function listPlugins() {
  const db = await prisma.integrationPlugin.findMany({ orderBy: { name: "asc" } });
  const runtime = [...RUNTIME_PLUGINS.values()].map((p) => ({
    slug: p.slug,
    name: p.name,
    version: p.version,
    provider: p.provider,
    hooks: p.hooks,
    source: "runtime" as const,
  }));
  return {
    runtime,
    registered: db.map((p) => ({
      slug: p.slug,
      name: p.name,
      version: p.version,
      provider: p.provider,
      hooks: p.hooks,
      isEnabled: p.isEnabled,
      source: "database" as const,
    })),
  };
}

// Built-in plugins
registerPlugin({
  slug: "order-shiprocket",
  name: "Auto Shiprocket on Order",
  version: "1.0.0",
  provider: "SHIPROCKET",
  hooks: ["order.paid"],
  execute: async (hook, ctx) => {
    if (hook !== "order.paid") return null;
    const { createShiprocketOrder } = await import("@/modules/integrations/providers/shiprocket");
    return createShiprocketOrder({
      orderNumber: String(ctx.payload?.orderNumber || ""),
      customerName: String(ctx.payload?.customerName || ""),
      address: String(ctx.payload?.address || ""),
      pincode: String(ctx.payload?.pincode || ""),
      weightKg: Number(ctx.payload?.weightKg || 1),
    });
  },
});

registerPlugin({
  slug: "invoice-tally",
  name: "Export Invoice to Tally",
  version: "1.0.0",
  provider: "TALLY",
  hooks: ["order.paid", "invoice.created"],
  execute: async (_hook, ctx) => {
    const { exportInvoiceToTally } = await import("@/modules/integrations/providers/tally");
    return exportInvoiceToTally(ctx.payload || {});
  },
});

registerPlugin({
  slug: "analytics-ga",
  name: "GA4 Purchase Event",
  version: "1.0.0",
  provider: "GOOGLE_ANALYTICS",
  hooks: ["order.paid"],
  execute: async (_hook, ctx) => ({
    event: "purchase",
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    payload: ctx.payload,
  }),
});
