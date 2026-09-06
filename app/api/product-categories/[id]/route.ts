import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

type RouteProps = {
  params: Promise<{ id: string }>;
};

// PATCH /api/product-categories/[id] - Rename a category
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "El nombre de la categoría es requerido" },
        { status: 400 }
      );
    }

    const existing = await prisma.productCategory.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const conflict = await prisma.productCategory.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" }, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json(
        { success: false, error: `La categoría '${name}' ya existe` },
        { status: 409 }
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.productCategory.update({ where: { id }, data: { name } }),
      // Keep products in sync with the renamed category
      prisma.inventoryItem.updateMany({
        where: { companyId, category: existing.name },
        data: { category: name },
      }),
    ]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/product-categories/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/product-categories/[id] - Delete a category
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);

    const existing = await prisma.productCategory.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    await prisma.productCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/product-categories/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
