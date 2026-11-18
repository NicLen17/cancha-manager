"use server";

import { getDataAccess } from "@/lib/data";
import {
  completeReservationSchema,
  createHoldSchema,
  lookupReservationSchema,
  reservationStatusUpdateSchema,
} from "@/lib/data/schemas";
import type { ReservationWithDetails } from "@/lib/data/types";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "./action-result";
import { ownsBooking, rememberBooking, requireAdmin } from "./auth";
import { getAvailabilityForDate } from "./availability-query";
import { normalizePhone } from "./phone";
import { saveReceipt, removeReceipts } from "./receipts";

// Todo lo exportado desde este archivo es una server action pública: validá la
// entrada con zod y verificá permisos dentro de cada función.

function revalidateReservations(code?: string) {
  for (const path of ["/reservar", "/demo", "/admin", "/admin/reservas"])
    revalidatePath(path);
  if (code) revalidatePath(`/reserva/${code}`);
}

const MAX_DAYS_AHEAD = 90;

export async function createHoldAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; holdExpiresAt: string | null }>> {
  return runAction(async () => {
    const input = createHoldSchema.parse(raw);
    const start = new Date(input.startsAt);
    if (
      start.getTime() <= Date.now() ||
      start.getTime() > Date.now() + MAX_DAYS_AHEAD * 86400000
    )
      throw new Error("Elegí un turno futuro dentro de los próximos 90 días");
    const availability = await getAvailabilityForDate(start.toISOString());
    const slot = availability.slotsByCourt[input.courtId]?.find(
      (s) =>
        s.startsAt === start.toISOString() &&
        s.endsAt === new Date(input.endsAt).toISOString() &&
        s.available,
    );
    if (!slot)
      throw new Error(
        "Ese turno se acaba de ocupar. Elegí otro horario.",
      );
    // La exclusión real la garantiza el adaptador (mock: assertNoOverlap;
    // Supabase: constraint de exclusión 23P01), no esta lectura previa.
    const reservation = await getDataAccess().reservations.createHold(
      availability.venue.id,
      input,
      slot.priceArs,
    );
    await rememberBooking(reservation.id, reservation.code);
    revalidateReservations();
    return { id: reservation.id, holdExpiresAt: reservation.holdExpiresAt };
  });
}

export async function completeReservationAction(
  form: FormData,
): Promise<ActionResult<{ code: string }>> {
  return runAction(async () => {
    if (!(form instanceof FormData))
      throw new Error("Completá los datos de la reserva");
    const input = completeReservationSchema
      .omit({ receiptPath: true, receiptFileName: true })
      .parse(Object.fromEntries(form));
    if (!(await ownsBooking(input.reservationId)))
      throw new Error("Volvé a elegir el turno desde este dispositivo");
    normalizePhone(input.phone);
    const db = getDataAccess();
    const current = await db.reservations.getById(input.reservationId);
    if (!current || current.status !== "hold")
      throw new Error("El turno expiró o ya se completó. Elegí otro horario.");
    const needsReceipt = input.paymentMethod !== "cash";
    let receipt: { path: string; name: string } | undefined;
    if (needsReceipt) {
      const file = form.get("receipt");
      if (!(file instanceof File) || !file.size)
        throw new Error("Adjuntá el comprobante de transferencia");
      receipt = await saveReceipt(current.id, file);
    }
    let reservation;
    try {
      const amount =
        input.paymentMethod === "deposit"
          ? Math.round((current.priceArs * current.venue.depositPercent) / 100)
          : input.paymentMethod === "transfer_full"
            ? current.priceArs
            : 0;
      reservation = await db.reservations.complete(
        {
          ...input,
          receiptFileName: receipt?.name,
          receiptPath: receipt?.path,
        },
        { fullName: input.fullName, email: input.email, phone: input.phone },
        amount,
      );
    } catch (error) {
      if (receipt) await removeReceipts([receipt.path]).catch(() => {});
      throw error;
    }
    await rememberBooking(reservation.id, reservation.code);
    revalidateReservations(reservation.code);
    return { code: reservation.code };
  });
}

export async function lookupReservationAction(
  raw: unknown,
): Promise<ActionResult<ReservationWithDetails | null>> {
  return runAction(async () => {
    const input = lookupReservationSchema.parse(raw);
    const result = await getDataAccess().reservations.findByCodeAndPhone(
      input.code,
      normalizePhone(input.phone),
    );
    if (result) await rememberBooking(result.id, result.code);
    // Nunca exponer la ruta interna del comprobante al público.
    return result ? { ...result, receiptPath: null } : null;
  });
}

export async function updateReservationStatusAction(
  raw: unknown,
): Promise<ActionResult<{ status: ReservationWithDetails["status"] }>> {
  return runAction(async () => {
    await requireAdmin();
    const { id, status } = reservationStatusUpdateSchema.parse(raw);
    const db = getDataAccess();
    const current = await db.reservations.getById(id);
    if (!current || !["pending", "confirmed"].includes(current.status))
      throw new Error("Solo podés gestionar reservas registradas");
    const reservation = await db.reservations.updateStatus(id, status);
    revalidateReservations(reservation.code);
    return { status: reservation.status };
  });
}
