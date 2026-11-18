"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { MessageCircleIcon, PhoneIcon, SearchIcon } from "lucide-react";
import type { Court, ReservationWithDetails } from "@/lib/data/types";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  type ReservationStatus,
} from "@/lib/data/types";
import { formatArs } from "@/lib/services/pricing";
import { formatTimeLabel } from "@/lib/services/availability";
import {
  formatVenueDate,
  venueDateKey,
  venueNoon,
} from "@/lib/services/venue-time";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import {
  ReservationStatusActions,
  useReservationStatusMutations,
} from "@/components/admin/reservation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function waLink(phoneE164: string, text: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function statusVariant(status: ReservationStatus) {
  switch (status) {
    case "confirmed":
      return "default" as const;
    case "cancelled":
    case "expired":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export function ReservationsManager({
  reservations,
  courts,
  defaultTab = "tabla",
  defaultStatus = "all",
}: {
  reservations: ReservationWithDetails[];
  courts: Court[];
  defaultTab?: "tabla" | "agenda";
  defaultStatus?: string;
}) {
  const { items, changeStatus, isPending } =
    useReservationStatusMutations(reservations);
  // Polling cada 15 s: pausado mientras hay una mutación en curso, sin correr
  // con la pestaña oculta y con refresco al volver si los datos quedaron viejos.
  useAutoRefresh({ intervalMs: 15_000, paused: isPending });

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  // La búsqueda filtra en cada tecla; diferirla mantiene el input fluido.
  const deferredQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(() => {
    const q = deferredQuery.toLowerCase().trim();
    return items.filter((r) => {
      if (q) {
        const matchCode = r.code.toLowerCase().includes(q);
        const matchName = r.customer.fullName.toLowerCase().includes(q);
        const matchPhone = r.customer.phoneE164.includes(q);
        if (!matchCode && !matchName && !matchPhone) return false;
      }
      if (dateFilter && venueDateKey(new Date(r.startsAt)) !== dateFilter)
        return false;
      if (courtFilter !== "all" && r.courtId !== courtFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (paymentFilter !== "all" && r.paymentMethod !== paymentFilter)
        return false;
      return true;
    });
  }, [courtFilter, dateFilter, paymentFilter, items, deferredQuery, statusFilter]);

  const agendaDate = dateFilter || venueDateKey(new Date());
  const agendaItems = filtered
    .filter((r) => venueDateKey(new Date(r.startsAt)) === agendaDate)
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-11 bg-muted/60 p-1">
            <TabsTrigger value="tabla" className="px-5 text-xs font-semibold">
              Vista Tabla ({filtered.length})
            </TabsTrigger>
            <TabsTrigger value="agenda" className="px-5 text-xs font-semibold">
              Agenda del Día ({agendaItems.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <SearchIcon
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Buscar reservas"
              placeholder="Buscar por cliente, tel o código…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="my-5 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label
              htmlFor="reservation-date"
              className="text-xs font-semibold text-muted-foreground"
            >
              Fecha
            </Label>
            <Input
              id="reservation-date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <FilterSelect
            id="reservation-court"
            label="Cancha"
            value={courtFilter}
            onChange={setCourtFilter}
            allLabel="Todas las canchas"
            options={courts.map((c) => [c.id, c.name])}
          />
          <FilterSelect
            id="reservation-status"
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="Todos los estados"
            options={Object.entries(STATUS_LABELS)}
          />
          <FilterSelect
            id="reservation-payment"
            label="Método de pago"
            value={paymentFilter}
            onChange={setPaymentFilter}
            allLabel="Todos los métodos"
            options={Object.entries(PAYMENT_LABELS)}
          />
        </div>

        <TabsContent value="tabla" className="mt-0">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-bold">Código</TableHead>
                    <TableHead className="text-xs font-bold">
                      Fecha y hora
                    </TableHead>
                    <TableHead className="text-xs font-bold">Cancha</TableHead>
                    <TableHead className="text-xs font-bold">
                      Cliente / Teléfono
                    </TableHead>
                    <TableHead className="text-xs font-bold">Estado</TableHead>
                    <TableHead className="text-xs font-bold">Pago</TableHead>
                    <TableHead className="text-xs font-bold">
                      Total / Seña
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No hay reservas con estos filtros. Probá limpiando la
                        fecha o el estado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow
                        key={r.id}
                        aria-busy={r.isSaving || undefined}
                        className="transition hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs font-bold text-navy-700 dark:text-lime-400">
                          {r.code}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="block font-semibold tabular-nums">
                            {formatTimeLabel(r.startsAt)} –{" "}
                            {formatTimeLabel(r.endsAt)} hs
                          </span>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {formatVenueDate(r.startsAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {r.court.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="block font-medium">
                            {r.customer.fullName}
                          </span>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <a
                              href={`tel:${r.customer.phoneE164}`}
                              className="flex items-center gap-1 hover:underline"
                            >
                              <PhoneIcon aria-hidden="true" className="size-3" />
                              {r.customer.phoneE164}
                            </a>
                            <a
                              href={waLink(
                                r.customer.phoneE164,
                                `¡Hola ${r.customer.fullName}! Te escribimos desde ${r.venue.name} sobre tu reserva ${r.code}.`,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:underline dark:text-lime-400"
                            >
                              <MessageCircleIcon
                                aria-hidden="true"
                                className="size-3"
                              />
                              Chat
                              <span className="sr-only">
                                {" "}
                                por WhatsApp con {r.customer.fullName}
                              </span>
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(r.status)}
                            className="text-[10px] font-semibold"
                          >
                            {STATUS_LABELS[r.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {PAYMENT_LABELS[r.paymentMethod]}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="block font-bold text-foreground tabular-nums">
                            {formatArs(r.priceArs)}
                          </span>
                          {r.depositArs > 0 ? (
                            <span className="text-[10px] text-navy-700 dark:text-lime-400">
                              Seña: {formatArs(r.depositArs)}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <ReservationStatusActions
                            reservation={r}
                            onChangeStatus={changeStatus}
                            compact
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Partidos programados para el{" "}
                {formatVenueDate(venueNoon(agendaDate), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                :
              </p>
              <Badge variant="outline" className="text-xs">
                {agendaItems.length} turnos
              </Badge>
            </div>

            {agendaItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-xs text-muted-foreground">
                No hay reservas cargadas para esta fecha.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {agendaItems.map((r) => (
                  <div
                    key={r.id}
                    aria-busy={r.isSaving || undefined}
                    className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:border-lime-400/50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-bold">
                          {r.court.name}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-navy-700 dark:text-lime-400">
                          {r.code}
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="font-display text-xl font-bold text-foreground tabular-nums">
                          {formatTimeLabel(r.startsAt)} –{" "}
                          {formatTimeLabel(r.endsAt)} hs
                        </span>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {r.customer.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.customer.phoneE164}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <span className="block text-xs font-bold text-foreground">
                          {formatArs(r.priceArs)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {PAYMENT_LABELS[r.paymentMethod]} ·{" "}
                          {STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                        >
                          <a
                            href={waLink(
                              r.customer.phoneE164,
                              `¡Hola ${r.customer.fullName}! Te escribimos desde ${r.venue.name} para confirmar tu partido a las ${formatTimeLabel(r.startsAt)} hs en ${r.court.name}.`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircleIcon
                              aria-hidden="true"
                              className="size-3.5 text-navy-700"
                            />
                            <span className="sr-only">
                              WhatsApp con {r.customer.fullName}
                            </span>
                          </a>
                        </Button>
                        <ReservationStatusActions
                          reservation={r}
                          onChangeStatus={changeStatus}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9 w-full text-xs">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
