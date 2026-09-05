import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postPurchaseInvoiceEntry } from "@/lib/accounting";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);

    const invoices = await db.purchaseInvoice.findMany({
      where: { companyId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    console.error("GET /api/purchase-invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch purchase invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);
    const body = await req.json();

    if (!body.invoiceNumber || !body.vendorName) {
      return NextResponse.json(
        { success: false, error: "N° de Factura de Proveedor y Nombre del Proveedor son obligatorios." },
        { status: 400 }
      );
    }

    const items = body.items || [];
    let subtotal = 0;

    items.forEach((it: any) => {
      const qty = Number(it.quantity) || 0;
      const cost = Number(it.unitCost) || 0;
      subtotal += qty * cost;
    });

    const tax = body.tax !== undefined ? Number(body.tax) : subtotal * 0.15;
    const total = subtotal + tax;

    // 1. Create Purchase Invoice
    const newInvoice = await db.purchaseInvoice.create({
      data: {
        companyId,
        invoiceNumber: body.invoiceNumber,
        purchaseOrderNumber: body.purchaseOrderNumber || null,
        vendorId: body.vendorId || null,
        vendorName: body.vendorName,
        issueDate: body.issueDate || new Date().toISOString().split("T")[0],
        dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        currency: body.currency || "USD",
        subtotal,
        tax,
        total,
        paymentStatus: body.paymentStatus || "PENDIENTE",
        inventoryStatus: "INGRESADO",
        notes: body.notes || null,
        items: {
          create: items.map((it: any) => ({
            sku: it.sku,
            description: it.description || "",
            quantity: Number(it.quantity) || 0,
            unitCost: Number(it.unitCost) || 0,
            totalCost: (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
            lotNumber: it.lotNumber || null,
          })),
        },
      },
      include: { items: true },
    });

    // 2. AUTOMATICALLY INCREASE INVENTORY STOCK & RECORD LOTS
    for (const item of items) {
      if (!item.sku) continue;
      const qtyToAdd = Number(item.quantity) || 0;
      if (qtyToAdd <= 0) continue;

      // Find inventory item by SKU
      const existingInvItem = await db.inventoryItem.findFirst({
        where: { sku: item.sku, companyId },
      });

      if (existingInvItem) {
        // Increase stock quantity & update average cost
        await db.inventoryItem.update({
          where: { id: existingInvItem.id },
          data: {
            quantity: existingInvItem.quantity + qtyToAdd,
            ...(Number(item.unitCost) > 0 && { cost: Number(item.unitCost) }),
          },
        });

        // Create ItemLot record if lotNumber is specified
        if (item.lotNumber && item.lotNumber.trim()) {
          await db.itemLot.create({
            data: {
              inventoryItemId: existingInvItem.id,
              lotNumber: item.lotNumber.trim(),
              quantity: qtyToAdd,
              notes: `Ingreso automático por Factura de Compra ${body.invoiceNumber}`,
            },
          });
        }
      }
    }

    // 3. AUTOMATIC DOUBLE-ENTRY ACCOUNTING POSTING
    let journalEntry = null;
    try {
      journalEntry = await postPurchaseInvoiceEntry({
        id: newInvoice.id,
        companyId,
        invoiceNumber: newInvoice.invoiceNumber,
        vendorName: newInvoice.vendorName,
        issueDate: newInvoice.issueDate,
        subtotal: newInvoice.subtotal,
        tax: newInvoice.tax,
        total: newInvoice.total,
        currency: newInvoice.currency,
      });
    } catch (accountingErr) {
      console.error("Error creating accounting entry for purchase invoice:", accountingErr);
    }

    return NextResponse.json({ success: true, data: newInvoice, journalEntry });
  } catch (error: any) {
    console.error("POST /api/purchase-invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create purchase invoice" },
      { status: 500 }
    );
  }
}
