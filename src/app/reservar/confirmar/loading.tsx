import { TicketSkeleton } from "@/components/booking/booking-skeletons";

// Sin este archivo se heredaba el skeleton del tablero de turnos (claro y con
// plano), que no se parece al ticket oscuro de confirmación.
export default function ConfirmarLoading() {
  return <TicketSkeleton label="Preparando tu reserva…" rows={7} />;
}
