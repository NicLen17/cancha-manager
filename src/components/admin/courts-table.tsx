"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, Pencil, Plus, Trash2 } from "lucide-react";
import type { Court, Sport } from "@/lib/data/types";
import { SPORT_LABELS } from "@/lib/data/types";
import { courtInputSchema } from "@/lib/data/schemas";
import { deleteCourt, upsertCourt } from "@/lib/services/admin-actions";
import { formatArs } from "@/lib/services/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminField, AdminFormSheet } from "@/components/admin/admin-form-sheet";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";

type CourtFormState = Omit<Court, "id" | "venueId"> & { id?: string };

type OptimisticCourt = Court & { isSaving?: boolean };
type CourtUpdate =
  | { type: "upsert"; court: OptimisticCourt }
  | { type: "remove"; id: string };

function emptyForm(sortOrder: number): CourtFormState {
  return {
    name: "",
    sport: "futbol_5",
    description: "",
    surface: "cesped_sintetico",
    hasLights: true,
    slotDurationMinutes: 60,
    basePriceArs: 18000,
    planX_m: 0,
    planY_m: 0,
    planWidthM: 20,
    planLengthM: 14,
    planRotationDeg: 0,
    sortOrder,
    isActive: true,
  };
}

function courtToForm(court: Court): CourtFormState {
  // `venueId` viaja de más pero el schema de zod descarta claves desconocidas.
  return { ...court };
}

export function CourtsTable({ courts }: { courts: Court[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CourtFormState>(() =>
    emptyForm(courts.length + 1),
  );
  const [pending, startTransition] = useTransition();
  // Lista optimista: el alta/edición/baja se ve al instante; si la action
  // falla, React descarta el cambio al cerrar la transición (rollback).
  const [items, applyOptimistic] = useOptimistic(
    courts as OptimisticCourt[],
    (list, update: CourtUpdate) => {
      if (update.type === "remove") return list.filter((c) => c.id !== update.id);
      const exists = list.some((c) => c.id === update.court.id);
      return exists
        ? list.map((c) => (c.id === update.court.id ? update.court : c))
        : [...list, update.court];
    },
  );

  function openCreate() {
    setForm(emptyForm(courts.length + 1));
    setOpen(true);
  }

  function openEdit(court: Court) {
    setForm(courtToForm(court));
    setOpen(true);
  }

  function save() {
    // Validación en el cliente con el mismo schema que la action: errores al
    // instante y sin ida y vuelta al servidor.
    const parsed = courtInputSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisá los datos");
      return;
    }
    const isNew = !form.id;
    setOpen(false);
    startTransition(async () => {
      applyOptimistic({
        type: "upsert",
        court: {
          ...parsed.data,
          id: form.id ?? `temp-${Date.now()}`,
          venueId: courts[0]?.venueId ?? "",
          isSaving: true,
        },
      });
      const result = await upsertCourt(parsed.data);
      if (result.ok) toast.success(isNew ? "Cancha creada" : "Cancha actualizada");
      else {
        toast.error(result.error);
        // Reabrimos el formulario con lo cargado para no perder el trabajo.
        setForm(form);
        setOpen(true);
      }
    });
  }

  function remove(court: Court) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: court.id });
      const result = await deleteCourt(court.id);
      if (result.ok) toast.success(`${court.name} eliminada`);
      else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" className="size-4" />
          Nueva cancha
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Deporte</TableHead>
              <TableHead>Precio base</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                  Todavía no cargaste canchas. Creá la primera con “Nueva cancha”.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((court) => (
              <TableRow key={court.id} aria-busy={court.isSaving || undefined}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {court.name}
                    {court.isSaving ? (
                      <Loader2Icon
                        aria-label="Guardando"
                        className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none"
                      />
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>{SPORT_LABELS[court.sport]}</TableCell>
                <TableCell className="tabular-nums">{formatArs(court.basePriceArs)}</TableCell>
                <TableCell>{court.slotDurationMinutes} min</TableCell>
                <TableCell>
                  <Badge variant={court.isActive ? "default" : "secondary"}>
                    {court.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={court.isSaving}
                      onClick={() => openEdit(court)}
                      aria-label={`Editar ${court.name}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <ConfirmActionDialog
                      title={`¿Eliminar ${court.name}?`}
                      description="Si tiene reservas no se puede borrar: en ese caso desactivala para que no aparezca en la reserva online."
                      confirmLabel="Eliminar cancha"
                      onConfirm={() => remove(court)}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={court.isSaving}
                          aria-label={`Eliminar ${court.name}`}
                        >
                          <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminFormSheet
        open={open}
        onOpenChange={setOpen}
        title={form.id ? "Editar cancha" : "Nueva cancha"}
        description="Datos de la cancha. La posición se ajusta en Mapa."
        footer={
          <Button onClick={save} disabled={pending} className="h-11 w-full">
            Guardar
          </Button>
        }
      >
        <AdminField label="Nombre" htmlFor="court-name">
          <Input
            id="court-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </AdminField>
        <AdminField label="Deporte" htmlFor="court-sport">
          <Select
            value={form.sport}
            onValueChange={(v) => setForm({ ...form, sport: v as Sport })}
          >
            <SelectTrigger id="court-sport" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SPORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminField>
        <AdminField label="Descripción" htmlFor="court-description">
          <Textarea
            id="court-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-24"
          />
        </AdminField>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Precio base" htmlFor="court-price">
            <Input
              id="court-price"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.basePriceArs}
              onChange={(e) =>
                setForm({ ...form, basePriceArs: e.target.valueAsNumber })
              }
            />
          </AdminField>
          <AdminField label="Duración (min)" htmlFor="court-duration">
            <Input
              id="court-duration"
              type="number"
              inputMode="numeric"
              min={15}
              max={240}
              step={15}
              value={form.slotDurationMinutes}
              onChange={(e) =>
                setForm({ ...form, slotDurationMinutes: e.target.valueAsNumber })
              }
            />
          </AdminField>
        </div>
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm transition-colors hover:text-foreground">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v === true })}
            />
            Cancha activa
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm transition-colors hover:text-foreground">
            <Checkbox
              checked={form.hasLights}
              onCheckedChange={(v) => setForm({ ...form, hasLights: v === true })}
            />
            Iluminación
          </label>
        </div>
      </AdminFormSheet>
    </>
  );
}
