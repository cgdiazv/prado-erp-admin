import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);

    const comms = await db.commissionRecord.findMany({
      where: {
        salesRep: { companyId },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: comms });
  } catch (error: any) {
    console.error("GET /api/commissions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch commission records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);
    const body = await req.json();

    if (!body.salesRepId || !body.saleAmount) {
      return NextResponse.json(
        { success: false, error: "Vendedor y Monto de Venta son obligatorios." },
        { status: 400 }
      );
    }

    const salesRep = await db.salesRep.findFirst({
      where: { id: body.salesRepId, companyId },
    });

    if (!salesRep) {
      return NextResponse.json(
        { success: false, error: "Vendedor no encontrado." },
        { status: 404 }
      );
    }

    const rate = Number(body.commissionRate) || salesRep.commissionRate || 5.0;
    const saleAmount = Number(body.saleAmount) || 0;
    const commissionAmount = Number(body.commissionAmount) || (saleAmount * rate) / 100;

    const newComm = await db.commissionRecord.create({
      data: {
        salesRepId: salesRep.id,
        salesRepName: salesRep.name,
        period: body.period || new Date().toISOString().slice(0, 7),
        invoiceNumber: body.invoiceNumber || null,
        customerName: body.customerName || null,
        saleAmount: saleAmount,
        commissionRate: rate,
        commissionAmount: commissionAmount,
        status: body.status || "PENDIENTE",
        paidDate: body.paidDate || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: newComm });
  } catch (error: any) {
    console.error("POST /api/commissions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create commission record" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const db = prisma as any;
    const body = await req.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { success: false, error: "ID de comisión y Nuevo Estado son obligatorios." },
        { status: 400 }
      );
    }

    const updated = await db.commissionRecord.update({
      where: { id: body.id },
      data: {
        status: body.status,
        ...(body.status === "PAGADO" && !body.paidDate && { paidDate: new Date().toISOString().split("T")[0] }),
        ...(body.paidDate && { paidDate: body.paidDate }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/commissions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update commission record" },
      { status: 500 }
    );
  }
}
