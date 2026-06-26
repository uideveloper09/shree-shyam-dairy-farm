import { hasPermission, type Permission } from "@/lib/security/permissions";

export type AbacContext = {
  actorId: string;
  actorRole: string;
  resource?: string;
  resourceId?: string;
  resourceOwnerId?: string;
  action: string;
  attributes?: Record<string, string | number | boolean | null>;
};

export type AbacResult = { allowed: boolean; reason?: string };

/** Attribute-based access control — extends RBAC with ownership and context rules */
export function evaluateAbac(ctx: AbacContext, requiredPermission: Permission): AbacResult {
  if (!hasPermission(ctx.actorRole, requiredPermission)) {
    return { allowed: false, reason: "missing_permission" };
  }

  if (ctx.resourceOwnerId && ctx.resourceOwnerId !== ctx.actorId) {
    const canManageOthers = hasPermission(ctx.actorRole, "admin:users:write");
    if (!canManageOthers) {
      return { allowed: false, reason: "not_resource_owner" };
    }
  }

  if (ctx.attributes?.sensitive === true) {
    const elevated = ["ADMIN", "OWNER"].includes(ctx.actorRole);
    if (!elevated) {
      return { allowed: false, reason: "sensitive_resource" };
    }
  }

  if (ctx.attributes?.environment === "production" && ctx.action === "delete") {
    if (!["ADMIN", "OWNER"].includes(ctx.actorRole)) {
      return { allowed: false, reason: "production_delete_denied" };
    }
  }

  return { allowed: true };
}

export function authorize(ctx: AbacContext, permission: Permission): AbacResult {
  return evaluateAbac(ctx, permission);
}
