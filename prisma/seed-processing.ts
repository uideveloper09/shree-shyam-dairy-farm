import { PrismaClient, type ProcProductType } from "@prisma/client";

const prisma = new PrismaClient();

const RECIPES: {
  name: string;
  productType: ProcProductType;
  yieldQty: number;
  yieldUnit: string;
  milkLiters: number;
  shelfLifeDays: number;
  instructions: string;
  ingredients: { name: string; quantity: number; unit: string }[];
}[] = [
  {
    name: "Fresh Paneer — Standard",
    productType: "PANEER",
    yieldQty: 2,
    yieldUnit: "kg",
    milkLiters: 10,
    shelfLifeDays: 5,
    instructions: "Heat milk to 90°C, add citric acid, drain whey, press 2 hours.",
    ingredients: [
      { name: "Full cream milk", quantity: 10, unit: "L" },
      { name: "Citric acid", quantity: 15, unit: "g" },
    ],
  },
  {
    name: "Set Curd — Dahi",
    productType: "CURD",
    yieldQty: 8,
    yieldUnit: "kg",
    milkLiters: 10,
    shelfLifeDays: 7,
    instructions: "Boil milk, cool to 42°C, add culture, incubate 6 hours.",
    ingredients: [
      { name: "Toned milk", quantity: 10, unit: "L" },
      { name: "Curd culture", quantity: 100, unit: "ml" },
    ],
  },
  {
    name: "Cultured Butter",
    productType: "BUTTER",
    yieldQty: 1.2,
    yieldUnit: "kg",
    milkLiters: 20,
    shelfLifeDays: 30,
    instructions: "Churn cultured cream until butter separates.",
    ingredients: [
      { name: "Cream", quantity: 5, unit: "L" },
      { name: "Salt", quantity: 20, unit: "g" },
    ],
  },
  {
    name: "A2 Cow Ghee — Bilona",
    productType: "GHEE",
    yieldQty: 1,
    yieldUnit: "kg",
    milkLiters: 25,
    shelfLifeDays: 180,
    instructions: "Slow cook butter on low heat until milk solids brown.",
    ingredients: [{ name: "Butter", quantity: 1.5, unit: "kg" }],
  },
  {
    name: "Traditional Khoya",
    productType: "KHOYA",
    yieldQty: 1,
    yieldUnit: "kg",
    milkLiters: 8,
    shelfLifeDays: 10,
    instructions: "Reduce milk on slow heat stirring continuously until thick.",
    ingredients: [{ name: "Full cream milk", quantity: 8, unit: "L" }],
  },
  {
    name: "Sweet Lassi",
    productType: "LASSI",
    yieldQty: 20,
    yieldUnit: "L",
    milkLiters: 10,
    shelfLifeDays: 3,
    instructions: "Blend curd with water, sugar, and cardamom. Chill.",
    ingredients: [
      { name: "Fresh curd", quantity: 5, unit: "kg" },
      { name: "Sugar", quantity: 500, unit: "g" },
      { name: "Cardamom", quantity: 5, unit: "g" },
    ],
  },
  {
    name: "Rose Flavoured Milk",
    productType: "FLAVOURED_MILK",
    yieldQty: 50,
    yieldUnit: "L",
    milkLiters: 50,
    shelfLifeDays: 5,
    instructions: "Pasteurize milk, add rose syrup and sugar, homogenize, bottle.",
    ingredients: [
      { name: "Toned milk", quantity: 50, unit: "L" },
      { name: "Rose syrup", quantity: 2, unit: "L" },
      { name: "Sugar", quantity: 2, unit: "kg" },
    ],
  },
];

async function main() {
  for (const r of RECIPES) {
    const existing = await prisma.procRecipe.findFirst({
      where: { name: r.name, productType: r.productType },
    });
    if (existing) continue;

    await prisma.procRecipe.create({
      data: {
        name: r.name,
        productType: r.productType,
        yieldQty: r.yieldQty,
        yieldUnit: r.yieldUnit,
        milkLiters: r.milkLiters,
        shelfLifeDays: r.shelfLifeDays,
        instructions: r.instructions,
        ingredients: { create: r.ingredients },
      },
    });
  }

  const paneerRecipe = await prisma.procRecipe.findFirst({
    where: { productType: "PANEER" },
    include: { ingredients: true },
  });

  if (paneerRecipe && !(await prisma.procBatch.findFirst())) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.procSchedule.create({
      data: {
        productType: "PANEER",
        plannedQty: 20,
        yieldUnit: "kg",
        scheduledDate: tomorrow,
        milkRequired: 100,
        status: "SCHEDULED",
        notes: "Weekly paneer production for retail",
      },
    });

    const batch = await prisma.procBatch.create({
      data: {
        batchNumber: `BATCH-PAN-${new Date().getFullYear()}-DEMO`,
        productType: "PANEER",
        recipeId: paneerRecipe.id,
        status: "QC_PENDING",
        milkInputLiters: 50,
        plannedQty: 10,
        actualQty: 9.8,
        yieldUnit: "kg",
        expiryDate: new Date(Date.now() + 5 * 86400_000),
        startedAt: new Date(Date.now() - 3600_000),
      },
    });

    await prisma.procQualityCheck.createMany({
      data: [
        {
          batchId: batch.id,
          checkType: "standard",
          parameter: "Moisture %",
          expectedValue: "50-55",
          actualValue: "52",
          status: "PASSED",
          checkedAt: new Date(),
        },
        {
          batchId: batch.id,
          checkType: "standard",
          parameter: "Fat %",
          expectedValue: "20-22",
          actualValue: "21",
          status: "PASSED",
          checkedAt: new Date(),
        },
        {
          batchId: batch.id,
          checkType: "standard",
          parameter: "pH",
          expectedValue: "5.8-6.2",
          status: "PENDING",
        },
      ],
    });

    const packaging = await prisma.procPackaging.create({
      data: {
        batchId: batch.id,
        packagingType: "POUCH",
        unitSize: "500g",
        unitCount: 20,
        totalQty: 9.8,
      },
    });

    await prisma.procLabel.create({
      data: {
        batchId: batch.id,
        packagingId: packaging.id,
        productType: "PANEER",
        barcode: "890BATCHPA0001",
        qrPayload: JSON.stringify({
          v: 1,
          brand: "Shree Shyam Dairy Farm",
          batch: batch.batchNumber,
          product: "PANEER",
          barcode: "890BATCHPA0001",
          expiry: batch.expiryDate?.toISOString().slice(0, 10),
        }),
        expiryDate: batch.expiryDate!,
      },
    });

    console.log("Seeded processing recipes and demo batch.");
  } else {
    console.log(`Seeded ${RECIPES.length} processing recipes (skipped existing).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
