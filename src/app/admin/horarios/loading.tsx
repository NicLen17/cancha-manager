import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
  CardSkeleton,
} from "@/components/admin/admin-skeletons";

// Replica HoursEditor (7 filas) + ClosuresManager.
export default function AdminHorariosLoading() {
  return (
    <AdminLoadingRegion label="Cargando horarios…">
      <AdminPageHeaderSkeleton titleWidth="w-36" />
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-[66px] w-full rounded-lg" />
        ))}
      </div>
      <CardSkeleton bodyClassName="h-64" />
    </AdminLoadingRegion>
  );
}
