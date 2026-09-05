import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(req);
    const note = await (prisma as any).creditDebitNote.findFirst({
      where: { id, companyId },
    });
    if (!note) {
      return NextResponse.json({ success: false, error: "Nota no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(req);
    const body = await req.json();
    const existing = await (prisma as any).creditDebitNote.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Nota no encontrada" }, { status: 404 });
    }
    const updated = await (prisma as any).creditDebitNote.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await resolveCompanyId(req);
    const existing = await (prisma as any).creditDebitNote.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Nota no encontrada" }, { status: 404 });
    }
    await (prisma as any).creditDebitNote.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Nota eliminada correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
