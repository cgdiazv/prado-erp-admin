import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export const DEFAULT_SALES_ZONES = [
  "San Pedro Sula / Zona Norte",
  "Tegucigalpa / Zona Centro-Sur",
  "La Ceiba / Zona Atlántida",
  "Choluteca / Zona Sur",
  "Occidente (Copán / Ocotepeque)",
  "Comayagua / Zona Central",
  "El Progreso / Yoro",
  "Nacional / Cobertura Total",
];

// GET /api/sales-zones - Retorna lista de zonas comerciales disponibles
export async function GET(request: NextRequest) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(request);

    const reps = await db.salesRep.findMany({
      where: { companyId },
      select: { zone: true },
    }).catch(() => []);

    const set = new Set<string>(DEFAULT_SALES_ZONES);
    for (const r of reps || []) {
      if (r?.zone && typeof r.zone === "string" && r.zone.trim()) {
        set.add(r.zone.trim());
      }
    }

    const zones = Array.from(set).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ success: true, data: zones });
  } catch (error: unknown) {
    console.error("GET /api/sales-zones error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_SALES_ZONES });
  }
}

// POST /api/sales-zones - Registrar nueva zona comercial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "El nombre de la zona es obligatorio." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { name } });
  } catch (error: unknown) {
    console.error("POST /api/sales-zones error:", error);
    const message = error instanceof Error ? error.message : "Error al registrar zona comercial";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
