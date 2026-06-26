import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
  {
    slug: "order-confirmed",
    name: "Order Confirmed",
    channel: "EMAIL" as const,
    type: "TRANSACTIONAL" as const,
    subject: "Order {{orderNumber}} confirmed",
    body: "Hi {{name}}, your order {{orderNumber}} for ₹{{total}} has been confirmed. Thank you for choosing Shree Shyam Dairy Farm!",
    variables: ["name", "orderNumber", "total"],
  },
  {
    slug: "order-confirmed-sms",
    name: "Order Confirmed SMS",
    channel: "SMS" as const,
    type: "TRANSACTIONAL" as const,
    body: "Order {{orderNumber}} confirmed. Amount: Rs {{total}}. - Shree Shyam Dairy",
    variables: ["orderNumber", "total"],
  },
  {
    slug: "order-confirmed-whatsapp",
    name: "Order Confirmed WhatsApp",
    channel: "WHATSAPP" as const,
    type: "TRANSACTIONAL" as const,
    body: "Your order {{orderNumber}} is confirmed! Total: ₹{{total}}",
    variables: ["orderNumber", "total"],
  },
  {
    slug: "delivery-out",
    name: "Out for Delivery",
    channel: "PUSH" as const,
    type: "TRANSACTIONAL" as const,
    body: "Your milk order is out for delivery and will arrive soon.",
    variables: [],
  },
  {
    slug: "delivery-out-inapp",
    name: "Out for Delivery In-App",
    channel: "IN_APP" as const,
    type: "TRANSACTIONAL" as const,
    body: "Your order is out for delivery.",
    variables: [],
  },
  {
    slug: "announcement",
    name: "General Announcement",
    channel: "IN_APP" as const,
    type: "ANNOUNCEMENT" as const,
    body: "{{message}}",
    variables: ["message"],
  },
];

const DEFAULT_RULES = [
  { event: "order.created", templateSlug: "order-confirmed", channels: ["EMAIL", "IN_APP"] },
  { event: "order.created", templateSlug: "order-confirmed-sms", channels: ["SMS"] },
  { event: "order.out_for_delivery", templateSlug: "delivery-out", channels: ["PUSH", "IN_APP"] },
];

async function main() {
  for (const t of DEFAULT_TEMPLATES) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { tenantId: null, slug: t.slug, channel: t.channel },
    });
    if (existing) {
      await prisma.notificationTemplate.update({
        where: { id: existing.id },
        data: { body: t.body, name: t.name },
      });
    } else {
      await prisma.notificationTemplate.create({
        data: {
          slug: t.slug,
          name: t.name,
          channel: t.channel,
          type: t.type,
          subject: t.subject,
          body: t.body,
          variables: t.variables,
        },
      });
    }
  }

  for (const r of DEFAULT_RULES) {
    const template = await prisma.notificationTemplate.findFirst({
      where: { slug: r.templateSlug, tenantId: null },
    });
    if (!template) continue;

    const existing = await prisma.notificationRule.findFirst({
      where: { event: r.event, templateId: template.id },
    });
    if (!existing) {
      await prisma.notificationRule.create({
        data: {
          name: `${r.event} → ${r.templateSlug}`,
          event: r.event,
          templateId: template.id,
          channels: r.channels,
          priority: "NORMAL",
        },
      });
    }
  }

  console.log("Notification templates and rules seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
