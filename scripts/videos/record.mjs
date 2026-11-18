// Graba los videos de flujo de la landing desde el producto real (modo mock).
//   node record.mjs [reserva|admin|all]   (ver README.md)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Cast } from "./lib/cast.mjs";
import { Director } from "./lib/director.mjs";
import { overlayInit } from "./lib/overlay.mjs";
import { makeReceipt } from "./lib/receipt.mjs";
import { encode } from "./lib/encode.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "out");
const PUBLIC = path.resolve(ROOT, "../../public/videos");
const BASE = process.env.BASE_URL ?? "http://localhost:3103";
const PASSCODE = process.env.ADMIN_PASSCODE;
const SHOTS = process.env.SHOTS ? path.join(OUT, "shots") : null;
const which = process.argv[2] ?? "all";

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PUBLIC, { recursive: true });
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--font-render-hinting=none", "--disable-lcd-text", "--hide-scrollbars"],
});

const MOBILE = { viewport: { width: 405, height: 720 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3 };

async function newPage(opts, mode) {
  const ctx = await browser.newContext({
    ...opts,
    locale: "es-AR",
    timezoneId: "America/Argentina/Tucuman",
    reducedMotion: "no-preference",
  });
  await ctx.addInitScript(overlayInit, { mode });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  return page;
}

const RECEIPT = path.join(OUT, "comprobante-ejemplo.png");
await makeReceipt(browser, RECEIPT, {
  amount: "$ 2.200",
  payer: "Martín Gómez",
  alias: "DEMO.NO.TRANSFERIR",
  holder: "Complejo Cancha Manager · Demo",
});

/** Precalienta las rutas para que `next dev` no compile durante la toma. */
async function warmUp() {
  for (const r of ["/reservar", "/reservar/confirmar", "/mis-reservas", "/admin/login", "/admin", "/admin/reservas", "/admin/mapa", "/admin/horarios", "/admin/precios"]) {
    await fetch(BASE + r).catch(() => {});
  }
}

/**
 * Flujo de reserva del jugador. Con `d.fast` sirve para cargar reservas de
 * contexto fuera de cámara.
 */
async function bookFlow(d, b) {
  const p = d.page;
  const visible = (loc) => loc.filter({ visible: true }).first();
  await d.caption(1, "Elegí el día y el deporte", "top");
  await d.wait(600);
  await d.tap(p.getByRole("button", { name: b.day }));
  await d.tap(p.getByRole("button", { name: b.sport, exact: true }));
  await d.caption(2, "Elegí el horario", "top");
  const hour = p.getByRole("button", { name: b.hour, exact: true });
  if (!d.fast) await d.scrollTo(hour);
  await d.tap(hour);
  await d.shot("filtros");
  await d.caption(3, "Tocá tu cancha en el plano", "top");
  const court = p.getByRole("button", { name: new RegExp(`^${b.court},`) });
  if (!d.fast) await d.scrollTo(court);
  await d.tap(court, { after: 900 });
  d.cast?.mark("poster");
  await d.shot("cancha");
  await d.navigate(() => d.tap(visible(p.getByRole("button", { name: /continuar con la reserva/i })), { after: 120 }), /\/reservar\/confirmar/);
  await d.caption(4, "Tus datos, sin crear cuenta", "top");
  await d.wait(250);
  await d.type(p.locator("#fullName"), b.name);
  await d.type(p.locator("#phone"), b.phone, { delay: 32 });
  await d.type(p.locator("#email"), b.email, { delay: 16 });
  if (b.method === "cash") {
    await d.tap(p.locator("label[for='pay-cash']"));
  } else {
    await d.caption(5, "Transferís la seña y subís el comprobante", "top");
    const receipt = p.locator("label[for='receipt']").last();
    if (!d.fast) await d.scrollTo(receipt);
    await d.wait(250);
    if (!d.fast) await d.tap(receipt, { after: 200 }).catch(() => {});
    await p.locator("input#receipt").setInputFiles(b.receipt);
    await d.wait(800);
  }
  await d.shot("datos");
  const submit = p.getByRole("button", { name: /finalizar/i });
  if (!d.fast) await d.scrollTo(submit);
  try {
    await d.navigate(() => d.tap(submit, { after: 120 }), /\/reserva\/[A-Z0-9-]+/i, { settle: 250 });
  } catch (e) {
    await p.screenshot({ path: path.join(OUT, "error-confirmar.png"), fullPage: true });
    console.error("Texto visible:", (await p.locator("[role=alert], [data-slot=field-error], [data-sonner-toast]").allInnerTexts()).join(" | "));
    throw e;
  }
  const code = decodeURIComponent(new URL(p.url()).pathname.split("/").pop());
  if (!/^CM-/i.test(code) || (await p.getByText(/no encontrada/i).count()))
    throw new Error(`La app no devolvió un código válido (${p.url()}). ¿Está a medio cambiar? Reintentá.`);
  await d.caption(b.method === "cash" ? 5 : 6, "Listo: tu código y el resumen para WhatsApp", "top");
  await d.wait(400);
  await d.shot("codigo");
  return code;
}

// Reservas de contexto (fuera de cámara) para que el panel tenga datos creíbles.
// `confirm: true` las confirma desde administración antes de grabar.
const CONTEXT_BOOKINGS = [
  { day: /^hoy/i, sport: "Fútbol 7", hour: "22:00", court: "Cancha F7", name: "Lucía Fernández", phone: "381 555 0187", email: "lucia.fernandez@example.com", method: "cash", confirm: true },
  { day: /^hoy/i, sport: "Pádel", hour: "22:30", court: "Pádel 2", name: "Diego Herrera", phone: "381 555 0163", email: "diego.herrera@example.com", method: "cash", confirm: true },
  { day: /mañana/i, sport: "Fútbol 9", hour: "19:00", court: "Cancha F9", name: "Sofía Ramírez", phone: "381 555 0119", email: "sofia.ramirez@example.com", method: "cash", confirm: true },
  { day: /mañana/i, sport: "Handball", hour: "18:00", court: "Handball / Futsal", name: "Tomás Acosta", phone: "381 555 0175", email: "tomas.acosta@example.com", method: "cash" },
];
const HERO_BOOKING = {
  day: /mañana/i, sport: "Fútbol 5", hour: "21:00", court: "Cancha F5 Norte",
  name: "Martín Gómez", phone: "381 555 0142", email: "martin.gomez@example.com", method: "deposit", receipt: RECEIPT,
};

async function recordReserva() {
  const page = await newPage(MOBILE, "mobile");
  await page.goto(BASE + "/reservar");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const cast = new Cast(path.join(OUT, "frames-reserva"), { maxWidth: 810, maxHeight: 1440 });
  const d = new Director(page, { mode: "mobile", cast, shots: SHOTS });
  // Arrancamos con la página ya dibujada.
  await page.reload();
  await page.waitForTimeout(150);
  await cast.start(page);
  await page.waitForTimeout(700);
  const code = await bookFlow(d, HERO_BOOKING);
  await d.wait(2300);
  await d.caption(null, null);
  await d.wait(400);
  await cast.stop();
  await page.context().close();
  return { cast, code };
}

async function adminLogin(page) {
  await page.goto(BASE + "/admin/login");
  await page.locator("input[type=password]").fill(PASSCODE);
  await page.locator("input[type=password]").press("Enter");
  await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"));
}

async function recordAdmin(code) {
  const page = await newPage(DESKTOP, "desktop");
  await adminLogin(page);
  // Mock sin Storage: servimos el mismo archivo que subió el jugador (ver README).
  await page.context().route("**/admin/comprobantes/**", (route) =>
    route.fulfill({ path: RECEIPT, contentType: "image/png", headers: { "Content-Disposition": "inline" } }));
  await page.goto(BASE + "/admin");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  const cast = new Cast(path.join(OUT, "frames-admin"), { maxWidth: 1920, maxHeight: 1200 });
  const d = new Director(page, { mode: "desktop", cast, shots: SHOTS });
  await page.mouse.move(1000, 600);
  d.mouse = { x: 1000, y: 600 };
  await cast.start(page);
  await d.caption(1, "Entra la reserva: queda pendiente");
  await d.wait(1000);
  await d.shot("dashboard");
  const row = page.getByText(code).first();
  await d.moveTo(...Object.values(await d.center(row)), 800);
  await d.wait(500);
  await d.navigate(() => d.click(page.getByRole("link", { name: /revisar/i }).first(), { after: 100 }), /\/admin\/reservas/);
  await d.caption(2, "Revisás el comprobante");
  await d.wait(900);
  await d.shot("reservas");
  cast.mark("poster");
  // El comprobante abre en otra pestaña: la grabamos también.
  const receiptLink = page.locator("tr").filter({ hasText: code }).locator(`a[href^="/admin/comprobantes/"]`).filter({ visible: true }).first();
  await d.moveTo(...Object.values(await d.center(receiptLink)), 700);
  await d.wait(250);
  const [popup] = await Promise.all([page.waitForEvent("popup"), d.click(receiptLink, { after: 0 })]);
  await cast.pause();
  await popup.setViewportSize(DESKTOP.viewport).catch(() => {});
  await popup.waitForLoadState("load");
  await popup.waitForTimeout(400);
  await cast.switchTo(popup);
  await cast.resume();
  await d.wait(2200);
  await cast.pause();
  await popup.close();
  await cast.switchTo(page);
  await cast.resume();
  await d.caption(3, "Confirmás con un clic");
  await d.wait(500);
  const confirm = page.locator("tr").filter({ hasText: code }).getByRole("button", { name: /^confirmar$/i }).filter({ visible: true }).first();
  await d.click(confirm, { after: 1500 });
  await d.shot("confirmada");
  await d.caption(4, "Tu predio, tus horarios y tus precios");
  for (const [route, label, hold] of [["/admin/mapa", /mapa/i, 2200], ["/admin/horarios", /horarios/i, 1600], ["/admin/precios", /precios/i, 2200]]) {
    const link = page.getByRole("link", { name: label }).filter({ visible: true }).first();
    await d.navigate(() => d.click(link, { after: 80 }), new RegExp(route));
    await d.caption(4, "Tu predio, tus horarios y tus precios");
    await d.wait(hold);
    await d.shot(route.split("/").pop());
  }
  await d.caption(null, null);
  await d.wait(400);
  await cast.stop();
  await page.context().close();
  return { cast };
}

/** Restablece la demo (solo afecta al servidor local en modo mock). */
async function resetDemo() {
  if (!PASSCODE) throw new Error("Falta ADMIN_PASSCODE");
  const page = await newPage(DESKTOP, "desktop");
  await adminLogin(page);
  await page.goto(BASE + "/admin/configuracion");
  await page.getByRole("button", { name: "Restablecer demo" }).click();
  await page.locator("#reset-confirmation").fill("REINICIAR DEMO");
  await page.getByRole("dialog").getByRole("button").filter({ hasNotText: /volver|close|cerrar/i }).last().click();
  await page.getByText("Demo restablecida").waitFor();
  await page.context().close();
}

async function prepare() {
  await resetDemo();
  const page = await newPage(MOBILE, "mobile");
  for (const b of CONTEXT_BOOKINGS) {
    await page.goto(BASE + "/reservar");
    await page.waitForLoadState("networkidle");
    await bookFlow(new Director(page, { mode: "mobile", fast: true }), b).catch((e) => console.warn("Reserva de contexto omitida:", e.message));
  }
  await page.context().close();
  // Confirmar algunas desde el panel, como haría el encargado.
  const admin = await newPage(DESKTOP, "desktop");
  await adminLogin(admin);
  for (const b of CONTEXT_BOOKINGS.filter((x) => x.confirm)) {
    await admin.goto(BASE + "/admin/reservas");
    await admin.waitForLoadState("networkidle");
    const btn = admin.locator("tr").filter({ hasText: b.name }).getByRole("button", { name: /^confirmar$/i }).first();
    await btn.click({ timeout: 5000 }).then(() => admin.waitForTimeout(800)).catch((e) => console.warn("No se pudo confirmar", b.name, e.message));
  }
  await admin.context().close();
}

await warmUp();
let code = process.env.RESERVA_CODE;
if (which === "reserva" || which === "all") {
  await prepare();
  const { cast, code: c } = await recordReserva();
  code = c;
  console.log("Reserva grabada:", code);
  await encode({ cast, name: "reserva-flujo", width: 720, height: 1280, out: OUT, publicDir: PUBLIC, posterAt: cast.marks.poster });
}
if (which === "admin" || which === "all") {
  if (!PASSCODE) throw new Error("Falta ADMIN_PASSCODE");
  if (!code) throw new Error("Falta el código de reserva (corré 'all' o definí RESERVA_CODE)");
  const { cast } = await recordAdmin(code);
  await encode({ cast, name: "admin-flujo", width: 1440, height: 900, out: OUT, publicDir: PUBLIC, posterAt: cast.marks.poster });
}
await browser.close();
