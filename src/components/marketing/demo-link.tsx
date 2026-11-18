"use client";

import Link, { useLinkStatus } from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

function Trail() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className="lp-btn-ball" aria-hidden="true" />
  ) : (
    <ArrowUpRightIcon aria-hidden="true" />
  );
}

function PendingFlag() {
  const { pending } = useLinkStatus();
  return pending ? <span className="sr-only">Abriendo la demo</span> : null;
}

/**
 * Entrada a /demo. Prefetch completo apenas el link entra en pantalla y
 * respuesta visible en el mismo click (estado :active + useLinkStatus).
 */
export function DemoLink({
  children,
  className = "",
  onNavigate,
}: {
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/demo"
      prefetch
      onNavigate={onNavigate}
      className={`lp-btn ${className}`}
    >
      {children}
      <Trail />
      <PendingFlag />
    </Link>
  );
}
