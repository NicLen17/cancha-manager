---
name: cancha-new-module
description: Checklist paso a paso para agregar un módulo o feature a Cancha Manager (sección nueva del admin, paso del flujo de reserva, entidad nueva, server action, pantalla pública). Usala cuando pidan "agregá un módulo", "nueva sección en el admin", "nueva pantalla", "nuevo CRUD", "nueva entidad", "agregar torneos/clientes/caja/…", o cualquier feature que toque rutas, datos y UI a la vez. Complementa a cancha-design-system (lo visual) y a las guías de Next 16 en node_modules/next/dist/docs.
---

# Agregar un módulo a Cancha Manager

Seguí los pasos en orden. Cada paso nombra el archivo existente que sirve de
molde: copiá su forma antes de inventar. Para lo visual cargá también la skill
`cancha-design-system`.

> Next 16.3 tiene cambios que rompen: antes de usar una API leé la guía en
> `node_modules/next/dist/docs/01-app/` (p. ej. `error.js` usa `retry`, no solo
> `reset`; `PageProps<"/ruta">`/`LayoutProps<"/ruta">` son globales tipados por
> `next typegen`; `searchParams`/`params` son Promises).

## 0. Antes de escribir

- [ ] Nombrá el concepto con el vocabulario de `CONTEXT.md` / `GLOSSARY.md`. Si
      es una entidad nueva, agregala ahí.
- [ ] Decidí la ruta: admin → `src/app/admin/<modulo>/`; público →
      `src/app/<ruta>/`. Rutas y textos en español (`/admin/torneos`).
- [ ] ¿Toca la base? La migración/RLS va en `supabase/` y se revisa aparte; en
      el código se trabaja contra los puertos y el mock.

## 1. Tipos, schema y puerto de datos

1. **Tipo** en `src/lib/data/types.ts` (+ `*_LABELS` si hay enum visible, como
   `STATUS_LABELS`).
2. **Schema zod** en `src/lib/data/schemas.ts`: mensajes en español en cada
   regla, `idSchema` para ids, `timeOfDaySchema` para HH:MM,
   `z.iso.datetime({ offset: true })` para instantes y `.refine` para reglas
   cruzadas (ver `closureInputSchema`). Exportá `type XInput = z.infer<…>`.
3. **Puerto** en `src/lib/data/ports.ts`: un `XRepository` con métodos
   async y sumalo a `DataAccess`.
4. **Mock** en `src/lib/data/mock/store.ts` (+ datos en `mock/seed.ts`; si cambia
   la forma, subí `STORE_LAYOUT_VERSION`). Reproducí las garantías de la base:
   unicidad, solapamientos (`assertNoOverlap`), FKs (ver `courts.remove`) y
   transiciones de estado permitidas (ver `reservations.updateStatus`).
5. **Supabase** en `src/lib/data/supabase/adapter.ts` con `database()`/`rpc()`
   de `http.ts` (errores ya traducidos a español). Si la tabla no existe, dejá
   el método lanzando `new Error("… pendiente de migración")` y anotalo.
6. Lecturas repetidas en el mismo request → `cache()` de React, como
   `getDefaultVenue` en `src/lib/data/queries.ts`.

## 2. Server actions

Archivo `src/lib/services/<modulo>-actions.ts` con `"use server"` (molde:
`admin-actions.ts`). Reglas:

- Todo export de un archivo `"use server"` es un endpoint POST público. Lo que
  sea solo lectura para Server Components va en un módulo con
  `import "server-only"` (molde: `availability-query.ts`).
- Firma: `export async function upsertX(raw: unknown): Promise<ActionResult<X>>`
  y cuerpo dentro de `runAction(async () => { … })` (`action-result.ts`). Nunca
  `throw` hacia el cliente: en producción Next oculta el mensaje.
- Orden: `await requireAdmin()` (si es admin) → `schema.parse(raw)` →
  `getDataAccess()` → mutación → `revalidatePath(...)` de cada ruta que muestra
  esos datos (admin + `/reservar`/`/demo` si afecta disponibilidad).
- Errores para el usuario: `throw new Error("Texto en español con qué hacer")`;
  `runAction` lo convierte en `{ ok:false, error }`. Errores inesperados se
  loguean y salen como mensaje genérico.
- Acciones del público que identifican una reserva: verificar con
  `ownsBooking`/`ownsCode` (`auth.ts`).

## 3. Rutas: server primero

```
src/app/admin/<modulo>/
  page.tsx      Server Component: lee datos y pasa props serializables
  loading.tsx   skeleton fiel (obligatorio: las rutas son dinámicas)
  error.tsx     opcional; si no, captura src/app/admin/error.tsx
```

- [ ] `page.tsx` async, sin `"use client"`. Lecturas independientes en
      `Promise.all` (molde: `admin/precios/page.tsx`). Nada de `fetch` desde el
      cliente para la carga inicial.
- [ ] Bloques lentos o secundarios en `<Suspense>` con skeleton propio para que
      el resto salga en el primer byte (molde: `src/app/demo/page.tsx`).
- [ ] `searchParams` validados (fecha con regex + `venueNoon`, enums con
      `safeParse`); un parámetro inválido cae a un default, no al `error.tsx`
      (molde: `reservar/page.tsx`).
- [ ] Si el client usa estado inicial derivado de `searchParams`, poné `key`
      con esos valores (molde: `admin/reservas/page.tsx`).
- [ ] Formularios sobre datos del servidor: `key` con los valores guardados para
      remontar si cambian (molde: `admin/configuracion/page.tsx`).
- [ ] `loading.tsx`: con `AdminLoadingRegion` + helpers de
      `components/admin/admin-skeletons.tsx`, misma grilla y alturas que la page.
- [ ] Sumá la entrada al `NAV` de `src/components/admin/admin-layout-shell.tsx`
      y la ruta a `ADMIN_PATHS` de `admin-actions.ts`.
- [ ] Rutas públicas con header en la page: incluí `SiteHeader` en el
      `loading.tsx` o mové header/footer a un `layout.tsx` (molde: `demo/layout.tsx`).

## 4. Componentes cliente

`src/components/<area>/<modulo>-*.tsx`. `"use client"` solo en el componente
interactivo más chico posible (las piezas sin estado quedan server).

- [ ] Lista + formulario: `useOptimistic` sobre la lista con reducer
      `upsert/remove` y flag `isSaving`; `useTransition` para la action
      (molde: `courts-table.tsx`, `price-rules-manager.tsx`).
- [ ] Validá en el cliente con el **mismo** schema antes de llamar a la action
      (`schema.safeParse(form)` → `toast.error(issue.message)`).
- [ ] Resultado: `if (result.ok) toast.success(...) else toast.error(result.error)`;
      el optimista se revierte solo al cerrar la transición. Si el estado es
      local (no `useOptimistic`), guardá la copia y restaurala (molde:
      `map-builder.tsx` `removeCourt`).
- [ ] Doble submit: el botón se deshabilita con `isPending`; si la acción
      navega, hacé el `router.push` **dentro** de la transición; para clicks
      repetidos en el mismo frame usá un `useRef` guard (molde: `booking-board.tsx`).
- [ ] Datos "en vivo": `useAutoRefresh({ intervalMs, paused: isPending })`
      (`src/hooks/use-auto-refresh.ts`), nunca `setInterval(router.refresh)`.
- [ ] Efectos con cleanup; nada de `useEffect` para derivar estado (calculalo en
      render; el React Compiler memoiza). Listas con `key` estable (id, nunca índice
      si el orden cambia). Ordená con `toSorted`, no `sort` sobre props.
- [ ] Destructivo → `ConfirmActionDialog`. Labels con `htmlFor`.
- [ ] Librerías pesadas (gráficos, editores) con `next/dynamic` + skeleton.
- [ ] Fechas con `venue-time.ts`; precios con `formatArs`.

## 5. Pruebas

- [ ] Lógica pura (cálculos, validaciones, schemas, helpers de fecha) → asserts en
      `scripts/test-services.ts` (corre con `npm run test:services`; compila a
      CJS: sin top-level await).
- [ ] Reglas de la base (concurrencia, RLS, RPC) → `scripts/test-persistence.mjs`
      contra el proyecto Supabase de demo (requiere `.env.local`).

## 6. Verificación antes de entregar

```bash
npx eslint src
NEXT_DIST_DIR=.next-<tu-sesion> npx next typegen && npx tsc --noEmit
npm run test:services
NEXT_DIST_DIR=.next-<tu-sesion> npx next build
```

Después, en modo mock y con latencia para ver los estados de carga:

```bash
NEXT_DIST_DIR=.next-<tu-sesion> DATA_ADAPTER=mock ADMIN_PASSCODE=cancha-demo-local MOCK_LATENCY_MS=800 npx next dev -p 31xx
```

- [ ] Navegá a la ruta desde un link (no recargando): el skeleton aparece al
      instante y no hay salto al llegar el contenido.
- [ ] Mutación OK: cambio inmediato + toast. Mutación con error (dato inválido o
      dos pestañas): vuelve al estado anterior + toast con el motivo.
- [ ] Vacío, 375 px de ancho, teclado (Tab/Enter/Escape) y consola sin errores
      de hidratación (probá con `TZ=UTC`).
- [ ] Nota: `next typegen`/`build` agregan tu `NEXT_DIST_DIR` al `include` de
      `tsconfig.json`; revertilo antes de commitear.
