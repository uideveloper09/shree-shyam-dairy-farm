import { NextResponse } from "next/server";
import { executeGraphQL, GRAPHQL_SCHEMA } from "@/modules/integrations/graphql/handler";
import { rateLimit } from "@/lib/ops/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    graphql: true,
    endpoint: "/api/graphql",
    schema: GRAPHQL_SCHEMA.trim(),
    note: "POST with { query, variables } — also use REST at /api/public/v1",
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rl = await rateLimit(`graphql:${ip}`, 60, 60);
  if (!rl.success) {
    return NextResponse.json({ errors: [{ message: "Rate limit exceeded" }] }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const query = body.query as string;
  if (!query) {
    return NextResponse.json({ errors: [{ message: "query required" }] }, { status: 400 });
  }

  const result = await executeGraphQL(query, body.variables);
  return NextResponse.json(result);
}
