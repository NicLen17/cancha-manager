"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * recharts pesa ~100 KB gzip y solo se usa en el dashboard: se carga diferido
 * (sin SSR, porque mide el contenedor en el navegador) y mientras tanto se
 * muestra un skeleton del mismo alto para no mover el layout.
 */
export const DashboardHourChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.DashboardHourChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-lg" />,
  },
);
