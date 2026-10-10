import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId, getTenantSession, requirePlanFeature } from "@/lib/tenant";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const companyId = await resolveCompanyId(request);

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        bom: {
          include: {
            items: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            orderDate: true,
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
                cost: true,
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Orden de trabajo no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workOrder });
  } catch (error) {
    console.error("Error fetching single Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la orden de trabajo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getTenantSession(request);
    const planGate = requirePlanFeature(session, "production");
    if (planGate) return planGate;

    const companyId = session?.companyId || (await resolveCompanyId(request));
    const body = await request.json();

    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: { items: true, bom: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Orden de trabajo no encontrada" },
        { status: 404 }
      );
    }

    if (existing.status === "COMPLETADA" && existing.inventoryDeducted) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta orden de trabajo ya ha sido completada y cerrada. No se pueden modificar sus cantidades o insumos.",
        },
        { status: 400 }
      );
    }

    const {
      status,
      priority,
      warehouse,
      startDate,
      dueDate,
      notes,
      quantityPlanned,
      bomId,
      items,
    } = body;

    // Si cambió la cantidad planificada o el BOM, recalcular componentes si no vienen items personalizados
    let newBomId = existing.bomId;
    let qtyPlanned = existing.quantityPlanned;
    if (quantityPlanned !== undefined && Number(quantityPlanned) > 0) {
      qtyPlanned = Number(quantityPlanned);
    }
    if (bomId && bomId !== existing.bomId) {
      newBomId = bomId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Si se enviaron nuevos items explícitos
      if (Array.isArray(items)) {
        await tx.workOrderItem.deleteMany({ where: { workOrderId: id } });
        await tx.workOrderItem.createMany({
          data: items.map((it: any) => ({
            workOrderId: id,
            inventoryItemId: it.inventoryItemId || null,
            sku: it.sku?.trim() || "INSUMO",
            description: it.description?.trim() || "",
            quantityRequired: Number(it.quantityRequired) || 1,
            quantityConsumed: Number(it.quantityConsumed) || 0,
            unit: it.unit || "Unidades",
            unitCost: Number(it.unitCost) || 0,
            notes: it.notes || null,
          })),
        });
      } else if (
        (quantityPlanned !== undefined && Number(quantityPlanned) !== existing.quantityPlanned) ||
        (bomId && bomId !== existing.bomId)
      ) {
        // Recalcular según BOM
        const targetBom = await tx.bom.findUnique({
          where: { id: newBomId },
          include: { items: true },
        });
        if (targetBom) {
          const factor = targetBom.outputQuantity > 0 ? qtyPlanned / targetBom.outputQuantity : 1;
          await tx.workOrderItem.deleteMany({ where: { workOrderId: id } });
          await tx.workOrderItem.createMany({
            data: targetBom.items.map((it) => ({
              workOrderId: id,
              inventoryItemId: it.inventoryItemId,
              sku: it.sku,
              description: it.description,
              quantityRequired: it.quantityRequired * factor,
              quantityConsumed: 0,
              unit: it.unit,
              unitCost: it.estimatedCost,
              notes: it.notes,
            })),
          });
        }
      }

      return tx.workOrder.update({
        where: { id },
        data: {
          bomId: newBomId,
          status: status || existing.status,
          priority: priority || existing.priority,
          warehouse: warehouse || existing.warehouse,
          startDate: startDate !== undefined ? startDate : existing.startDate,
          dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
          notes: notes !== undefined ? notes : existing.notes,
          quantityPlanned: qtyPlanned,
        },
        include: {
          bom: true,
          items: true,
          salesOrder: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Orden de trabajo actualizada con éxito",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la orden de trabajo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getTenantSession(request);
    const planGate = requirePlanFeature(session, "production");
    if (planGate) return planGate;

    const companyId = session?.companyId || (await resolveCompanyId(request));

    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Orden de trabajo no encontrada" },
        { status: 404 }
      );
    }

    if (existing.status === "COMPLETADA" && existing.inventoryDeducted) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede eliminar una orden de trabajo que ya fue completada y cerrada con rebaja de inventario. Puede anularla o marcarla como cancelada si es necesario.",
        },
        { status: 400 }
      );
    }

    await prisma.workOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Orden de trabajo eliminada con éxito",
    });
  } catch (error) {
    console.error("Error deleting Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la orden de trabajo" },
      { status: 500 }
    );
  }
}
