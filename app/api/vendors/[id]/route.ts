import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

type RouteProps = {
  params: Promise<{ id: string }>;
};

// GET /api/vendors/[id] - Fetch single vendor by id or macolaCode for current company
export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const companyId = await resolveCompanyId(request);
    const { id } = await params;

    const vendor = await prisma.vendor.findFirst({
      where: {
        companyId,
        OR: [{ id }, { macolaCode: id }],
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error: unknown) {
    console.error("GET /api/vendors/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/vendors/[id] - Update vendor
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const companyId = await resolveCompanyId(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const { macolaCode, name, email, phone, address, currency } = body;

    // Check macolaCode uniqueness in company if changing
    if (macolaCode && macolaCode !== existing.macolaCode) {
      const codeConflict = await prisma.vendor.findFirst({
        where: { macolaCode, companyId },
      });
      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: `Vendor with Macola code '${macolaCode}' already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.vendor.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(macolaCode !== undefined && { macolaCode: macolaCode || null }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(currency !== undefined && { currency }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/vendors/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Delete vendor
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const companyId = await resolveCompanyId(request);
    const { id } = await params;

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    await prisma.vendor.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/vendors/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
