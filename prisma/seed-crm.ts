import { PrismaClient } from "@prisma/client";
import { ensureDefaultPipeline } from "@/modules/crm/pipeline";

const prisma = new PrismaClient();

async function main() {
  await ensureDefaultPipeline(null);

  const existingLead = await prisma.crmLead.findFirst();
  if (!existingLead) {
    const lead = await prisma.crmLead.create({
      data: {
        name: "Sample Dairy Buyer",
        email: "buyer@example.com",
        phone: "+919876543210",
        source: "website",
        status: "NEW",
        score: 60,
      },
    });

    const customer = await prisma.crmCustomer.create({
      data: {
        name: "Green Valley Restaurant",
        email: "orders@greenvalley.in",
        phone: "+919111222333",
        company: "Green Valley Restaurant",
      },
    });

    const pipeline = await ensureDefaultPipeline(null);
    const stage = pipeline.stages[1];

    await prisma.crmOpportunity.create({
      data: {
        title: "Monthly A2 Milk Supply",
        customerId: customer.id,
        leadId: lead.id,
        stageId: stage?.id,
        stage: "QUALIFICATION",
        amount: 45000,
        probability: stage?.probability ?? 25,
      },
    });

    await prisma.crmFollowUp.create({
      data: {
        type: "CALL",
        subject: "Intro call — bulk milk pricing",
        scheduledAt: new Date(Date.now() + 2 * 86400_000),
        leadId: lead.id,
      },
    });

    await prisma.crmQuotation.create({
      data: {
        quoteNumber: `QT-${new Date().getFullYear()}-DEMO`,
        customerId: customer.id,
        subtotal: 42000,
        tax: 2100,
        total: 44100,
        status: "DRAFT",
        lines: {
          create: [
            {
              description: "A2 Cow Milk — 500L/month",
              quantity: 500,
              unitPrice: 60,
              amount: 30000,
            },
            { description: "Delivery — monthly", quantity: 1, unitPrice: 12000, amount: 12000 },
          ],
        },
      },
    });

    await prisma.crmCampaign.create({
      data: {
        name: "Monsoon Ghee Promo",
        channel: "whatsapp",
        status: "DRAFT",
        description: "Seasonal ghee discount for returning customers",
        members: {
          create: [{ email: "buyer@example.com", status: "pending" }],
        },
      },
    });

    await prisma.crmReferral.create({
      data: {
        referrerCode: "DEMO-REF",
        referredEmail: "friend@example.com",
        status: "pending",
      },
    });

    await prisma.crmSupportTicket.create({
      data: {
        ticketNumber: `TKT-${new Date().getFullYear()}-DEMO`,
        subject: "Delivery timing change request",
        description: "Please shift morning delivery to 7 AM.",
        priority: "NORMAL",
        category: "delivery",
        customerId: customer.id,
      },
    });

    console.log("Seeded CRM demo data.");
  } else {
    console.log("CRM data already exists, skipping demo records.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
