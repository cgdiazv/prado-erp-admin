import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const normalizedRole = (session.role || "").toLowerCase();
    if (!["super_admin", "admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Solo los administradores pueden eliminar la cuenta y datos de la empresa." },
        { status: 403 }
      );
    }

    if (session.companyId === "default") {
      return NextResponse.json(
        { success: false, error: "La empresa predeterminada del sistema no puede ser eliminada." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
    const reasons = Array.isArray(body.reasons) ? body.reasons.map((r: unknown) => String(r)) : [];
    const comments = typeof body.comments === "string" ? body.comments.trim() : "";

    if (confirmation.toUpperCase() !== "ELIMINAR") {
      return NextResponse.json(
        { success: false, error: "Debe escribir la palabra ELIMINAR para confirmar la eliminación." },
        { status: 400 }
      );
    }

    // Fetch company info before deletion
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "La empresa no fue encontrada." },
        { status: 404 }
      );
    }

    // 1. Cancel Stripe subscription if active
    if (company.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(company.stripeSubscriptionId);
        console.log(`[Delete Account] Stripe subscription ${company.stripeSubscriptionId} cancelled.`);
      } catch (stripeErr) {
        console.error("[Delete Account Stripe Cancel Error]:", stripeErr);
      }
    }

    // 2. Save feedback or send alert email if configured
    try {
      if (reasons.length > 0 || comments) {
        await prisma.cancellationFeedback.create({
          data: {
            companyId: company.id,
            reason: reasons.join(", ") || "Cuenta eliminada por el usuario",
            comments: comments || null,
          },
        }).catch(() => {});
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL || "notifications@pradocommerce.com",
          to: process.env.ADMIN_ALERT_EMAIL || "soporte@pradocommerce.com",
          subject: `[Prado ERP] Cuenta eliminada: ${company.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
              <h2>Aviso de eliminación de cuenta</h2>
              <p><strong>Empresa:</strong> ${company.name} (${company.id})</p>
              <p><strong>Usuario administrador:</strong> ${session.email} (${session.name})</p>
              <p><strong>Plan:</strong> ${company.plan || "N/A"} (${company.subscriptionStatus})</p>
              <p><strong>Motivos seleccionados:</strong> ${reasons.join(", ") || "Ninguno"}</p>
              ${comments ? `<p><strong>Comentarios:</strong> ${comments}</p>` : ""}
            </div>
          `,
        }).catch(() => {});
      }
    } catch (feedbackErr) {
      console.error("[Delete Account Feedback Error]:", feedbackErr);
    }

    // 3. Delete users first, then delete company (which cascades to all related entities)
    await prisma.$transaction(async (tx) => {
      // Delete user accounts belonging to this company
      await tx.user.deleteMany({
        where: { companyId: company.id },
      });

      // Delete company (cascading deletes accounts, invoices, items, vendors, customers, etc.)
      await tx.company.delete({
        where: { id: company.id },
      });
    });

    console.log(`[Delete Account] Company ${company.id} (${company.name}) and all data deleted successfully.`);

    // 4. Response that clears the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Su cuenta y todos sus datos han sido eliminados de forma permanente.",
    });

    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    console.error("[Delete Account Error]:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar la cuenta.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
