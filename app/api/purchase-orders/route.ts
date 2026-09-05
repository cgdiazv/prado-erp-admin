import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const whereClause: Record<string, unknown> = { companyId };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (vendorId && vendorId !== "ALL") {
      whereClause.vendorId = vendorId;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (from || to) {
      whereClause.issueDate = {};
      if (from) (whereClause.issueDate as any).gte = from;
      if (to) (whereClause.issueDate as any).lte = to;
    }

    const orders = await db.purchaseOrder.findMany({
      where: whereClause,
      include: {
        items: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered = orders;
    if (search) {
      filtered = orders.filter((o: any) =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.vendorName.toLowerCase().includes(search) ||
        (o.category && o.category.toLowerCase().includes(search)) ||
        o.items.some((it: any) =>
          it.productName.toLowerCase().includes(search) ||
          (it.sku && it.sku.toLowerCase().includes(search))
        )
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("GET /api/purchase-orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener órdenes de compra" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(request);
    const body = await request.json();

    const {
      orderNumber: inputOrderNumber,
      vendorId,
      vendorName,
      vendorEmail,
      vendorAddress,
      category = "General",
      issueDate = new Date().toISOString().split("T")[0],
      expectedDate,
      paymentTerms = "Crédito 30 días",
      currency = "USD",
      status = "Pendiente",
      notes,
      items = [],
    } = body;

    if (!vendorName || !vendorName.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del proveedor es obligatorio." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debe incluir al menos un ítem o producto en la orden de compra." },
        { status: 400 }
      );
    }

    // Generate unique order number if not provided or format correctly
    let finalOrderNumber = inputOrderNumber?.trim();
    if (!finalOrderNumber) {
      const currentYear = new Date().getFullYear();
      const countThisYear = await db.purchaseOrder.count({ where: { companyId } });
      const nextNum = String(countThisYear + 1).padStart(4, "0");
      finalOrderNumber = `OC-${currentYear}-${nextNum}`;
    }

    // Check uniqueness
    const existing = await db.purchaseOrder.findFirst({
      where: { orderNumber: finalOrderNumber, companyId },
    });
    if (existing) {
      // If already exists, append random suffix
      finalOrderNumber = `${finalOrderNumber}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Calculate totals
    let subtotal = 0;
    const mappedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unitCost ?? it.rate) || 0;
      const totalCost = qty * rate;
      subtotal += totalCost;
      return {
        productName: it.productName || "Insumo o Material",
        sku: it.sku || null,
        description: it.description || null,
        quantity: qty,
        unitCost: rate,
        totalCost,
      };
    });

    const tax = body.tax !== undefined ? Number(body.tax) : Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const newOrder = await db.purchaseOrder.create({
      data: {
        companyId,
        orderNumber: finalOrderNumber,
        vendorId: vendorId || null,
        vendorName: vendorName.trim(),
        vendorEmail: vendorEmail || null,
        vendorAddress: vendorAddress || null,
        category,
        issueDate,
        expectedDate: expectedDate || null,
        paymentTerms,
        currency,
        subtotal,
        tax,
        total,
        status,
        notes: notes || null,
        items: {
          create: mappedItems,
        },
      },
      include: {
        items: true,
        vendor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: `Orden de compra ${finalOrderNumber} creada exitosamente.`,
    });
  } catch (error: any) {
    console.error("POST /api/purchase-orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear la orden de compra" },
      { status: 500 }
    );
  }
}
