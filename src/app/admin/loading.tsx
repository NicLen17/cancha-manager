import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  CardSkeleton,
} from "@/components/admin/admin-skeletons";

// Replica src/app/admin/page.tsx: encabezado con acciones, 4 KPIs y grilla 7/5.
export default function AdminLoading() {
  return (
    <AdminLoadingRegion label="Cargando el panel…" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-11 w-44 rounded-lg" />
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <CardSkeleton bodyClassName="h-[220px]" />
          <CardSkeleton bodyClassName="h-48" />
        </div>
        <CardSkeleton className="lg:col-span-5" bodyClassName="h-64" />
      </div>
    </AdminLoadingRegion>
  );
}
