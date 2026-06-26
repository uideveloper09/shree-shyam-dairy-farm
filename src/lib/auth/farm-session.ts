import { NextResponse } from "next/server";
import { requireUser, type AuthUser } from "@/lib/auth/session";
import { FARM_OPERATOR_ROLES } from "@/lib/farm/types";

export function isFarmOperator(user: AuthUser): boolean {
  return FARM_OPERATOR_ROLES.includes(user.role as (typeof FARM_OPERATOR_ROLES)[number]);
}

export async function requireFarmOperator() {
  const result = await requireUser();
  if (result.error) return result;
  if (!isFarmOperator(result.user!)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export async function requireAdminOrFarmManager() {
  const result = await requireUser();
  if (result.error) return result;
  const role = result.user!.role;
  if (!["ADMIN", "OWNER", "FARM_MANAGER"].includes(role)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
