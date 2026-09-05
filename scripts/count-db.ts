import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking current counts in DB ===");
  const [
    customers,
    vendors,
    items,
    invoices,
    quotes,
    salesOrders,
    accounts,
    journalEntries,
    bankAccounts,
    pettyCashFunds,
    purchaseInvoices,
    purchaseOrders,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.vendor.count(),
    prisma.inventoryItem.count(),
    prisma.salesInvoice.count(),
    prisma.quote.count(),
    prisma.salesOrder.count(),
    prisma.account.count(),
    prisma.journalEntry.count(),
    prisma.bankAccount.count(),
    prisma.pettyCashFund.count(),
    prisma.purchaseInvoice.count(),
    prisma.purchaseOrder.count(),
  ]);

  console.log({
    customers,
    vendors,
    items,
    invoices,
    quotes,
    salesOrders,
    accounts,
    journalEntries,
    bankAccounts,
    pettyCashFunds,
    purchaseInvoices,
    purchaseOrders,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
