/**
 * In-process pub/sub for admin payment dashboard live refresh.
 * SSE subscribers refetch metrics when a payment is persisted successfully.
 */
import { EventEmitter } from "node:events";

export interface PaymentDashboardRefreshEvent {
  orderId: string;
  at: number;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

const EVENT_NAME = "payment-dashboard-refresh";

export function publishPaymentDashboardRefresh(
  payload: Omit<PaymentDashboardRefreshEvent, "at"> & { at?: number }
): void {
  const event: PaymentDashboardRefreshEvent = {
    orderId: payload.orderId,
    at: payload.at ?? Date.now(),
  };
  emitter.emit(EVENT_NAME, event);
}

export function subscribePaymentDashboardRefresh(
  listener: (event: PaymentDashboardRefreshEvent) => void
): () => void {
  emitter.on(EVENT_NAME, listener);
  return () => emitter.off(EVENT_NAME, listener);
}
