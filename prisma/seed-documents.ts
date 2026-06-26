import { PrismaClient } from "@prisma/client";
import { seedDefaultFolders } from "@/modules/documents/folders";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "OWNER"] } },
    select: { id: true },
  });

  if (!admin) {
    console.log("No admin user — run db:seed first");
    return;
  }

  const folders = await seedDefaultFolders(admin.id);
  console.log(`Seeded ${folders.length} document folders.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
