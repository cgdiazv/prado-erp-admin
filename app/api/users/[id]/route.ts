import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";

const canManageUsers = (role: string) => ["super_admin", "admin"].includes((role || "").toLowerCase());
const isOwner = (role: string) => (role || "").toLowerCase() === "super_admin";

async function getTargetUser(id: string, companyId: string) {
  return prisma.user.findFirst({
    where: { id, companyId },
    select: { id: true, role: true },
  });
}

// PUT /api/users/[id] - Actualiza nombre, rol, estado o contraseña de un usuario de la empresa
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!canManageUsers(session.role)) {
      return NextResponse.json({ success: false, error: "Solo los administradores pueden editar usuarios." }, { status: 403 });
    }

    const { id } = await params;
    const target = await getTargetUser(id, session.companyId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }
    if (isOwner(target.role) && target.id !== session.id) {
      return NextResponse.json({ success: false, error: "No se puede modificar al propietario de la cuenta." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim().length >= 2) data.name = body.name.trim();
    if (body.role === "admin" || body.role === "user") {
      // El propietario conserva siempre su rol
      if (!isOwner(target.role)) data.role = body.role;
    }
    if (typeof body.isActive === "boolean") {
      if (target.id === session.id && body.isActive === false) {
        return NextResponse.json({ success: false, error: "No puede desactivar su propio usuario." }, { status: 400 });
      }
      if (!isOwner(target.role)) data.isActive = body.isActive;
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json({ success: false, error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(body.password, salt);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nada que actualizar." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PUT /api/users/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Elimina un usuario de la empresa
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!canManageUsers(session.role)) {
      return NextResponse.json({ success: false, error: "Solo los administradores pueden eliminar usuarios." }, { status: 403 });
    }

    const { id } = await params;
    const target = await getTargetUser(id, session.companyId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }
    if (target.id === session.id) {
      return NextResponse.json({ success: false, error: "No puede eliminar su propio usuario." }, { status: 400 });
    }
    if (isOwner(target.role)) {
      return NextResponse.json({ success: false, error: "No se puede eliminar al propietario de la cuenta." }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: target.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/users/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
