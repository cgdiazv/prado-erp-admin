import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const companyId = await resolveCompanyId(req);
    const body = await req.json();
    const {
      to,
      vendorName = "Estimado proveedor",
      orderNumber = "OC-1001",
      issueDate = new Date().toISOString().split("T")[0],
      expectedDate = "",
      paymentTerms = "Crédito 30 días",
      category = "Insumos Generales",
      lines = [],
      currency = "L",
      currencySymbol = "L",
      total = 0,
      notes = "",
      fromEmailOverride,
      apiKey: customApiKey,
    } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "Se requiere un correo electrónico de destino válido ('to') para el proveedor." },
        { status: 400 }
      );
    }

    // Consultar información de la empresa configurada
    const comp = await prisma.companySettings.findUnique({
      where: { id: companyId },
    }).catch(() => null);

    const compName = comp?.nombreLegal || comp?.nombre || "Nuestra Empresa";
    const compSlogan = comp?.sector || "Gestión de Compras y Suministros";
    // Correo configurado por el usuario para su empresa
    const configuredCompanyEmail =
      fromEmailOverride?.trim() ||
      comp?.email?.trim() ||
      comp?.emailCliente?.trim() ||
      "";

    const compAddress = comp?.direccion || "";
    const compPhone = comp?.telefono || "";
    const compTaxId = comp?.taxId || "";

    const apiKey = customApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "No se encontró la clave de API de Resend (RESEND_API_KEY) configurada en el servidor." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const escapeHtml = (s: string) =>
      String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const itemsTableRowsHtml = lines
      .map(
        (line: any, idx: number) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px; font-size: 12px; color: #64748b; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 12px; color: #0f172a; font-weight: 600;">${escapeHtml(line.productName || line.description || "Material / Insumo")}</td>
          <td style="padding: 10px; font-size: 11px; color: #1b426e; font-family: monospace;">${escapeHtml(line.sku || "—")}</td>
          <td style="padding: 10px; font-size: 12px; color: #475569;">${escapeHtml(line.description || "—")}</td>
          <td style="padding: 10px; font-size: 12px; color: #0f172a; text-align: right; font-family: monospace; font-weight: 600;">${line.quantity || 1}</td>
          <td style="padding: 10px; font-size: 12px; color: #0f172a; text-align: right; font-family: monospace;">${currencySymbol} ${(Number(line.rate) || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; font-size: 12px; color: #0f172a; text-align: right; font-family: monospace; font-weight: 700;">${currencySymbol} ${(Number(line.total) || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Orden de Compra ${escapeHtml(orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="620" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1b426e 100%); padding: 26px 32px; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${escapeHtml(compName)}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd;">${escapeHtml(compSlogan)}</p>
                    ${compTaxId ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #cbd5e1;">RTN: ${escapeHtml(compTaxId)}</p>` : ""}
                  </td>
                  <td align="right">
                    <span style="background-color: #ffffff; color: #1b426e; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; display: inline-block;">
                      ORDEN DE COMPRA N.º ${escapeHtml(orderNumber)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                Estimado equipo de ${escapeHtml(vendorName)},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                Por medio del presente correo, <strong>${escapeHtml(compName)}</strong> formaliza la emisión de la 
                <strong>Orden de Compra N.º ${escapeHtml(orderNumber)}</strong> correspondiente a suministros de 
                <strong>${escapeHtml(category)}</strong>. Agradecemos confirmar recepción e indicar la fecha programada de entrega.
              </p>

              <!-- METADATA BOX -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;">
                    <strong>Fecha de Emisión:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(issueDate)}</span>
                  </td>
                  <td width="50%" style="font-size: 12px; color: #64748b; padding-bottom: 8px;" align="right">
                    <strong>Fecha Esperada:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(expectedDate || "A convenir")}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="font-size: 12px; color: #64748b;">
                    <strong>Términos de Pago:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(paymentTerms || "Al contado")}</span>
                  </td>
                  <td width="50%" style="font-size: 12px; color: #64748b;" align="right">
                    <strong>Moneda:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(currency)} (${currencySymbol})</span>
                  </td>
                </tr>
              </table>

              <!-- ITEMS TABLE -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: center; width: 30px;">#</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: left;">Insumo / Producto</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; width: 85px;">SKU</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: left;">Detalle</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; width: 50px;">Cant.</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; width: 90px;">Costo Unit.</th>
                    <th style="padding: 10px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; width: 95px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsTableRowsHtml}
                </tbody>
              </table>

              <!-- TOTAL BANNER -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 13px; font-weight: 700; color: #0f172a;">
                    TOTAL ORDEN DE COMPRA:
                  </td>
                  <td align="right" style="font-size: 17px; font-weight: 900; color: #1b426e; font-family: monospace;">
                    ${currencySymbol} ${(Number(total) || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${escapeHtml(currency)}
                  </td>
                </tr>
              </table>

              <!-- INSTRUCTIONS / NOTES -->
              ${
                notes
                  ? `
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase;">
                  Instrucciones de Entrega y Observaciones:
                </p>
                <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.5;">
                  ${escapeHtml(notes)}
                </p>
              </div>
              `
                  : ""
              }

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Por favor responder a este correo para coordinar despacho o solicitar cualquier aclaración referente a esta orden.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">${escapeHtml(compName)}</p>
              ${compAddress ? `<p style="margin: 0 0 4px 0;">${escapeHtml(compAddress)}</p>` : ""}
              <p style="margin: 0; color: #94a3b8;">
                ${configuredCompanyEmail ? `Correo: ${escapeHtml(configuredCompanyEmail)}` : ""}
                ${compPhone ? ` | Teléfono: ${escapeHtml(compPhone)}` : ""}
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

    // Configurar la dirección FROM requerida por el usuario
    // Si la empresa tiene configurado un correo, se usa como remitente principal
    const fallbackFromEmail = process.env.CONTACT_FROM_EMAIL || "notifications@pradocommerce.com";
    const senderEmail = configuredCompanyEmail && configuredCompanyEmail.includes("@")
      ? configuredCompanyEmail
      : fallbackFromEmail;

    const primaryFrom = `${compName} <${senderEmail}>`;
    const replyToEmail = configuredCompanyEmail && configuredCompanyEmail.includes("@")
      ? configuredCompanyEmail
      : undefined;

    let sendResult;
    let usedFrom = primaryFrom;

    try {
      // Intento 1: Enviar con el correo configurado de la empresa
      const { data, error } = await resend.emails.send({
        from: primaryFrom,
        to: [to],
        replyTo: replyToEmail,
        subject: `Orden de Compra N.º ${orderNumber} - ${compName}`,
        html: emailHtml,
      });

      if (error) {
        throw error;
      }
      sendResult = data;
    } catch (primaryErr: any) {
      console.warn("Fallo con remitente configurado de empresa en Resend:", primaryErr?.message);
      
      // Si el dominio no está verificado en Resend (error típico de dominio en Resend),
      // reintentamos transparentemente con el remitente verificado del sistema y replyTo a la empresa
      if (
        primaryErr?.message?.toLowerCase().includes("domain") ||
        primaryErr?.message?.toLowerCase().includes("verify") ||
        primaryErr?.message?.toLowerCase().includes("validation_error") ||
        primaryErr?.statusCode === 403 ||
        primaryErr?.name === "validation_error"
      ) {
        usedFrom = `${compName} <${fallbackFromEmail}>`;
        const retry = await resend.emails.send({
          from: usedFrom,
          to: [to],
          replyTo: replyToEmail || senderEmail,
          subject: `Orden de Compra N.º ${orderNumber} - ${compName}`,
          html: emailHtml,
        });

        if (retry.error) {
          console.error("Error al reintentar con remitente de respaldo Resend:", retry.error);
          return NextResponse.json(
            { error: retry.error.message || "Error al enviar correo por Resend." },
            { status: 400 }
          );
        }
        sendResult = retry.data;
      } else {
        return NextResponse.json(
          { error: primaryErr.message || "Error al enviar correo con Resend." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: sendResult,
      from: usedFrom,
      message: `Orden de compra ${orderNumber} enviada correctamente a ${to} desde ${usedFrom}`,
    });
  } catch (err: any) {
    console.error("Error en POST /api/send-purchase-order:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor al enviar la orden de compra." },
      { status: 500 }
    );
  }
}
