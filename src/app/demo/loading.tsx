import { Skeleton } from "@/components/ui/skeleton";
import { DemoCourtsSkeleton, DemoMapSkeleton } from "./demo-skeletons";

// /demo es dinámica: sin este archivo Next no puede prefetchear nada y el
// click en "Probar demo" quedaba sin respuesta visible hasta que el servidor
// terminaba de renderizar. Con loading.tsx el skeleton se prefetchea y se
// muestra al instante (header y footer vienen del layout).
export default function DemoLoading() {
  return (
    <main id="contenido" className="cm-demo-page flex-1" aria-busy="true">
      <div className="cm-demo-banner">
        ESTÁS EN UNA DEMO · Complejo ficticio · No realices pagos reales
      </div>
      <div role="status" className="sr-only">
        Cargando el complejo de demostración…
      </div>
      <section className="cm-container cm-section grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-3.5 w-48 bg-[#dfe9da]" />
          <Skeleton className="h-40 w-full max-w-md bg-[#dfe9da] sm:h-56" />
          <Skeleton className="h-14 w-full max-w-md bg-[#dfe9da]" />
          <Skeleton className="h-12 w-52 rounded-full bg-[#dfe9da]" />
        </div>
        <div className="rounded-3xl bg-[#dfe9da] p-4 sm:p-7">
          <Skeleton className="mb-5 h-4 w-48 bg-[#c9d8c2]" />
          <DemoMapSkeleton />
          <Skeleton className="mt-4 h-3 w-56 bg-[#c9d8c2]" />
        </div>
      </section>
      <section className="cm-container pb-20">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-64 bg-[#dfe9da]" />
          <Skeleton className="h-4 w-80 max-w-full bg-[#dfe9da]" />
        </div>
        <DemoCourtsSkeleton />
      </section>
    </main>
  );
}
