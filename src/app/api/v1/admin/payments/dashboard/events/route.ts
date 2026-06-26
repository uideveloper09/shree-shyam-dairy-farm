import { requirePermission } from "@/lib/auth/session";
import {
  subscribePaymentDashboardRefresh,
  type PaymentDashboardRefreshEvent,
} from "@/lib/payment/dashboard-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/v1/admin/payments/dashboard/events
 * Server-Sent Events stream — pushes refresh signals after successful payments.
 */
export async function GET() {
  const auth = await requirePermission("admin:ecommerce:read");
  if (auth.error) return auth.error;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: PaymentDashboardRefreshEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "refresh", ...event })}\n\n`)
        );
      };

      unsubscribe = subscribePaymentDashboardRefresh(send);

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25_000);

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", at: Date.now() })}\n\n`)
      );
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
