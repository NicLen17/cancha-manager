import { z } from "zod";

// Mensajes de zod en español para cualquier validación sin texto propio
// (se aplica en servidor y cliente porque este módulo se importa en ambos).
z.config(z.locales.es());

/** Identificador opaco (ids del mock o UUID de Supabase). */
export const idSchema = z
  .string()
  .trim()
  .min(1, "Falta el identificador")
  .max(100, "Identificador inválido");

/** Hora local del complejo en formato HH:MM (00:00 = medianoche). */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usá el formato HH:MM");

export const sportSchema = z.enum([
  "futbol_5",
  "futbol_7",
  "futbol_8",
  "futbol_9",
  "futbol_11",
  "futsal",
  "handball",
  "padel",
]);

export const paymentMethodSchema = z.enum(["cash", "deposit", "transfer_full"]);

export const surfaceSchema = z.enum([
  "cesped_sintetico",
  "cesped_natural",
  "cemento",
  "parquet",
]);

export const customerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá tu nombre completo").max(120, "Usá hasta 120 caracteres"),
  email: z
    .string()
    .trim()
    .max(254, "Email demasiado largo")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Email inválido",
    ),
  phone: z
    .string()
    .min(8, "Teléfono inválido")
    .max(30, "Teléfono inválido")
    .regex(/^[\d\s+\-()]+$/, "Teléfono inválido"),
});

export const createHoldSchema = z.object({
  courtId: idSchema,
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
});

export const completeReservationSchema = customerInputSchema.extend({
  reservationId: idSchema,
  paymentMethod: paymentMethodSchema,
  receiptFileName: z.string().optional(),
  receiptPath: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const lookupReservationSchema = z.object({
  code: z.string().trim().min(4, "Ingresá el código de la reserva").max(40),
  phone: z.string().trim().min(8, "Ingresá el teléfono").max(30),
});

export const reservationStatusUpdateSchema = z.object({
  id: idSchema,
  status: z.enum(["confirmed", "cancelled", "pending"], {
    error: "Estado inválido",
  }),
});

export const courtInputSchema = z.object({
  id: idSchema.optional(),
  name: z
    .string()
    .trim()
    .min(2, "El nombre necesita al menos 2 caracteres")
    .max(60, "Usá hasta 60 caracteres"),
  sport: sportSchema,
  description: z.string().max(500, "Usá hasta 500 caracteres"),
  surface: surfaceSchema,
  hasLights: z.boolean(),
  slotDurationMinutes: z
    .number({ error: "Ingresá la duración en minutos" })
    .int("La duración debe ser un número entero")
    .min(15, "La duración mínima es 15 minutos")
    .max(240, "La duración máxima es 240 minutos"),
  basePriceArs: z
    .number({ error: "Ingresá un precio" })
    .int("El precio debe ser un número entero")
    .nonnegative("El precio no puede ser negativo")
    .max(10_000_000, "Precio fuera de rango"),
  planX_m: z.number().nonnegative(),
  planY_m: z.number().nonnegative(),
  planWidthM: z.number().positive(),
  planLengthM: z.number().positive(),
  planRotationDeg: z.number().min(-360).max(360),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export const courtPlanSchema = courtInputSchema.pick({
  planX_m: true,
  planY_m: true,
  planWidthM: true,
  planLengthM: true,
  planRotationDeg: true,
});

export const priceRuleInputSchema = z.object({
  id: idSchema.optional(),
  courtId: idSchema.nullable(),
  name: z
    .string()
    .trim()
    .min(2, "El nombre necesita al menos 2 caracteres")
    .max(60, "Usá hasta 60 caracteres"),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Elegí al menos un día"),
  startsAt: timeOfDaySchema,
  endsAt: timeOfDaySchema,
  priceArs: z
    .number()
    .int("El precio debe ser un número entero")
    .nonnegative("El precio no puede ser negativo")
    .nullable(),
  surchargeArs: z.number().int("El recargo debe ser un número entero").nullable(),
  priority: z.number().int(),
  isActive: z.boolean(),
});

export const venueHoursInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: timeOfDaySchema,
  closesAt: timeOfDaySchema,
});

export const closureInputSchema = z
  .object({
    id: idSchema.optional(),
    courtId: idSchema.nullable(),
    reason: z
      .string()
      .trim()
      .min(2, "Contá el motivo del cierre")
      .max(200, "Usá hasta 200 caracteres"),
    startsAt: z.iso.datetime({ offset: true, error: "Elegí fecha y hora de inicio" }),
    endsAt: z.iso.datetime({ offset: true, error: "Elegí fecha y hora de fin" }),
  })
  .refine((c) => new Date(c.endsAt) > new Date(c.startsAt), {
    message: "El cierre tiene que terminar después de empezar",
    path: ["endsAt"],
  });

export const venueConfigSchema = z.object({
  depositPercent: z
    .number({ error: "Ingresá el porcentaje de seña" })
    .min(0, "La seña no puede ser negativa")
    .max(100, "La seña no puede superar el 100%"),
  bankAlias: z.string().trim().min(1, "Completá el alias").max(60),
  bankCbu: z.string().trim().min(1, "Completá el CBU").max(40),
  bankHolder: z.string().trim().min(1, "Completá el titular").max(120),
  whatsappE164: z.string().trim().min(8, "WhatsApp inválido").max(20),
  planWidthM: z.number().min(10, "El plano necesita al menos 10 m").max(1000),
  planLengthM: z.number().min(10, "El plano necesita al menos 10 m").max(1000),
});

export const venuePlanSchema = venueConfigSchema.pick({
  planWidthM: true,
  planLengthM: true,
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CreateHoldInput = z.infer<typeof createHoldSchema>;
export type CompleteReservationInput = z.infer<
  typeof completeReservationSchema
>;
export type CourtInput = z.infer<typeof courtInputSchema>;
export type PriceRuleInput = z.infer<typeof priceRuleInputSchema>;
export type VenueConfigInput = z.infer<typeof venueConfigSchema>;
