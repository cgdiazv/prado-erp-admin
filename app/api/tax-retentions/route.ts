import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postTaxRetentionEntry } from "@/lib/accounting";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");
    const month = searchParams.get("month"); // e.g. "2026-09"

    const where: any = { companyId };
    if (providerId) where.providerId = providerId;
    if (status && status !== "ALL") where.status = status;
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end,
      };
    }

    const retentions = await db.taxRetention.findMany({
      where,
      include: {
        provider: true,
        purchaseInvoice: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: retentions });
  } catch (error: any) {
    console.error("GET /api/tax-retentions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener retenciones",
        debugType: typeof (prisma as any).taxRetention,
        debugKeys: Object.keys(prisma as any).filter((k) => !k.startsWith("$") && !k.startsWith("_")),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);
    const body = await req.json();

    const {
      providerId,
      purchaseInvoiceId,
      baseAmount,
      retentionRate,
      retentionType = "ISV_1",
      cai,
      notes,
      date = new Date().toISOString(),
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "El proveedor es obligatorio para emitir la retención." },
        { status: 400 }
      );
    }

    const numBase = Number(baseAmount);
    const numRate = Number(retentionRate);

    if (isNaN(numBase) || numBase <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto base debe ser un valor mayor a cero." },
        { status: 400 }
      );
    }

    if (isNaN(numRate) || numRate <= 0) {
      return NextResponse.json(
        { success: false, error: "El porcentaje de retención debe ser mayor a cero." },
        { status: 400 }
      );
    }

    // Calculate retention amount
    const retentionAmount =
      body.retentionAmount !== undefined
        ? Math.round(Number(body.retentionAmount) * 100) / 100
        : Math.round(((numBase * numRate) / 100) * 100) / 100;

    // Fetch provider info
    const provider = await db.vendor.findFirst({
      where: { id: providerId, companyId },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Proveedor no encontrado." },
        { status: 404 }
      );
    }

    // Optional invoice check
    let invoiceNumber: string | undefined = undefined;
    if (purchaseInvoiceId) {
      const inv = await db.purchaseInvoice.findFirst({
        where: { id: purchaseInvoiceId, companyId },
      });
      if (inv) {
        invoiceNumber = inv.invoiceNumber;
      }
    }

    // Generate or format correlative retention number
    let retentionNumber = body.retentionNumber?.trim();
    if (!retentionNumber) {
      const year = new Date(date).getFullYear() || new Date().getFullYear();
      const prefix = `RET-${year}-`;
      const lastRetention = await db.taxRetention.findFirst({
        where: { retentionNumber: { startsWith: prefix }, companyId },
        orderBy: { retentionNumber: "desc" },
      });

      let nextCorrelative = 1;
      if (lastRetention) {
        const parts = lastRetention.retentionNumber.split("-");
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextCorrelative = lastNum + 1;
        }
      }
      retentionNumber = `${prefix}${String(nextCorrelative).padStart(4, "0")}`;
    } else {
      // Check if custom correlative already exists
      const existing = await db.taxRetention.findFirst({
        where: { retentionNumber, companyId },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `El correlativo de comprobante ${retentionNumber} ya fue emitido previamente.`,
          },
          { status: 400 }
        );
      }
    }

    // 1. Create TaxRetention record
    const retention = await db.taxRetention.create({
      data: {
        companyId,
        retentionNumber,
        providerId,
        purchaseInvoiceId: purchaseInvoiceId || null,
        baseAmount: numBase,
        retentionRate: numRate,
        retentionAmount,
        retentionType,
        status: "ISSUED",
        cai: cai || null,
        notes: notes || null,
        date: new Date(date),
      },
      include: {
        provider: true,
        purchaseInvoice: true,
      },
    });

    // 2. Automatically post Double-Entry Accounting Entry:
    // Débito: 2000 Cuentas por Pagar Proveedores (Disminuye pasivo con proveedor)
    // Crédito: 2160 Retenciones Fiscales por Pagar SAR (Registra pasivo con SAR)
    let journalEntry = null;
    try {
      journalEntry = await postTaxRetentionEntry({
        companyId,
        retentionNumber: retention.retentionNumber,
        providerName: provider.name,
        date: new Date(date).toISOString().split("T")[0],
        retentionAmount,
        retentionType,
        invoiceNumber,
        currency: provider.currency || "USD",
      });

      if (journalEntry?.id) {
        await db.taxRetention.update({
          where: { id: retention.id },
          data: { journalEntryId: journalEntry.id },
        });
        retention.journalEntryId = journalEntry.id;
      }
    } catch (accErr: any) {
      console.error("Error al registrar asiento contable de retención:", accErr);
    }

    return NextResponse.json({
      success: true,
      data: retention,
      journalEntry,
    });
  } catch (error: any) {
    console.error("POST /api/tax-retentions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al emitir comprobante de retención" },
      { status: 500 }
    );
  }
}
