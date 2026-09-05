import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

const DEFAULT_COMPANY_DATA = {
  id: "default",
  nombre: "WAYNE TRADEMARK PRINTING AND PACKAGING DE HONDURAS S DE RL",
  direccion: "ZIP Búfalo, Villanueva, Cortés 21100",
  email: "contabilidad@waynetrademarkhn.com",
  telefono: "+50494522666",
  sitioWeb: "Ninguno indicado",
  sector: "Manufactura y Producción Industrial (Manufacturing)",
  nombreLegal: "WAYNE TRADEMARK PRINTING AND PACKAGING DE HONDURAS S DE RL",
  taxId: "05019008183490",
  cai: "Ninguno indicado",
  rangoAutorizado: "Ninguno indicado",
  fechaLimiteEmision: "Ninguno indicado",
  tipoEmpresa: "Sociedad anónima (pequeña empresa) con dos o más propietarios",
  domicilioLegal: "Zip Búfalo Edificio 1B, Villanueva, Cortés 21101",
  emailCliente: "contabilidad@waynetrademarkhn.com",
  direccionCliente: "Ninguno indicado",
  // Información del Contador General
  contadorNombre: "",
  contadorTitulo: "Contador General",
  contadorColegiacion: "Ninguno indicado",
  contadorTelefono: "Ninguno indicado",
  contadorEmail: "Ninguno indicado",
};

// GET /api/company - Retrieve official company settings for current company
export async function GET(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);

    let settings = await prisma.companySettings.findUnique({
      where: { id: companyId },
    });

    if (!settings) {
      // Look up Company entity name if available
      const companyRecord = await prisma.company.findUnique({
        where: { id: companyId },
      });

      const initialName = companyRecord?.name || (companyId === "default" ? DEFAULT_COMPANY_DATA.nombre : "Mi Empresa");
      const initialLegal = companyRecord?.legalName || initialName;

      settings = await prisma.companySettings.create({
        data: {
          ...DEFAULT_COMPANY_DATA,
          id: companyId,
          nombre: initialName,
          nombreLegal: initialLegal,
          email: companyRecord?.email || DEFAULT_COMPANY_DATA.email,
          telefono: companyRecord?.phone || DEFAULT_COMPANY_DATA.telefono,
          direccion: companyRecord?.address || DEFAULT_COMPANY_DATA.direccion,
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la configuración de la empresa" },
      { status: 500 }
    );
  }
}

// PUT /api/company - Update official company settings for current company
export async function PUT(request: NextRequest) {
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();

    const allowedFields = [
      "nombre",
      "direccion",
      "email",
      "telefono",
      "sitioWeb",
      "sector",
      "nombreLegal",
      "taxId",
      "cai",
      "rangoAutorizado",
      "fechaLimiteEmision",
      "tipoEmpresa",
      "domicilioLegal",
      "emailCliente",
      "direccionCliente",
      "contadorNombre",
      "contadorTitulo",
      "contadorColegiacion",
      "contadorTelefono",
      "contadorEmail",
      "logoUrl",
    ];

    const updateData: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const settings = await prisma.companySettings.upsert({
      where: { id: companyId },
      update: updateData,
      create: {
        ...DEFAULT_COMPANY_DATA,
        id: companyId,
        ...updateData,
      },
    });

    // Also sync basic details into Company record
    await prisma.company.updateMany({
      where: { id: companyId },
      data: {
        ...(updateData.nombre ? { name: updateData.nombre } : {}),
        ...(updateData.nombreLegal ? { legalName: updateData.nombreLegal } : {}),
        ...(updateData.taxId ? { taxId: updateData.taxId } : {}),
        ...(updateData.cai ? { cai: updateData.cai } : {}),
        ...(updateData.email ? { email: updateData.email } : {}),
        ...(updateData.telefono ? { phone: updateData.telefono } : {}),
        ...(updateData.direccion ? { address: updateData.direccion } : {}),
        ...(updateData.logoUrl !== undefined ? { logoUrl: updateData.logoUrl } : {}),
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la configuración de la empresa" },
      { status: 500 }
    );
  }
}
