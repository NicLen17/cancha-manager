"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDataAccess } from "@/lib/data";
import {
  closureInputSchema,
  courtInputSchema,
  courtPlanSchema,
  idSchema,
  priceRuleInputSchema,
  venueConfigSchema,
  venueHoursInputSchema,
  venuePlanSchema,
} from "@/lib/data/schemas";
import type {
  Closure,
  Court,
  PriceRule,
  Venue,
  VenueHours,
} from "@/lib/data/types";

import { runAction, type ActionResult } from "./action-result";
import { requireAdmin } from "./auth";
import {
  ADMIN_COOKIE,
  adminPasscode,
  matchesSecret,
  createAdminSession,
} from "./session";

// Todo lo exportado desde un archivo "use server" es un endpoint público:
// cada action valida con zod y llama a requireAdmin() antes de tocar datos.
// Los errores esperables vuelven como { ok: false, error } (ver action-result).

const ADMIN_PATHS = [
  "/admin",
  "/admin/mapa",
  "/admin/canchas",
  "/admin/reservas",
  "/admin/horarios",
  "/admin/precios",
  "/admin/configuracion",
] as const;

function revalidateAdmin() {
  for (const path of ADMIN_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/reservar");
  revalidatePath("/demo");
}

export async function adminLogin(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const passcode = String(form.get("passcode") ?? "").slice(0, 200);
  const expected = adminPasscode();
  if (!matchesSecret(passcode, expected)) {
    return { ok: false, error: "Clave de acceso incorrecta" };
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminSession(), {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return { ok: true };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  revalidateAdmin();
}

export async function upsertCourt(raw: unknown): Promise<ActionResult<Court>> {
  return runAction(async () => {
    await requireAdmin();
    const input = courtInputSchema.parse(raw);
    const db = getDataAccess();
    const venue = await db.venues.getDefaultVenue();
    const court = await db.courts.upsert(venue.id, input);
    revalidateAdmin();
    return court;
  });
}

export async function deleteCourt(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(rawId);
    await getDataAccess().courts.remove(id);
    revalidateAdmin();
    return undefined;
  });
}

export async function updateCourtPlan(
  rawId: unknown,
  rawPlan: unknown,
): Promise<ActionResult<Court>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(rawId);
    const plan = courtPlanSchema.parse(rawPlan);
    const court = await getDataAccess().courts.updatePlan(id, plan);
    revalidateAdmin();
    return court;
  });
}

export async function upsertPriceRule(
  raw: unknown,
): Promise<ActionResult<PriceRule>> {
  return runAction(async () => {
    await requireAdmin();
    const input = priceRuleInputSchema.parse(raw);
    const db = getDataAccess();
    const venue = await db.venues.getDefaultVenue();
    const rule = await db.priceRules.upsert(venue.id, input);
    revalidateAdmin();
    return rule;
  });
}

export async function deletePriceRule(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(rawId);
    await getDataAccess().priceRules.remove(id);
    revalidateAdmin();
    return undefined;
  });
}

export async function upsertVenueHours(
  raw: unknown,
): Promise<ActionResult<VenueHours[]>> {
  return runAction(async () => {
    await requireAdmin();
    const input = venueHoursInputSchema.parse(raw);
    const db = getDataAccess();
    const venue = await db.venues.getDefaultVenue();
    const existing = await db.venues.listVenueHours(venue.id);
    const idx = existing.findIndex((h) => h.dayOfWeek === input.dayOfWeek);
    const updated = [...existing];
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], ...input };
    } else {
      updated.push({
        id: `hours-${input.dayOfWeek}`,
        venueId: venue.id,
        ...input,
      });
    }
    const hours = await db.venues.upsertVenueHours(venue.id, updated);
    revalidateAdmin();
    return hours;
  });
}

export async function upsertClosure(
  raw: unknown,
): Promise<ActionResult<Closure>> {
  return runAction(async () => {
    await requireAdmin();
    const input = closureInputSchema.parse(raw);
    const db = getDataAccess();
    const venue = await db.venues.getDefaultVenue();
    const closure = await db.closures.upsert(venue.id, input);
    revalidateAdmin();
    return closure;
  });
}

export async function deleteClosure(rawId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(rawId);
    await getDataAccess().closures.remove(id);
    revalidateAdmin();
    return undefined;
  });
}

export async function updateVenueConfig(
  raw: unknown,
): Promise<ActionResult<Venue>> {
  return runAction(async () => {
    await requireAdmin();
    const input = venueConfigSchema.parse(raw);
    const venue = await getDataAccess().venues.updateVenueConfig(input);
    revalidateAdmin();
    return venue;
  });
}

/**
 * Solo cambia las dimensiones del plano. El resto de la configuración se lee
 * en el servidor justo antes de guardar: antes el mapa reenviaba los datos
 * bancarios que tenía en memoria y podía pisar un cambio hecho en
 * Configuración desde otra pestaña (lost update).
 */
export async function updateVenuePlan(
  raw: unknown,
): Promise<ActionResult<Venue>> {
  return runAction(async () => {
    await requireAdmin();
    const plan = venuePlanSchema.parse(raw);
    const db = getDataAccess();
    const current = await db.venues.getDefaultVenue();
    const venue = await db.venues.updateVenueConfig({
      depositPercent: current.depositPercent,
      bankAlias: current.bankAlias,
      bankCbu: current.bankCbu,
      bankHolder: current.bankHolder,
      whatsappE164: current.whatsappE164,
      ...plan,
    });
    revalidateAdmin();
    return venue;
  });
}
