import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const companyId = await resolveCompanyId(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const quotes = await prisma.quote.findMany({
      where: { companyId },
      include: {
        lines: true,
        salesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            status: true,
            journalEntryId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filtrar si se proporcionó búsqueda o estado
    let filtered = quotes;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.quoteNumber.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          (c.salesRepName && c.salesRepName.toLowerCase().includes(q)) ||
          c.lines.some((l) => l.productName.toLowerCase().includes(q))
      );
    }

    if (status && status !== "ALL") {
      filtered = filtered.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }

    // Calcular KPIs
    const totalQuoted = quotes.reduce((acc, q) => acc + (q.total || 0), 0);
    const totalApproved = quotes
      .filter((q) => q.status === "Aprobada" || q.status === "Facturada")
      .reduce((acc, q) => acc + (q.total || 0), 0);
    const countBorrador = quotes.filter((q) => q.status === "Borrador").length;
    const countEnviada = quotes.filter((q) => q.status === "Enviada").length;
    const countAprobada = quotes.filter((q) => q.status === "Aprobada").length;
    const countFacturada = quotes.filter((q) => q.status === "Facturada").length;
    const countRechazada = quotes.filter((q) => q.status === "Rechazada").length;

    // Próximo correlativo sugerido
    const numbers = quotes
      .map((q) => {
        const match = q.quoteNumber.match(/COT-(\d+)-(\d+)/) || q.quoteNumber.match(/(\d+)/);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextSeq = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
    const year = new Date().getFullYear();
    const nextQuoteNumber = `COT-${year}-${String(nextSeq).padStart(4, "0")}`;

    return NextResponse.json({
      success: true,
      data: filtered,
      nextQuoteNumber,
      metrics: {
        totalQuotes: quotes.length,
        totalQuoted,
        totalApproved,
        countBorrador,
        countEnviada,
        countAprobada,
        countFacturada,
        countRechazada,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/quotes error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await resolveCompanyId(req);
    const body = await req.json();
    const {
      quoteNumber,
      customerId,
      customerName,
      customerRtn,
      customerAddress,
      customerEmail,
      customerPhone,
      quoteDate = new Date().toISOString().split("T")[0],
      validUntil,
      paymentTerms = "Neto 30 días",
      currency = "USD",
      salesRepId,
      salesRepName,
      notes,
      termsConditions,
      discount = 0,
      taxRate = 15,
      status = "Borrador",
      lines = [],
    } = body;

    if (!quoteNumber || !customerName || lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "N.º de cotización, cliente y al menos un ítem son obligatorios." },
        { status: 400 }
      );
    }

    // Calcular montos de forma precisa
    const calculatedLines = lines.map((l: any) => {
      const qty = Number(l.quantity) || 1;
      const rate = Number(l.rate) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      return {
        productName: l.productName || "Artículo o Servicio",
        sku: l.sku || null,
        description: l.description || null,
        quantity: qty,
        rate: rate,
        amount: amount,
      };
    });

    const subtotal = calculatedLines.reduce((acc: number, l: any) => acc + l.amount, 0);
    const discNum = Math.max(0, Number(discount) || 0);
    const taxableBase = Math.max(0, subtotal - discNum);
    const taxNum = Math.round(((taxableBase * (Number(taxRate) || 0)) / 100) * 100) / 100;
    const total = Math.round((taxableBase + taxNum) * 100) / 100;

    // Fecha de validez por defecto (30 días)
    const defValidUntil =
      validUntil ||
      new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    // Comprobar si ya existe el número de cotización en esta empresa
    const existing = await prisma.quote.findFirst({
      where: { quoteNumber, companyId },
    });

    let savedQuote;
    if (existing) {
      // Si existe y ya fue facturada, no permitir sobreescritura total
      if (existing.status === "Facturada") {
        return NextResponse.json(
          { success: false, error: "Esta cotización ya fue convertida a Factura y no puede ser modificada." },
          { status: 400 }
        );
      }

      await prisma.quoteLine.deleteMany({
        where: { quoteId: existing.id },
      });

      savedQuote = await prisma.quote.update({
        where: { id: existing.id },
        data: {
          customerId: customerId || null,
          customerName,
          customerRtn: customerRtn || null,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          quoteDate,
          validUntil: defValidUntil,
          paymentTerms,
          currency,
          salesRepId: salesRepId || null,
          salesRepName: salesRepName || null,
          notes: notes || null,
          termsConditions: termsConditions || null,
          discount: discNum,
          subtotal,
          taxRate: Number(taxRate) || 15,
          tax: taxNum,
          total,
          status,
          lines: {
            create: calculatedLines,
          },
        },
        include: { lines: true, salesInvoice: true },
      });
    } else {
      savedQuote = await prisma.quote.create({
        data: {
          companyId,
          quoteNumber,
          customerId: customerId || null,
          customerName,
          customerRtn: customerRtn || null,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          quoteDate,
          validUntil: defValidUntil,
          paymentTerms,
          currency,
          salesRepId: salesRepId || null,
          salesRepName: salesRepName || null,
          notes: notes || null,
          termsConditions: termsConditions || null,
          discount: discNum,
          subtotal,
          taxRate: Number(taxRate) || 15,
          tax: taxNum,
          total,
          status,
          lines: {
            create: calculatedLines,
          },
        },
        include: { lines: true, salesInvoice: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: savedQuote,
      message: "Cotización guardada exitosamente.",
    });
  } catch (error: unknown) {
    console.error("POST /api/quotes error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const companyId = await resolveCompanyId(req);
    const body = await req.json();
    const { id, status, notes, termsConditions } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de cotización requerido." }, { status: 400 });
    }

    const existing = await prisma.quote.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Cotización no encontrada." }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(termsConditions !== undefined ? { termsConditions } : {}),
      },
      include: { lines: true, salesInvoice: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Estado de cotización actualizado a "${updated.status}".`,
    });
  } catch (error: unknown) {
    console.error("PUT /api/quotes error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
