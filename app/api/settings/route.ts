import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";

// GET /api/settings - Configuraciones de la app de la empresa actual
export async function GET(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const row = await prisma.companySettings.findUnique({
      where: { id: session.companyId },
      select: { appSettings: true },
    });

    return NextResponse.json({ success: true, data: row?.appSettings || null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/settings - Guarda las configuraciones (solo administradores)
export async function PUT(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!["super_admin", "admin"].includes((session.role || "").toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Solo los administradores pueden modificar la configuración." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Configuración inválida." }, { status: 400 });
    }

    const existing = await prisma.companySettings.findUnique({
      where: { id: session.companyId },
      select: { appSettings: true },
    });
    const existingSettings =
      existing?.appSettings && typeof existing.appSettings === "object" && !Array.isArray(existing.appSettings)
        ? existing.appSettings
        : {};
    const appSettings = { ...existingSettings, ...body };

    await prisma.companySettings.upsert({
      where: { id: session.companyId },
      update: { appSettings },
      create: { id: session.companyId, appSettings },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PUT /api/settings error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
