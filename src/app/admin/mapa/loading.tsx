import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
  CardSkeleton,
} from "@/components/admin/admin-skeletons";

// Replica MapBuilder: dimensiones + plano a la izquierda, inspector de 320px.
export default function AdminMapaLoading() {
  return (
    <AdminLoadingRegion label="Cargando el mapa del predio…">
      <AdminPageHeaderSkeleton titleWidth="w-56" />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <CardSkeleton bodyClassName="h-10" />
          <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
        </div>
        <CardSkeleton bodyClassName="h-[520px]" />
      </div>
    </AdminLoadingRegion>
  );
}
