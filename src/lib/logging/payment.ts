/**
 * Payment domain logger — server-only.
 * @example import { paymentLogger } from "@/lib/logging/payment"
 */
import "server-only";

export { paymentLogger } from "./server/domains/payment";
export type { PaymentLogMeta } from "./shared/types";
