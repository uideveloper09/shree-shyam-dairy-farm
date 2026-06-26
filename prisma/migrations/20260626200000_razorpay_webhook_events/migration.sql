-- AlterEnum: add FAILED to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';

-- CreateTable
CREATE TABLE "RazorpayWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_eventType_idx" ON "RazorpayWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_processed_idx" ON "RazorpayWebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_createdAt_idx" ON "RazorpayWebhookEvent"("createdAt");
