# Posicionamiento — Cancha Manager

Versión 1 · 17 de noviembre de 2026. Para el copy de la landing comercial y las visitas de venta.

Reglas que siguen vigentes (ver [README](../../README.md)): sin precios públicos, la demo es un complejo ficticio, no prometer multiempresa, suscripciones, pasarela de pagos, verificación bancaria ni mensajes automáticos, no inventar clientes ni métricas.

## 1. Mapa de competidores

Relevado en los sitios oficiales el 17/11/2026. Titulares citados tal como aparecen.

| Producto | Modelo | Qué comunica | Precio público | Muestra el flujo en video |
|---|---|---|---|---|
| [ATC Sports](https://atcsports.io/) (ex AlquilaTuCancha) | Marketplace de jugadores + software para el complejo. AR y LatAm | "Reserva tu cancha al instante". Mercado Pago, seña por cancha, caja, estadísticas. Torneos y WhatsApp figuran como "Próximamente" ([cómo funciona](https://atcsports.io/como-funciona-software-deportivo-alquila-tu-cancha)) | Sí, en USD por mes según cantidad de canchas ([precios](https://atcsports.io/software-gestion-deportiva)) | No: capturas y "Hablar con ventas" |
| [Playtomic Manager](https://playtomic.com/es/playtomic-manager) | App de jugadores + software. Solo deportes de raqueta | "La plataforma n.º 1 de gestión de clubes de deportes de raqueta". Pagos integrados, ligas, POS | No ([planes](https://playtomic.com/pricing)) | No |
| [EasyCancha](https://www.easycancha.com) | Marketplace + software. CL, AR y otros | "Más gestión para tu club. Más deporte para todos." Reservas y pagos automáticos, app | No | No |
| [WonaSports](https://www.wonasports.com) (ex Quierojugar) | Software que alimenta un marketplace. Uruguay | Reservas, Mercado Pago, transferencia, torneos, caja | No | No |
| [TurnoLink](https://turnolink.com.ar/deportes/canchas-de-futbol) | Link propio del complejo. AR | "Tus canchas siempre ocupadas, tu teléfono siempre libre." Señas por Mercado Pago, recordatorios por WhatsApp | Sí, en ARS, con plan gratis | No |
| [ReservaSimple](https://www.reservasimple.com/app-reservas-canchas-argentina) | Link propio. AR | Agenda de reservas. Mercado Pago o transferencia con comprobante que "el negocio revisa", 0% de comisión | Sí, en ARS, con plan gratis | No |
| [Agendito](https://www.agendito.com/lp/agenda-online-para-canchas-de-futbol) | Agenda genérica con página para canchas | "El software ideal para tu cancha de fútbol." Turnos fijos, señas, recordatorios | No en esa página | Tiene videos; no confirmamos qué muestran |

Lo que vimos en común:

- **Todos prometen lo mismo**: reservas 24/7 y seña con Mercado Pago.
- **Nadie muestra el recorrido.** Se apoyan en capturas sueltas y en "agendá una demo".
- **La transferencia con comprobante**, que es como se paga la seña en buena parte de los complejos, casi no aparece. Solo ReservaSimple la menciona, y no muestra cómo se revisa.
- **Ninguno muestra el plano del predio** para elegir la cancha. Todos usan grillas o listas.
- Los grandes son **marketplaces**: el complejo aparece al lado de su competencia, dentro de una marca ajena.

## 2. Qué hace distinto Cancha Manager hoy

Solo funciones que existen en el código y se ven en la demo:

| Función | Dónde se ve |
|---|---|
| Web propia del complejo, con su nombre e identidad, desde donde se reserva | `/demo`, `/reservar` |
| Reserva sin cuenta: fecha, deporte, horario y cancha, desde el celular | `/reservar` |
| **Mapa del predio**: las canchas dibujadas a escala, con su disponibilidad. También hay vista de lista | `/reservar` (Vista mapa / Vista lista) |
| El turno queda bloqueado 15 minutos mientras el jugador completa sus datos | `/reservar/confirmar` |
| Tres modalidades: efectivo, seña o transferencia total. Muestra alias y CBU con botón para copiar | `/reservar/confirmar` |
| **El jugador sube el comprobante** (imagen o PDF, hasta 3 MB) dentro de la misma reserva | `/reservar/confirmar` |
| Código de reserva, estado visible y resumen listo para mandar por WhatsApp (el envío lo hace el jugador) | `/reserva/[código]` |
| Recuperar la reserva con código y teléfono | `/mis-reservas` |
| Panel con las pendientes primero. Abrís el comprobante al lado de la reserva y confirmás o cancelás | `/admin`, `/admin/reservas` |
| La lista de reservas se actualiza sola cada 15 s | `/admin/reservas` |
| Editor del plano: medidas del predio, posición, tamaño y rotación de cada cancha | `/admin/mapa` |
| Horario semanal y cierres por mantenimiento o torneo, para una cancha o todo el predio | `/admin/horarios` |
| Precio base por cancha y reglas por franja horaria o día, con prioridad y vista previa | `/admin/precios` |
| Dos reservas no pueden ocupar el mismo turno (restricción en la base de datos) | Servidor |

## 3. Propuesta de valor

**Tu complejo con web propia: el jugador elige la cancha en el plano, reserva y sube el comprobante desde el celular, y vos lo confirmás con un toque.**

Versión corta: *Reservas y comprobantes en un solo lugar, con la marca de tu complejo.*

## 4. Diferenciales

1. **Es tu web, no un marketplace.**
   *Evidencia*: `/demo` es la página del complejo, con su nombre, y desde ahí se reserva. ATC, EasyCancha y Playtomic muestran el complejo dentro de su propia app, junto a otros.
   *Cómo decirlo*: "Tus jugadores reservan en tu página, no en una app donde también aparece el complejo de enfrente."

2. **La seña por transferencia, resuelta de punta a punta.**
   *Evidencia*: en `/reservar/confirmar` el jugador ve el alias y el CBU, copia, transfiere y adjunta el comprobante. En `/admin/reservas` el comprobante aparece junto a la reserva y se confirma ahí. La competencia habla de Mercado Pago y casi no muestra este caso.
   *Límite honesto*: el sistema no verifica que el dinero haya llegado. Lo confirma el encargado.

3. **Eligen la cancha en el plano real del predio.**
   *Evidencia*: la vista mapa de `/reservar` y el editor de `/admin/mapa`. No lo vimos en ningún competidor relevado.

4. **Cero reservas duplicadas y cero idas y vueltas de horarios.**
   *Evidencia*: el turno se bloquea 15 minutos durante la carga y la base de datos impide dos reservas activas en el mismo turno. El jugador ve en el momento qué está libre.

5. **Sin cuenta, sin app y con WhatsApp de por medio.**
   *Evidencia*: se reserva con nombre, teléfono y email. Recibe un código y un mensaje armado para WhatsApp, y recupera la reserva con código y teléfono.

## 5. Mensajes clave

- Para el dueño: **orden**. Todas las reservas y comprobantes en un panel, sin buscar capturas en el chat.
- Para el encargado: **menos consultas**. "¿Tenés a las 21?" se responde solo.
- Para el jugador: **reserva en un minuto** desde el celular, sin bajar ninguna app.
- Para la marca: **tu complejo, tu web y tus jugadores**.
- Para ganar confianza: **mostrar en vez de prometer**. Videos del flujo real y demo abierta.

## 6. Titulares y textos para la landing

Hero (elegir uno):

- **"Tus canchas, reservadas desde el celular. Los comprobantes, en un solo lugar."**
- **"Dejá de contestar '¿tenés a las 21?' por WhatsApp."**
- **"Tu complejo con web propia y reservas online, sin pasar por un marketplace."**

Bajada: *El jugador elige día, horario y cancha en el plano de tu predio, deja sus datos y sube el comprobante. Vos lo revisás y confirmás desde el panel.*

CTA principal: **Solicitar demo**. CTA secundario: **Probar la reserva** (lleva a `/demo`).

Secciones:

- **Video del jugador** (`reserva-flujo`): "Así reserva un jugador. Fecha, cancha, datos y comprobante. Listo."
- **Video del complejo** (`admin-flujo`): "Así la confirmás vos. Entra pendiente, mirás el comprobante, confirmás."
- **Plano**: "Tu predio, tal cual es. Dibujamos tus canchas para que el jugador elija la suya."
- **Precios y horarios**: "Cobrá distinto la hora pico. Reglas por franja y por día, y cierres por torneo o mantenimiento."
- **Marca**: "Tu nombre, no el nuestro. La página es de tu complejo."
- Rótulo de la demo, siempre visible: *"Complejo de demostración. Datos y precios ficticios."*

Evitar: "el N.º 1", "miles de complejos", "cobros automáticos", "Mercado Pago", "notificaciones automáticas", "multi-sede", "planes", "IA".

## 7. Objeciones y respuestas

| Objeción | Respuesta |
|---|---|
| "Ya estoy en ATC / un marketplace." | Podés seguir ahí. Esto es tu propia web: el jugador que te busca a vos reserva con tu marca, sin ver otros complejos. |
| "Mis clientes reservan por WhatsApp." | No lo perdés: la reserva termina con un mensaje listo para WhatsApp. Lo que cambia es que ya llega con horario, cancha y comprobante. |
| "¿Cobra con Mercado Pago?" | Hoy no. Funciona con efectivo, seña o transferencia, con el comprobante adjunto. El cobro online está entre lo próximo (ver §8). |
| "¿Y si el comprobante es falso?" | El sistema no da el pago por hecho: queda pendiente hasta que vos lo revisás contra tu cuenta y confirmás. |
| "No tengo tiempo de configurar nada." | La puesta en marcha (plano, canchas, horarios y precios) se prepara con vos como parte de la propuesta. Después, el día a día es revisar y confirmar. |
| "¿Cuánto sale?" | Depende de cuántas canchas y qué necesitás. Lo cotizamos después de ver tu complejo. No publicamos precio. |
| "¿Hay complejos que ya lo usan?" | Todavía no mostramos clientes. Lo que ves es una demo con un complejo ficticio, y podés probarla entera. |

## 8. Lo que falta para diferenciarse más (FUTURO, no anunciar)

Ordenado por peso comercial:

1. **Cobro de la seña online** (Mercado Pago) con confirmación automática. Es la promesa estándar del mercado y la objeción más probable.
2. **Recordatorios y confirmaciones automáticas por WhatsApp.** Hoy el envío es manual.
3. **Turnos fijos semanales** (el equipo de todos los martes), muy pedidos en fútbol 5.
4. **Alta de clientes reales con datos aislados por complejo** y usuarios por rol (dueño, encargado). Es necesario para vender en serie.
5. **Reportes de ocupación e ingresos por cancha y franja**, para respaldar la regla de precios en hora pico.
6. **Dominio propio del complejo** y página editable por el dueño.
