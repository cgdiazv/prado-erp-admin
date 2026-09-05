import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// PATCH /api/bank-accounts/[id] - Update a bank account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { name, accountNumber, type, currency, bankBalance, bookBalance, color, status } = body;

    const existing = await prisma.bankAccount.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Cuenta bancaria no encontrada" }, { status: 404 });
    }

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(accountNumber && {
          accountNumber: accountNumber.startsWith("••••")
            ? accountNumber
            : `•••• ${accountNumber.slice(-4)}`,
        }),
        ...(type && { type }),
        ...(currency && { currency }),
        ...(bankBalance !== undefined && { bankBalance: Number(bankBalance) }),
        ...(bookBalance !== undefined && { bookBalance: Number(bookBalance) }),
        ...(color && { color }),
        ...(status && { status }),
        lastUpdated: "Justo ahora",
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/bank-accounts/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/bank-accounts/[id] - Delete a bank account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);

    const existing = await prisma.bankAccount.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Cuenta bancaria no encontrada" }, { status: 404 });
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Cuenta bancaria eliminada" });
  } catch (error: unknown) {
    console.error("DELETE /api/bank-accounts/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
