import { Resend } from "resend";

interface WelcomeEmailParams {
  to: string;
  companyName: string;
  companyId: string;
  origin?: string;
}

export async function sendWelcomeEmail({
  to,
  companyName,
  companyId,
  origin = "https://pradocommerce.com",
}: WelcomeEmailParams) {
  try {
    const apiKey = process.env.RESEND_API_KEY || "re_dummy_key";
    const resend = new Resend(apiKey);
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "notifications@pradocommerce.com";
    const dashboardUrl = `${origin.replace(/\/+$/, "")}/`;
    const loginUrl = `${origin.replace(/\/+$/, "")}/login`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a Prado ERP!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">
          
          <!-- HERO HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b426e 0%, #0f2744 100%); padding: 40px 36px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Brand Pill -->
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.12); padding: 6px 16px; border-radius: 30px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.15);">
                      PRADO ERP &bull; CLOUD BUSINESS
                    </div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25; color: #ffffff;">
                      ¡Bienvenido a bordo!
                    </h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #cbd5e1; max-width: 440px; line-height: 1.5;">
                      Tu espacio empresarial para <strong style="color: #ffffff;">${companyName}</strong> ha sido aprovisionado exitosamente en nuestra nube.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Hola <strong style="color: #0f172a;">${companyName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Te damos una cordial bienvenida a <strong>Prado ERP</strong>. A partir de este momento cuentas con un entorno completamente aislado, seguro y listo para optimizar la gestión financiera, comercial y operativa de tu empresa.
              </p>

              <!-- CREDENTIALS / TENANT INFO BOX -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">
                      Resumen de tu Espacio Empresarial
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b;" width="40%">Empresa registrada:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Usuario Administrador:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1b426e;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b;">ID de Organización:</td>
                        <td style="padding: 6px 0; font-size: 12px; font-family: monospace; color: #0284c7;">${companyId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Privacidad de Datos:</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #059669;">
                          <span style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 6px;">Multi-Tenant Aislado</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #1b426e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 15px 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(27, 66, 110, 0.35); text-align: center;">
                      Ir a mi Panel de Control &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- WHAT CAN YOU DO (FEATURE PILLARS) -->
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                ¿Qué puedes hacer desde hoy en Prado ERP?
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #eff6ff; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px;">🧾</div>
                        </td>
                        <td>
                          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">Facturación y Cotizaciones</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Emite cotizaciones formales, conviértelas a órdenes de venta o facturas oficiales con CAI y desglose de ISV.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #ecfdf5; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px;">🏦</div>
                        </td>
                        <td>
                          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">Bancos y Conciliación Mensual</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Controla tus cuentas bancarias en USD o Lempiras, aplica reglas automáticas y cierra conciliaciones mensuales sin descuadres.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #fef3c7; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px;">📦</div>
                        </td>
                        <td>
                          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">Inventario y Trazabilidad</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Administra existencias, costos, precios y rastreo por número de lote o número de serie individual.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #f3e8ff; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px;">📊</div>
                        </td>
                        <td>
                          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">Contabilidad en Tiempo Real</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Generación de partidas de diario automáticas, Libro Mayor, Balanza de Comprobación y antigüedad de saldos.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY NOTICE -->
              <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
                  🔒 <strong>Seguridad Garantizada:</strong> Tu información está estrictamente aislada bajo tu identificador de inquilino. Ningún otro usuario u organización tiene visibilidad de tus catálogos o transacciones.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                Si necesitas ayuda para configurar tu catálogo de cuentas, importar clientes o parametrizar tus bancos, no dudes en contactar a nuestro equipo de soporte respondiendo directamente a este correo.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155;">
                Prado ERP &mdash; Solución Integral en la Nube
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b;">
                Mensaje automático enviado para notificar la apertura de cuenta en pradocommerce.com.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Para iniciar sesión en cualquier momento, visita: <a href="${loginUrl}" style="color: #1b426e; text-decoration: underline;">${loginUrl}</a>
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

    const { data, error } = await resend.emails.send({
      from: `Prado ERP <${fromEmail}>`,
      to: [to],
      replyTo: "soporte@pradocommerce.com",
      subject: `¡Bienvenido a Prado ERP, ${companyName}! Tu espacio empresarial está listo`,
      html: emailHtml,
    });

    if (error) {
      console.error("[Welcome Email Error via Resend]:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Welcome Email Sent]: Successfully sent to ${to} (${companyName}), Resend ID: ${data?.id}`);
    return { success: true, data };
  } catch (err: any) {
    console.error("[Welcome Email Exception]:", err);
    return { success: false, error: err.message };
  }
}
