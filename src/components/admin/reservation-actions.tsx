"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import type { ReservationWithDetails } from "@/lib/data/types";
import { STATUS_LABELS } from "@/lib/data/types";
import { updateReservationStatusAction } from "@/lib/services/reservations";
import { formatArs } from "@/lib/services/pricing";
import { formatTimeLabel } from "@/lib/services/availability";
import { formatVenueDate } from "@/lib/services/venue-time";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ManagedStatus = "confirmed" | "cancelled" | "pending";

/** Reserva con marca de "cambio optimista en curso" para mostrar el spinner. */
export type OptimisticReservation = ReservationWithDetails & {
  isSaving?: boolean;
};

const SUCCESS_COPY: Record<ManagedStatus, string> = {
  confirmed: "Reserva confirmada",
  cancelled: "Reserva cancelada. El turno quedó libre.",
  pending: "Reserva marcada como pendiente",
};

/**
 * Estado optimista compartido para una lista de reservas.
 *
 * - El cambio se ve al instante en toda la fila (badge, filtros, contadores),
 *   no solo en el botón.
 * - Si la action falla, React descarta el estado optimista al terminar la
 *   transición (rollback automático) y mostramos el motivo en un toast.
 * - Si sale bien, la action hace revalidatePath y los props nuevos llegan en la
 *   misma transición, así que no hay parpadeo al valor viejo.
 */
export function useReservationStatusMutations(
  reservations: ReservationWithDetails[],
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, applyOptimistic] = useOptimistic(
    reservations as OptimisticReservation[],
    (list, update: { id: string; status: ManagedStatus }) =>
      list.map((r) =>
        r.id === update.id ? { ...r, status: update.status, isSaving: true } : r,
      ),
  );

  function changeStatus(id: string, status: ManagedStatus) {
    startTransition(async () => {
      applyOptimistic({ id, status });
      const result = await updateReservationStatusAction({ id, status });
      if (result.ok) {
        toast.success(SUCCESS_COPY[status]);
        return;
      }
      toast.error(result.error);
      // Si falló porque otra persona ya la cambió, el rollback mostraría el
      // estado viejo: pedimos el estado real al servidor.
      router.refresh();
    });
  }

  return { items, changeStatus, isPending };
}

type ReservationStatusActionsProps = {
  reservation: OptimisticReservation;
  onChangeStatus: (id: string, status: ManagedStatus) => void;
  compact?: boolean;
};

/** Botones Confirmar / Cancelar. Presentacional: la mutación vive en el hook. */
export function ReservationStatusActions({
  reservation,
  onChangeStatus,
  compact = false,
}: ReservationStatusActionsProps) {
  const { status, isSaving } = reservation;
  const size = compact ? "sm" : "default";

  const receipt = reservation.receiptPath ? (
    <a
      href={`/admin/comprobantes/${reservation.id}`}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold underline underline-offset-4"
    >
      Ver comprobante
    </a>
  ) : null;

  if (status !== "pending" && status !== "confirmed") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {receipt}
        {isSaving ? <SavingIndicator /> : null}
        <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex items-center justify-end gap-1"
          : "flex flex-wrap items-center gap-2"
      }
    >
      {receipt}
      {isSaving ? <SavingIndicator /> : null}
      {status === "confirmed" ? (
        <Badge>Confirmada</Badge>
      ) : (
        <Button
          size={size}
          disabled={isSaving}
          onClick={() => onChangeStatus(reservation.id, "confirmed")}
        >
          Confirmar
        </Button>
      )}
      <ConfirmActionDialog
        title={`¿Cancelar la reserva ${reservation.code}?`}
        description={`El turno de ${reservation.customer.fullName} queda libre para otra persona. Avisale por WhatsApp si hace falta.`}
        confirmLabel="Sí, cancelar"
        cancelLabel="No, mantener"
        onConfirm={() => onChangeStatus(reservation.id, "cancelled")}
        trigger={
          <Button size={size} variant="outline" disabled={isSaving}>
            Cancelar
          </Button>
        }
      />
    </div>
  );
}

function SavingIndicator() {
  return (
    <span role="status" className="inline-flex items-center text-muted-foreground">
      <Loader2Icon
        aria-hidden="true"
        className="size-3.5 animate-spin motion-reduce:animate-none"
      />
      <span className="sr-only">Guardando…</span>
    </span>
  );
}

export function PendingReservationsList({
  reservations,
}: {
  reservations: ReservationWithDetails[];
}) {
  const { items, changeStatus } = useReservationStatusMutations(reservations);
  // Al confirmar o cancelar, la reserva sale de "pendientes" en el acto.
  const pending = items.filter((r) => r.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendientes recientes</CardTitle>
        <CardDescription>
          {pending.length === 0
            ? "No hay reservas pendientes de confirmación"
            : "Confirmá o cancelá reservas en espera de aprobación"}
        </CardDescription>
      </CardHeader>
      {pending.length > 0 ? (
        <CardContent className="space-y-3">
          {pending.map((reservation) => (
            <div
              key={reservation.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {reservation.court.name} · {reservation.code}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="capitalize">
                    {formatVenueDate(reservation.startsAt)}
                  </span>{" "}
                  · {formatTimeLabel(reservation.startsAt)} ·{" "}
                  {reservation.customer.fullName} ·{" "}
                  {formatArs(reservation.priceArs)}
                </p>
              </div>
              <ReservationStatusActions
                reservation={reservation}
                onChangeStatus={changeStatus}
                compact
              />
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
