import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { TRIAL_DAYS } from "@/lib/plans";

export const metadata = {
  title: "Términos y Condiciones — Prado ERP",
};

export default function TerminosPage() {
  const sections = [
    {
      title: "1. Aceptación de los términos",
      body: [
        "Al crear una cuenta o utilizar Prado ERP (el \"Servicio\"), usted acepta estos Términos y Condiciones. Si actúa en nombre de una empresa, declara tener autoridad para vincularla a estos términos.",
      ],
    },
    {
      title: "2. Descripción del servicio",
      body: [
        "Prado ERP es una plataforma en la nube de gestión empresarial y contable que incluye facturación, cotizaciones, contabilidad de partida doble, bancos, inventario, caja chica, retenciones y reportes.",
        "El Servicio se ofrece \"tal cual\" y puede evolucionar con mejoras, cambios o eliminación de funcionalidades.",
      ],
    },
    {
      title: `3. Período de prueba de ${TRIAL_DAYS} días`,
      body: [
        `Toda cuenta nueva incluye ${TRIAL_DAYS} días de prueba gratuita con acceso completo. No se requiere tarjeta de crédito para iniciar.`,
        "Al finalizar la prueba, el acceso se suspende hasta que se contrate uno de los planes de suscripción. Los datos ingresados durante la prueba se conservan y estarán disponibles al suscribirse.",
      ],
    },
    {
      title: "4. Suscripciones y pagos",
      body: [
        "Las suscripciones son mensuales y se procesan de forma segura a través de Stripe.",
        "Los precios están expresados en dólares estadounidenses (USD) y pueden cambiar con previo aviso de 30 días.",
        "La falta de pago puede resultar en la suspensión del acceso al Servicio hasta regularizar la cuenta.",
      ],
    },
    {
      title: "5. Cancelación",
      body: [
        "Usted puede cancelar su suscripción en cualquier momento. El acceso permanecerá activo hasta el final del período ya pagado; no se otorgan reembolsos proporcionales.",
        "Tras la cancelación, podrá solicitar la exportación de los datos de su empresa durante los 90 días siguientes.",
      ],
    },
    {
      title: "6. Cuentas y responsabilidad del usuario",
      body: [
        "Usted es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada bajo su cuenta.",
        "Se compromete a usar el Servicio conforme a la ley y a no intentar vulnerar su seguridad, acceder a datos de otras empresas ni hacer ingeniería inversa de la plataforma.",
      ],
    },
    {
      title: "7. Propiedad de los datos",
      body: [
        "Los datos contables, comerciales y financieros que usted ingresa son propiedad exclusiva de su empresa.",
        "Prado ERP solo los utiliza para operar el Servicio, conforme a la Política de Privacidad.",
      ],
    },
    {
      title: "8. Disponibilidad y respaldo",
      body: [
        "Procuramos una alta disponibilidad del Servicio, pero no garantizamos operación ininterrumpida. Realizamos respaldos periódicos; no obstante, recomendamos exportar información crítica regularmente.",
      ],
    },
    {
      title: "9. Limitación de responsabilidad",
      body: [
        "Prado ERP no será responsable por daños indirectos, lucro cesante o pérdida de datos derivados del uso o imposibilidad de uso del Servicio, en la máxima medida permitida por la ley.",
        "El Servicio es una herramienta de gestión: la exactitud y cumplimiento fiscal de la información registrada es responsabilidad de cada empresa y su contador.",
      ],
    },
    {
      title: "10. Modificaciones",
      body: [
        "Podremos actualizar estos términos ocasionalmente. Los cambios relevantes se notificarán por correo o dentro de la plataforma; el uso continuado del Servicio implica su aceptación.",
      ],
    },
    {
      title: "11. Ley aplicable",
      body: [
        "Estos términos se rigen por las leyes de la República de Honduras. Cualquier controversia se someterá a los tribunales competentes de Honduras.",
      ],
    },
    {
      title: "12. Contacto",
      body: [
        "Para consultas sobre estos términos, escríbanos a info@pradosys.com.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Términos y Condiciones</h1>
        <p className="text-xs text-slate-400 mt-2">Última actualización: 7 de septiembre de 2026</p>
        <p className="text-sm text-slate-600 mt-6 leading-relaxed">
          Estos Términos y Condiciones regulan el uso de Prado ERP. Le recomendamos leerlos junto con
          nuestra{" "}
          <Link href="/privacidad" className="font-semibold text-[#1b426e] hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-extrabold text-slate-900">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((p) => (
                  <li key={p} className="text-sm text-slate-600 leading-relaxed">
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
