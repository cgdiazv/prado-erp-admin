import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata = {
  title: "Política de Privacidad — Prado ERP",
};

const SECTIONS = [
  {
    title: "1. Información que recopilamos",
    body: [
      "Datos de registro: nombre de la empresa, correo electrónico y contraseña (almacenada de forma cifrada) al crear su cuenta.",
    "Datos de facturación: información de pago procesada de forma segura por Stripe. Prado ERP no almacena números de tarjeta de crédito.",
      "Datos operativos: la información contable, de clientes, proveedores, inventario y demás registros que usted ingresa al sistema pertenecen exclusivamente a su empresa.",
      "Datos técnicos: dirección IP, tipo de navegador y registros de acceso, utilizados para seguridad y diagnóstico.",
    ],
  },
  {
    title: "2. Cómo usamos su información",
    body: [
      "Proveer y operar el servicio de Prado ERP.",
      "Procesar pagos y gestionar su suscripción a través de Stripe.",
      "Enviar comunicaciones transaccionales (bienvenida, recuperación de contraseña, avisos de facturación).",
      "Mejorar la seguridad, rendimiento y funcionalidad de la plataforma.",
    ],
  },
  {
    title: "3. Aislamiento de datos entre empresas",
    body: [
      "Prado ERP es una plataforma multi-empresa. Los datos de cada empresa están aislados lógicamente: ningún usuario de otra empresa puede acceder a su información contable, comercial o financiera.",
    ],
  },
  {
    title: "4. Compartición de datos",
    body: [
      "No vendemos ni alquilamos su información personal a terceros.",
      "Compartimos datos únicamente con proveedores necesarios para operar el servicio: Stripe (pagos), servicios de correo transaccional y proveedores de infraestructura en la nube.",
      "Podremos divulgar información si la ley lo requiere o para proteger nuestros derechos legales.",
    ],
  },
  {
    title: "5. Seguridad",
    body: [
      "Las contraseñas se almacenan con cifrado bcrypt y las comunicaciones viajan sobre HTTPS.",
      "El acceso a la base de datos está restringido y las sesiones se gestionan mediante cookies seguras HTTP-only.",
    ],
  },
  {
    title: "6. Retención y eliminación",
    body: [
      "Sus datos se conservan mientras su cuenta esté activa. Si cancela su suscripción, puede solicitar la exportación o eliminación definitiva de los datos de su empresa escribiéndonos.",
    ],
  },
  {
    title: "7. Sus derechos",
    body: [
      "Usted puede acceder, corregir o eliminar su información personal en cualquier momento desde la plataforma o contactándonos.",
      "Puede cancelar su suscripción cuando lo desee; el acceso permanecerá hasta el final del período pagado.",
    ],
  },
  {
    title: "8. Cambios a esta política",
    body: [
      "Podremos actualizar esta política ocasionalmente. Notificaremos los cambios relevantes por correo electrónico o dentro de la plataforma.",
    ],
  },
  {
    title: "9. Contacto",
    body: [
      "Si tiene preguntas sobre esta política o el tratamiento de sus datos, contáctenos en info@pradosys.com.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Política de Privacidad</h1>
        <p className="text-xs text-slate-400 mt-2">Última actualización: 7 de septiembre de 2026</p>
        <p className="text-sm text-slate-600 mt-6 leading-relaxed">
          En Prado ERP respetamos su privacidad y protegemos los datos de su empresa. Esta política
          describe qué información recopilamos, cómo la usamos y los derechos que usted tiene sobre ella.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
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

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Prado ERP. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500">
            <Link href="/privacidad" className="hover:text-slate-800 transition">Privacidad</Link>
            <Link href="/terminos" className="hover:text-slate-800 transition">Términos y Condiciones</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
