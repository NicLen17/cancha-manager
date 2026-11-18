import assert from "node:assert/strict";
import { resolvePrice } from "../src/lib/services/pricing";
import { generateSlots } from "../src/lib/services/availability";
import type { Court, PriceRule, VenueHours } from "../src/lib/data/types";
import { formatTimeLabel } from "../src/lib/services/availability";
import {
  venueDateKey,
  venueLocalInputToIso,
  venueNoon,
} from "../src/lib/services/venue-time";
import { runAction, toUserMessage } from "../src/lib/services/action-result";
import {
  closureInputSchema,
  courtInputSchema,
  reservationStatusUpdateSchema,
  timeOfDaySchema,
} from "../src/lib/data/schemas";

const court: Court = {
  id: "c1",
  venueId: "v1",
  name: "F5",
  sport: "futbol_5",
  description: "",
  surface: "cesped_sintetico",
  hasLights: true,
  slotDurationMinutes: 60,
  basePriceArs: 10000,
  planX_m: 0,
  planY_m: 0,
  planWidthM: 20,
  planLengthM: 10,
  planRotationDeg: 0,
  sortOrder: 1,
  isActive: true,
};

const rules: PriceRule[] = [
  {
    id: "r1",
    venueId: "v1",
    courtId: null,
    name: "Night",
    daysOfWeek: [1],
    startsAt: "18:00",
    endsAt: "00:00",
    priceArs: null,
    surchargeArs: 3000,
    priority: 10,
    isActive: true,
  },
];

const mondayNight = new Date(2026, 7, 24, 20, 0, 0);
assert.equal(resolvePrice(court, mondayNight, rules), 13000);

const mondayMorning = new Date(2026, 7, 24, 10, 0, 0);
assert.equal(resolvePrice(court, mondayMorning, rules), 10000);

const hours: VenueHours[] = [
  {
    id: "h1",
    venueId: "v1",
    dayOfWeek: 1,
    opensAt: "09:00",
    closesAt: "12:00",
  },
];

const slots = generateSlots({
  court,
  date: new Date(2026, 7, 24),
  venueHours: hours,
  reservations: [],
  closures: [],
  priceRules: rules,
});

assert.equal(slots.length, 3);
assert.equal(
  slots.every((s) => s.available),
  true,
);

const blocked = generateSlots({
  court,
  date: new Date(2026, 7, 24),
  venueHours: hours,
  reservations: [
    {
      id: "res1",
      code: "X",
      venueId: "v1",
      courtId: "c1",
      customerId: "cu",
      startsAt: new Date(2026, 7, 24, 10, 0, 0).toISOString(),
      endsAt: new Date(2026, 7, 24, 11, 0, 0).toISOString(),
      status: "confirmed",
      holdExpiresAt: null,
      paymentMethod: "cash",
      priceArs: 10000,
      depositArs: 0,
      receiptFileName: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  closures: [],
  priceRules: rules,
});

assert.equal(blocked.filter((s) => !s.available).length, 1);
console.log("availability + pricing tests passed");

// --- Hardening: zona horaria del complejo -----------------------------------
// 23:30 en Argentina = 02:30 UTC del día siguiente: el "día" debe ser el local.
const lateNight = new Date("2026-11-21T02:30:00Z");
assert.equal(venueDateKey(lateNight), "2026-11-20");
assert.equal(formatTimeLabel(lateNight.toISOString()), "23:30");
assert.equal(venueDateKey(venueNoon("2026-11-20")), "2026-11-20");
assert.equal(
  venueLocalInputToIso("2026-11-20T18:00"),
  "2026-11-20T21:00:00.000Z",
);
assert.equal(venueLocalInputToIso(""), null);
assert.equal(venueLocalInputToIso("basura"), null);
console.log("venue time tests passed");

// --- Hardening: mensajes de error de las actions ----------------------------
assert.equal(toUserMessage(new Error("Ese turno se acaba de ocupar")), "Ese turno se acaba de ocupar");
// Errores internos (TypeError, etc.) no se filtran al usuario.
const originalConsoleError = console.error;
console.error = () => {};
assert.match(toUserMessage(new TypeError("x is undefined")), /No se pudo completar/);
console.error = originalConsoleError;
const zodFailure = courtInputSchema.safeParse({ name: "A" });
assert.equal(zodFailure.success, false);
if (!zodFailure.success) assert.equal(typeof toUserMessage(zodFailure.error), "string");
// El script compila a CJS (sin top-level await): encadenamos las promesas.
void Promise.all([
  runAction(async () => {
    throw new Error("Clave incorrecta");
  }),
  runAction(async () => 42),
])
  .then(([failed, succeeded]) => {
    assert.deepEqual(failed, { ok: false, error: "Clave incorrecta" });
    assert.deepEqual(succeeded, { ok: true, data: 42 });
    console.log("action result tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

// --- Hardening: validación de entradas --------------------------------------
assert.equal(timeOfDaySchema.safeParse("24:00").success, false);
assert.equal(timeOfDaySchema.safeParse("00:00").success, true);
const closure = closureInputSchema.safeParse({
  courtId: null,
  reason: "Mantenimiento",
  startsAt: "2026-11-20T21:00:00.000Z",
  endsAt: "2026-11-20T20:00:00.000Z",
});
assert.equal(closure.success, false, "un cierre no puede terminar antes de empezar");
assert.equal(
  reservationStatusUpdateSchema.safeParse({ id: "r1", status: "hold" }).success,
  false,
  "el admin no puede volver una reserva a hold",
);
assert.equal(
  courtInputSchema.shape.slotDurationMinutes.safeParse(5).success,
  false,
);
console.log("schema validation tests passed");
