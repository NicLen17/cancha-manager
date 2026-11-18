import "server-only";
import { getDataAccess } from "@/lib/data";
import { getDefaultVenue } from "@/lib/data/queries";
import { generateSlots } from "./availability";
import { venueDayRange } from "./venue-time";

/**
 * Disponibilidad de todas las canchas activas para un día del complejo.
 *
 * Vive fuera de `reservations.ts` ("use server") a propósito: todo lo que se
 * exporta desde un archivo "use server" queda publicado como endpoint POST.
 * Esta función es solo de lectura y se usa desde Server Components y actions.
 */
export async function getAvailabilityForDate(dateIso: string) {
  const date = new Date(dateIso);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Elegí una fecha válida");
  const db = getDataAccess();
  const venue = await getDefaultVenue();
  const range = venueDayRange(date);
  const [courts, hours, reservations, closures, rules] = await Promise.all([
    db.courts.listByVenue(venue.id),
    db.venues.listVenueHours(venue.id),
    db.reservations.listBlockingForVenueDate(
      venue.id,
      range.start.toISOString(),
      range.end.toISOString(),
    ),
    db.closures.listByVenue(venue.id),
    db.priceRules.listByVenue(venue.id),
  ]);
  const now = Date.now();
  const active = courts.filter((c) => c.isActive);
  return {
    venue,
    courts: active,
    rules,
    slotsByCourt: Object.fromEntries(
      active.map((court) => [
        court.id,
        generateSlots({
          court,
          date,
          venueHours: hours,
          reservations,
          closures,
          priceRules: rules,
        }).map((slot) => ({
          ...slot,
          available: slot.available && new Date(slot.startsAt).getTime() > now,
        })),
      ]),
    ),
  };
}
