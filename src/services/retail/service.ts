import { prisma } from "@/repositories/prisma";
import { calculateGst, generateInvoiceNumber } from "@/modules/retail/gst";
import {
  billBarcode,
  billNumber,
  buildBillQrPayload,
  returnNumber,
} from "@/modules/retail/printer";
import type { BillLineInput, PaymentInput } from "@/modules/retail/types";
import { LOYALTY_EARN_RATE, LOYALTY_REDEEM_VALUE } from "@/modules/retail/types";
import type { PosBillStatus, PosPaymentMethod, PosReturnType } from "@prisma/client";

export async function getRetailDashboard(tenantId?: string | null) {
  const where = { tenantId: tenantId ?? undefined };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, todayBills, pendingOffline, pendingReturns, loyaltyAccounts, terminals] =
    await Promise.all([
      prisma.posBill.aggregate({
        where: { ...where, status: "COMPLETED", createdAt: { gte: today } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.posBill.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.posOfflineQueue.count({ where: { status: "PENDING" } }),
      prisma.posReturn.count({ where: { status: "PENDING" } }),
      prisma.posLoyaltyAccount.count(),
      prisma.posTerminal.count({ where: { ...where, isActive: true } }),
    ]);

  const recentBills = await prisma.posBill.findMany({
    where,
    include: { cashier: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    stats: {
      todayRevenue: Number(todaySales._sum.total ?? 0),
      todayBills: todaySales._count.id,
      totalBillsToday: todayBills,
      pendingOffline,
      pendingReturns,
      loyaltyAccounts,
      terminals,
    },
    recentBills,
  };
}

// ─── Terminals ───────────────────────────────────────────────────────────────

export async function listTerminals(tenantId?: string | null) {
  return prisma.posTerminal.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: { _count: { select: { bills: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createTerminal(
  tenantId: string | null | undefined,
  data: {
    name: string;
    location?: string;
    printerName?: string;
    printerWidth?: number;
    cashDrawerEnabled?: boolean;
  }
) {
  return prisma.posTerminal.create({ data: { tenantId, ...data } });
}

// ─── Barcode / QR Scan ───────────────────────────────────────────────────────

export async function scanCode(code: string) {
  const productBarcode = await prisma.posProductBarcode.findUnique({
    where: { barcode: code },
    include: { product: { include: { category: true } } },
  });
  if (productBarcode?.product) {
    return {
      type: "product" as const,
      barcode: code,
      product: productBarcode.product,
      qrPayload: productBarcode.qrPayload,
    };
  }

  const procLabel = await prisma.procLabel.findUnique({
    where: { barcode: code },
    include: { batch: true },
  });
  if (procLabel) {
    return {
      type: "proc_label" as const,
      barcode: code,
      label: procLabel,
      qrPayload: procLabel.qrPayload,
    };
  }

  const bill = await prisma.posBill.findFirst({
    where: { OR: [{ billBarcode: code }, { billNumber: code }] },
    include: { items: true },
  });
  if (bill) {
    return { type: "bill" as const, barcode: code, bill, qrPayload: bill.billQrPayload };
  }

  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: code }, { name: { contains: code, mode: "insensitive" } }] },
  });
  if (product) return { type: "product_search" as const, barcode: code, product };

  return null;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export async function listBills(tenantId?: string | null, status?: PosBillStatus) {
  return prisma.posBill.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      ...(status ? { status } : {}),
    },
    include: {
      cashier: { select: { name: true } },
      terminal: { select: { name: true } },
      _count: { select: { items: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createBill(
  tenantId: string | null | undefined,
  cashierId: string,
  data: {
    terminalId?: string;
    customerUserId?: string;
    customerPhone?: string;
    customerName?: string;
    customerGstin?: string;
    lines: BillLineInput[];
    discountAmount?: number;
    discountPercent?: number;
    loyaltyPointsRedeem?: number;
    payments: PaymentInput[];
    isOffline?: boolean;
    offlineClientId?: string;
    openCashDrawer?: boolean;
  }
) {
  const discountAmount = data.discountAmount ?? 0;
  const loyaltyRedeem = (data.loyaltyPointsRedeem ?? 0) * LOYALTY_REDEEM_VALUE;
  const totalDiscount = discountAmount + loyaltyRedeem;

  const gst = calculateGst(data.lines, totalDiscount, false);
  const num = billNumber();
  const barcode = billBarcode(num);
  const invoiceNum = generateInvoiceNumber(num);
  const qrPayload = buildBillQrPayload({
    billNumber: num,
    total: gst.total,
    invoiceNumber: invoiceNum,
    gstin: data.customerGstin,
  });

  const hasCash = data.payments.some((p) => p.method === "CASH");
  const loyaltyEarned = Math.floor(gst.total * LOYALTY_EARN_RATE);

  const bill = await prisma.posBill.create({
    data: {
      tenantId,
      terminalId: data.terminalId,
      billNumber: num,
      status: "COMPLETED",
      cashierId,
      customerUserId: data.customerUserId,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      customerGstin: data.customerGstin,
      subtotal: gst.subtotal,
      discountAmount: totalDiscount,
      discountPercent: data.discountPercent ?? 0,
      loyaltyRedeemed: loyaltyRedeem,
      loyaltyEarned,
      taxCgst: gst.cgst,
      taxSgst: gst.sgst,
      taxIgst: gst.igst,
      total: gst.total,
      invoiceNumber: invoiceNum,
      invoiceType: data.customerGstin ? "B2B" : "B2C",
      billBarcode: barcode,
      billQrPayload: qrPayload,
      isOffline: data.isOffline ?? false,
      offlineClientId: data.offlineClientId,
      cashDrawerOpened: hasCash && data.openCashDrawer !== false,
      items: {
        create: data.lines.map((l, i) => ({
          productId: l.productId,
          barcodeScanned: l.barcodeScanned,
          name: l.name,
          hsnCode: l.hsnCode ?? "0401",
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount ?? 0,
          taxRate: l.taxRate ?? 5,
          cgst: gst.lines[i]?.cgst ?? 0,
          sgst: gst.lines[i]?.sgst ?? 0,
          lineTotal: gst.lines[i]?.lineTotal ?? l.quantity * l.unitPrice,
        })),
      },
      payments: {
        create: data.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference,
        })),
      },
    },
    include: { items: true, payments: true, terminal: true },
  });

  if (data.loyaltyPointsRedeem && data.customerPhone) {
    await redeemLoyaltyPoints(data.customerPhone, data.loyaltyPointsRedeem, bill.id);
  }

  if (data.customerPhone || data.customerUserId) {
    await earnLoyaltyPoints(
      { phone: data.customerPhone, userId: data.customerUserId, name: data.customerName },
      loyaltyEarned,
      bill.id
    );
  }

  for (const line of data.lines) {
    if (line.productId) {
      await prisma.product.update({
        where: { id: line.productId },
        data: { stockQty: { decrement: Math.ceil(line.quantity) } },
      });
    }
  }

  return bill;
}

export async function voidBill(id: string) {
  return prisma.posBill.update({
    where: { id },
    data: { status: "VOID" },
  });
}

export async function getBill(id: string) {
  return prisma.posBill.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      payments: true,
      terminal: true,
      cashier: { select: { name: true } },
      returns: { include: { items: true } },
    },
  });
}

export async function getGstInvoice(billNumberOrId: string) {
  const bill = await prisma.posBill.findFirst({
    where: {
      OR: [
        { id: billNumberOrId },
        { billNumber: billNumberOrId },
        { invoiceNumber: billNumberOrId },
      ],
    },
    include: { items: true, payments: true, terminal: true, cashier: { select: { name: true } } },
  });
  if (!bill) return null;

  return {
    invoiceNumber: bill.invoiceNumber,
    invoiceType: bill.invoiceType,
    billNumber: bill.billNumber,
    date: bill.createdAt,
    seller: {
      name: "Shree Shyam Dairy Farm",
      gstin: "08XXXXX1234X1ZX",
      address: "Jaipur, Rajasthan",
    },
    buyer: {
      name: bill.customerName,
      gstin: bill.customerGstin,
      phone: bill.customerPhone,
    },
    items: bill.items.map((i) => ({
      name: i.name,
      hsn: i.hsnCode,
      qty: Number(i.quantity),
      rate: Number(i.unitPrice),
      discount: Number(i.discount),
      cgst: Number(i.cgst),
      sgst: Number(i.sgst),
      amount: Number(i.lineTotal),
    })),
    summary: {
      subtotal: Number(bill.subtotal),
      discount: Number(bill.discountAmount),
      cgst: Number(bill.taxCgst),
      sgst: Number(bill.taxSgst),
      igst: Number(bill.taxIgst),
      total: Number(bill.total),
    },
    payments: bill.payments,
    qrPayload: bill.billQrPayload,
    barcode: bill.billBarcode,
  };
}

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export async function getLoyaltyAccount(phone?: string, userId?: string) {
  if (userId) {
    return prisma.posLoyaltyAccount.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  }
  if (phone) {
    return prisma.posLoyaltyAccount.findUnique({
      where: { phone },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  }
  return null;
}

async function getOrCreateLoyaltyAccount(data: { phone?: string; userId?: string; name?: string }) {
  if (data.userId) {
    const existing = await prisma.posLoyaltyAccount.findUnique({ where: { userId: data.userId } });
    if (existing) return existing;
    return prisma.posLoyaltyAccount.create({
      data: { userId: data.userId, phone: data.phone, customerName: data.name },
    });
  }
  if (data.phone) {
    const existing = await prisma.posLoyaltyAccount.findUnique({ where: { phone: data.phone } });
    if (existing) return existing;
    return prisma.posLoyaltyAccount.create({
      data: { phone: data.phone, customerName: data.name },
    });
  }
  throw new Error("phone or userId required for loyalty");
}

async function earnLoyaltyPoints(
  customer: { phone?: string; userId?: string; name?: string },
  points: number,
  billId: string
) {
  if (points <= 0) return;
  const account = await getOrCreateLoyaltyAccount(customer);
  const balance = account.pointsBalance + points;
  await prisma.$transaction([
    prisma.posLoyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: balance, lifetimePoints: { increment: points } },
    }),
    prisma.posLoyaltyTransaction.create({
      data: {
        accountId: account.id,
        billId,
        type: "earn",
        points,
        balanceAfter: balance,
      },
    }),
  ]);
}

async function redeemLoyaltyPoints(phone: string, points: number, billId: string) {
  const account = await prisma.posLoyaltyAccount.findUnique({ where: { phone } });
  if (!account || account.pointsBalance < points) {
    throw new Error("Insufficient loyalty points");
  }
  const balance = account.pointsBalance - points;
  await prisma.$transaction([
    prisma.posLoyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: balance },
    }),
    prisma.posLoyaltyTransaction.create({
      data: {
        accountId: account.id,
        billId,
        type: "redeem",
        points: -points,
        balanceAfter: balance,
      },
    }),
  ]);
}

// ─── Returns & Exchange ────────────────────────────────────────────────────────

export async function listReturns() {
  return prisma.posReturn.findMany({
    include: {
      originalBill: { select: { billNumber: true, total: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createReturn(
  processedById: string,
  data: {
    originalBillId: string;
    type: PosReturnType;
    reason?: string;
    items: { billItemId: string; quantity: number; amount: number }[];
    exchangeLines?: BillLineInput[];
    exchangePayments?: PaymentInput[];
    terminalId?: string;
  }
) {
  const bill = await prisma.posBill.findUnique({
    where: { id: data.originalBillId },
    include: { items: true },
  });
  if (!bill || bill.status === "VOID") throw new Error("Invalid bill");

  const refundAmount = data.items.reduce((s, i) => s + i.amount, 0);
  const retNum = returnNumber();

  let exchangeBillId: string | undefined;

  if (data.type === "EXCHANGE" && data.exchangeLines?.length) {
    const exchangeBill = await createBill(undefined, processedById, {
      terminalId: data.terminalId,
      customerPhone: bill.customerPhone ?? undefined,
      customerName: bill.customerName ?? undefined,
      lines: data.exchangeLines,
      payments: data.exchangePayments ?? [{ method: "CASH", amount: 0 }],
    });
    exchangeBillId = exchangeBill.id;
  }

  const posReturn = await prisma.posReturn.create({
    data: {
      returnNumber: retNum,
      originalBillId: data.originalBillId,
      type: data.type,
      status: data.type === "EXCHANGE" ? "EXCHANGED" : "APPROVED",
      reason: data.reason,
      refundAmount,
      exchangeBillId,
      processedById,
      processedAt: new Date(),
      items: { create: data.items },
    },
    include: { items: true },
  });

  const allReturned = data.items.length >= bill.items.length;
  await prisma.posBill.update({
    where: { id: data.originalBillId },
    data: { status: allReturned ? "FULLY_RETURNED" : "PARTIALLY_RETURNED" },
  });

  return posReturn;
}

// ─── Offline Billing ─────────────────────────────────────────────────────────

export async function queueOfflineBill(data: {
  clientId: string;
  terminalId?: string;
  payload: Record<string, unknown>;
}) {
  return prisma.posOfflineQueue.upsert({
    where: { clientId: data.clientId },
    create: {
      clientId: data.clientId,
      terminalId: data.terminalId,
      payload: data.payload as object,
      status: "PENDING",
    },
    update: { payload: data.payload as object, status: "PENDING" },
  });
}

export async function syncOfflineBills(cashierId: string) {
  const pending = await prisma.posOfflineQueue.findMany({
    where: { status: "PENDING" },
    take: 50,
  });

  let synced = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      const payload = row.payload as {
        terminalId?: string;
        customerPhone?: string;
        customerName?: string;
        lines: BillLineInput[];
        discountAmount?: number;
        payments: PaymentInput[];
      };

      const bill = await createBill(undefined, cashierId, {
        ...payload,
        isOffline: true,
        offlineClientId: row.clientId,
      });

      await prisma.posOfflineQueue.update({
        where: { id: row.id },
        data: { status: "SYNCED", syncedAt: new Date(), billId: bill.id },
      });
      synced++;
    } catch (e) {
      await prisma.posOfflineQueue.update({
        where: { id: row.id },
        data: { status: "FAILED", errorMessage: (e as Error).message },
      });
      failed++;
    }
  }

  return { synced, failed };
}

export async function listOfflineQueue(status?: string) {
  return prisma.posOfflineQueue.findMany({
    where: status ? { status: status as "PENDING" | "SYNCED" | "FAILED" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export { billNumber, buildBillQrPayload };
