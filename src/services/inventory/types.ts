/**
 * Inventory domain types.
 */

/** Per-product stock change after order fulfillment. */
export interface StockUpdateResult {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseCode: string;
  quantitySold: number;
  previousStock: number;
  newStock: number;
  inStock: boolean;
}

/** Item that could not be fulfilled due to insufficient stock. */
export interface InsufficientStockItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

/** Thrown when order lines exceed available inventory. */
export class InsufficientInventoryError extends Error {
  readonly items: InsufficientStockItem[];

  constructor(items: InsufficientStockItem[]) {
    super("Insufficient stock for one or more products");
    this.name = "InsufficientInventoryError";
    this.items = items;
  }
}

/** Result of inventory fulfillment for a paid order. */
export interface OrderInventoryFulfillmentResult {
  inventoryUpdated: boolean;
  stockUpdates: StockUpdateResult[];
}
