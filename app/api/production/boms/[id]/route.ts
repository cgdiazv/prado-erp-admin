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

    const bom = await prisma.bom.findFirst({
      where: { id, companyId },
      include: {
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
        workOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            quantityPlanned: true,
          },
        },
      },
    });

    if (!bom) {
      return NextResponse.json(
        { success: false, error: "Lista de materiales (BOM) no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bom });
  } catch (error) {
    console.error("Error fetching single BOM:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la lista de materiales" },
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

    const existing = await prisma.bom.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lista de materiales no encontrada" },
        { status: 404 }
      );
    }

    const {
      code,
      name,
      description,
      finishedProductSku,
      finishedProductName,
      outputQuantity,
      outputUnit,
      version,
      isActive,
      notes,
      items,
    } = body;

    // Actualizar con transacción para recrear los items
    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(items)) {
        await tx.bomItem.deleteMany({
          where: { bomId: id },
        });
      }

      return tx.bom.update({
        where: { id },
        data: {
          code: code ? code.trim() : existing.code,
          name: name ? name.trim() : existing.name,
          description: description !== undefined ? description : existing.description,
          finishedProductSku: finishedProductSku !== undefined ? finishedProductSku : existing.finishedProductSku,
          finishedProductName: finishedProductName ? finishedProductName.trim() : existing.finishedProductName,
          outputQuantity: outputQuantity !== undefined ? Number(outputQuantity) : existing.outputQuantity,
          outputUnit: outputUnit || existing.outputUnit,
          version: version || existing.version,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
          notes: notes !== undefined ? notes : existing.notes,
          ...(Array.isArray(items)
            ? {
                items: {
                  create: items.map((it: any) => ({
                    inventoryItemId: it.inventoryItemId || null,
                    sku: it.sku?.trim() || "INSUMO",
                    description: it.description?.trim() || "",
                    quantityRequired: Number(it.quantityRequired) || 1,
                    unit: it.unit?.trim() || "Unidades",
                    estimatedCost: Number(it.estimatedCost) || 0,
                    notes: it.notes?.trim() || null,
                  })),
                },
              }
            : {}),
        },
        include: {
          items: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Lista de materiales actualizada con éxito",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating BOM:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la lista de materiales" },
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

    const existing = await prisma.bom.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { workOrders: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lista de materiales no encontrada" },
        { status: 404 }
      );
    }

    if (existing._count.workOrders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar esta BOM porque está siendo utilizada por ${existing._count.workOrders} orden(es) de trabajo. Puede desactivarla en su lugar.`,
        },
        { status: 400 }
      );
    }

    await prisma.bom.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Lista de materiales eliminada con éxito",
    });
  } catch (error) {
    console.error("Error deleting BOM:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la lista de materiales" },
      { status: 500 }
    );
  }
}
