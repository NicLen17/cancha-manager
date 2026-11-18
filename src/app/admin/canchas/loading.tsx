import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
  TableSkeleton,
} from "@/components/admin/admin-skeletons";

export default function AdminCanchasLoading() {
  return (
    <AdminLoadingRegion label="Cargando canchas…">
      <AdminPageHeaderSkeleton titleWidth="w-36" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </AdminLoadingRegion>
  );
}
