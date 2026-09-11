import prisma from "../lib/prisma";

async function main() {
  console.log("Migrating current accounts to plan 'empresarial' and subscriptionStatus 'ACTIVE'...");

  // Update all current companies
  const updateCompanies = await prisma.company.updateMany({
    data: {
      plan: "empresarial",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log(`Updated ${updateCompanies.count} companies to 'empresarial' (ACTIVE).`);

  // Ensure all current users have super_admin role and are active
  const updateUsers = await prisma.user.updateMany({
    data: {
      role: "super_admin",
      isActive: true,
    },
  });

  console.log(`Updated ${updateUsers.count} users to 'super_admin' (active).`);

  // Print all companies to verify
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  console.log("Current state of accounts in database:");
  console.log(JSON.stringify(companies, null, 2));
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
