"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DiagonalSection } from "@/components/layout/diagonal-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReservarError({
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
    <DiagonalSection tone="muted" className="py-10 sm:py-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar la reserva</CardTitle>
            <CardDescription>
              Ocurrió un error al obtener la disponibilidad. Intentá de nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {/* retry() vuelve a pedir los datos al servidor; reset() solo re-renderizaba. */}
            <Button type="button" onClick={() => retry()}>
              Reintentar
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Ir al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DiagonalSection>
  );
}
