import { Skeleton } from "@/components/ui/skeleton";

// Fallbacks del demo con las mismas medidas que el contenido real:
// plano 3:2 (120 × 80 m del complejo de ejemplo) y tarjetas .cm-court-card.

export function DemoMapSkeleton() {
  return (
    <Skeleton className="aspect-[3/2] w-full rounded-2xl bg-[#c9d8c2]" />
  );
}

export function DemoCourtsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cm-court-card space-y-4">
          <Skeleton className="h-3 w-20 bg-[#dfe9da]" />
          <Skeleton className="h-7 w-40 bg-[#dfe9da]" />
          <Skeleton className="h-10 w-full bg-[#dfe9da]" />
          <Skeleton className="h-3 w-44 bg-[#dfe9da]" />
          <Skeleton className="h-6 w-full bg-[#dfe9da]" />
        </div>
      ))}
    </div>
  );
}
