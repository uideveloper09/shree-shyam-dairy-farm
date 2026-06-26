/**
 * Inventory repository — warehouse stock levels and movement history.
 */
import {
  InventoryMovementType,
  OrderStatus,
  PaymentStatus,
  type Prisma,
  type Warehouse,
} from "@prisma/client";
import { prisma } from "@/repositories/prisma";
import type { InsufficientStockItem, StockUpdateResult } from "@/services/inventory/types";
import { InsufficientInventoryError } from "@/services/inventory/types";

export type TransactionClient = Prisma.TransactionClient;

export interface OrderLineForInventory {
  productId: string;
  productName: string;
  quantity: number;
  currentStock: number;
}

/**
 * Returns the default active warehouse, creating one when missing.
 * Supports future multi-location expansion via additional warehouse rows.
 */
export async function getDefaultWarehouse(tx: TransactionClient): Promise<Warehouse> {
  const existing = await tx.warehouse.findFirst({
    where: { isDefault: true, isActive: true },
  });

  if (existing) {
    return existing;
  }

  return tx.warehouse.create({
    data: {
      code: "MAIN",
      name: "Main Warehouse",
      isDefault: true,
      isActive: true,
    },
  });
}

/**
 * Loads order line items with current product stock for validation.
 */
export async function getOrderLinesForInventory(
  tx: TransactionClient,
  orderId: string
): Promise<OrderLineForInventory[]> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: {
      quantity: true,
      productId: true,
      name: true,
      product: {
        select: {
          name: true,
          stockQty: true,
        },
      },
    },
  });

  return items.map((item) => ({
    productId: item.productId,
    productName: item.product.name || item.name,
    quantity: item.quantity,
    currentStock: item.product.stockQty,
  }));
}

/**
 * Returns whether inventory has already been processed for an order.
 */
export async function isOrderInventoryProcessed(
  tx: TransactionClient,
  orderId: string
): Promise<boolean> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { inventoryProcessedAt: true },
  });

  return Boolean(order?.inventoryProcessedAt);
}

/**
 * Atomically decrements stock for each order line, writes movement history,
 * and updates product availability. Rolls back entirely if any line fails.
 */
export async function decrementStockForOrder(
  tx: TransactionClient,
  orderId: string,
  warehouseId: string,
  warehouseCode: string
): Promise<StockUpdateResult[]> {
  const alreadyProcessed = await isOrderInventoryProcessed(tx, orderId);
  if (alreadyProcessed) {
    return getStockSnapshotForOrder(orderId);
  }

  const lines = await getOrderLinesForInventory(tx, orderId);
  if (lines.length === 0) {
    await tx.order.update({
      where: { id: orderId },
      data: { inventoryProcessedAt: new Date() },
    });
    return [];
  }

  const insufficient: InsufficientStockItem[] = [];
  const updates: StockUpdateResult[] = [];

  for (const line of lines) {
    const decrementResult = await tx.product.updateMany({
      where: {
        id: line.productId,
        stockQty: { gte: line.quantity },
      },
      data: {
        stockQty: { decrement: line.quantity },
      },
    });

    if (decrementResult.count === 0) {
      insufficient.push({
        productId: line.productId,
        productName: line.productName,
        requested: line.quantity,
        available: line.currentStock,
      });
      continue;
    }

    const product = await tx.product.findUniqueOrThrow({
      where: { id: line.productId },
      select: { stockQty: true, name: true },
    });

    const newStock = product.stockQty;
    const previousStock = newStock + line.quantity;

    await tx.product.update({
      where: { id: line.productId },
      data: { inStock: newStock > 0 },
    });

    await tx.inventoryLevel.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: line.productId,
        },
      },
      create: {
        warehouseId,
        productId: line.productId,
        quantity: newStock,
      },
      update: {
        quantity: newStock,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        warehouseId,
        productId: line.productId,
        orderId,
        type: InventoryMovementType.SALE,
        quantityChange: -line.quantity,
        quantityBefore: previousStock,
        quantityAfter: newStock,
        reason: "Order payment fulfillment",
      },
    });

    updates.push({
      productId: line.productId,
      productName: product.name,
      warehouseId,
      warehouseCode,
      quantitySold: line.quantity,
      previousStock,
      newStock,
      inStock: newStock > 0,
    });
  }

  if (insufficient.length > 0) {
    throw new InsufficientInventoryError(insufficient);
  }

  await tx.order.update({
    where: { id: orderId },
    data: { inventoryProcessedAt: new Date() },
  });

  return updates;
}

/**
 * Reads the latest stock snapshot for products in an order (post-fulfillment).
 */
export async function getStockSnapshotForOrder(orderId: string): Promise<StockUpdateResult[]> {
  const movements = await prisma.inventoryMovement.findMany({
    where: { orderId, type: InventoryMovementType.SALE },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, stockQty: true, inStock: true } },
      warehouse: { select: { id: true, code: true } },
    },
  });

  return movements.map((movement) => ({
    productId: movement.productId,
    productName: movement.product.name,
    warehouseId: movement.warehouseId,
    warehouseCode: movement.warehouse.code,
    quantitySold: Math.abs(movement.quantityChange),
    previousStock: movement.quantityBefore,
    newStock: movement.quantityAfter,
    inStock: movement.product.inStock,
  }));
}

/**
 * Cancels an order when inventory cannot be fulfilled after payment verification.
 * Restores payment status so the order can be retried or refunded manually.
 */
export async function cancelOrderDueToInsufficientStock(orderId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.PENDING,
      cancelledAt: new Date(),
    },
  });
}
