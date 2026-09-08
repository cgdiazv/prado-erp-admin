const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const email = process.argv[2] || "cgdiazv@gmail.com";
  const user = await p.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      company: { select: { name: true, subscriptionStatus: true } },
    },
  });
  console.log(JSON.stringify(user, null, 2));
  await p.$disconnect();
}

main();
