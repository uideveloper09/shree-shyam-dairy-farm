/**
 * Audit domain logger — server-only.
 * @example import { auditLogger } from "@/lib/logging/audit"
 */
import "server-only";

export { auditLogger } from "./server/domains/audit";
export type { AuditLogMeta } from "./shared/types";
