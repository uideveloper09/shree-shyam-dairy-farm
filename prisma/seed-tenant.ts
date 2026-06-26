import { ensureDefaultTenant } from "@/lib/tenant/isolation";

async function main() {
  const tenant = await ensureDefaultTenant();
  console.log("Default tenant ready:", tenant.slug, tenant.plan);
}

main().catch(console.error);
