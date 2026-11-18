"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Boundary general (demo, reserva, mis reservas). El root layout queda por
// fuera: para errores ahí está global-error.tsx.
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="contenido"
      role="alert"
      className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <p className="text-sm font-semibold tracking-widest text-lime-600 uppercase">
        Algo salió mal
      </p>
      <h1 className="font-display text-4xl text-navy-900 uppercase">
        No pudimos cargar la página
      </h1>
      <p className="max-w-md text-muted-foreground">
        Probá de nuevo en unos segundos. Si estabas reservando, tu turno no se
        confirmó todavía.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Reintentar</Button>
        <Button asChild variant="secondary">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
