import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  findPasswordResetToken,
  deletePasswordResetTokens,
} from "@/lib/passwordReset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "El token de restablecimiento es requerido." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Lookup token record
    const tokenRecord = await findPasswordResetToken(token);

    if (!tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "El enlace de restablecimiento es inválido o ya ha sido utilizado. Por favor solicite uno nuevo.",
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      // Invalidate expired token
      await deletePasswordResetTokens(tokenRecord.email);
      return NextResponse.json(
        {
          success: false,
          error: "El enlace de restablecimiento ha expirado. Por favor solicite uno nuevo.",
        },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No se encontró el usuario asociado a este enlace." },
        { status: 404 }
      );
    }

    // Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Remove all reset tokens for this user
    await deletePasswordResetTokens(tokenRecord.email);

    return NextResponse.json({
      success: true,
      message: "Su contraseña ha sido actualizada con éxito. Ya puede iniciar sesión.",
    });
  } catch (error: unknown) {
    console.error("[ResetPassword API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocurrió un error al actualizar la contraseña. Por favor intente más tarde.",
      },
      { status: 500 }
    );
  }
}
