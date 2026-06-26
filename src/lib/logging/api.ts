/**
 * API domain logger — server-only.
 * @example import { apiLogger } from "@/lib/logging/api"
 */
import "server-only";

export { apiLogger } from "./server/domains/api";
export type { LogMeta, RequestLogMeta } from "./shared/types";
