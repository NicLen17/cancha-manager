import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
  CardSkeleton,
  TableSkeleton,
} from "@/components/admin/admin-skeletons";

export default function AdminPreciosLoading() {
  return (
    <AdminLoadingRegion label="Cargando precios…">
      <AdminPageHeaderSkeleton titleWidth="w-32" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={4} cols={8} />
      <CardSkeleton bodyClassName="h-56" />
    </AdminLoadingRegion>
  );
}
