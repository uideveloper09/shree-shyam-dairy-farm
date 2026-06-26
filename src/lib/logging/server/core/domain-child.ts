import "server-only";

import type { Logger as PinoLogger } from "pino";
import { getRootPinoLogger } from "./pino-factory";
import type { LogDomain } from "../../shared/types";

/** Returns a lazy Pino child scoped to a logging domain. */
export function createDomainChild(domain: LogDomain, logType?: string): () => PinoLogger {
  const type = logType ?? domain;
  return () => getRootPinoLogger().child({ domain, logType: type });
}
