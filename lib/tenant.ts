import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FeatureKey, hasFeatureAccess, FEATURE_MIN_PLAN, FEATURE_TITLES } from "@/lib/plans";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  companyName?: string;
  plan?: string | null;
  subscriptionStatus?: string | null;
}

/**
 * Extracts and validates the authenticated user and companyId from the session cookie.
 * Falls back to "default" company if running in unauthenticated mode or during background processes.
 */
export async function getTenantSession(request?: Request | NextRequest): Promise<SessionUser | null> {
  try {
    if (!request) return null;
    let cookieVal: string | undefined;
    if ("cookies" in request && typeof (request as any).cookies?.get === "function") {
      cookieVal = (request as any).cookies.get("admin_session")?.value;
    }
    if (!cookieVal) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(^|;\s*)admin_session=([^;]*)/);
      if (match) cookieVal = decodeURIComponent(match[2]);
    }
    if (!cookieVal) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(cookieVal, "base64").toString("utf8"));
    if (!decoded || !decoded.email) {
      return null;
    }

    // Verify user exists and is active, and fetch their companyId
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            plan: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const resolvedCompanyId = user.companyId || "default";

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: resolvedCompanyId,
      companyName: user.company?.name || "Empresa Principal",
      plan: user.company?.plan || null,
      subscriptionStatus: user.company?.subscriptionStatus || null,
    };
  } catch (error) {
    console.error("[getTenantSession Error]:", error);
    return null;
  }
}

/**
 * Helper to resolve the companyId from session or fallback to "default".
 * Ensures existing single-tenant flows continue working seamlessly while isolating
 * any authenticated tenant user to their own companyId.
 */
export async function resolveCompanyId(request?: Request | NextRequest): Promise<string> {
  const session = await getTenantSession(request);
  return session?.companyId || "default";
}

/**
 * Quick helper to return a standardized 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: "No autorizado. Inicie sesión para continuar." },
    { status: 401 }
  );
}

/**
 * Enforces plan tier access for backend API endpoints.
 * Returns a 403 Forbidden response if the tenant's plan doesn't include the feature,
 * or null if allowed.
 */
export function requirePlanFeature(session: SessionUser | null, feature: FeatureKey) {
  if (!session) return unauthorizedResponse();
  if (!hasFeatureAccess(session.plan, session.subscriptionStatus, feature)) {
    const minTier = FEATURE_MIN_PLAN[feature];
    const planDisplayName = minTier === "empresarial" ? "Empresarial" : "Profesional";
    const featureName = FEATURE_TITLES[feature] || "esta funcionalidad";

    return NextResponse.json(
      {
        success: false,
        error: `El módulo "${featureName}" requiere el Plan ${planDisplayName}. Actualice su suscripción para desbloquearlo.`,
        upgradeRequired: true,
        requiredPlan: minTier,
      },
      { status: 403 }
    );
  }
  return null;
}
