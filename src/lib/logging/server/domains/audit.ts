import "server-only";

import { createDomainChild } from "../core/domain-child";
import type { AuditLogMeta } from "../../shared/types";

const pino = createDomainChild("audit", "audit");

/**
 * Immutable-style audit trail — always info level, dedicated domain for SIEM ingestion.
 * Pair with `writeAudit()` in @/lib/security/audit for DB persistence.
 */
export const auditLogger = {
  record(action: string, meta?: Omit<AuditLogMeta, "action">) {
    pino().info(
      {
        action,
        severity: meta?.severity ?? "info",
        userId: meta?.userId,
        actorId: meta?.actorId,
        resource: meta?.resource,
        resourceId: meta?.resourceId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        ...stripAuditMeta(meta),
      },
      action
    );
  },
  security(action: string, meta?: Omit<AuditLogMeta, "action">) {
    pino().warn(
      {
        action,
        severity: meta?.severity ?? "warn",
        security: true,
        userId: meta?.userId,
        actorId: meta?.actorId,
        resource: meta?.resource,
        resourceId: meta?.resourceId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        ...stripAuditMeta(meta),
      },
      action
    );
  },
  critical(action: string, meta?: Omit<AuditLogMeta, "action">) {
    pino().error(
      {
        action,
        severity: "critical",
        userId: meta?.userId,
        actorId: meta?.actorId,
        resource: meta?.resource,
        resourceId: meta?.resourceId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        ...stripAuditMeta(meta),
      },
      action
    );
  },
};

function stripAuditMeta(meta?: Omit<AuditLogMeta, "action">): Record<string, unknown> {
  if (!meta) return {};
  const {
    severity: _s,
    userId: _u,
    actorId: _a,
    resource: _r,
    resourceId: _ri,
    ipAddress: _ip,
    userAgent: _ua,
    ...rest
  } = meta;
  return rest;
}
