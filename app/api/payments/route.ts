import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postCustomerPaymentEntry } from "@/lib/accounting";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const payments = await prisma.payment.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    console.error("GET /api/payments error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      sendLater,
      paymentDate,
      paymentMethod,
      referenceNumber,
      depositAccount,
      amount,
      note,
      currency,
    } = body;

    if (!customerName || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Cliente, fecha, método e importe son requeridos." },
        { status: 400 }
      );
    }

    const newPayment = await prisma.payment.create({
      data: {
        companyId,
        customerId: customerId || null,
        customerName,
        customerEmail: customerEmail || null,
        sendLater: Boolean(sendLater),
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        depositAccount: depositAccount || "Cash and cash equivalents",
        amount: parseFloat(amount) || 0,
        note: note || null,
      },
    });

    // Automatic accounting posting
    let journalEntry = null;
    try {
      journalEntry = await postCustomerPaymentEntry({
        id: newPayment.id,
        companyId,
        paymentDate: newPayment.paymentDate,
        customerName: newPayment.customerName,
        amount: newPayment.amount,
        paymentMethod: newPayment.paymentMethod,
        referenceNumber: newPayment.referenceNumber || undefined,
        depositAccount: newPayment.depositAccount,
        currency: currency || undefined,
      });
    } catch (accountingErr) {
      console.error("Error creating accounting entry for payment:", accountingErr);
    }

    // Automatically update sales invoice status to "Cobrada"
    try {
      let targetInvoiceNumber = (body.invoiceNumber || "").trim();
      if (!targetInvoiceNumber && referenceNumber) {
        targetInvoiceNumber = referenceNumber.replace(/^FAC-/, "").trim();
      }

      if (targetInvoiceNumber) {
        await prisma.salesInvoice.updateMany({
          where: {
            companyId,
            invoiceNumber: targetInvoiceNumber,
          },
          data: {
            status: "Cobrada",
          },
        });
      } else if (customerId || customerName) {
        const matchingInvoice = await prisma.salesInvoice.findFirst({
          where: {
            companyId,
            ...(customerId ? { customerId } : { customerName }),
            status: { in: ["Pendiente", "Emitida"] },
            total: parseFloat(amount),
          },
          orderBy: { invoiceDate: "asc" },
        });

        if (matchingInvoice) {
          await prisma.salesInvoice.update({
            where: { id: matchingInvoice.id },
            data: { status: "Cobrada" },
          });
        }
      }
    } catch (invErr) {
      console.error("Error updating invoice status after payment:", invErr);
    }

    // Update BankAccount bookBalance and create BankTransaction if assigned to a bank account
    let bankTransaction = null;
    try {
      let targetBank: any = null;
      if (body.bankAccountId) {
        targetBank = await prisma.bankAccount.findFirst({
          where: { id: body.bankAccountId, companyId },
        });
      }

      if (!targetBank && depositAccount) {
        const companyBanks = await prisma.bankAccount.findMany({
          where: { companyId },
        });

        targetBank =
          companyBanks.find((b) => b.id === depositAccount) ||
          companyBanks.find(
            (b) =>
              depositAccount.toLowerCase().includes(b.name.toLowerCase()) ||
              b.name.toLowerCase().includes(depositAccount.toLowerCase())
          );

        if (
          !targetBank &&
          companyBanks.length === 1 &&
          depositAccount !== "Cash and cash equivalents" &&
          !depositAccount.includes("Caja General")
        ) {
          targetBank = companyBanks[0];
        }
      }

      if (targetBank) {
        await prisma.bankAccount.update({
          where: { id: targetBank.id },
          data: {
            bookBalance: {
              increment: newPayment.amount,
            },
            bankBalance: {
              increment: newPayment.amount,
            },
          },
        });

        bankTransaction = await prisma.bankTransaction.create({
          data: {
            bankAccountId: targetBank.id,
            date: newPayment.paymentDate || new Date().toLocaleDateString("es-HN"),
            description: `Pago recibido de cliente: ${newPayment.customerName}${newPayment.referenceNumber ? ` - Ref: ${newPayment.referenceNumber}` : ""}`,
            payee: newPayment.customerName,
            type: "deposit",
            amount: newPayment.amount,
            suggestedAccount: newPayment.depositAccount || "1100 - Bancos Nacionales",
            status: "porRevisar",
          },
        });
      }
    } catch (bankErr) {
      console.error("Error updating bank account/creating transaction for payment:", bankErr);
    }

    return NextResponse.json({ success: true, data: newPayment, journalEntry, bankTransaction });
  } catch (error: unknown) {
    console.error("POST /api/payments error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
