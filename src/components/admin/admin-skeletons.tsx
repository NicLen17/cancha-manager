import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Piezas para `loading.tsx` del admin. Regla: el skeleton replica la grilla,
 * alturas y espaciados de la page real para que al llegar los datos no se mueva
 * nada (sin CLS). Server Components puros: cero JS en el cliente.
 */

/** Contenedor con anuncio para lectores de pantalla. */
export function AdminLoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("space-y-6", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Título (font-display text-2xl) + bajada, igual que el encabezado de cada page. */
export function AdminPageHeaderSkeleton({
  titleWidth = "w-44",
  action = false,
}: {
  titleWidth?: string;
  action?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className={cn("h-8", titleWidth)} />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-32 rounded-lg" /> : null}
    </div>
  );
}

/** Tabla dentro de `rounded-xl border bg-card`, con fila de encabezado. */
export function TableSkeleton({
  rows = 6,
  cols = 6,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div
        className="grid gap-4 border-b bg-muted/40 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 border-b px-4 py-3.5 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-24" : "w-16")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card con encabezado (título + descripción) y cuerpo de alto fijo. */
export function CardSkeleton({
  bodyClassName = "h-40",
  className,
}: {
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 rounded-xl border bg-card p-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-56 max-w-full" />
      </div>
      <Skeleton className={cn("w-full rounded-lg", bodyClassName)} />
    </div>
  );
}
