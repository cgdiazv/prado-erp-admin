import Link from "next/link";
import Image from "next/image";

export default function PublicFooter() {
  return (
    <footer className="bg-[#25426f] text-white">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 pt-[50px] pb-[30px]">
        {/* Top: Identity & Navigation */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10">
          <div className="flex flex-col gap-4 max-w-[430px]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[7px] overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src="/logo-prado.png"
                  alt="Prado ERP"
                  width={34}
                  height={34}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-manrope font-extrabold text-[25px] leading-[34px] text-white tracking-tight">
                Prado ERP
              </span>
            </Link>
            <p className="font-inter text-[13px] leading-[22px] text-[#b6c5d5]">
              Facturación y administración en la nube.
              <br />
              Hecho para empresas en Honduras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-[50px] font-inter text-[13px] text-white">
            <Link href="/#funciones" className="hover:text-[#b6c5d5] transition">
              Funciones
            </Link>
            <Link href="/#precios" className="hover:text-[#b6c5d5] transition">
              Precios
            </Link>
            <Link href="/login" className="hover:text-[#b6c5d5] transition">
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-[23px] border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 font-inter text-[11px] leading-[13px] text-[#b6c5d5]">
          <p>© 2026 Prado ERP</p>
          <div className="flex items-center gap-[30px]">
            <Link href="/privacidad" className="hover:text-white transition">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white transition">
              Términos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
