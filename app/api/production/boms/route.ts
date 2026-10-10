import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId, getTenantSession, requirePlanFeature } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = { companyId };
    if (activeOnly) {
      where.isActive = true;
    }

    let boms = await prisma.bom.findMany({
      where,
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
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (search) {
      boms = boms.filter(
        (b) =>
          b.code.toLowerCase().includes(search) ||
          b.name.toLowerCase().includes(search) ||
          b.finishedProductName.toLowerCase().includes(search) ||
          (b.finishedProductSku && b.finishedProductSku.toLowerCase().includes(search)) ||
          b.items.some(
            (it) =>
              it.sku.toLowerCase().includes(search) ||
              it.description.toLowerCase().includes(search)
          )
      );
    }

    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.bom.count({
      where: {
        companyId,
        code: {
          startsWith: `BOM-${currentYear}`,
        },
      },
    });
    const nextCode = `BOM-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;

    const metrics = {
      totalBoms: boms.length,
      activeBoms: boms.filter((b) => b.isActive).length,
      inactiveBoms: boms.filter((b) => !b.isActive).length,
    };

    return NextResponse.json({
      success: true,
      data: boms,
      nextCode,
      metrics,
    });
  } catch (error) {
    console.error("Error fetching BOMs:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las listas de materiales (BOMs)" },
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
      code,
      name,
      description,
      finishedProductSku,
      finishedProductName,
      outputQuantity = 1,
      outputUnit = "Unidades",
      version = "1.0",
      isActive = true,
      notes,
      items = [],
    } = body;

    if (!name || !finishedProductName) {
      return NextResponse.json(
        { success: false, error: "El nombre de la BOM y el producto terminado son requeridos" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "La lista de materiales debe contener al menos una materia prima o insumo" },
        { status: 400 }
      );
    }

    // Auto generar código si no viene
    let bomCode = code?.trim();
    if (!bomCode) {
      const currentYear = new Date().getFullYear();
      const countThisYear = await prisma.bom.count({
        where: {
          companyId,
          code: { startsWith: `BOM-${currentYear}` },
        },
      });
      bomCode = `BOM-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;
    }

    // Verificar unicidad de código
    const existing = await prisma.bom.findFirst({
      where: { companyId, code: bomCode },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe una lista de materiales con el código ${bomCode}` },
        { status: 400 }
      );
    }

    const createdBom = await prisma.bom.create({
      data: {
        companyId,
        code: bomCode,
        name: name.trim(),
        description: description?.trim() || null,
        finishedProductSku: finishedProductSku?.trim() || null,
        finishedProductName: finishedProductName.trim(),
        outputQuantity: Number(outputQuantity) || 1,
        outputUnit: outputUnit || "Unidades",
        version: version || "1.0",
        isActive: Boolean(isActive),
        notes: notes?.trim() || null,
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
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lista de materiales creada con éxito",
      data: createdBom,
    });
  } catch (error) {
    console.error("Error creating BOM:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la lista de materiales" },
      { status: 500 }
    );
  }
}
