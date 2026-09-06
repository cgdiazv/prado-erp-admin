import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

const DEFAULT_COMPANY_DATA = {
  id: "default",
  nombre: "",
  direccion: "",
  email: "",
  telefono: "",
  sitioWeb: "Ninguno indicado",
  sector: "General",
  nombreLegal: "",
  taxId: "",
  cai: "Ninguno indicado",
  rangoAutorizado: "Ninguno indicado",
  fechaLimiteEmision: "Ninguno indicado",
  tipoEmpresa: "Ninguno indicado",
  domicilioLegal: "",
  emailCliente: "",
  direccionCliente: "Ninguno indicado",
  contadorNombre: "",
  contadorTitulo: "Contador General",
  contadorColegiacion: "Ninguno indicado",
  contadorTelefono: "Ninguno indicado",
  contadorEmail: "Ninguno indicado",
};

const BLANK_COMPANY_DATA = {
  nombre: "",
  direccion: "",
  email: "",
  telefono: "",
  sitioWeb: "Ninguno indicado",
  sector: "General",
  nombreLegal: "",
  taxId: "",
  cai: "Ninguno indicado",
  rangoAutorizado: "Ninguno indicado",
  fechaLimiteEmision: "Ninguno indicado",
  tipoEmpresa: "Ninguno indicado",
  domicilioLegal: "",
  emailCliente: "",
  direccionCliente: "Ninguno indicado",
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

      if (companyId === "default") {
        settings = await prisma.companySettings.create({
          data: {
            ...DEFAULT_COMPANY_DATA,
            id: companyId,
            nombre: companyRecord?.name && companyRecord.name !== "Ninguno indicado" ? companyRecord.name : DEFAULT_COMPANY_DATA.nombre,
            nombreLegal: companyRecord?.legalName && companyRecord.legalName !== "Ninguno indicado" ? companyRecord.legalName : DEFAULT_COMPANY_DATA.nombreLegal,
            email: companyRecord?.email && companyRecord.email !== "Ninguno indicado" ? companyRecord.email : DEFAULT_COMPANY_DATA.email,
            telefono: companyRecord?.phone && companyRecord.phone !== "Ninguno indicado" ? companyRecord.phone : DEFAULT_COMPANY_DATA.telefono,
            direccion: companyRecord?.address && companyRecord.address !== "Ninguno indicado" ? companyRecord.address : DEFAULT_COMPANY_DATA.direccion,
          },
        });
      } else {
        const initialName = companyRecord?.name || "Mi Empresa";
        const initialLegal = companyRecord?.legalName || initialName;

        settings = await prisma.companySettings.create({
          data: {
            ...BLANK_COMPANY_DATA,
            id: companyId,
            nombre: initialName,
            nombreLegal: initialLegal,
            email: companyRecord?.email || "",
            telefono: companyRecord?.phone || "",
            direccion: companyRecord?.address || "",
            taxId: companyRecord?.taxId || "",
            cai: companyRecord?.cai || "Ninguno indicado",
          },
        });
      }
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

    const defaultCreate = companyId === "default" ? DEFAULT_COMPANY_DATA : {
      ...BLANK_COMPANY_DATA,
      id: companyId,
    };

    const settings = await prisma.companySettings.upsert({
      where: { id: companyId },
      update: updateData,
      create: {
        ...defaultCreate,
        id: companyId,
        ...updateData,
      },
    });

    // Also sync basic details into Company record
    await prisma.company.updateMany({
      where: { id: companyId },
      data: {
        ...(updateData.nombre !== undefined ? { name: updateData.nombre || "Mi Empresa" } : {}),
        ...(updateData.nombreLegal !== undefined ? { legalName: updateData.nombreLegal || "" } : {}),
        ...(updateData.taxId !== undefined ? { taxId: updateData.taxId || "" } : {}),
        ...(updateData.cai !== undefined ? { cai: updateData.cai || null } : {}),
        ...(updateData.email !== undefined ? { email: updateData.email || "" } : {}),
        ...(updateData.telefono !== undefined ? { phone: updateData.telefono || "" } : {}),
        ...(updateData.direccion !== undefined ? { address: updateData.direccion || "" } : {}),
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
