"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, Plus, Trash2 } from "lucide-react";
import type { Closure, Court, VenueHours } from "@/lib/data/types";
import { closureInputSchema } from "@/lib/data/schemas";
import { DAY_LABELS } from "@/lib/services/admin-stats";
import {
  deleteClosure,
  upsertClosure,
  upsertVenueHours,
} from "@/lib/services/admin-actions";
import {
  formatVenueDateTime,
  venueLocalInputToIso,
} from "@/lib/services/venue-time";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HoursEditor({ hours }: { hours: VenueHours[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horario semanal</CardTitle>
        <CardDescription>
          Apertura y cierre del complejo por día (00:00 = medianoche)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const row = hours.find((h) => h.dayOfWeek === day) ?? {
            opensAt: "09:00",
            closesAt: "00:00",
          };
          return (
            <DayHoursRow
              // La key incluye los valores del servidor: si cambian (otra
              // pestaña, reinicio de la demo) la fila se remonta con los datos
              // nuevos en vez de quedarse con el estado local viejo.
              key={`${day}-${row.opensAt}-${row.closesAt}`}
              day={day}
              opensAt={row.opensAt}
              closesAt={row.closesAt}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function DayHoursRow({
  day,
  opensAt: savedOpens,
  closesAt: savedCloses,
}: {
  day: number;
  opensAt: string;
  closesAt: string;
}) {
  const [opensAt, setOpensAt] = useState(savedOpens);
  const [closesAt, setClosesAt] = useState(savedCloses);
  // Cada fila tiene su propia transición: guardar el lunes no bloquea el martes.
  const [pending, startTransition] = useTransition();
  const dirty = opensAt !== savedOpens || closesAt !== savedCloses;
  const id = `hours-${day}`;

  function save() {
    startTransition(async () => {
      const result = await upsertVenueHours({ dayOfWeek: day, opensAt, closesAt });
      if (result.ok) toast.success(`${DAY_LABELS[day]} actualizado`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
      <div className="min-w-[100px] font-medium">{DAY_LABELS[day]}</div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-opens`} className="text-xs">
          Abre
        </Label>
        <Input
          id={`${id}-opens`}
          type="time"
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-closes`} className="text-xs">
          Cierra
        </Label>
        <Input
          id={`${id}-closes`}
          type="time"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
      </div>
      <Button size="sm" disabled={pending || !dirty} onClick={save}>
        {pending ? (
          <Loader2Icon
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : null}
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}

type OptimisticClosure = Closure & { isSaving?: boolean };
type ClosureUpdate =
  | { type: "add"; closure: OptimisticClosure }
  | { type: "remove"; id: string };

const EMPTY_CLOSURE_FORM = { courtId: "all", reason: "", startsAt: "", endsAt: "" };

export function ClosuresManager({
  closures,
  courts,
}: {
  closures: Closure[];
  courts: Court[];
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY_CLOSURE_FORM);
  const [items, applyOptimistic] = useOptimistic(
    closures as OptimisticClosure[],
    (list, update: ClosureUpdate) =>
      update.type === "remove"
        ? list.filter((c) => c.id !== update.id)
        : [...list, update.closure],
  );

  function createClosure() {
    // Los datetime-local se interpretan en la hora del complejo, no en la del
    // navegador (antes `new Date("")` tiraba "Invalid time value").
    const parsed = closureInputSchema.safeParse({
      courtId: form.courtId === "all" ? null : form.courtId,
      reason: form.reason,
      startsAt: venueLocalInputToIso(form.startsAt) ?? "",
      endsAt: venueLocalInputToIso(form.endsAt) ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisá los datos del cierre");
      return;
    }
    const snapshot = form;
    setForm(EMPTY_CLOSURE_FORM);
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        closure: {
          ...parsed.data,
          id: `temp-${Date.now()}`,
          venueId: closures[0]?.venueId ?? "",
          isSaving: true,
        },
      });
      const result = await upsertClosure(parsed.data);
      if (result.ok) toast.success("Cierre registrado. Esos turnos ya no se pueden reservar.");
      else {
        toast.error(result.error);
        setForm(snapshot);
      }
    });
  }

  function remove(closure: Closure) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: closure.id });
      const result = await deleteClosure(closure.id);
      if (result.ok) toast.success("Cierre eliminado");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cierres y mantenimiento</CardTitle>
        <CardDescription>
          Bloqueos por fecha para todo el predio o una cancha (hora del complejo)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="closure-scope">Alcance</Label>
            <Select
              value={form.courtId}
              onValueChange={(v) => setForm({ ...form, courtId: v })}
            >
              <SelectTrigger id="closure-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el predio</SelectItem>
                {courts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="closure-reason">Motivo</Label>
            <Textarea
              id="closure-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={1}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="closure-starts">Desde</Label>
            <Input
              id="closure-starts"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="closure-ends">Hasta</Label>
            <Input
              id="closure-ends"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={createClosure} disabled={pending}>
          <Plus aria-hidden="true" className="size-4" />
          Agregar cierre
        </Button>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motivo</TableHead>
                <TableHead>Alcance</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                    No hay cierres programados.
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((c) => (
                <TableRow key={c.id} aria-busy={c.isSaving || undefined}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {c.reason}
                      {c.isSaving ? (
                        <Loader2Icon
                          aria-label="Guardando"
                          className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none"
                        />
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.courtId
                      ? (courts.find((x) => x.id === c.courtId)?.name ?? c.courtId)
                      : "Todo el predio"}
                  </TableCell>
                  <TableCell className="capitalize tabular-nums">
                    {formatVenueDateTime(c.startsAt)}
                  </TableCell>
                  <TableCell className="capitalize tabular-nums">
                    {formatVenueDateTime(c.endsAt)}
                  </TableCell>
                  <TableCell>
                    <ConfirmActionDialog
                      title="¿Eliminar este cierre?"
                      description={`“${c.reason}”. Los turnos de ese período vuelven a estar disponibles para reservar.`}
                      confirmLabel="Eliminar cierre"
                      onConfirm={() => remove(c)}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={c.isSaving}
                          aria-label={`Eliminar cierre ${c.reason}`}
                        >
                          <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
