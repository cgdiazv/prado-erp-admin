import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "ALL";
    const customerId = searchParams.get("customerId");

    // Filtros
    const where: any = { companyId };
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    let orders = await prisma.salesOrder.findMany({
      where,
      include: {
        items: true,
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
          },
        },
        salesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    });

    if (search) {
      orders = orders.filter(
        (o: any) =>
          o.orderNumber.toLowerCase().includes(search) ||
          (o.customerPoNumber && o.customerPoNumber.toLowerCase().includes(search)) ||
          o.customerName.toLowerCase().includes(search) ||
          (o.quoteNumber && o.quoteNumber.toLowerCase().includes(search)) ||
          (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(search)) ||
          o.items.some(
            (it: any) =>
              it.productName.toLowerCase().includes(search) ||
              (it.sku && it.sku.toLowerCase().includes(search))
          )
      );
    }

    // Calcular próximo correlativo PV-YYYY-####
    const currentYear = new Date().getFullYear();
    const totalOrdersThisYear = await prisma.salesOrder.count({
      where: {
        orderNumber: {
          startsWith: `PV-${currentYear}`,
        },
      },
    });
    const nextNumber = totalOrdersThisYear + 1;
    const nextOrderNumber = `PV-${currentYear}-${String(nextNumber).padStart(4, "0")}`;

    // Métricas por estado
    const allOrders = await prisma.salesOrder.findMany({
      select: {
        status: true,
        total: true,
      },
    });

    const metrics = {
      totalOrders: allOrders.length,
      borradores: allOrders.filter((o: any) => o.status === "BORRADOR").length,
      confirmados: allOrders.filter((o: any) => o.status === "CONFIRMADO").length,
      enPreparacion: allOrders.filter((o: any) => o.status === "EN_PREPARACION").length,
      despachados: allOrders.filter((o: any) => o.status === "DESPACHADO" || o.status === "DESPACHADO_PARCIAL").length,
      facturados: allOrders.filter((o: any) => o.status === "FACTURADO").length,
      totalMonto: allOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0),
      montoDespachadoSinFacturar: allOrders
        .filter((o: any) => o.status === "DESPACHADO")
        .reduce((acc: number, o: any) => acc + (o.total || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: orders,
      metrics,
      nextOrderNumber,
    });
  } catch (error: any) {
    console.error("GET /api/sales-orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener pedidos de venta" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();

    const {
      orderNumber,
      customerPoNumber,
      quoteId,
      quoteNumber,
      customerId,
      customerName,
      customerRtn,
      customerAddress,
      customerEmail,
      customerPhone,
      orderDate,
      expectedDeliveryDate,
      paymentTerms,
      currency,
      salesRepId,
      salesRepName,
      warehouse,
      notes,
      shippingNotes,
      discount,
      subtotal,
      taxRate,
      tax,
      total,
      status,
      items,
    } = body;

    if (!customerName?.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "El pedido debe contener al menos un producto o servicio." },
        { status: 400 }
      );
    }

    // Validar o generar número de pedido
    let finalOrderNumber = orderNumber?.trim();
    if (!finalOrderNumber) {
      const currentYear = new Date().getFullYear();
      const count = await prisma.salesOrder.count({
        where: { orderNumber: { startsWith: `PV-${currentYear}` }, companyId },
      });
      finalOrderNumber = `PV-${currentYear}-${String(count + 1).padStart(4, "0")}`;
    }

    // Verificar si ya existe en esta empresa
    const existing = await prisma.salesOrder.findFirst({
      where: { orderNumber: finalOrderNumber, companyId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un pedido con el número ${finalOrderNumber}.` },
        { status: 400 }
      );
    }

    // Crear pedido con ítems
    const newOrder = await prisma.salesOrder.create({
      data: {
        companyId,
        orderNumber: finalOrderNumber,
        customerPoNumber: customerPoNumber?.trim() || null,
        quoteId: quoteId || null,
        quoteNumber: quoteNumber?.trim() || null,
        customerId: customerId || null,
        customerName: customerName.trim(),
        customerRtn: customerRtn?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        orderDate: orderDate || new Date().toISOString().split("T")[0],
        expectedDeliveryDate: expectedDeliveryDate || null,
        paymentTerms: paymentTerms || "Neto 30 días",
        currency: currency || "USD",
        salesRepId: salesRepId || null,
        salesRepName: salesRepName?.trim() || null,
        warehouse: warehouse || "Bodega Principal Zip Búfalo",
        notes: notes?.trim() || null,
        shippingNotes: shippingNotes?.trim() || null,
        discount: Number(discount) || 0,
        subtotal: Number(subtotal) || 0,
        taxRate: Number(taxRate) ?? 15,
        tax: Number(tax) || 0,
        total: Number(total) || 0,
        status: status || "CONFIRMADO",
        items: {
          create: items.map((it: any) => ({
            productName: it.productName?.trim() || "Producto",
            sku: it.sku?.trim() || null,
            description: it.description?.trim() || null,
            quantityOrdered: Number(it.quantityOrdered || it.quantity) || 1,
            quantityCommitted: Number(it.quantityCommitted || it.quantityOrdered || it.quantity) || 1,
            quantityShipped: Number(it.quantityShipped) || 0,
            quantityInvoiced: Number(it.quantityInvoiced) || 0,
            rate: Number(it.rate) || 0,
            amount: Number(it.amount) || 0,
            notes: it.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Si viene de una cotización, actualizar el estado de la cotización
    if (quoteId) {
      await prisma.quote
        .update({
          where: { id: quoteId },
          data: { status: "Aprobada" },
        })
        .catch(() => null);
    }

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: `Pedido de venta ${finalOrderNumber} creado exitosamente.`,
    });
  } catch (error: any) {
    console.error("POST /api/sales-orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear pedido de venta" },
      { status: 500 }
    );
  }
}
