// API Route: Bank Statement Reconciliations (NIIF / US GAAP compliant)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(request);
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get("bankAccountId");
    const period = searchParams.get("period");
    const status = searchParams.get("status");



    const whereClause: Record<string, unknown> = {
      bankAccount: { companyId },
    };
    if (bankAccountId && bankAccountId !== "ALL") {
      whereClause.bankAccountId = bankAccountId;
    }
    if (period && period !== "ALL") {
      whereClause.period = period;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const reconciliations = await db.bankReconciliation.findMany({
      where: whereClause,
      include: {
        bankAccount: true,
        items: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { statementDate: "desc" },
    });

    const company = await db.companySettings.findFirst({
      where: { companyId },
    }).catch(() => null);
    const activeContador = company?.contadorNombre?.trim()
      ? `${company.contadorNombre.trim()} (${company.contadorTitulo?.trim() || "Contador General"})`
      : null;

    const formattedRecs = reconciliations.map((rec: any) => {
      if (rec.status === "CERRADA" && activeContador && (!rec.closedBy || rec.closedBy.includes("Mondrag") || rec.closedBy.includes("Auditoría") || rec.closedBy.includes("Contador General"))) {
        return {
          ...rec,
          closedBy: activeContador,
        };
      }
      return rec;
    });

    return NextResponse.json({ success: true, data: formattedRecs });
  } catch (error: any) {
    console.error("GET /api/bank-reconciliations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener conciliaciones bancarias" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any;
    const companyId = await resolveCompanyId(request);
    const body = await request.json();

    const {
      bankAccountId,
      period,
      statementDate,
      startDate,
      endDate,
      statementBeginningBalance = 0,
      statementEndingBalance = 0,
      notes,
    } = body;

    if (!bankAccountId) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar una cuenta bancaria." },
        { status: 400 }
      );
    }

    if (!period || !statementDate) {
      return NextResponse.json(
        { success: false, error: "El período (ej. 2026-09) y la fecha de corte son obligatorios." },
        { status: 400 }
      );
    }

    const bankAccount = await db.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { success: false, error: "Cuenta bancaria no encontrada." },
        { status: 404 }
      );
    }

    // Check if an existing open reconciliation exists for this bank and period
    const existing = await db.bankReconciliation.findFirst({
      where: {
        bankAccountId,
        period,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe una conciliación registrada para ${bankAccount.name} en el período ${period} (Estado: ${existing.status}).`,
        },
        { status: 400 }
      );
    }

    // Generate unique reconciliation number
    const prefix = bankAccount.name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "BNK";
    const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, "-");
    const recNumber = `REC-${prefix}-${cleanPeriod}`;

    const begBal = Number(statementBeginningBalance) || 0;
    const endBal = Number(statementEndingBalance) || 0;

    // Fetch existing bank transactions for this account to populate items
    const sDate = startDate || `${period}-01`;
    const eDate = endDate || statementDate;

    const existingTx = await db.bankTransaction.findMany({
      where: {
        bankAccountId,
      },
      orderBy: { createdAt: "desc" },
    });

    const initialItems = existingTx.map((tx: any) => ({
      transactionId: tx.id,
      sourceType: "BANK_TRANSACTION",
      date: tx.date || statementDate,
      reference: tx.ruleApplied ? `REGLA-${tx.id.slice(-4)}` : `TX-${tx.id.slice(-4)}`,
      description: tx.description,
      payee: tx.payee || "N/A",
      type: tx.type === "deposit" ? "DEPOSIT" : "CHECK",
      amount: Number(tx.amount) || 0,
      isCleared: tx.status === "categorizadas",
      clearedAt: tx.status === "categorizadas" ? new Date() : null,
      notes: tx.suggestedAccount || null,
    }));

    // Calculate initial cleared amounts
    let clearedDepAmt = 0;
    let clearedDepCnt = 0;
    let clearedChkAmt = 0;
    let clearedChkCnt = 0;

    initialItems.forEach((it: any) => {
      if (it.isCleared) {
        if (it.type === "DEPOSIT") {
          clearedDepAmt += it.amount;
          clearedDepCnt += 1;
        } else {
          clearedChkAmt += it.amount;
          clearedChkCnt += 1;
        }
      }
    });

    const clearedBalance = Math.round((begBal + clearedDepAmt - clearedChkAmt) * 100) / 100;
    const difference = Math.round((endBal - clearedBalance) * 100) / 100;

    const newRec = await db.bankReconciliation.create({
      data: {
        reconciliationNumber: recNumber,
        bankAccountId,
        period,
        statementDate,
        startDate: sDate,
        endDate: eDate,
        statementBeginningBalance: begBal,
        statementEndingBalance: endBal,
        clearedDepositsCount: clearedDepCnt,
        clearedDepositsAmount: clearedDepAmt,
        clearedChecksCount: clearedChkCnt,
        clearedChecksAmount: clearedChkAmt,
        clearedBalance,
        difference,
        status: difference === 0 ? "CONCILIADA_CUADRADA" : "EN_PROCESO",
        notes: notes || `Apertura de conciliación para el período ${period}.`,
        items: {
          create: initialItems,
        },
      },
      include: {
        bankAccount: true,
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newRec,
      message: `Conciliación ${recNumber} aperturada exitosamente con ${initialItems.length} movimientos preliminares.`,
    });
  } catch (error: any) {
    console.error("POST /api/bank-reconciliations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear la conciliación bancaria" },
      { status: 500 }
    );
  }
}
