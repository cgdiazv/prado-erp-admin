import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";
import { getUserLimit, getPlan } from "@/lib/plans";

const canManageUsers = (role: string) => ["super_admin", "admin"].includes((role || "").toLowerCase());

// GET /api/users - Lista los usuarios de la empresa actual con info del límite del plan
export async function GET(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const [users, company] = await Promise.all([
      prisma.user.findMany({
        where: { companyId: session.companyId },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.company.findUnique({
        where: { id: session.companyId },
        select: { plan: true, subscriptionStatus: true },
      }),
    ]);

    const maxUsers = getUserLimit(company?.plan, company?.subscriptionStatus);

    return NextResponse.json({
      success: true,
      data: {
        users,
        maxUsers,
        planName: getPlan(company?.plan)?.name || (company?.subscriptionStatus === "TRIAL" ? "Período de Prueba" : null),
        canManage: canManageUsers(session.role),
        currentUserId: session.id,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users - Crea un usuario en la empresa actual respetando el límite del plan
export async function POST(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!canManageUsers(session.role)) {
      return NextResponse.json(
        { success: false, error: "Solo los administradores pueden crear usuarios." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "El nombre es requerido (mínimo 2 caracteres)." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Correo electrónico inválido." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ya existe un usuario registrado con este correo electrónico." },
        { status: 409 }
      );
    }

    // Validar límite de usuarios según el plan
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { plan: true, subscriptionStatus: true },
    });
    const maxUsers = getUserLimit(company?.plan, company?.subscriptionStatus);
    const currentCount = await prisma.user.count({ where: { companyId: session.companyId } });

    if (maxUsers !== null && currentCount >= maxUsers) {
      const planName = getPlan(company?.plan)?.name || "actual";
      return NextResponse.json(
        {
          success: false,
          limitReached: true,
          error: `Su plan ${planName} permite un máximo de ${maxUsers} usuario${maxUsers === 1 ? "" : "s"}. Actualice su plan para agregar más.`,
        },
        { status: 403 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        isActive: true,
        companyId: session.companyId,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/users error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
