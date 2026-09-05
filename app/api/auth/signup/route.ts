import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendWelcomeEmail } from "@/lib/welcomeEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!companyName || companyName.length < 2) {
      return NextResponse.json(
        { success: false, error: "El nombre de la empresa es requerido (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Por favor ingrese un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una cuenta registrada con este correo electrónico. Por favor inicie sesión.",
        },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const companyId = "comp_" + crypto.randomBytes(12).toString("hex");
    const userId = "usr_" + crypto.randomBytes(12).toString("hex");

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company in database
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Company" ("id", "name", "legalName", "currency", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'USD', true, NOW(), NOW())`,
      companyId,
      companyName,
      companyName
    );

    // Create User in database linked to Company
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "email", "name", "password", "role", "isActive", "companyId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'super_admin', true, $5, NOW(), NOW())`,
      userId,
      email,
      companyName,
      hashedPassword,
      companyId
    );

    // User session payload
    const userData = {
      id: userId,
      email,
      name: companyName,
      role: "super_admin",
      companyId,
      companyName,
    };

    const sessionPayload = Buffer.from(JSON.stringify(userData)).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: "Empresa y cuenta creadas exitosamente.",
      user: userData,
    });

    // Set secure session cookie (30 days trial)
    response.cookies.set("admin_session", sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Send welcome email via Resend from notifications@pradocommerce.com
    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://pradocommerce.com";

    sendWelcomeEmail({
      to: email,
      companyName,
      companyId,
      origin,
    }).catch((err) => {
      console.error("[Signup Welcome Email Failed]:", err);
    });

    return response;
  } catch (error: unknown) {
    console.error("[Signup API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocurrió un error inesperado al registrar la empresa. Por favor intente más tarde.",
      },
      { status: 500 }
    );
  }
}
