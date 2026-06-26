import { PrismaClient } from "@prisma/client";
import { seedFarm } from "./seed-farm";

const prisma = new PrismaClient();

seedFarm(prisma)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
