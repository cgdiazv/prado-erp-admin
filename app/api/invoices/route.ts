import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSalesInvoiceEntry } from "@/lib/accounting";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);

    const invoices = await prisma.salesInvoice.findMany({
      where: { companyId },
      include: {
        lines: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: unknown) {
    console.error("GET /api/invoices error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const {
      invoiceNumber,
      customerId,
      customerName,
      customerRtn,
      customerAddress,
      customerEmail,
      invoiceDate = new Date().toISOString().split("T")[0],
      dueDate,
      paymentTerms = "Neto 30 días",
      currency = "USD",
      cai,
      discount = 0,
      importeExento = 0,
      importeExonerado = 0,
      impGravado15 = 0,
      impGravado18 = 0,
      subtotal = 0,
      isv15 = 0,
      isv18 = 0,
      total = 0,
      status = "Emitida",
      lines = [],
    } = body;

    if (!invoiceNumber || !customerName || total <= 0) {
      return NextResponse.json(
        { success: false, error: "Número de factura, cliente y total válido son requeridos." },
        { status: 400 }
      );
    }

    // Upsert SalesInvoice in DB isolated by company
    const existing = await prisma.salesInvoice.findFirst({
      where: { invoiceNumber, companyId },
    });

    let savedInvoice;
    if (existing) {
      // Delete old lines and replace with new
      await prisma.salesInvoiceLine.deleteMany({
        where: { salesInvoiceId: existing.id },
      });

      savedInvoice = await prisma.salesInvoice.update({
        where: { id: existing.id },
        data: {
          customerId: customerId || null,
          customerName,
          customerRtn: customerRtn || null,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          invoiceDate,
          dueDate: dueDate || null,
          paymentTerms,
          currency,
          cai: cai || null,
          discount: Number(discount) || 0,
          importeExento: Number(importeExento) || 0,
          importeExonerado: Number(importeExonerado) || 0,
          impGravado15: Number(impGravado15) || 0,
          impGravado18: Number(impGravado18) || 0,
          subtotal: Number(subtotal) || 0,
          isv15: Number(isv15) || 0,
          isv18: Number(isv18) || 0,
          total: Number(total) || 0,
          status,
          lines: {
            create: lines.map((l: any) => ({
              productName: l.productName || "Artículo",
              sku: l.sku || null,
              description: l.description || null,
              quantity: Number(l.quantity) || 1,
              rate: Number(l.rate) || 0,
              amount: Number(l.amount) || 0,
            })),
          },
        },
        include: { lines: true },
      });
    } else {
      savedInvoice = await prisma.salesInvoice.create({
        data: {
          companyId,
          invoiceNumber,
          customerId: customerId || null,
          customerName,
          customerRtn: customerRtn || null,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          invoiceDate,
          dueDate: dueDate || null,
          paymentTerms,
          currency,
          cai: cai || null,
          discount: Number(discount) || 0,
          importeExento: Number(importeExento) || 0,
          importeExonerado: Number(importeExonerado) || 0,
          impGravado15: Number(impGravado15) || 0,
          impGravado18: Number(impGravado18) || 0,
          subtotal: Number(subtotal) || 0,
          isv15: Number(isv15) || 0,
          isv18: Number(isv18) || 0,
          total: Number(total) || 0,
          status,
          lines: {
            create: lines.map((l: any) => ({
              productName: l.productName || "Artículo",
              sku: l.sku || null,
              description: l.description || null,
              quantity: Number(l.quantity) || 1,
              rate: Number(l.rate) || 0,
              amount: Number(l.amount) || 0,
            })),
          },
        },
        include: { lines: true },
      });
    }

    // AUTOMATIC DOUBLE-ENTRY ACCOUNTING POSTING
    let journalEntry = null;
    try {
      journalEntry = await postSalesInvoiceEntry({
        id: savedInvoice.id,
        companyId,
        invoiceNumber: savedInvoice.invoiceNumber,
        customerName: savedInvoice.customerName,
        invoiceDate: savedInvoice.invoiceDate,
        subtotal: savedInvoice.subtotal,
        total: savedInvoice.total,
        isv15: savedInvoice.isv15,
        isv18: savedInvoice.isv18,
        discount: savedInvoice.discount,
        currency: savedInvoice.currency,
      });

      if (journalEntry) {
        await prisma.salesInvoice.update({
          where: { id: savedInvoice.id },
          data: { journalEntryId: journalEntry.id },
        });
      }
    } catch (accountingErr: any) {
      console.error("Error creating accounting entry for invoice:", accountingErr);
    }

    return NextResponse.json({
      success: true,
      data: savedInvoice,
      journalEntry,
      message: "Factura guardada y contabilizada automáticamente en el Libro Diario.",
    });
  } catch (error: unknown) {
    console.error("POST /api/invoices error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
