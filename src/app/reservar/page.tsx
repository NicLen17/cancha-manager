import type { Metadata } from "next";
import { BookingBoard } from "@/components/booking/booking-board";
import { DiagonalSection } from "@/components/layout/diagonal-section";
import {
  findNextAvailableHour,
  parseSportParam,
  parseViewParam,
} from "@/lib/services/booking-helpers";
import { getAvailabilityForDate } from "@/lib/services/availability-query";
import { venueDateKey, venueNoon } from "@/lib/services/venue-time";

export const metadata: Metadata = {
  title: "Reservar",
  description:
    "Elegí fecha, deporte y horario para reservar tu cancha en Cancha Manager.",
};

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

export default async function ReservarPage({
  searchParams,
}: PageProps<"/reservar">) {
  const params = await searchParams;
  const today = venueDateKey(new Date());
  // Fecha inválida o pasada → hoy (antes `?fecha=basura` tiraba el error.tsx).
  const fecha =
    typeof params.fecha === "string" &&
    DATE_PARAM.test(params.fecha) &&
    Number.isFinite(venueNoon(params.fecha).getTime()) &&
    venueDateKey(venueNoon(params.fecha)) === params.fecha &&
    params.fecha >= today
      ? params.fecha
      : today;
  const deporte = parseSportParam(
    typeof params.deporte === "string" ? params.deporte : undefined,
  );
  const vista = parseViewParam(
    typeof params.vista === "string" ? params.vista : undefined,
  );
  const cancha =
    typeof params.cancha === "string" && params.cancha
      ? params.cancha
      : undefined;

  const date = venueNoon(fecha);
  const availability = await getAvailabilityForDate(date.toISOString());

  let hora =
    typeof params.hora === "string" && params.hora ? params.hora : undefined;
  if (!hora) {
    hora = findNextAvailableHour(availability.slotsByCourt, date) ?? undefined;
  }

  return (
    <DiagonalSection tone="muted" className="py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BookingBoard
          venue={availability.venue}
          courts={availability.courts}
          slotsByCourt={availability.slotsByCourt}
          initialFecha={fecha}
          initialDeporte={deporte}
          initialHora={hora}
          initialCancha={cancha}
          initialVista={vista}
        />
      </div>
    </DiagonalSection>
  );
}
