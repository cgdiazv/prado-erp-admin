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

    return NextResponse.json({ success: true, data: newPayment, journalEntry });
  } catch (error: unknown) {
    console.error("POST /api/payments error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
