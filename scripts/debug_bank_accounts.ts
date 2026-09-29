import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const banks = await p.bankAccount.findMany({
    select: { id: true, name: true, accountNumber: true, currency: true, companyId: true, createdAt: true },
  });
  console.log("BANK ACCOUNTS:", JSON.stringify(banks, null, 2));
  const companies = await p.company.findMany({ select: { id: true, name: true } });
  console.log("COMPANIES:", JSON.stringify(companies, null, 2));
  const users = await p.user.findMany({ select: { email: true, companyId: true } });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().finally(() => p.$disconnect());
