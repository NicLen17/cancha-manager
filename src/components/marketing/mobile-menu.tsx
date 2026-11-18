"use client";

import { useRef } from "react";
import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import { DemoLink } from "./demo-link";

/** Menú de pantalla completa sobre <dialog>: foco atrapado y Escape nativos. */
export function MobileMenu({
  links,
  contactHref,
}: {
  links: { href: string; label: string }[];
  contactHref: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        className="lp-menu-btn"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <MenuIcon aria-hidden="true" className="size-5" />
      </button>
      <dialog ref={dialog} className="lp-menu" aria-label="Menú">
        <div className="lp-menu-top">
          <span className="lp-brand" translate="no">
            Cancha Manager
          </span>
          <button
            type="button"
            className="lp-menu-btn"
            aria-label="Cerrar menú"
            onClick={close}
          >
            <XIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
        <nav className="lp-menu-links" aria-label="Menú móvil">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={close}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="lp-menu-foot">
          <DemoLink className="lp-btn-line lp-btn-lg" onNavigate={close}>
            Probar demo
          </DemoLink>
          <a
            className="lp-btn lp-btn-cone lp-btn-lg"
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            Solicitar demo
            <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
      </dialog>
    </>
  );
}
