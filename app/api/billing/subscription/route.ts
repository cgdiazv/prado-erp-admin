import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getTenantSession, unauthorizedResponse } from "@/lib/tenant";

// GET /api/billing/subscription - Info del plan/suscripción de la empresa actual
export async function GET(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: company.plan,
        subscriptionStatus: company.subscriptionStatus,
        trialEndsAt: company.trialEndsAt,
        hasStripeSubscription: Boolean(company.stripeSubscriptionId),
        companyId: session.companyId,
        userEmail: session.email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/billing/subscription - Cancela la suscripción y guarda la encuesta de salida
export async function DELETE(request: NextRequest) {
  try {
    const session = await getTenantSession(request);
    if (!session) return unauthorizedResponse();
    if (!["super_admin", "admin"].includes((session.role || "").toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Solo los administradores pueden cancelar la suscripción." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const comments = typeof body.comments === "string" ? body.comments.trim() : "";

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Por favor seleccione un motivo de cancelación." },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { id: true, stripeSubscriptionId: true, subscriptionStatus: true },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }

    // Guardar encuesta de salida
    await prisma.cancellationFeedback.create({
      data: {
        companyId: company.id,
        reason,
        comments: comments || null,
      },
    });

    let message = "Su suscripción ha sido cancelada.";

    // Cancelar en Stripe al final del período pagado (mantiene acceso hasta entonces)
    if (company.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.update(company.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        message =
          "Su suscripción se canceló y no se renovará. Conservará el acceso hasta el final del período ya pagado.";
      } catch (stripeErr) {
        console.error("[Billing Cancel] Error cancelando en Stripe:", stripeErr);
        // Continuar: se marca cancelada localmente aunque Stripe falle
        await prisma.company.update({
          where: { id: company.id },
          data: { subscriptionStatus: "CANCELED" },
        });
      }
    } else {
      // Sin suscripción de Stripe (ej. en prueba): cancelar de inmediato
      await prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: "CANCELED" },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    console.error("DELETE /api/billing/subscription error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
