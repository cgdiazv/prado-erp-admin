import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// GET /api/accounts - List all accounts with filtering isolated by company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      companyId,
    };

    if (type) {
      where.type = type;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.AND = [
        { companyId },
        {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
      delete where.companyId;
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: unknown) {
    console.error("GET /api/accounts error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/accounts - Create a new account for current company
export async function POST(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { code, name, type, currency, balance, isActive } = body;

    if (!code || !name || !type) {
      return NextResponse.json(
        { success: false, error: "code, name, and type are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.account.findFirst({
      where: { code, companyId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Account with code '${code}' already exists in this company` },
        { status: 409 }
      );
    }

    const account = await prisma.account.create({
      data: {
        companyId,
        code,
        name,
        type,
        currency: currency || "USD",
        balance: balance !== undefined ? Number(balance) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/accounts error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
