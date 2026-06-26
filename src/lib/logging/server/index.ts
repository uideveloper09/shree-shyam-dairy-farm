import "server-only";

export type { LogLevel } from "@/config/logging";
export type {
  AuditLogMeta,
  DatabaseLogMeta,
  LogDomain,
  LogMeta,
  PaymentLogMeta,
  RequestLogMeta,
  SerializedError,
} from "../shared/types";
export type { ErrorLogContext } from "./domains/error";

export { LOG_REDACT_CENSOR, LOG_REDACT_PATHS } from "../shared/redact";
export { serializeError } from "../shared/serialize";

export {
  createRotatableDestination,
  reopenAllLogDestinations,
  registerRotationSignalHandlers,
  clearRotatableDestinationsForTests,
} from "./core/rotation";

export {
  createRootPinoLogger,
  getRootPinoLogger,
  getLoggingRuntimeConfig,
  resetRootPinoLogger,
} from "./core/pino-factory";

export { createLogger, getLogger, resetLoggerCache, type AppLogger } from "./core/logger";
export { createDomainChild } from "./core/domain-child";

export { apiLogger } from "./domains/api";
export { auditLogger } from "./domains/audit";
export { paymentLogger } from "./domains/payment";
export { databaseLogger } from "./domains/database";
export { requestLogger } from "./domains/request";
export { errorLogger } from "./domains/error";

import { getLogger } from "./core/logger";
import { apiLogger } from "./domains/api";
import { auditLogger } from "./domains/audit";
import { paymentLogger } from "./domains/payment";
import { databaseLogger } from "./domains/database";
import { requestLogger } from "./domains/request";
import { errorLogger } from "./domains/error";

/** Unified enterprise logging facade (server-only). */
export const logging = {
  app: getLogger,
  api: apiLogger,
  audit: auditLogger,
  database: databaseLogger,
  payment: paymentLogger,
  request: requestLogger,
  error: errorLogger,
} as const;
