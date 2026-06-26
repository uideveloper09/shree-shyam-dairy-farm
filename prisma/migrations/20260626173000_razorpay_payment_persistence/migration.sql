-- Add PAID status values for Razorpay order/payment completion
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';

-- Order payment completion timestamp
ALTER TABLE "Order" ADD COLUMN "paymentCompletedAt" TIMESTAMP(3);

-- Extended payment audit fields
ALTER TABLE "Payment" ADD COLUMN "customerId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "razorpaySignature" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ADD COLUMN "transactionReference" TEXT;

CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");
