import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";



export async function GET(req: Request) {
  try {
    const companyId = await resolveCompanyId(req);
    const notes = await (prisma as any).creditDebitNote.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching credit/debit notes from DB:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch credit/debit notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await resolveCompanyId(req);
    const body = await req.json();
    const {
      noteNumber,
      type,
      entityType,
      entityId,
      entityName,
      targetDocNum,
      issueDate,
      reason,
      amount,
      tax,
      total,
      currency,
      status,
      notes,
    } = body;

    if (!noteNumber || !type || !entityName || !amount) {
      return NextResponse.json(
        { success: false, error: "Número de nota, tipo, beneficiario y monto son obligatorios." },
        { status: 400 }
      );
    }

    let noteCurrency = currency;
    if (!noteCurrency) {
      try {
        const company = await prisma.companySettings.findUnique({
          where: { id: companyId },
          select: { appSettings: true },
        });
        const appSettings: any = company?.appSettings;
        const main = appSettings?.monedas?.monedaPrincipal || "";
        if (main.includes("HNL") || main.includes("Lempira")) {
          noteCurrency = "HNL";
        } else if (main.includes("EUR") || main.includes("Euro")) {
          noteCurrency = "EUR";
        } else {
          noteCurrency = "USD";
        }
      } catch {
        noteCurrency = "USD";
      }
    }

    let finalNoteNumber = (noteNumber || "").trim();
    if (!finalNoteNumber) {
      finalNoteNumber = `${type === "DEBIT" ? "ND" : "NC"}-${new Date().getFullYear()}-001`;
    }

    // Si el número de nota ya existe en la base de datos, calcular el siguiente correlativo libre
    let candidate = finalNoteNumber;
    let attempts = 0;
    while (attempts < 100) {
      const existing = await (prisma as any).creditDebitNote.findUnique({
        where: { noteNumber: candidate },
        select: { id: true },
      });
      if (!existing) break;

      attempts++;
      const match = finalNoteNumber.match(/^([A-Za-z]+-\d{4}-)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numDigits = match[2].length;
        const currentSeq = parseInt(match[2], 10);
        candidate = `${prefix}${String(currentSeq + attempts).padStart(numDigits, "0")}`;
      } else {
        candidate = `${finalNoteNumber}-${attempts}`;
      }
    }
    finalNoteNumber = candidate;

    try {
      const newNote = await (prisma as any).creditDebitNote.create({
        data: {
          companyId,
          noteNumber: finalNoteNumber,
          type: type || "CREDIT",
          entityType: entityType || "CUSTOMER",
          entityId: entityId || null,
          entityName,
          targetDocNum: targetDocNum || null,
          issueDate: issueDate || new Date().toISOString().split("T")[0],
          reason: reason || "Ajuste Contable",
          amount: Number(amount) || 0,
          tax: Number(tax) || 0,
          total: Number(total) || Number(amount) || 0,
          currency: noteCurrency || "USD",
          status: status || "APLICADA",
          notes: notes || null,
        },
      });
      return NextResponse.json({ success: true, data: newNote });
    } catch (dbErr: any) {
      console.error("DB creditDebitNote.create failed:", dbErr);
      return NextResponse.json(
        { success: false, error: dbErr?.message || "Error al registrar la nota en la base de datos." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar la nota de crédito/débito." },
      { status: 500 }
    );
  }
}
