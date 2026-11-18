# Informe de hardening — app (admin y reserva)

Fecha: 2026-11-17 · Rama: `rediseno-y-hardening` · Alcance: todo menos la landing
(`src/app/(marketing)`, `src/components/{layout,marketing}`, bloque marketing de
`globals.css`) y `supabase/`. Trabajo hecho en modo mock (`DATA_ADAPTER=mock`), sin
acceso a Supabase ni `.env.local`. Nada commiteado.

## Verificación

| Chequeo | Resultado |
|---|---|
| `npx eslint` (toda la carpeta) | sin errores ni warnings |
| `next typegen` + `npx tsc --noEmit` | sin errores |
| `npm run test:services` | pasa (se agregaron tests de zona horaria, `ActionResult` y schemas) |
| `NEXT_DIST_DIR=.next-hardening next build` | pasa; todas las rutas de la app son dinámicas (ƒ) |
| Navegador, modo mock, `MOCK_LATENCY_MS=1200`, `TZ=UTC` | ver detalle abajo |

**Probado en el navegador** (servidor en UTC para reproducir producción, latencia
artificial de 1,2 s por llamada a datos):
- `/demo`: el hero aparece a ~225 ms tras el click; plano y canchas llegan por
  streaming con skeleton del mismo tamaño.
- `/mis-reservas`: skeleton visible apenas se navega; contenido ~1,2 s después.
- `/reservar` → doble click en "Continuar": un solo hold (2 POST en total en el
  log: hold + confirmación), botón en "Bloqueando turno temporal…" hasta que carga
  la confirmación.
- Confirmación con **seña + comprobante** en modo mock: llega a "Reserva
  registrada" (antes fallaba, ver A2).
- Dashboard admin: gráfico cargado de forma diferida; "Confirmar" en Pendientes
  recientes saca la fila a los ~110 ms y el toast aparece al responder el servidor
  (~3 s).
- `/admin/reservas`: cancelar con el diálogo nuevo; el polling refrescó la
  pestaña desactualizada; navegar entre `?status=` actualiza los filtros (bug B6).

- **Rollback con error, verificado en pantalla**: (1) dashboard desactualizado
  confirma una reserva que otra pestaña ya canceló → la fila sale al instante,
  vuelve al rechazar el servidor y aparece el toast; se agregó `router.refresh()`
  tras el error para mostrar el estado real. (2) Borrar "Cancha F5 Norte" (tiene
  reservas) → la fila desaparece, vuelve y aparece el toast "Hay datos
  relacionados. Desactivá la cancha para conservar las reservas.".
- Canchas: skeleton a los ~110 ms; validación en cliente con mensaje en español;
  alta optimista con spinner en la fila y toast "Cancha creada".
- Diálogo de cancelación de reserva, toast y estado vacío de la tabla.
- Reinicio de la demo desde Configuración.

**Nota del entorno de prueba**: con el panel del navegador oculto o la pestaña en
segundo plano no corre `requestAnimationFrame`, y React 19.2 lo usa para mostrar
el contenido que llega por streaming. Por eso la verificación visual se hizo con
el panel visible. No afecta a usuarios reales.

**No probado**: formularios de precios y horarios/cierres en pantalla (comparten
el mismo patrón que canchas, con tipos, lint y tests de schemas en verde), el
editor de mapa y la vista mobile (375 px) en detalle.

## Hallazgos y correcciones

### Severidad alta

**A1. "Probar demo" / rutas dinámicas sin respuesta al click.** `/demo`,
`/mis-reservas`, `/reserva/[code]` y `/reservar/confirmar` son dinámicas
(`force-dynamic`/cookies) y no tenían `loading.tsx`. Según la doc de Next 16
(*Linking and navigating*), sin `loading.tsx` una ruta dinámica no se prefetchea
y la navegación espera el render completo sin ningún indicio. `/reservar/confirmar`
heredaba el skeleton claro del tablero de turnos.
→ `loading.tsx` en todas, con skeletons que replican la grilla final
(`components/booking/booking-skeletons.tsx`, `app/demo/demo-skeletons.tsx`,
`components/admin/admin-skeletons.tsx`). `/demo` ahora tiene header/footer en
`demo/layout.tsx` y transmite plano y canchas con `<Suspense>`. Los skeletons de
admin se rehicieron para coincidir con cada page (antes eran bloques genéricos).
*Queda en la landing:* el link "Probar demo" podría usar `useLinkStatus` para
redes lentas (archivo de la landing, no se tocó).

**A2. Comprobante en modo mock llamaba a Supabase.** `saveReceipt` subía siempre
a Supabase Storage: en mock, pagar con seña o transferencia (opción por defecto)
fallaba con "Falta configurar la conexión…". → En mock se valida el archivo
igual y no se sube (`receipts.ts`); la ruta `/admin/comprobantes/[id]` responde
404 explicativo.

**A3. Mensajes de error que en producción no llegan.** Todas las server actions
lanzaban `Error`; en producción Next reemplaza el mensaje por uno genérico, así
que los toasts de "turno ocupado", "clave incorrecta", etc. no se iban a ver.
Además los errores de zod salían como JSON en inglés. → `ActionResult`
(`services/action-result.ts`): las actions devuelven `{ ok, data } | { ok:false,
error }`; solo se exponen errores de negocio en español, los inesperados se
loguean y salen con texto genérico. `z.config(z.locales.es())` y mensajes propios
en los schemas. Todos los clientes actualizados.

**A4. Fechas en la zona del navegador/servidor.** `reservations-manager` usaba
`date-fns/format`, cierres y lookup `toLocaleString()` sin zona, el preview de
precios `toISOString().slice(0,10)` y el carrusel de días `getDate()`. Con el
servidor en UTC (producción) eso produce horarios corridos 3 h, el día equivocado
después de las 21 h y **errores de hidratación** (SSR y cliente formatean
distinto); `format(new Date("YYYY-MM-DD"))` en la agenda mostraba el día anterior.
→ Helpers en `venue-time.ts` (`formatVenueDate`, `formatVenueDateTime`,
`venueNoon`, `venueLocalInputToIso`) usados en todos lados; los `datetime-local`
de cierres se interpretan en hora del complejo.

**A5. Optimistic de reservas solo en el botón.** `useOptimistic` vivía en
`ReservationStatusActions`: el badge de estado, los filtros y los contadores
seguían mostrando el valor viejo, y en el dashboard la reserva confirmada seguía
en "Pendientes". → `useReservationStatusMutations` (en `reservation-actions.tsx`)
mantiene la lista optimista, marca la fila con `isSaving`/`aria-busy`, revierte
sola si falla y muestra toast con el motivo. `window.confirm` reemplazado por
`ConfirmActionDialog`.

### Severidad media

**B1. Polling de 15 s sin control.** `setInterval(router.refresh)` corría durante
mutaciones y no refrescaba al volver a la pestaña. → `useAutoRefresh`
(`hooks/use-auto-refresh.ts`): pausa con mutaciones en curso, no corre oculta,
refresca al volver si los datos tienen más del intervalo, no encola refreshes y
limpia timers. Next procesa refresh y actions en una sola cola, así que no hay
respuestas fuera de orden.

**B2. Doble submit al bloquear turno.** `isSubmitting` con `useState` permitía
dos clicks en el mismo frame (dos holds, el segundo con error) y se
rehabilitaba durante el `router.push`. → guard con `useRef` + `useTransition`
que incluye la navegación. Igual en la confirmación (`router.push` dentro de la
transición). Se agregó toast para fallas de red.

**B3. Turno elegido reemplazado en silencio.** Si un refresco marcaba ocupado el
turno elegido, el panel pasaba al primer horario libre sin avisar (se podía
reservar otra hora por error). → queda sin selección con aviso "El turno que
elegiste se acaba de ocupar". El refresco en cada `focus` (que también disparaba
el selector de fecha nativo) pasó a `useAutoRefresh` de 30 s, pausado mientras se
reserva.

**B4. Reserva temporal vencida.** El contador llegaba a 0 y solo se deshabilitaba
el botón. → aviso con link para volver a elegir horario.

**B5. Mapa pisaba la configuración (lost update).** "Guardar dimensiones"
reenviaba datos bancarios en memoria y podía sobrescribir lo guardado en
Configuración desde otra pestaña. → action `updateVenuePlan` que lee el resto en
el servidor. Baja de cancha en el mapa con rollback manual si falla.

**B6. Filtros de reservas no seguían la URL.** Estando en Reservas, el link
"Agenda" del sidebar o "Revisar pendientes" no cambiaba pestaña ni filtro (estado
inicial del cliente). → `key` con `tab`/`status` en la page.

**B7. Paridad mock ↔ Supabase.** El mock permitía borrar canchas con reservas
(reservas huérfanas que rompían `/admin/reservas`) y cambiar el estado de
reservas canceladas/vencidas. → mismas guardas que la FK (23503) y que el filtro
`status=in.(pending,confirmed)` del adaptador.

**B8. Validación de entradas en server actions.** Ids sin validar, horas como
string libre, cierres con fin antes del inicio, duración 0, estado `hold`
aceptado por el admin. → `idSchema`, `timeOfDaySchema`, `z.iso.datetime`,
`refine` de rango, límites de duración/precio/nombre, `reservationStatusUpdateSchema`;
`requireAdmin()` antes de parsear. `getAvailabilityForDate` salió de
`reservations.ts` ("use server") a `availability-query.ts` (`server-only`): ya no
es un endpoint público. `?fecha=` inválida o pasada en `/reservar` cae a hoy en
vez de mostrar el `error.tsx`; `/reserva/[code]` valida el formato del código.

**B9. Formularios que no se resincronizan.** Horarios y Configuración tomaban los
valores del servidor solo al montar (tras reiniciar la demo mostraban datos
viejos). → `key` con los valores guardados. Cada día de horario tiene su propia
transición y botón deshabilitado si no hay cambios.

**B10. Contraste.** Texto lima (`#a8df8e`/`#80c567`) sobre fondo claro en admin
(códigos, links, eyebrows): 1,5–2:1. → `text-navy-700/800` sobre claro, lima solo
sobre navy.

### Severidad baja

- `error.tsx` nuevos en `/` (raíz de la app) y `/admin` (conserva el sidebar);
  `reservar/error.tsx` usa `retry()` (estable en Next 16.3) en vez de `reset()`.
- recharts (~100 KB gzip) cargado con `next/dynamic` y skeleton del mismo alto.
- `React.cache` para el complejo (`data/queries.ts`): `/reservar` hacía dos
  lecturas en serie (layout + page); cookies de `/reserva/[code]` en paralelo.
- Búsqueda de reservas con `useDeferredValue`; `toSorted` en vez de `sort` que
  mutaba la lista; `FilterSelect` reutilizable.
- Accesibilidad: labels asociados (`htmlFor`/`id`) en admin, `aria-label` con el
  objeto en botones ícono, `aria-pressed` en días de precios, `role="status"`
  en skeletons y resultados, íconos decorativos `aria-hidden`, spinners y
  skeletons con `motion-reduce:animate-none`.
- Copiado al portapapeles con manejo de error; copys de vacío y error más
  concretos en voseo.
- `MOCK_LATENCY_MS` (solo desarrollo) en `data/index.ts` para probar estados de
  carga con el mock.

### Revisado sin cambios

- Límites client/server: los `"use client"` están en componentes interactivos;
  pages y skeletons son Server Components. Compatible con React Compiler (lint
  limpio, sin mutaciones en render).
- `react-day-picker` / `ui/calendar.tsx` no se usan en ninguna pantalla (no
  afectan el bundle). Se pueden eliminar junto con la dependencia más adelante.
- Keys de listas estables (ids o `startsAt`).

## Pendiente para la etapa de base de datos (requiere Supabase)

1. **Liberar el hold al abandonar.** Cada "Continuar" crea un hold de 15 min; si
   el cliente vuelve atrás y elige otro horario, el anterior queda bloqueado hasta
   vencer. Hace falta un RPC `cm_release_hold(id)` (con verificación de dueño) y
   un método en el puerto; `updateStatus` de Supabase solo admite
   pending/confirmed.
2. **Vencimiento de holds**: en mock se expiran en cada lectura; confirmar que
   `cm_expire_holds` corre por cron o en las lecturas de disponibilidad.
3. **Concurrencia real de holds**: la exclusión la da el constraint 23P01;
   `scripts/test-persistence.mjs` la cubre pero no se pudo correr sin `.env.local`.
4. **Waterfall venue → listas**: cada page espera el complejo antes de pedir las
   listas (2 round trips). Con un único complejo se podría resolver el id sin
   consulta o con un RPC que devuelva todo; definirlo con el modelo multi-tenant.
5. **Identidad de cliente por teléfono**: el mock (y probablemente el RPC)
   actualiza el nombre del cliente existente con el mismo teléfono, cambiando el
   titular de reservas viejas. Decidir si el nombre se guarda por reserva.
6. **Comprobantes**: subida y borrado reales en Storage, tamaño/MIME en el bucket
   y políticas (no probado).
7. **RLS / revalidación**: no se revisaron políticas ni migraciones (fuera de
   alcance).
8. Cuando haya `DATA_ADAPTER=supabase` en el build, evaluar Cache Components
   (skill `next-cache-components-adoption`) para tener shell estático
   prefetcheable en lugar de `force-dynamic`.

## Notas de convivencia

- `next typegen`/`next build` con `NEXT_DIST_DIR` agregan
  `.next-<dir>/types/**` al `include` de `tsconfig.json` (y lo reformatean).
  Se revirtió a lo que está en git al terminar.
- `.env.example` (nuevo) queda ignorado por el patrón `.env*` del `.gitignore`;
  para versionarlo hace falta agregar `!.env.example` (no se tocó `.gitignore`).
- `skills-lock.json` pasó a `version: 2` al instalar con la CLI actual de
  `skills`; el hash de `web-design-guidelines` quedó vacío (lo reescribió la CLI).

## Skills

- Instaladas (`.claude/skills`, `.agents/skills`, `skills-lock.json`):
  `vercel-react-best-practices`, `vercel-composition-patterns`,
  `vercel-react-view-transitions` (vercel-labs/agent-skills),
  `next-bundle-optimizer`, `next-cache-components-adoption` (vercel/next.js; las
  de Next se mudaron ahí y `next-best-practices` ya no existe como skill: viene en
  `node_modules/next/dist/docs` y `AGENTS.md`), `accessibility`,
  `core-web-vitals` (addyosmani/web-quality-skills). Todas son markdown, sin
  scripts. No se instaló `vercel-optimize` (ejecuta muchos scripts y apunta a
  métricas de Vercel), `next-dev-loop` (depende de `agent-browser`) ni Supabase.
- Propias: `cancha-design-system` y `cancha-new-module`.
