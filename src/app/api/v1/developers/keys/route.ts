import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/repositories/prisma";
import {
  createApiKey,
  getOrCreateDeveloperAccount,
  revokeApiKey,
} from "@/services/api/developer.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  return NextResponse.json({
    keys: account.apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      rateLimit: k.rateLimit,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : undefined;
  const { key, record } = await createApiKey(account.id, name, scopes);

  return NextResponse.json({
    key,
    apiKey: {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      scopes: record.scopes,
      rateLimit: record.rateLimit,
    },
    warning: "Store this key securely. It will not be shown again.",
  });
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const keyId = typeof body.id === "string" ? body.id : "";
  if (!keyId) {
    return NextResponse.json({ error: "Key id required" }, { status: 400 });
  }

  const account = await getOrCreateDeveloperAccount(auth.user!.id);
  const result = await revokeApiKey(account.id, keyId);

  return NextResponse.json({ revoked: result.count > 0 });
}
