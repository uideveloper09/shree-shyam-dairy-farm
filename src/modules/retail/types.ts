import type {
  PosBillStatus,
  PosPaymentMethod,
  PosReturnStatus,
  PosReturnType,
} from "@prisma/client";

export const BILL_STATUS_LABELS: Record<PosBillStatus, string> = {
  DRAFT: "Draft",
  COMPLETED: "Completed",
  VOID: "Void",
  PARTIALLY_RETURNED: "Partially Returned",
  FULLY_RETURNED: "Fully Returned",
};

export const PAYMENT_METHOD_LABELS: Record<PosPaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  WALLET: "Wallet",
  LOYALTY: "Loyalty Points",
};

export const RETURN_TYPE_LABELS: Record<PosReturnType, string> = {
  RETURN: "Return",
  EXCHANGE: "Exchange",
};

export const RETURN_STATUS_LABELS: Record<PosReturnStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REFUNDED: "Refunded",
  EXCHANGED: "Exchanged",
  REJECTED: "Rejected",
};

export type BillLineInput = {
  productId?: string;
  barcodeScanned?: string;
  name: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
};

export type PaymentInput = {
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
};

export const LOYALTY_EARN_RATE = 1;
export const LOYALTY_REDEEM_VALUE = 0.5;

export const DEFAULT_HSN = "0401";
