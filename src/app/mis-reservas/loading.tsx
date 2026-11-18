import { SiteHeader } from "@/components/layout/site-header";
import { DiagonalSection } from "@/components/layout/diagonal-section";
import { Skeleton } from "@/components/ui/skeleton";

// Replica mis-reservas/page.tsx: encabezado de sección + card de búsqueda.
export default function MisReservasLoading() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1" aria-busy="true">
        <div role="status" className="sr-only">
          Cargando la consulta de reservas…
        </div>
        <DiagonalSection tone="muted" className="py-10 sm:py-14">
          <div className="mx-auto max-w-lg space-y-6 px-4 sm:px-6">
            <div className="space-y-3 text-center">
              <Skeleton className="mx-auto h-3.5 w-24" />
              <Skeleton className="mx-auto h-10 w-56" />
              <Skeleton className="mx-auto h-4 w-80 max-w-full" />
            </div>
            <div className="space-y-5 rounded-xl border bg-card p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-64" />
              </div>
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </DiagonalSection>
      </main>
    </>
  );
}
