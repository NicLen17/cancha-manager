"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import type { Venue } from "@/lib/data/types";
import { venueConfigSchema } from "@/lib/data/schemas";
import { updateVenueConfig } from "@/lib/services/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VenueConfigFormState = {
  depositPercent: number;
  bankAlias: string;
  bankCbu: string;
  bankHolder: string;
  whatsappE164: string;
  planWidthM: number;
  planLengthM: number;
};

/**
 * Formulario controlado: los valores guardados son los del servidor. La page
 * le pone `key` con esos valores, así se remonta si cambian por otra vía
 * (mapa, reinicio de demo) en vez de mostrar datos viejos.
 */
export function VenueConfigForm({ venue }: { venue: Venue }) {
  const [form, setForm] = useState<VenueConfigFormState>({
    depositPercent: venue.depositPercent,
    bankAlias: venue.bankAlias,
    bankCbu: venue.bankCbu,
    bankHolder: venue.bankHolder,
    whatsappE164: venue.whatsappE164,
    planWidthM: venue.planWidthM,
    planLengthM: venue.planLengthM,
  });
  const [pending, startTransition] = useTransition();

  function save() {
    const parsed = venueConfigSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisá los datos");
      return;
    }
    startTransition(async () => {
      const result = await updateVenueConfig(parsed.data);
      if (result.ok) toast.success("Configuración guardada");
      else toast.error(result.error);
    });
  }

  const field = (
    key: keyof VenueConfigFormState,
    label: string,
    props: ComponentProps<typeof Input> = {},
    className = "space-y-1",
  ) => {
    const numeric = typeof form[key] === "number";
    return (
      <div className={className}>
        <Label htmlFor={`venue-${key}`}>{label}</Label>
        <Input
          id={`venue-${key}`}
          value={form[key]}
          onChange={(e) =>
            setForm({
              ...form,
              [key]: numeric ? e.target.valueAsNumber : e.target.value,
            })
          }
          {...props}
        />
      </div>
    );
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configuración del complejo</CardTitle>
        <CardDescription>
          Datos bancarios, contacto y dimensiones del plano
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("depositPercent", "Seña (%)", {
            type: "number",
            min: 0,
            max: 100,
            inputMode: "numeric",
          })}
          {field("whatsappE164", "WhatsApp (E.164)", {
            inputMode: "tel",
            autoComplete: "off",
            spellCheck: false,
          })}
          {field("bankAlias", "Alias bancario", { spellCheck: false })}
          {field("bankCbu", "CBU", { inputMode: "numeric", spellCheck: false })}
          {field("bankHolder", "Titular de la cuenta", {}, "space-y-1 sm:col-span-2")}
          {field("planWidthM", "Plano ancho (m)", { type: "number", step: 0.5, min: 10 })}
          {field("planLengthM", "Plano largo (m)", { type: "number", step: 0.5, min: 10 })}
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? (
            <Loader2Icon
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          {pending ? "Guardando…" : "Guardar configuración"}
        </Button>
      </CardContent>
    </Card>
  );
}
