import "server-only";
import { cache } from "react";
import { getDataAccess } from "./index";

/**
 * Lecturas compartidas entre layouts y pages del mismo request.
 *
 * `cache` de React deduplica la llamada dentro de un render: `/reservar` pide
 * el complejo en el layout (footer) y otra vez en la page (disponibilidad); con
 * Supabase eran dos requests HTTP en serie y ahora es uno.
 */
export const getDefaultVenue = cache(() =>
  getDataAccess().venues.getDefaultVenue(),
);
