import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "La contraseña actual y la nueva contraseña son requeridas." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, password: true },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json(
        { success: false, error: "La contraseña actual es incorrecta." },
        { status: 400 }
      );
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe ser diferente de la actual." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "La contraseña se actualizó correctamente." });
  } catch (error: unknown) {
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo cambiar la contraseña. Intente más tarde." },
      { status: 500 }
    );
  }
}
