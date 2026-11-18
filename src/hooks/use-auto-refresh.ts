"use client";

import { useEffect, useEffectEvent, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshOptions = {
  /** Cada cuánto refrescar mientras la pestaña está visible. */
  intervalMs: number;
  /**
   * Pausa el refresco (p. ej. mientras hay una mutación en curso). La mutación
   * ya devuelve datos frescos vía revalidatePath; refrescar en paralelo solo
   * agrega carga y puede mostrar un estado intermedio.
   */
  paused?: boolean;
};

/**
 * Refresca los Server Components de la ruta actual de forma segura:
 * - no corre con la pestaña oculta y, al volver, refresca solo si los datos
 *   tienen más de `intervalMs`;
 * - no encola un refresh si el anterior todavía no terminó;
 * - se limpia al desmontar (sin timers huérfanos).
 *
 * Next procesa `router.refresh()` y las server actions en una única cola, así
 * que las respuestas no se aplican fuera de orden.
 */
export function useAutoRefresh({ intervalMs, paused = false }: AutoRefreshOptions) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const lastRefreshAt = useRef(0);

  const refresh = useEffectEvent((force: boolean) => {
    if (paused || isRefreshing) return;
    if (document.visibilityState !== "visible") return;
    if (!force && Date.now() - lastRefreshAt.current < intervalMs) return;
    lastRefreshAt.current = Date.now();
    startTransition(() => router.refresh());
  });

  useEffect(() => {
    lastRefreshAt.current = Date.now();
    const timer = window.setInterval(() => refresh(true), intervalMs);
    const onVisible = () => refresh(false);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return { isRefreshing };
}
