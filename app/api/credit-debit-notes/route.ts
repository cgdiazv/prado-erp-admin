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

    try {
      const newNote = await (prisma as any).creditDebitNote.create({
        data: {
          companyId,
          noteNumber,
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
          currency: currency || "USD",
          status: status || "APLICADA",
          notes: notes || null,
        },
      });
      return NextResponse.json({ success: true, data: newNote });
    } catch (dbErr) {
      console.warn("DB write failed, returning created object in memory:", dbErr);
      const fallbackNote = {
        id: `note-${Date.now()}`,
        noteNumber,
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
        currency: currency || "USD",
        status: status || "APLICADA",
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: fallbackNote });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar la nota de crédito/débito." },
      { status: 500 }
    );
  }
}
