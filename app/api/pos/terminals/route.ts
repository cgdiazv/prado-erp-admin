import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";
import { DEFAULT_POS_REGISTERS } from "@/lib/posRegisters";

const canManageTerminals = (role: string) => ["super_admin", "admin"].includes(role.toLowerCase());

function readTerminals(settings: unknown): string[] {
  if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
    return DEFAULT_POS_REGISTERS;
  }

  const terminals = (settings as Record<string, unknown>).posTerminals;
  if (terminals === undefined) return DEFAULT_POS_REGISTERS;
  if (!Array.isArray(terminals) || terminals.some((terminal) => typeof terminal !== "string")) {
    throw new Error("La configuración de terminales POS no es válida.");
  }

  return terminals;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const row = await prisma.companySettings.findUnique({
      where: { id: session.companyId },
      select: { appSettings: true },
    });

    return NextResponse.json({ success: true, data: { terminals: readTerminals(row?.appSettings) } });
  } catch (error: unknown) {
    console.error("GET /api/pos/terminals error:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron cargar las terminales del POS." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!canManageTerminals(session.role)) {
      return NextResponse.json(
        { success: false, error: "Solo los administradores pueden administrar las terminales del POS." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || !Array.isArray(body.terminals)) {
      return NextResponse.json({ success: false, error: "La lista de terminales es inválida." }, { status: 400 });
    }

    const terminals = body.terminals.map((terminal: unknown) =>
      typeof terminal === "string" ? terminal.trim() : ""
    );
    if (
      terminals.length === 0 ||
      terminals.some((terminal: string) => !terminal || terminal.length > 60) ||
      new Set(terminals.map((terminal: string) => terminal.toLocaleLowerCase())).size !== terminals.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe guardar al menos una terminal. Los nombres son obligatorios, únicos y no pueden exceder 60 caracteres.",
        },
        { status: 400 }
      );
    }

    const current = await prisma.companySettings.findUnique({
      where: { id: session.companyId },
      select: { appSettings: true },
    });
    const settings =
      current?.appSettings && typeof current.appSettings === "object" && !Array.isArray(current.appSettings)
        ? current.appSettings
        : {};

    await prisma.companySettings.upsert({
      where: { id: session.companyId },
      update: { appSettings: { ...settings, posTerminals: terminals } },
      create: { id: session.companyId, appSettings: { posTerminals: terminals } },
    });

    return NextResponse.json({ success: true, data: { terminals } });
  } catch (error: unknown) {
    console.error("PUT /api/pos/terminals error:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron guardar las terminales del POS." },
      { status: 500 }
    );
  }
}
