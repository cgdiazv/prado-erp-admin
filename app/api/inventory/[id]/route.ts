import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

type RouteProps = {
  params: Promise<{ id: string }>;
};

// GET /api/inventory/[id] - Fetch single item by id or SKU
export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);

    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [{ id }, { sku: id }],
        companyId,
      },
      include: {
        lots: {
          orderBy: { expirationDate: "asc" },
        },
        serials: {
          orderBy: { serialNumber: "asc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: unknown) {
    console.error("GET /api/inventory/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/inventory/[id] - Update item
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);
    const body = await request.json();

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const { sku, description, quantity, cost, price, trackingType, imageUrl } = body;

    // Check SKU uniqueness if changing
    if (sku && sku !== existing.sku) {
      const skuConflict = await prisma.inventoryItem.findFirst({
        where: { sku, companyId, NOT: { id: existing.id } },
      });
      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: `Inventory item with SKU '${sku}' already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        ...(sku !== undefined && { sku }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(trackingType !== undefined && { trackingType }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
      include: {
        lots: true,
        serials: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/inventory/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete item
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(request);

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    await prisma.inventoryItem.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Inventory item deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/inventory/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
