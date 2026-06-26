export {
  fulfillOrderInventoryIfNeeded,
  fulfillOrderInventoryInTransaction,
} from "./inventory.service";
export {
  InsufficientInventoryError,
  type InsufficientStockItem,
  type OrderInventoryFulfillmentResult,
  type StockUpdateResult,
} from "./types";
