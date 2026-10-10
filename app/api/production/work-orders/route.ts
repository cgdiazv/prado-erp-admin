import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId, getTenantSession, requirePlanFeature } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "ALL";
    const priority = searchParams.get("priority") || "ALL";
    const salesOrderId = searchParams.get("salesOrderId");

    const where: any = { companyId };
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (salesOrderId) {
      where.salesOrderId = salesOrderId;
    }

    let orders = await prisma.workOrder.findMany({
      where,
      include: {
        bom: {
          select: {
            id: true,
            code: true,
            name: true,
            outputQuantity: true,
            outputUnit: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                description: true,
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (search) {
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          (o.salesOrderNumber && o.salesOrderNumber.toLowerCase().includes(search)) ||
          (o.customerName && o.customerName.toLowerCase().includes(search)) ||
          o.productName.toLowerCase().includes(search) ||
          (o.productSku && o.productSku.toLowerCase().includes(search)) ||
          o.bom.name.toLowerCase().includes(search) ||
          o.bom.code.toLowerCase().includes(search)
      );
    }

    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.workOrder.count({
      where: {
        companyId,
        orderNumber: { startsWith: `OT-${currentYear}` },
      },
    });
    const nextOrderNumber = `OT-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;

    // Métricas
    const allOrders = await prisma.workOrder.findMany({
      where: { companyId },
      select: { status: true, quantityPlanned: true },
    });

    const metrics = {
      totalOrders: allOrders.length,
      planificadas: allOrders.filter((o) => o.status === "PLANIFICADA").length,
      enProceso: allOrders.filter((o) => o.status === "EN_PROCESO").length,
      completadas: allOrders.filter((o) => o.status === "COMPLETADA").length,
      canceladas: allOrders.filter((o) => o.status === "CANCELADA").length,
      totalUnidadesPlanificadas: allOrders.reduce((sum, o) => sum + (o.quantityPlanned || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: orders,
      nextOrderNumber,
      metrics,
    });
  } catch (error) {
    console.error("Error fetching Work Orders:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las órdenes de trabajo" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    const planGate = requirePlanFeature(session, "production");
    if (planGate) return planGate;

    const companyId = session?.companyId || (await resolveCompanyId(request));
    const body = await request.json();

    const {
      orderNumber,
      bomId,
      salesOrderId,
      salesOrderNumber,
      customerName,
      productSku,
      productName,
      quantityPlanned = 1,
      unit = "Unidades",
      startDate,
      dueDate,
      priority = "MEDIA",
      warehouse = "Bodega Principal Zip Búfalo",
      notes,
      customItems, // Opcional si se ajustaron insumos manualmente
    } = body;

    if (!bomId) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar una lista de materiales (BOM) para la orden de trabajo" },
        { status: 400 }
      );
    }

    const bom = await prisma.bom.findFirst({
      where: { id: bomId, companyId },
      include: { items: true },
    });

    if (!bom) {
      return NextResponse.json(
        { success: false, error: "La lista de materiales (BOM) seleccionada no existe o no pertenece a esta empresa" },
        { status: 404 }
      );
    }

    // Auto generar número de orden si no viene
    let woNumber = orderNumber?.trim();
    if (!woNumber) {
      const currentYear = new Date().getFullYear();
      const countThisYear = await prisma.workOrder.count({
        where: {
          companyId,
          orderNumber: { startsWith: `OT-${currentYear}` },
        },
      });
      woNumber = `OT-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;
    }

    const existing = await prisma.workOrder.findFirst({
      where: { companyId, orderNumber: woNumber },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe una orden de trabajo con el número ${woNumber}` },
        { status: 400 }
      );
    }

    const qtyPlanned = Math.max(0.01, Number(quantityPlanned) || 1);
    const factor = bom.outputQuantity > 0 ? qtyPlanned / bom.outputQuantity : 1;

    // Calcular insumos requeridos basados en el BOM o en customItems si fueron modificados
    let workOrderItemsData: any[] = [];
    if (Array.isArray(customItems) && customItems.length > 0) {
      workOrderItemsData = customItems.map((it: any) => ({
        inventoryItemId: it.inventoryItemId || null,
        sku: it.sku?.trim() || "INSUMO",
        description: it.description?.trim() || "",
        quantityRequired: Number(it.quantityRequired) || 1,
        quantityConsumed: 0,
        unit: it.unit || "Unidades",
        unitCost: Number(it.unitCost) || 0,
        notes: it.notes || null,
      }));
    } else {
      workOrderItemsData = bom.items.map((it) => ({
        inventoryItemId: it.inventoryItemId,
        sku: it.sku,
        description: it.description,
        quantityRequired: it.quantityRequired * factor,
        quantityConsumed: 0,
        unit: it.unit,
        unitCost: it.estimatedCost,
        notes: it.notes,
      }));
    }

    const createdOrder = await prisma.workOrder.create({
      data: {
        companyId,
        orderNumber: woNumber,
        bomId: bom.id,
        salesOrderId: salesOrderId || null,
        salesOrderNumber: salesOrderNumber?.trim() || null,
        customerName: customerName?.trim() || null,
        productSku: productSku?.trim() || bom.finishedProductSku || null,
        productName: productName?.trim() || bom.finishedProductName,
        quantityPlanned: qtyPlanned,
        quantityProduced: 0,
        unit: unit || bom.outputUnit || "Unidades",
        startDate: startDate || new Date().toISOString().split("T")[0],
        dueDate: dueDate || null,
        status: "PLANIFICADA",
        priority: priority || "MEDIA",
        warehouse: warehouse || "Bodega Principal Zip Búfalo",
        inventoryDeducted: false,
        notes: notes?.trim() || null,
        items: {
          create: workOrderItemsData,
        },
      },
      include: {
        bom: true,
        items: true,
        salesOrder: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Orden de trabajo creada con éxito",
      data: createdOrder,
    });
  } catch (error) {
    console.error("Error creating Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la orden de trabajo" },
      { status: 500 }
    );
  }
}
