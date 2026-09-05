import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// GET /api/bank-accounts - List connected bank accounts for current company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { companyId },
      include: {
        account: true,
        _count: {
          select: {
            transactions: {
              where: { status: "porRevisar" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = bankAccounts.map((b) => ({
      ...b,
      pendingCount: b._count.transactions,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    console.error("GET /api/bank-accounts error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/bank-accounts - Connect a new bank account for current company
export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { name, accountNumber, type, currency, bankBalance, bookBalance, color, tenantId } = body;

    if (!name || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "name and accountNumber are required" },
        { status: 400 }
      );
    }

    const maskedNumber = accountNumber.startsWith("••••") ? accountNumber : `•••• ${accountNumber.slice(-4)}`;
    const curr = currency || "USD";
    const balanceVal = Number(bankBalance) || 0;

    // 1. Generate unique GL Account code for Chart of Accounts
    const existingBankAccountsCount = await prisma.bankAccount.count({
      where: { companyId },
    });
    const glCode = `11${(0 + existingBankAccountsCount + 1).toString().padStart(2, "0")}`;
    const glName = `${name} (${maskedNumber}) ${curr}`;

    // 2. Create GL Account in Chart of Accounts automatically
    const createdGlAccount = await prisma.account.create({
      data: {
        companyId,
        code: glCode,
        name: glName,
        type: "Efectivo y equivalentes de efectivo",
        currency: curr,
        balance: balanceVal,
        isActive: true,
      },
    });

    // 3. Create BankAccount linked to GL Account
    const createdBank = await prisma.bankAccount.create({
      data: {
        companyId,
        tenantId: tenantId || null,
        name,
        accountNumber: maskedNumber,
        type: type || "Cuenta de cheques empresarial",
        currency: curr,
        bankBalance: balanceVal,
        bookBalance: Number(bookBalance) || balanceVal,
        color: color || (name.includes("BAC") ? "#dc2626" : name.includes("Atlántida") ? "#f59e0b" : "#0284c7"),
        status: "Conectado",
        lastUpdated: "Justo ahora",
        accountId: createdGlAccount.id,
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json({ success: true, data: createdBank }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/bank-accounts error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
