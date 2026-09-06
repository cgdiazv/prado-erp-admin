import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// GET /api/inventory - List inventory items with search & pagination isolated by company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      companyId,
    };

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
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    const { sku, description, quantity, cost, price, trackingType, imageUrl } = body;

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
