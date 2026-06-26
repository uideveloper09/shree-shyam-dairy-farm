import "server-only";

import { createDomainChild } from "../core/domain-child";
import { serializeError } from "../../shared/serialize";
import type { LogMeta } from "../../shared/types";

const pino = createDomainChild("error", "error");

export type ErrorLogContext = LogMeta & {
  method?: string;
  path?: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  digest?: string;
  sentry?: boolean;
};

export const errorLogger = {
  log(message: string, error: unknown, context?: ErrorLogContext) {
    pino().error({ err: serializeError(error), ...context }, message);
  },
  unhandled(error: unknown, context?: ErrorLogContext) {
    pino().error({ err: serializeError(error), unhandled: true, ...context }, "unhandled_error");
  },
  api(error: unknown, context?: ErrorLogContext) {
    pino().error({ err: serializeError(error), source: "api", ...context }, "api_error");
  },
  worker(error: unknown, context?: ErrorLogContext) {
    pino().error({ err: serializeError(error), source: "worker", ...context }, "worker_error");
  },
  external(service: string, error: unknown, context?: ErrorLogContext) {
    pino().error(
      { err: serializeError(error), source: "external", service, ...context },
      "external_service_error"
    );
  },
  warn(message: string, error: unknown, context?: ErrorLogContext) {
    pino().warn({ err: serializeError(error), ...context }, message);
  },
};
