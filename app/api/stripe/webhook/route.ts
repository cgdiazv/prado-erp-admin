import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// POST /api/stripe/webhook - Activa/desactiva suscripciones desde eventos de Stripe
export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secretKey || !webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET no configurados");
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Falta el encabezado stripe-signature");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Firma inválida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.client_reference_id;
        const email = session.customer_details?.email?.toLowerCase();

        // Resolver la empresa: por client_reference_id o por email del comprador
        let resolvedCompanyId: string | null = null;
        if (companyId) {
          const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
          if (company) resolvedCompanyId = company.id;
        }
        if (!resolvedCompanyId && email) {
          const user = await prisma.user.findUnique({ where: { email }, select: { companyId: true } });
          if (user?.companyId) resolvedCompanyId = user.companyId;
        }

        if (!resolvedCompanyId) {
          console.error(`[Stripe Webhook] No se pudo vincular el pago a una empresa (ref: ${companyId}, email: ${email})`);
          break;
        }

        await prisma.company.update({
          where: { id: resolvedCompanyId },
          data: {
            subscriptionStatus: "ACTIVE",
            plan: session.metadata?.plan || undefined,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          },
        });
        console.log(`[Stripe Webhook] Suscripción activada para empresa ${resolvedCompanyId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const isActive = sub.status === "active" || sub.status === "trialing";
        await prisma.company.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: isActive ? "ACTIVE" : "EXPIRED" },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await prisma.company.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "CANCELED" },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error procesando ${event.type}:`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
