import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { BRAND } from "@/lib/brand";
import { DemoLink } from "./demo-link";
import { MobileMenu } from "./mobile-menu";

const LINKS = [
  { href: "#producto", label: "Qué cambia" },
  { href: "#flujo", label: "Cómo funciona" },
  { href: "#panel", label: "El panel" },
  { href: "#preguntas", label: "Preguntas" },
];

export function MarketingHeader() {
  return (
    <header className="lp-header">
      <a className="lp-skip" href="#contenido">
        Saltar al contenido
      </a>
      <div className="lp-wrap lp-header-in">
        <Link href="/" className="lp-brand" aria-label="Cancha Manager, inicio">
          <BrandMark className="size-8" />
          <span translate="no">Cancha Manager</span>
        </Link>
        <nav className="lp-nav" aria-label="Principal">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="lp-header-cta">
          <a
            className="lp-btn lp-btn-cone lp-btn-sm lp-only-wide"
            href={BRAND.contact}
            target="_blank"
            rel="noreferrer"
          >
            Solicitar demo
            <ArrowUpRightIcon aria-hidden="true" />
          </a>
          <DemoLink className="lp-btn-line lp-btn-sm">
            <span className="lp-xs-hide">Probar demo</span>
            <span className="lp-xs-only">Demo</span>
          </DemoLink>
          <MobileMenu links={LINKS} contactHref={BRAND.contact} />
        </div>
      </div>
    </header>
  );
}
