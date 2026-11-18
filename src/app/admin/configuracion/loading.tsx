import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminLoadingRegion,
  AdminPageHeaderSkeleton,
} from "@/components/admin/admin-skeletons";

// Replica VenueConfigForm (grilla 2 columnas) + bloque de demo.
export default function AdminConfiguracionLoading() {
  return (
    <AdminLoadingRegion label="Cargando configuración…">
      <AdminPageHeaderSkeleton titleWidth="w-48" />
      <div className="max-w-2xl space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={i === 4 ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
    </AdminLoadingRegion>
  );
}
