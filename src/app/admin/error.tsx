"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Captura errores de cualquier page del admin sin perder el sidebar (el
// layout del segmento queda por fuera del boundary).
export default function AdminError({
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
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-600">
        <AlertTriangleIcon aria-hidden="true" className="size-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl uppercase">No pudimos cargar esta sección</h1>
        <p className="text-sm text-muted-foreground">
          Puede ser un problema momentáneo de conexión. Probá de nuevo; si sigue
          pasando, avisanos con este código: {error.digest ?? "sin código"}.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Reintentar</Button>
        <Button asChild variant="outline">
          <Link href="/admin">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
