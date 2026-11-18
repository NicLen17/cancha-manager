"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, Pencil, Plus, Trash2 } from "lucide-react";
import type { Court, PriceRule } from "@/lib/data/types";
import { priceRuleInputSchema } from "@/lib/data/schemas";
import { DAY_LABELS } from "@/lib/services/admin-stats";
import { deletePriceRule, upsertPriceRule } from "@/lib/services/admin-actions";
import { formatArs } from "@/lib/services/pricing";
import { formatTimeLabel, generateSlots } from "@/lib/services/availability";
import { venueDateKey, venueNoon } from "@/lib/services/venue-time";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import type { Closure, VenueHours } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminField, AdminFormSheet } from "@/components/admin/admin-form-sheet";
import { cn } from "@/lib/utils";

type RuleForm = {
  id?: string;
  courtId: string | null;
  name: string;
  daysOfWeek: number[];
  startsAt: string;
  endsAt: string;
  priceArs: number | null;
  surchargeArs: number | null;
  priority: number;
  isActive: boolean;
};

type OptimisticRule = PriceRule & { isSaving?: boolean };
type RuleUpdate =
  | { type: "upsert"; rule: OptimisticRule }
  | { type: "remove"; id: string };

function emptyRule(): RuleForm {
  return {
    courtId: null,
    name: "",
    daysOfWeek: [1, 2, 3, 4, 5],
    startsAt: "18:00",
    endsAt: "23:00",
    priceArs: null,
    surchargeArs: 5000,
    priority: 10,
    isActive: true,
  };
}

export function PriceRulesManager({
  rules,
  courts,
  hours,
  closures,
}: {
  rules: PriceRule[];
  courts: Court[];
  hours: VenueHours[];
  closures: Closure[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyRule);
  // Antes: toISOString() (UTC) → después de las 21 h mostraba el día siguiente.
  const [previewDate, setPreviewDate] = useState(() =>
    venueDateKey(new Date()),
  );
  const [pending, startTransition] = useTransition();
  // Lista optimista (la vista previa de precios también la usa, así el efecto
  // de una regla nueva se ve antes de que responda el servidor).
  const [items, applyOptimistic] = useOptimistic(
    rules as OptimisticRule[],
    (list, update: RuleUpdate) => {
      if (update.type === "remove") return list.filter((r) => r.id !== update.id);
      const exists = list.some((r) => r.id === update.rule.id);
      return exists
        ? list.map((r) => (r.id === update.rule.id ? update.rule : r))
        : [...list, update.rule];
    },
  );

  function openCreate() {
    setForm(emptyRule());
    setOpen(true);
  }

  function openEdit(rule: PriceRule) {
    setForm({
      id: rule.id,
      courtId: rule.courtId,
      name: rule.name,
      daysOfWeek: rule.daysOfWeek,
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
      priceArs: rule.priceArs,
      surchargeArs: rule.surchargeArs,
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setOpen(true);
  }

  function save() {
    const parsed = priceRuleInputSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisá los datos");
      return;
    }
    if (parsed.data.priceArs === null && !parsed.data.surchargeArs) {
      toast.error("Cargá un precio fijo o un recargo");
      return;
    }
    const isNew = !form.id;
    const snapshot = form;
    setOpen(false);
    startTransition(async () => {
      applyOptimistic({
        type: "upsert",
        rule: {
          ...parsed.data,
          id: form.id ?? `temp-${Date.now()}`,
          venueId: rules[0]?.venueId ?? "",
          isSaving: true,
        },
      });
      const result = await upsertPriceRule(parsed.data);
      if (result.ok) toast.success(isNew ? "Regla creada" : "Regla actualizada");
      else {
        toast.error(result.error);
        setForm(snapshot);
        setOpen(true);
      }
    });
  }

  function remove(rule: PriceRule) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: rule.id });
      const result = await deletePriceRule(rule.id);
      if (result.ok) toast.success(`Regla “${rule.name}” eliminada`);
      else toast.error(result.error);
    });
  }

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  }

  const previewGrid = useMemo(() => {
    // `new Date("YYYY-MM-DD")` es medianoche UTC = día anterior en Argentina.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(previewDate)) return [];
    const date = venueNoon(previewDate);
    return courts
      .filter((c) => c.isActive)
      .map((court) => ({
        court,
        slots: generateSlots({
          court,
          date,
          venueHours: hours,
          reservations: [],
          closures,
          priceRules: items,
        }).map((s) => ({
          key: s.startsAt,
          time: formatTimeLabel(s.startsAt),
          price: s.priceArs,
        })),
      }));
  }, [closures, courts, hours, previewDate, items]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nueva regla
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cancha</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Precio / recargo</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  Sin reglas: todos los turnos usan el precio base de cada cancha.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((rule) => (
              <TableRow key={rule.id} aria-busy={rule.isSaving || undefined}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {rule.name}
                    {rule.isSaving ? (
                      <Loader2Icon
                        aria-label="Guardando"
                        className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none"
                      />
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>
                  {rule.courtId
                    ? courts.find((c) => c.id === rule.courtId)?.name ?? "—"
                    : "Todas"}
                </TableCell>
                <TableCell className="text-xs">
                  {rule.daysOfWeek.map((d) => DAY_LABELS[d].slice(0, 3)).join(", ")}
                </TableCell>
                <TableCell>
                  {rule.startsAt} – {rule.endsAt}
                </TableCell>
                <TableCell>
                  {rule.priceArs !== null
                    ? formatArs(rule.priceArs)
                    : rule.surchargeArs
                      ? `+${formatArs(rule.surchargeArs)}`
                      : "—"}
                </TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={rule.isSaving}
                      onClick={() => openEdit(rule)}
                      aria-label={`Editar regla ${rule.name}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <ConfirmActionDialog
                      title={`¿Eliminar la regla “${rule.name}”?`}
                      description="Los turnos vuelven al precio base de la cancha (o a otra regla que aplique)."
                      confirmLabel="Eliminar regla"
                      onConfirm={() => remove(rule)}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={rule.isSaving}
                          aria-label={`Eliminar regla ${rule.name}`}
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

      <Card>
        <CardHeader>
          <CardTitle>Vista previa de precios</CardTitle>
          <CardDescription>
            Precio resuelto por cancha y hora para la fecha seleccionada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-1">
            <Label htmlFor="price-preview-date">Fecha</Label>
            <Input
              id="price-preview-date"
              type="date"
              value={previewDate}
              onChange={(e) => setPreviewDate(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            {previewGrid.map(({ court, slots }) => (
              <div key={court.id}>
                <p className="mb-2 font-medium">{court.name}</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <span
                      key={s.key}
                      className="rounded-md border bg-muted/50 px-2 py-1 text-xs tabular-nums"
                    >
                      {s.time}: {formatArs(s.price)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AdminFormSheet
        open={open}
        onOpenChange={setOpen}
        title={form.id ? "Editar regla" : "Nueva regla"}
        description="Reglas de precio por día, horario y cancha"
        footer={
          <Button onClick={save} disabled={pending} className="h-11 w-full">
            Guardar
          </Button>
        }
      >
        <AdminField label="Nombre" htmlFor="rule-name">
          <Input
            id="rule-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </AdminField>
        <AdminField label="Cancha" htmlFor="rule-court">
          <Select
            value={form.courtId ?? "all"}
            onValueChange={(v) =>
              setForm({ ...form, courtId: v === "all" ? null : v })
            }
          >
            <SelectTrigger id="rule-court" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las canchas</SelectItem>
              {courts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminField>
        <AdminField label="Días">
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => {
              const selected = form.daysOfWeek.includes(day);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  aria-label={label}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </AdminField>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Desde" htmlFor="rule-starts">
            <Input
              id="rule-starts"
              type="time"
              value={form.startsAt}
              onChange={(e) =>
                setForm({ ...form, startsAt: e.target.value })
              }
            />
          </AdminField>
          <AdminField label="Hasta" htmlFor="rule-ends">
            <Input
              id="rule-ends"
              type="time"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </AdminField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Precio fijo (opcional)" htmlFor="rule-price">
            <Input
              id="rule-price"
              type="number"
              min={0}
              value={form.priceArs ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  priceArs: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </AdminField>
          <AdminField label="Recargo (opcional)" htmlFor="rule-surcharge">
            <Input
              id="rule-surcharge"
              type="number"
              value={form.surchargeArs ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  surchargeArs: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </AdminField>
        </div>
        <AdminField label="Prioridad" htmlFor="rule-priority">
          <Input
            id="rule-priority"
            type="number"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: Number(e.target.value) })
            }
          />
        </AdminField>
        <div className="rounded-xl border bg-muted/30 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm transition-colors hover:text-foreground">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(v) =>
                setForm({ ...form, isActive: v === true })
              }
            />
            Regla activa
          </label>
        </div>
      </AdminFormSheet>
    </div>
  );
}
