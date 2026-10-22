import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SalesInvoiceCreateData = Omit<
  Prisma.SalesInvoiceUncheckedCreateInput,
  "invoiceNumber"
>;

function getSequenceValue(invoiceNumber: string): number | null {
  if (/^POS-/i.test(invoiceNumber)) return null;
  const match = invoiceNumber.match(/(\d+)$/);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) ? sequence : null;
}

export function getNextSalesInvoiceNumber(invoiceNumbers: string[], authorizedRange: string): string {
  const existingNumbers = invoiceNumbers.filter((number) => !/^POS-/i.test(number));
  const maxSequence = existingNumbers.reduce((max, number) => {
    const sequence = getSequenceValue(number);
    return sequence === null ? max : Math.max(max, sequence);
  }, 0);

  const rangeMatch = authorizedRange.match(
    /DEL\s+(\d{3}-\d{3}-\d{2}-)(\d{1,8})\s+AL\s+(\d{3}-\d{3}-\d{2}-)(\d{1,8})/i
  );
  if (rangeMatch && rangeMatch[1] === rangeMatch[3]) {
    const start = Number(rangeMatch[2]);
    const sequence = Math.max(start, maxSequence + 1);
    return `${rangeMatch[1]}${String(sequence).padStart(8, "0")}`;
  }

  const sarInvoice = existingNumbers
    .map((number) => number.match(/^(\d{3}-\d{3}-\d{2}-)(\d+)$/))
    .find((match) => match !== null);
  if (sarInvoice) {
    return `${sarInvoice[1]}${String(maxSequence + 1).padStart(8, "0")}`;
  }

  const formattedInvoice = existingNumbers
    .map((number) => number.match(/^(.*-)(\d+)$/))
    .find((match) => match !== null);
  if (formattedInvoice) {
    return `${formattedInvoice[1]}${String(maxSequence + 1).padStart(formattedInvoice[2].length, "0")}`;
  }

  return String(maxSequence > 0 ? maxSequence + 1 : 1001);
}

export async function createSequentialSalesInvoice(
  companyId: string,
  data: SalesInvoiceCreateData
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`sales-invoice:${companyId}`}, 0))`
    );

    const [invoices, companySettings] = await Promise.all([
      tx.salesInvoice.findMany({
        where: { companyId },
        select: { invoiceNumber: true },
      }),
      (async () =>
        (await tx.companySettings.findUnique({
          where: { id: companyId },
          select: { rangoAutorizado: true },
        })) ||
        (companyId !== "default"
          ? await tx.companySettings.findUnique({
              where: { id: "default" },
              select: { rangoAutorizado: true },
            })
          : null))(),
    ]);

    const invoiceNumber = getNextSalesInvoiceNumber(
      invoices.map((invoice) => invoice.invoiceNumber),
      companySettings?.rangoAutorizado || ""
    );

    return tx.salesInvoice.create({
      data: { ...data, companyId, invoiceNumber },
      include: { lines: true },
    });
  });
}
