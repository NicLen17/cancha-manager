import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallbacks del flujo de reserva. Copian la estructura de BookingBoard y del
 * ticket de confirmación (fondo navy, mismas alturas) para que la transición
 * skeleton → contenido no mueva nada. Server Components, sin JS.
 */

const onDark = "bg-white/10";

export function BookingBoardSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div role="status" className="sr-only">
        Cargando turnos disponibles…
      </div>
      <div className="rounded-3xl border border-white/10 bg-navy-950 p-4 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className={`h-3.5 w-52 ${onDark}`} />
            <Skeleton className={`h-8 w-64 ${onDark}`} />
            <Skeleton className={`h-4 w-80 max-w-full ${onDark}`} />
          </div>
          <div className="flex gap-2">
            <Skeleton className={`h-10 w-28 rounded-md ${onDark}`} />
            <Skeleton className={`h-10 w-28 rounded-md ${onDark}`} />
          </div>
        </div>
        <Skeleton className={`mt-4 mb-2 h-3 w-36 ${onDark}`} />
        <div className="flex gap-2 overflow-hidden pb-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className={`h-[74px] min-w-[72px] rounded-2xl ${onDark}`} />
          ))}
        </div>
        <Skeleton className={`mt-4 mb-2 h-3 w-24 ${onDark}`} />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className={`h-8 w-28 rounded-xl ${onDark}`} />
          ))}
        </div>
        <Skeleton className={`mt-4 mb-2 h-3 w-40 ${onDark}`} />
        <div className="flex gap-2 overflow-hidden pb-1">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className={`h-8 w-[70px] shrink-0 rounded-xl ${onDark}`} />
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:h-[600px] md:grid-cols-[minmax(0,1fr)_350px]">
        <Skeleton className="aspect-[3/2] w-full rounded-2xl md:aspect-auto md:h-full" />
        <div className="hidden h-[600px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-navy-950 p-6 md:flex">
          <Skeleton className={`size-8 rounded-lg ${onDark}`} />
          <Skeleton className={`h-6 w-40 ${onDark}`} />
          <Skeleton className={`h-4 w-56 ${onDark}`} />
        </div>
      </div>
    </div>
  );
}

/** Ticket oscuro de /reservar/confirmar y /reserva/[code]. */
export function TicketSkeleton({
  label,
  rows = 6,
  maxWidth = "max-w-3xl",
}: {
  label: string;
  rows?: number;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-navy-950 py-8 sm:py-12" aria-busy="true">
      <div role="status" className="sr-only">
        {label}
      </div>
      <div className={`mx-auto px-4 sm:px-6 ${maxWidth}`}>
        <Skeleton className={`mb-6 h-4 w-56 ${onDark}`} />
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-navy-900/90">
          <div className="space-y-3 border-b border-white/10 p-6 sm:p-8">
            <Skeleton className={`h-3.5 w-56 ${onDark}`} />
            <Skeleton className={`h-8 w-64 ${onDark}`} />
            <Skeleton className={`h-3.5 w-80 max-w-full ${onDark}`} />
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className={`h-11 w-full rounded-xl ${onDark}`} />
            ))}
            <Skeleton className="h-13 w-full rounded-xl bg-lime-400/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
