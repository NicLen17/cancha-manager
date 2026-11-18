import { SiteHeader } from "@/components/layout/site-header";
import { TicketSkeleton } from "@/components/booking/booking-skeletons";

// La page dibuja su propio header (no hay layout en /reserva), por eso el
// skeleton lo incluye: así no "aparece" el header al terminar de cargar.
export default function ReservaLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <SiteHeader />
      <TicketSkeleton label="Cargando tu reserva…" rows={8} maxWidth="max-w-xl" />
    </div>
  );
}
