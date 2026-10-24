import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantSession, requirePlanFeature, resolveCompanyId } from "@/lib/tenant";

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
    const body = await request.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Debe indicar el motivo de cancelación." },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Orden de trabajo no encontrada." },
        { status: 404 }
      );
    }
    if (workOrder.status === "COMPLETADA" || workOrder.inventoryDeducted) {
      return NextResponse.json(
        { success: false, error: "No se puede cancelar una orden completada con movimientos de inventario." },
        { status: 400 }
      );
    }
    if (workOrder.status === "CANCELADA") {
      return NextResponse.json(
        { success: false, error: "La orden ya está cancelada." },
        { status: 409 }
      );
    }

    const cancellation = await prisma.workOrder.updateMany({
      where: {
        id,
        companyId,
        status: { in: ["PLANIFICADA", "EN_PROCESO"] },
        inventoryDeducted: false,
      },
      data: {
        status: "CANCELADA",
        cancellationReason: reason,
        notes: workOrder.notes
          ? `${workOrder.notes} | Cancelada: ${reason}`
          : `Cancelada: ${reason}`,
      },
    });
    if (cancellation.count !== 1) {
      return NextResponse.json(
        { success: false, error: "El estado de la orden cambió. Actualice e intente nuevamente." },
        { status: 409 }
      );
    }

    const updated = await prisma.workOrder.findUniqueOrThrow({ where: { id } });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error cancelling Work Order:", error);
    return NextResponse.json(
      { success: false, error: "Error al cancelar la orden de trabajo." },
      { status: 500 }
    );
  }
}