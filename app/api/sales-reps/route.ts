import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);

    const reps = await db.salesRep.findMany({
      where: { companyId },
      include: { commissions: true },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, data: reps });
  } catch (error: any) {
    console.error("GET /api/sales-reps error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sales representatives" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(req);
    const body = await req.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: "Nombre y Código de Vendedor son obligatorios." },
        { status: 400 }
      );
    }

    const newRep = await db.salesRep.create({
      data: {
        companyId,
        code: body.code,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        zone: body.zone || "San Pedro Sula / Zona Norte",
        commissionRate: Number(body.commissionRate) || 5.0,
        commissionType: body.commissionType || "PERCENTAGE",
        monthlyTarget: Number(body.monthlyTarget) || 50000.0,
        status: body.status || "ACTIVO",
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: newRep });
  } catch (error: any) {
    console.error("POST /api/sales-reps error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create sales representative" },
      { status: 500 }
    );
  }
}
