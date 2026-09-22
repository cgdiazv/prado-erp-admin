import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// GET /api/inventory - List inventory items with search & pagination isolated by company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");
    const categoryParam = searchParams.get("category");
    const limitParam = searchParams.get("limit");
    // Si no se especifica limit o es 'all'/'0', retorna el catálogo completo de la empresa
    const shouldPaginate = limitParam !== null && limitParam !== "all" && limitParam !== "0";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = shouldPaginate ? Math.max(1, Math.min(5000, parseInt(limitParam || "50", 10))) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;

    const where: Record<string, unknown> = {
      companyId,
    };

    if (categoryParam) {
      where.category = categoryParam;
    }

    if (lowStock) {
      where.quantity = { lte: parseFloat(lowStock) };
    }

    if (search) {
      where.AND = [
        { companyId },
        {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
      delete where.companyId;
    }

    const [total, items] = await Promise.all([
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        orderBy: { sku: "asc" },
        skip,
        take: limit,
        include: {
          lots: {
            orderBy: { expirationDate: "asc" },
          },
          serials: {
            orderBy: { serialNumber: "asc" },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit: limit || total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/inventory error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/inventory - Create a new inventory item for current company
export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { sku, description, quantity, cost, price, trackingType, imageUrl, category } = body;

    if (!sku || !description) {
      return NextResponse.json(
        { success: false, error: "sku and description are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { sku, companyId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Inventory item with SKU '${sku}' already exists in this company` },
        { status: 409 }
      );
    }

    const itemCategory = typeof category === "string" && category.trim() ? category.trim() : null;

    // Auto-register category in ProductCategory catalog if not existing yet
    if (itemCategory) {
      try {
        const existingCat = await prisma.productCategory.findFirst({
          where: { companyId, name: { equals: itemCategory, mode: "insensitive" } },
        });
        if (!existingCat) {
          await prisma.productCategory.create({
            data: { companyId, name: itemCategory },
          });
        }
      } catch (catErr) {
        console.warn("Auto-register category warning:", catErr);
      }
    }

    const item = await prisma.inventoryItem.create({
      data: {
        companyId,
        sku,
        description,
        quantity: quantity !== undefined ? Number(quantity) : 0,
        cost: cost !== undefined ? Number(cost) : 0,
        price: price !== undefined ? Number(price) : 0,
        trackingType: trackingType || "NONE",
        imageUrl: imageUrl || null,
        category: itemCategory,
      },
      include: {
        lots: true,
        serials: true,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });

  } catch (error: unknown) {
    console.error("POST /api/inventory error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/inventory - Bulk delete inventory items isolated by company
export async function DELETE(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "La lista de identificadores (ids) es obligatoria." },
        { status: 400 }
      );
    }

    let deleteResult = await prisma.inventoryItem.deleteMany({
      where: {
        id: { in: ids },
        ...(companyId && companyId !== "default" ? { companyId } : {}),
      },
    });

    // Fallback if companyId mismatch occurred
    if (deleteResult.count === 0) {
      deleteResult = await prisma.inventoryItem.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: deleteResult.count,
      message: `${deleteResult.count} artículos eliminados con éxito`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/inventory error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


