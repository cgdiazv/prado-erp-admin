import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId, getTenantSession, requirePlanFeature } from "@/lib/tenant";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getTenantSession(request);
    const planGate = requirePlanFeature(session, "production");
    if (planGate) return planGate;

    const companyId = session?.companyId || (await resolveCompanyId(request));
    const body = await request.json().catch(() => ({}));
    const { quantityProduced, notes } = body;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        items: true,
        bom: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Orden de trabajo no encontrada" },
        { status: 404 }
      );
    }

    if (workOrder.status === "COMPLETADA" || workOrder.inventoryDeducted) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta orden de trabajo ya se encuentra cerrada y con el inventario de materias primas rebajado.",
        },
        { status: 400 }
      );
    }

    if (workOrder.status === "CANCELADA") {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede cerrar una orden de trabajo que ha sido cancelada.",
        },
        { status: 400 }
      );
    }

    if (!workOrder.items || workOrder.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La orden de trabajo no tiene componentes o materias primas registradas para rebajar.",
        },
        { status: 400 }
      );
    }

    // 1. Validar existencias de TODAS las materias primas antes de rebajar
    const missingStock: Array<{
      sku: string;
      description: string;
      required: number;
      available: number;
      missing: number;
      unit: string;
    }> = [];

    const inventoryItemsToDeduct: Array<{
      inventoryItemId: string;
      quantityToDeduct: number;
      workOrderItemId: string;
    }> = [];

    for (const item of workOrder.items) {
      const requiredQty = Number(item.quantityRequired) || 0;
      if (requiredQty <= 0) continue;

      let invItem = null;
      if (item.inventoryItemId) {
        invItem = await prisma.inventoryItem.findFirst({
          where: { id: item.inventoryItemId, companyId },
        });
      }

      if (!invItem && item.sku) {
        invItem = await prisma.inventoryItem.findFirst({
          where: { sku: item.sku, companyId },
        });
      }

      const availableQty = invItem ? Number(invItem.quantity) || 0 : 0;

      if (!invItem || availableQty < requiredQty) {
        missingStock.push({
          sku: item.sku,
          description: item.description,
          required: requiredQty,
          available: availableQty,
          missing: requiredQty - availableQty,
          unit: item.unit || "Unidades",
        });
      } else {
        inventoryItemsToDeduct.push({
          inventoryItemId: invItem.id,
          quantityToDeduct: requiredQty,
          workOrderItemId: item.id,
        });
      }
    }

    // Si falta stock de al menos una materia prima, BLOQUEAR el cierre
    if (missingStock.length > 0) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          error: "Stock insuficiente para cerrar la orden de trabajo. Se debe abastecer el inventario antes de completar.",
          missingStock,
        },
        { status: 400 }
      );
    }

    // 2. Si todo tiene stock suficiente, ejecutar la rebaja atómica
    const finalProducedQty =
      quantityProduced !== undefined && Number(quantityProduced) > 0
        ? Number(quantityProduced)
        : workOrder.quantityPlanned;

    const todayDate = new Date().toISOString().split("T")[0];

    const result = await prisma.$transaction(async (tx) => {
      // Rebajar materias primas
      for (const deduction of inventoryItemsToDeduct) {
        await tx.inventoryItem.update({
          where: { id: deduction.inventoryItemId },
          data: {
            quantity: {
              decrement: deduction.quantityToDeduct,
            },
          },
        });

        await tx.workOrderItem.update({
          where: { id: deduction.workOrderItemId },
          data: {
            quantityConsumed: deduction.quantityToDeduct,
          },
        });
      }

      // 2. Incrementar automáticamente las existencias del producto terminado
      const finishedSku = workOrder.productSku || workOrder.bom?.finishedProductSku || null;
      let finishedItem = null;

      if (finishedSku) {
        finishedItem = await tx.inventoryItem.findFirst({
          where: { sku: finishedSku, companyId },
        });
      }

      if (!finishedItem && workOrder.productName) {
        finishedItem = await tx.inventoryItem.findFirst({
          where: { description: workOrder.productName, companyId },
        });
      }

      if (finishedItem) {
        await tx.inventoryItem.update({
          where: { id: finishedItem.id },
          data: {
            quantity: {
              increment: finalProducedQty,
            },
          },
        });
      } else {
        // Si no existe aún en el catálogo de inventario, registrar el producto terminado con las existencias producidas
        let skuToUse =
          finishedSku ||
          `PT-${workOrder.orderNumber?.replace(/[^a-zA-Z0-9]/g, "") || "PROD"}`;
        const existingGlobal = await tx.inventoryItem.findUnique({
          where: { sku: skuToUse },
        });
        if (existingGlobal) {
          skuToUse = `${skuToUse}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        await tx.inventoryItem.create({
          data: {
            companyId,
            sku: skuToUse,
            description: workOrder.productName || "Producto Terminado",
            quantity: finalProducedQty,
            cost: 0,
            price: 0,
            category: "Producto Terminado",
          },
        });
      }

      // Actualizar estado de la Orden de Trabajo a COMPLETADA
      const updatedOrder = await tx.workOrder.update({
        where: { id },
        data: {
          status: "COMPLETADA",
          completionDate: todayDate,
          quantityProduced: finalProducedQty,
          inventoryDeducted: true,
          notes: notes ? `${workOrder.notes ? workOrder.notes + " | " : ""}${notes}` : workOrder.notes,
        },
        include: {
          bom: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
          salesOrder: true,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: `Orden de trabajo cerrada y completada con éxito. Se rebajaron las materias primas del inventario y se ingresaron +${finalProducedQty} ${workOrder.unit} de "${workOrder.productName}" al stock de producto terminado.`,
      data: result,
    });
  } catch (error) {
    console.error("Error closing Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al cerrar la orden de trabajo" },
      { status: 500 }
    );
  }
}
