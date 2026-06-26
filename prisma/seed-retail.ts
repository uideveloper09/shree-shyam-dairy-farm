import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let terminal = await prisma.posTerminal.findFirst();
  if (!terminal) {
    terminal = await prisma.posTerminal.create({
      data: {
        name: "Counter 1 — Farm Shop",
        location: "Main outlet, Jaipur",
        printerName: "EPSON TM-T82",
        printerWidth: 80,
        cashDrawerEnabled: true,
      },
    });
  }

  const products = await prisma.product.findMany({ take: 5 });
  for (const p of products) {
    const barcode = `890SSD${String(p.legacyId ?? p.id.slice(-4)).padStart(6, "0")}`.slice(0, 13);
    await prisma.posProductBarcode.upsert({
      where: { barcode },
      create: {
        productId: p.id,
        barcode,
        qrPayload: JSON.stringify({ product: p.slug, name: p.name, price: Number(p.price) }),
      },
      update: { productId: p.id },
    });
  }

  if (!(await prisma.posBill.findFirst())) {
    const product = products[0];
    if (product) {
      await prisma.posBill.create({
        data: {
          terminalId: terminal.id,
          billNumber: `BILL-${new Date().getFullYear()}-DEMO`,
          status: "COMPLETED",
          customerPhone: "+919876543210",
          customerName: "Walk-in Customer",
          subtotal: Number(product.price) * 2,
          discountAmount: 20,
          taxCgst: 4.9,
          taxSgst: 4.9,
          total: Number(product.price) * 2 - 20 + 9.8,
          invoiceNumber: `INV/${new Date().getFullYear()}/000001`,
          invoiceType: "B2C",
          billBarcode: "899BILLDEMO01",
          billQrPayload: JSON.stringify({
            v: 1,
            store: "Shree Shyam Dairy Farm",
            bill: `BILL-${new Date().getFullYear()}-DEMO`,
            total: Number(product.price) * 2,
          }),
          loyaltyEarned: 50,
          cashDrawerOpened: true,
          items: {
            create: [
              {
                productId: product.id,
                name: product.name,
                quantity: 2,
                unitPrice: product.price,
                hsnCode: "0401",
                taxRate: 5,
                cgst: 4.9,
                sgst: 4.9,
                lineTotal: Number(product.price) * 2 + 9.8,
              },
            ],
          },
          payments: {
            create: [{ method: "CASH", amount: Number(product.price) * 2 - 20 + 9.8 }],
          },
        },
      });
    }
    console.log("Seeded retail terminal, barcodes, and demo bill.");
  } else {
    console.log("Retail data exists; ensured barcodes and terminal.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
