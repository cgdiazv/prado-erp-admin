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
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: { id: deduction.inventoryItemId, companyId },
        });
        if (!inventoryItem || inventoryItem.quantity < deduction.quantityToDeduct) {
          throw new Error("Las existencias cambiaron durante el cierre. Actualice e intente nuevamente.");
        }

        const deductionResult = await tx.inventoryItem.updateMany({
          where: {
            id: deduction.inventoryItemId,
            companyId,
            quantity: { gte: deduction.quantityToDeduct },
          },
          data: {
            quantity: { decrement: deduction.quantityToDeduct },
          },
        });
        if (deductionResult.count !== 1) {
          throw new Error("Las existencias cambiaron durante el cierre. Actualice e intente nuevamente.");
        }

        const inventoryAfter = await tx.inventoryItem.findUnique({
          where: { id: deduction.inventoryItemId },
        });
        if (!inventoryAfter) {
          throw new Error("No se encontró un artículo de inventario después de actualizar existencias.");
        }
        const quantityBefore = inventoryAfter.quantity + deduction.quantityToDeduct;

        await tx.productionInventoryMovement.create({
          data: {
            companyId: companyId || "default",
            inventoryItemId: inventoryItem.id,
            workOrderId: workOrder.id,
            movementType: "MATERIAL_CONSUMPTION",
            quantity: deduction.quantityToDeduct,
            quantityDelta: -deduction.quantityToDeduct,
            quantityBefore,
            quantityAfter: inventoryAfter.quantity,
            sku: inventoryItem.sku,
            description: inventoryItem.description,
            unit: workOrder.items.find((item) => item.id === deduction.workOrderItemId)?.unit || "Unidades",
            unitCost: inventoryItem.cost,
            reference: workOrder.orderNumber,
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
        const receiptResult = await tx.inventoryItem.updateMany({
          where: { id: finishedItem.id, companyId },
          data: {
            quantity: { increment: finalProducedQty },
          },
        });
        if (receiptResult.count !== 1) {
          throw new Error("No se pudo actualizar el inventario de producto terminado.");
        }
        const inventoryAfter = await tx.inventoryItem.findUnique({
          where: { id: finishedItem.id },
        });
        if (!inventoryAfter) {
          throw new Error("No se encontró el producto terminado después de actualizar existencias.");
        }
        const quantityBefore = inventoryAfter.quantity - finalProducedQty;
        await tx.productionInventoryMovement.create({
          data: {
            companyId: companyId || "default",
            inventoryItemId: finishedItem.id,
            workOrderId: workOrder.id,
            movementType: "FINISHED_GOODS_RECEIPT",
            quantity: finalProducedQty,
            quantityDelta: finalProducedQty,
            quantityBefore,
            quantityAfter: inventoryAfter.quantity,
            sku: inventoryAfter.sku,
            description: inventoryAfter.description,
            unit: workOrder.unit,
            unitCost: finishedItem.cost,
            reference: workOrder.orderNumber,
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

        const createdFinishedItem = await tx.inventoryItem.create({
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
        await tx.productionInventoryMovement.create({
          data: {
            companyId: companyId || "default",
            inventoryItemId: createdFinishedItem.id,
            workOrderId: workOrder.id,
            movementType: "FINISHED_GOODS_RECEIPT",
            quantity: finalProducedQty,
            quantityDelta: finalProducedQty,
            quantityBefore: 0,
            quantityAfter: finalProducedQty,
            sku: createdFinishedItem.sku,
            description: createdFinishedItem.description,
            unit: workOrder.unit,
            unitCost: createdFinishedItem.cost,
            reference: workOrder.orderNumber,
          },
        });
      }

      // Actualizar estado de la Orden de Trabajo a COMPLETADA
      const completionResult = await tx.workOrder.updateMany({
        where: { id, companyId, status: { in: ["PLANIFICADA", "EN_PROCESO"] }, inventoryDeducted: false },
        data: {
          status: "COMPLETADA",
          completionDate: todayDate,
          quantityProduced: finalProducedQty,
          inventoryDeducted: true,
          notes: notes ? `${workOrder.notes ? workOrder.notes + " | " : ""}${notes}` : workOrder.notes,
        },
      });
      if (completionResult.count !== 1) {
        throw new Error("El estado de la orden cambió durante el cierre. Actualice e intente nuevamente.");
      }

      return tx.workOrder.findUniqueOrThrow({
        where: { id },
        include: {
          bom: true,
          items: { include: { inventoryItem: true } },
          salesOrder: true,
          inventoryMovements: { orderBy: { createdAt: "desc" } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Orden de trabajo cerrada y completada con éxito. Se rebajaron las materias primas del inventario y se ingresaron +${finalProducedQty} ${workOrder.unit} de "${workOrder.productName}" al stock de producto terminado.`,
      data: result,
    });
  } catch (error) {
    console.error("Error closing Work Order:", error);
    if (
      error instanceof Error &&
      (error.message.includes("existencias cambiaron") || error.message.includes("estado de la orden cambió"))
    ) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: "Error al cerrar la orden de trabajo" },
      { status: 500 }
    );
  }
}
