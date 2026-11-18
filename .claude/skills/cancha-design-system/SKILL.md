---
name: cancha-design-system
description: Sistema de diseño de la app de Cancha Manager (panel admin y flujo de reserva, no la landing). Usala SIEMPRE antes de crear o modificar UI en src/app/admin, src/app/reservar, src/app/reserva, src/app/mis-reservas, src/app/demo o src/components/{admin,booking,map,ui}: pantallas nuevas, componentes, formularios, tablas, skeletons/loading.tsx, estados vacío/error/éxito, toasts, optimistic updates, animaciones, colores, tipografía o textos en español rioplatense. También cuando pidan "que quede consistente", "con el estilo de la app" o "agregá una vista al admin".
---

# Cancha Manager · Sistema de diseño de la app

Describe lo que el código **ya tiene**. Si algo no está acá, copiá el patrón del
archivo citado más parecido antes de inventar uno nuevo. La landing
(`src/app/(marketing)`, `src/components/marketing`, bloque `/* marketing */` y
clases `.lp`/`.cm-*` de `globals.css`) tiene su propio estilo: **no** la uses de
referencia para la app.

Stack visual: Tailwind 4 (tokens en `src/app/globals.css` → `@theme inline` y
`:root`), shadcn sobre `radix-ui`, iconos `lucide-react`, toasts `sonner`,
animación `motion` (`LazyMotion` + `m`).

## 1. Tokens

### Color (usá siempre el token, nunca hex suelto en la app)

| Token Tailwind | Valor | Uso |
|---|---|---|
| `bg-background` / `text-foreground` | `#f8f9f3` / `#102b20` | Fondo y texto base (admin claro) |
| `bg-card`, `bg-muted` (`#eef2e9`), `text-muted-foreground` (`#475569`) | | Cards, zonas secundarias, texto de apoyo |
| `border` (`#dce4d7`) | | Bordes de cards, tablas, inputs |
| `bg-primary` = lime-400 `#a8df8e` / `text-primary-foreground` navy | | Acción principal (Button default) |
| `bg-secondary` = navy-900 `#173e2b` | | Acción secundaria oscura |
| `navy-950/900/800/700` | `#102b20` `#173e2b` `#23553c` `#34704f` | Superficies oscuras del flujo de reserva, sidebar, texto enfático sobre claro |
| `lime-500/400/300` | `#80c567` `#a8df8e` `#c3eeb2` | Acentos **sobre fondos oscuros** (navy) |
| `gold-400` `#f2b72e`, `amber-*` | | Advertencia: reserva temporal por vencer, "pendiente" |
| `destructive` `#ef4444` | | Borrar/cancelar |
| `chart-1..5` | | Solo gráficos (`src/components/ui/chart.tsx`) |

**Contraste (obligatorio):** el lima sobre fondo claro da 1,5–2:1 y no pasa
WCAG. Sobre fondos claros (admin), el texto enfático es `text-navy-700`/`text-navy-800`
(ver códigos de reserva en `reservations-manager.tsx`); el lima queda para
fondos navy (`booking-board.tsx`, `confirmar/page.tsx`) o como fondo
(`bg-lime-400 text-navy-950`). En modo oscuro: `dark:text-lime-400`.

### Tipografía (`src/app/layout.tsx`)

- `font-sans` = DM Sans: todo el texto.
- `font-display` = Anton: títulos. `h1, h2, h3` ya salen en Anton, mayúsculas y
  `tracking-wide` por `@layer base`. Título de page admin:
  `font-display text-2xl uppercase`; KPI: `font-display text-2xl sm:text-3xl`.
- `font-mono` = Geist Mono: códigos de reserva (`font-mono text-xs font-bold`).
- Números que cambian (precios, horas, contadores): `tabular-nums`.
- Etiquetas tipo eyebrow: `text-xs font-bold uppercase tracking-wider`.
- Precios: siempre `formatArs()` (`src/lib/services/pricing.ts`).

### Espaciado, radios y sombras

- Page admin: `space-y-6` entre bloques (dashboard `space-y-8`); contenedor
  `p-4 md:p-6 lg:p-8` ya lo pone `AdminLayoutShell`.
- Grillas: `gap-3`/`gap-4` en cards y filtros, `gap-6` entre columnas grandes.
- `--radius: 0.75rem`. Inputs/botones `rounded-md|lg`; cards y tablas
  `rounded-xl`; contenedores destacados `rounded-2xl`; tickets y bloques del
  flujo de reserva `rounded-3xl`.
- Sombras: `shadow-sm` en cards del admin; `shadow-lg`/`shadow-2xl` solo en el
  flujo de reserva sobre navy.

## 2. Componentes (`src/components/ui`) y cuándo usarlos

| Necesidad | Usá | Ejemplo real |
|---|---|---|
| Acción | `Button` (`default` lima, `outline`, `secondary` navy, `ghost`, `destructive`, `link`; tamaños `sm/default/lg/icon`) | toda la app |
| Botón solo ícono | `Button size="icon"` + `aria-label` con el objeto ("Editar Cancha F5") + ícono `aria-hidden` | `courts-table.tsx` |
| Estado de una entidad | `Badge` (`default` = confirmada/activa, `secondary` = pendiente/inactiva, `outline` = cancelada/vencida) | `reservations-manager.tsx` |
| Formulario de alta/edición en admin | `AdminFormSheet` + `AdminField label htmlFor` | `courts-table.tsx`, `price-rules-manager.tsx` |
| Confirmar algo destructivo | `ConfirmActionDialog` (nunca `window.confirm`) | `reservation-actions.tsx` |
| Confirmación con texto tipeado | `Dialog` + `Input` | `demo-controls.tsx` |
| Listado tabular | `Table` dentro de `div.overflow-x-auto.rounded-xl.border.bg-card` | `courts-table.tsx` |
| Filtros | `Label htmlFor` + `Select`/`Input type=date`, en `grid sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border bg-card p-4` | `FilterSelect` en `reservations-manager.tsx` |
| Vistas alternativas | `Tabs` | tabla/agenda de reservas |
| Bloque con título | `Card` + `CardHeader/CardTitle/CardDescription/CardContent` | `hours-closures.tsx` |
| Campos del flujo público | `Field`, `FieldLabel`, `FieldError` | `confirm-form.tsx`, `lookup-form.tsx` |
| Panel lateral en mobile (reserva) | `Drawer` (vaul) | `booking-board.tsx` |
| Copiar dato bancario | `CopyField` (`ui/copy-button.tsx`) | `reserva/[code]/page.tsx` |
| Gráfico | `ChartContainer` de `ui/chart.tsx`, cargado con `next/dynamic` (`ssr:false`) | `dashboard-hour-chart.tsx` |
| Plano del complejo | `PlanMap` / `PlanListView` (`components/map/plan-map.tsx`) | `/demo`, `/reservar` |
| Feedback efímero | `toast.success / toast.error` de `sonner` | todas las mutaciones |
| Carga | `Skeleton` (ya respeta `prefers-reduced-motion`) | `loading.tsx` |

No agregues componentes shadcn nuevos si uno existente cubre el caso; si hace
falta, `npx shadcn add <x>` y respetá `components.json`.

## 3. Layouts

### Admin (`src/app/admin/*`)
`AdminLayoutShell` pone sidebar navy (`NAV` en `admin-layout-shell.tsx`; sumá
ahí la entrada de un módulo nuevo), header de 56 px y el padding. Cada page:

```tsx
<div className="space-y-6">
  <div>
    <h1 className="font-display text-2xl uppercase">Canchas</h1>
    <p className="text-sm text-muted-foreground">Alta, edición y baja de canchas del complejo</p>
  </div>
  {/* acciones alineadas a la derecha: <div className="flex justify-end"><Button>…</Button></div> */}
  {/* contenido: tabla / cards / grilla */}
</div>
```

### Reserva pública (`/reservar`, `/reservar/confirmar`, `/reserva/[code]`)
- `/reservar`: `DiagonalSection tone="muted"` + `max-w-6xl`; cabecera navy
  `rounded-3xl bg-navy-950 p-4 text-white`; grilla
  `md:grid-cols-[minmax(0,1fr)_350px] md:h-[600px]` (plano + panel). En mobile
  el panel va en `Drawer`.
- Ticket (confirmar / detalle): `min-h-screen bg-navy-950`, card
  `rounded-3xl border-white/15 bg-navy-900`, acentos lima, pasos
  "Paso 1 de 2 / Paso 2 de 2".
- Siempre visible: banner `.cm-demo-banner` ("DEMO · No realices pagos reales").

## 4. Estados (todos obligatorios en una vista nueva)

| Estado | Patrón | Referencia |
|---|---|---|
| **Carga de ruta** | `loading.tsx` que replica la grilla y alturas finales con `Skeleton` (en admin usá `AdminLoadingRegion`, `AdminPageHeaderSkeleton`, `TableSkeleton`, `CardSkeleton` de `components/admin/admin-skeletons.tsx`; en reserva `BookingBoardSkeleton`/`TicketSkeleton`) | `src/app/admin/reservas/loading.tsx` |
| **Carga parcial** | `<Suspense fallback={<XSkeleton/>}>` alrededor del bloque que espera datos; el resto sale en el primer byte | `src/app/demo/page.tsx` |
| **Componente pesado** | `next/dynamic` + skeleton del mismo alto | `dashboard-hour-chart.tsx` |
| **Acción en curso** | `useTransition`; botón `disabled` + `Loader2Icon animate-spin motion-reduce:animate-none` + texto en gerundio ("Guardando…", "Bloqueando turno temporal…") | `venue-config-form.tsx` |
| **Optimista** | `useOptimistic` sobre la lista (no sobre el botón), marca `isSaving` para spinner y `aria-busy` en la fila | `useReservationStatusMutations` en `reservation-actions.tsx`, `courts-table.tsx` |
| **Error de acción** | la action devuelve `{ ok:false, error }` → `toast.error(result.error)`; el optimista se revierte solo; si era un formulario, reabrirlo con lo cargado | `courts-table.tsx` `save()` |
| **Éxito** | `toast.success` corto y concreto ("Reserva cancelada. El turno quedó libre.") | `reservation-actions.tsx` |
| **Vacío** | fila/caja `border-dashed` + qué hacer ("Creá la primera con “Nueva cancha”") | `courts-table.tsx`, agenda |
| **Error de ruta** | `error.tsx` con `retry()` (Next 16.3) y link de salida | `src/app/admin/error.tsx` |
| **Conflicto/stale** | avisar en el lugar, no reemplazar en silencio ("El turno que elegiste se acaba de ocupar") | `booking-board.tsx` |
| **No encontrado** | `notFound()` + `src/app/not-found.tsx` | `reserva/[code]/page.tsx` |

Accesibilidad mínima de estados: skeletons con región `role="status"` y texto
`sr-only` ("Cargando reservas…"), resultados con `role="status"`, errores
bloqueantes con `role="alert"`.

## 5. Motion

- Entradas: `FadeIn` de `components/motion/motion-provider.tsx` (ya chequea
  `useReducedMotion`) dentro de `MotionProvider` (`LazyMotion domAnimation`, usá
  `m.div`, nunca `motion.div`, para no cargar el bundle completo).
- CSS: `.booking-panel-enter` (180 ms), `active:scale-95` en chips; curvas
  `--ease-fluid` / `--ease-snappy`. Duraciones 150–250 ms para UI, ≤ 500 ms para
  entradas.
- Toda animación nueva necesita su variante `motion-reduce:` o bloque
  `@media (prefers-reduced-motion: reduce)`. Spinners: `motion-reduce:animate-none`.
- Animá solo `opacity`/`transform` (listas: `transition-[color,background-color,border-color,box-shadow,opacity,transform]`, no `transition-all`).

## 6. Responsive

Mobile first. Cortes usados: `sm` (640) para pasar a 2 columnas, `md` (768) para
el layout de reserva con panel lateral, `lg` (1024) para 3–4 columnas y la
grilla 7/5 del dashboard, `xl` (1280) para el inspector del mapa
(`xl:grid-cols-[1fr_320px]`). Tablas siempre dentro de `overflow-x-auto`.
Objetivos táctiles ≥ 40 px en el flujo público (`h-10`–`h-12`).
`pb-[max(1rem,env(safe-area-inset-bottom))]` en barras inferiores.

## 7. Fechas y horas

El complejo vive en `America/Argentina/Tucuman` y el servidor puede estar en
UTC. **Nunca** `toLocaleString()`, `toISOString().slice(0,10)` ni `date-fns/format`
para mostrar o agrupar por día. Usá `src/lib/services/venue-time.ts`:
`venueDateKey`, `formatTimeLabel`/`venueTime`, `formatVenueDate`,
`formatVenueDateTime`, `venueNoon(día)` y `venueLocalInputToIso` para
`datetime-local`.

## 8. Copy (español rioplatense)

- Voseo siempre: "Elegí", "Confirmá", "Revisá", "Probá". Nada de "Elija"/"tú".
- Botones: verbo + objeto ("Guardar configuración", "Nueva cancha",
  "Sí, cancelar" / "No, mantener"). Nada de "OK" o "Enviar" genérico.
- Errores: qué pasó + qué hacer, sin culpar ni tecnicismos ("Ese turno se acaba
  de ocupar. Elegí otro horario."). Nunca mostrar un mensaje técnico o en inglés:
  los genera `toUserMessage` (`src/lib/services/action-result.ts`).
- Confirmaciones destructivas: consecuencia concreta ("El turno de Juan queda libre
  para otra persona").
- Vocabulario del dominio (ver `GLOSSARY.md`): cancha, turno, reserva, seña,
  comprobante, complejo, cierre. "Reserva temporal" para el *hold*.
- Recordatorio de demo donde haya plata: "Demo: no realices pagos reales".
- Puntos suspensivos con el carácter `…`.

## Checklist rápido antes de dar por terminada una UI

- [ ] Tokens y componentes de esta guía; nada de hex sueltos ni lima sobre claro.
- [ ] `loading.tsx`/Suspense con skeleton fiel, vacío, error, éxito y pendiente.
- [ ] Mutaciones con `useOptimistic`/`useTransition`, rollback y toast.
- [ ] Labels asociados (`htmlFor`/`id`), `aria-label` en botones ícono, foco visible.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Fechas con `venue-time.ts`; precios con `formatArs`.
- [ ] Probado en 375 px y ≥ 1280 px.
