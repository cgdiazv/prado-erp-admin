import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import {
  generateResetToken,
  createPasswordResetToken,
} from "@/lib/passwordReset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Por favor proporcione un correo electrónico válido." },
        { status: 400 }
      );
    }

    // Lookup user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontró ninguna cuenta activa asociada a este correo electrónico.",
        },
        { status: 404 }
      );
    }

    const token = generateResetToken();
    // Token valid for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await createPasswordResetToken(email, token, expiresAt);

    // Determine base URL dynamically
    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const resetUrl = `${origin.replace(/\/+$/, "")}/reset-password?token=${token}`;

    // Format expiration time in user-friendly format
    const expiryFormatted = expiresAt.toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Prepare and send email via Resend
    const apiKey = process.env.RESEND_API_KEY || "re_dummy_key";
    const resend = new Resend(apiKey);
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "notifications@indevasa.com";

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - Prado ERP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1b426e; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Prado ERP</h1>
              <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Recuperación de Contraseña</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; line-height: 24px; color: #334155; margin-top: 0;">
                Hola <strong>${user.name || "Usuario"}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #475569;">
                Hemos recibido una solicitud para restablecer la contraseña de su cuenta en <strong>Prado ERP</strong> asociada a este correo.
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #475569;">
                Haga clic en el siguiente botón para definir una nueva contraseña:
              </p>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #1b426e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(27, 66, 110, 0.35);">
                      Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #1b426e; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
                <p style="font-size: 12px; color: #475569; margin: 0; line-height: 18px;">
                  ⏱️ <strong>Vigencia:</strong> Este enlace expirará en <strong>1 hora</strong> (aproximadamente a las ${expiryFormatted}).
                </p>
              </div>

              <p style="font-size: 12px; color: #64748b; line-height: 18px;">
                Si el botón no funciona, copie y pegue el siguiente enlace en su navegador web:
              </p>
              <p style="font-size: 11px; word-break: break-all; color: #1b426e; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
                <a href="${resetUrl}" style="color: #1b426e; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="font-size: 12px; color: #94a3b8; line-height: 18px; margin: 0;">
                🔒 Si usted no solicitó este cambio, puede ignorar este mensaje de manera segura. Su cuenta sigue protegida.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Prado ERP • Sistema de Gestión Administrativa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data: emailData, error: sendError } = await resend.emails.send({
      from: `Prado ERP <${fromEmail}>`,
      to: [email],
      subject: "Restablecer contraseña - Prado ERP",
      html: emailHtml,
    });

    if (sendError) {
      console.error("[ForgotPassword] Resend error:", sendError);
      return NextResponse.json(
        {
          success: false,
          error: `Error al enviar correo con Resend: ${sendError.message || "Fallo en el servicio de correo."}`,
        },
        { status: 500 }
      );
    }

    console.log(`[ForgotPassword] Reset email successfully sent to ${email} (ID: ${emailData?.id})`);

    return NextResponse.json({
      success: true,
      message:
        "Se ha enviado un enlace con instrucciones para restablecer su contraseña a su correo.",
    });
  } catch (error: unknown) {
    console.error("[ForgotPassword API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocurrió un error al procesar la solicitud. Por favor intente más tarde.",
      },
      { status: 500 }
    );
  }
}
