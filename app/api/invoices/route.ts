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
              productName: l.productName || l.description || l.sku || "Artículo",
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
              productName: l.productName || l.description || l.sku || "Artículo",
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

    // AUTOMATIC INVENTORY STOCK DEDUCTION
    try {
      for (const line of lines) {
        const qty = Number(line.quantity) || 1;
        let item = null;
        if (line.productId) {
          item = await prisma.inventoryItem.findFirst({
            where: { id: line.productId, companyId },
          });
        }
        if (!item && line.sku) {
          item = await prisma.inventoryItem.findFirst({
            where: { sku: line.sku, companyId },
          });
        }

        if (item) {
          const newQty = Math.max(0, item.quantity - qty);
          await prisma.inventoryItem.update({
            where: { id: item.id },
            data: { quantity: newQty },
          });

          // Decrement lot if applicable
          const lotNum = line.selectedLot || line.lotNumber;
          if (lotNum) {
            const lot = await prisma.itemLot.findFirst({
              where: { inventoryItemId: item.id, lotNumber: lotNum },
            });
            if (lot) {
              await prisma.itemLot.update({
                where: { id: lot.id },
                data: { quantity: Math.max(0, lot.quantity - qty) },
              });
            }
          }

          // Mark serial as sold if applicable
          const serialNum = line.selectedSerial || line.serialNumber;
          if (serialNum) {
            const serial = await prisma.itemSerial.findFirst({
              where: { inventoryItemId: item.id, serialNumber: serialNum },
            });
            if (serial) {
              await prisma.itemSerial.update({
                where: { id: serial.id },
                data: { status: "VENDIDO" },
              });
            }
          }
        }
      }
    } catch (invErr: any) {
      console.error("Error deducting inventory for invoice:", invErr);
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
