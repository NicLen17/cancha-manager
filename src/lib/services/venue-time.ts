// Todas las fechas visibles se formatean en la zona del complejo, nunca en la
// del navegador ni la del servidor: el servidor de producción corre en UTC y un
// `toLocaleString()` o `date-fns/format` sin zona produce textos distintos en
// SSR y en el cliente (error de hidratación) y horarios corridos 3 h.
export const VENUE_TIMEZONE = "America/Argentina/Tucuman";
export function venueDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VENUE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function venueTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VENUE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
export function venueDateTime(day: string, time: string) {
  return new Date(`${day}T${time}:00-03:00`);
}
export function venueDayRange(date: Date) {
  const start = venueDateTime(venueDateKey(date), "00:00");
  return { start, end: new Date(start.getTime() + 86400000) };
}

/** Mediodía del día `YYYY-MM-DD` en el complejo (seguro para cálculos de día). */
export function venueNoon(dayKey: string) {
  return venueDateTime(dayKey, "12:00");
}

/** Fecha legible en español, en la zona del complejo. */
export function formatVenueDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: VENUE_TIMEZONE,
    ...options,
  })
    .format(date)
    .replaceAll(".", "");
}

/** Fecha + hora corta (ej. "sáb 22 nov, 18:00"). */
export function formatVenueDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${formatVenueDate(date)}, ${venueTime(date)}`;
}

/** Convierte el valor de un `<input type="datetime-local">` (hora del complejo) a ISO. */
export function venueLocalInputToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00-03:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
