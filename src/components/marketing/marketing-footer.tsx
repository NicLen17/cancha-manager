import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { BRAND } from "@/lib/brand";

export function MarketingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-in">
        <div>
          <Link href="/" className="lp-brand" aria-label="Cancha Manager, inicio">
            <BrandMark className="size-8" />
            <span translate="no">Cancha Manager</span>
          </Link>
          <p className="mt-2 max-w-sm">
            La web, las reservas y el panel de tu complejo deportivo.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <Link href="/demo">Complejo de demo</Link>
          <Link href="/mis-reservas" prefetch={false}>
            Consultar una reserva
          </Link>
          <Link href="/admin" prefetch={false}>
            Administración
          </Link>
          <a href={BRAND.contact} target="_blank" rel="noreferrer">
            Contacto por WhatsApp
          </a>
        </nav>
      </div>
      <div className="lp-wrap lp-footer-base">
        <p>© {new Date().getFullYear()} Cancha Manager</p>
        <p>La demo usa un complejo ficticio y no recibe pagos reales.</p>
      </div>
    </footer>
  );
}
