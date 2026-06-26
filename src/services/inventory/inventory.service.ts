/**
 * Inventory service — business logic for post-payment stock fulfillment.
 */
import { paymentLogger } from "@/lib/logging/payment";
import {
  decrementStockForOrder,
  getDefaultWarehouse,
  getStockSnapshotForOrder,
  isOrderInventoryProcessed,
} from "@/repositories/inventory.repository";
import type { TransactionClient } from "@/repositories/inventory.repository";
import { prisma } from "@/repositories/prisma";
import type { OrderInventoryFulfillmentResult } from "./types";

export type {
  InsufficientInventoryError,
  InsufficientStockItem,
  OrderInventoryFulfillmentResult,
  StockUpdateResult,
} from "./types";

/**
 * Fulfills inventory for a paid order inside an existing database transaction.
 * Must run before or with payment persistence so the whole unit rolls back on failure.
 */
export async function fulfillOrderInventoryInTransaction(
  tx: TransactionClient,
  orderId: string
): Promise<OrderInventoryFulfillmentResult> {
  const warehouse = await getDefaultWarehouse(tx);

  const stockUpdates = await decrementStockForOrder(tx, orderId, warehouse.id, warehouse.code);

  paymentLogger.info("order_inventory_fulfilled", {
    provider: "inventory",
    action: "decrement_stock",
    orderId,
    status: "completed",
  });

  return {
    inventoryUpdated: stockUpdates.length > 0 || (await isOrderInventoryProcessed(tx, orderId)),
    stockUpdates,
  };
}

/**
 * Fulfills inventory for an already-paid order (idempotent retry path).
 */
export async function fulfillOrderInventoryIfNeeded(
  orderId: string
): Promise<OrderInventoryFulfillmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { inventoryProcessedAt: true },
  });

  if (!order) {
    return { inventoryUpdated: false, stockUpdates: [] };
  }

  if (order.inventoryProcessedAt) {
    return {
      inventoryUpdated: true,
      stockUpdates: await getStockSnapshotForOrder(orderId),
    };
  }

  try {
    return await prisma.$transaction(async (tx) => fulfillOrderInventoryInTransaction(tx, orderId));
  } catch (error) {
    paymentLogger.failed({
      provider: "inventory",
      action: "decrement_stock",
      orderId,
      error,
    });
    throw error;
  }
}
