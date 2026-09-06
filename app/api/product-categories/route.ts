import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// GET /api/product-categories - List categories for current company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const categories = await prisma.productCategory.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error("GET /api/product-categories error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/product-categories - Create a category
export async function POST(request: NextRequest) {
  try {
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
      where: { companyId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `La categoría '${name}' ya existe` },
        { status: 409 }
      );
    }

    const category = await prisma.productCategory.create({
      data: { companyId, name },
    });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/product-categories error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
