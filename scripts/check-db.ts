import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log("Existing Companies:", JSON.stringify(companies, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, companyId: true },
  });
  console.log("Existing Users:", JSON.stringify(users, null, 2));

  const settings = await prisma.companySettings.findMany();
  console.log("CompanySettings:", JSON.stringify(settings, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
