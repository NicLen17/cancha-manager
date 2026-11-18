import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
  TableSkeleton,
} from "@/components/admin/admin-skeletons";

// Replica ReservationsManager: tabs + búsqueda, barra de 4 filtros y tabla.
export default function AdminReservasLoading() {
  return (
    <AdminLoadingRegion label="Cargando reservas…">
      <AdminPageHeaderSkeleton titleWidth="w-36" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-80 max-w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-md sm:w-72" />
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={8} cols={8} className="rounded-2xl" />
    </AdminLoadingRegion>
  );
}
