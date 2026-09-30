import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// GET /api/bank-transactions - List bank feed transactions
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get("bankAccountId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Auto-sync customer payments to BankTransactions if missing
    try {
      const companyBanks = await prisma.bankAccount.findMany({
        where: { companyId },
      });

      if (companyBanks.length > 0) {
        const payments = await prisma.payment.findMany({
          where: { companyId },
        });

        for (const pay of payments) {
          const matchedBank =
            companyBanks.find((b) => b.id === pay.depositAccount) ||
            companyBanks.find(
              (b) =>
                pay.depositAccount.toLowerCase().includes(b.name.toLowerCase()) ||
                b.name.toLowerCase().includes(pay.depositAccount.toLowerCase())
            ) ||
            (companyBanks.length === 1 &&
            pay.depositAccount !== "Cash and cash equivalents" &&
            !pay.depositAccount.includes("Caja General")
              ? companyBanks[0]
              : null);

          if (matchedBank) {
            const existingTx = await prisma.bankTransaction.findFirst({
              where: {
                bankAccountId: matchedBank.id,
                payee: pay.customerName,
                amount: pay.amount,
              },
            });

            if (!existingTx) {
              await prisma.bankTransaction.create({
                data: {
                  bankAccountId: matchedBank.id,
                  date: pay.paymentDate || new Date().toLocaleDateString("es-HN"),
                  description: `Pago recibido de cliente: ${pay.customerName}${pay.referenceNumber ? ` - Ref: ${pay.referenceNumber}` : ""}`,
                  payee: pay.customerName,
                  type: "deposit",
                  amount: pay.amount,
                  suggestedAccount: pay.depositAccount || "1100 - Bancos Nacionales",
                  status: "porRevisar",
                },
              });

              const targetBankBalance = matchedBank.bankBalance === 0 ? matchedBank.bookBalance + pay.amount : matchedBank.bankBalance + pay.amount;
              await prisma.bankAccount.update({
                where: { id: matchedBank.id },
                data: {
                  bookBalance: {
                    increment: pay.amount,
                  },
                  bankBalance: targetBankBalance,
                },
              });
            }
          }
        }

        // Auto-fix any bank account where bankBalance is 0 but bookBalance > 0
        for (const bank of companyBanks) {
          if (bank.bankBalance === 0 && bank.bookBalance > 0) {
            await prisma.bankAccount.update({
              where: { id: bank.id },
              data: {
                bankBalance: bank.bookBalance,
              },
            });
          }
        }
      }
    } catch (syncErr) {
      console.error("Auto-syncing payments to bank transactions error:", syncErr);
    }

    const where: Record<string, unknown> = {
      bankAccount: { companyId },
    };

    if (bankAccountId && bankAccountId !== "all") {
      where.bankAccountId = bankAccountId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { payee: { contains: search, mode: "insensitive" } },
      ];
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    console.error("GET /api/bank-transactions error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/bank-transactions - Create a bank transaction
export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { bankAccountId, date, description, payee, type, amount, suggestedAccount, ruleApplied, status } = body;

    if (!bankAccountId || !description || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "bankAccountId, description, and amount are required" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    const created = await prisma.bankTransaction.create({
      data: {
        bankAccountId,
        date: date || new Date().toLocaleDateString("es-HN"),
        description,
        payee: payee || "Beneficiario No Indicado",
        type: type || "expense",
        amount: Number(amount),
        suggestedAccount: suggestedAccount || "5000 - Cost of Goods Sold",
        ruleApplied: ruleApplied || null,
        status: status || "porRevisar",
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/bank-transactions error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
