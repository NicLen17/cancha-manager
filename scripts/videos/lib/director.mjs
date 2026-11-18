// Acciones "humanas" para la grabación: toques/clicks con cursor visible,
// tipeo pausado, scroll suave y rótulos. Con fast=true ejecuta lo mismo
// sin pausas ni efectos (para preparar datos fuera de cámara).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Director {
  constructor(page, { mode, fast = false, cast = null, shots = null }) {
    this.page = page;
    this.mode = mode;
    this.fast = fast;
    this.cast = cast;
    this.shots = shots;
    this.shotN = 0;
    this.mouse = { x: 640, y: 420 };
  }

  async wait(ms) {
    if (!this.fast) await sleep(ms);
  }

  async shot(name) {
    if (!this.shots) return;
    this.shotN += 1;
    await this.page.screenshot({ path: `${this.shots}/${String(this.shotN).padStart(2, "0")}-${name}.png` });
  }

  async caption(step, text, pos = "bottom") {
    if (this.fast) return;
    await this.page.evaluate(([s, t, p]) => window.__cmrec?.caption(s, t, p), [step, text, pos]);
  }

  async scrollTo(locator, block = "center") {
    await locator.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b, inline: "center" }), block);
    await this.wait(750);
  }

  async scrollBy(dy) {
    await this.page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), dy);
    await this.wait(750);
  }

  async center(locator) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error("Elemento sin caja visible");
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  /** Toque en mobile: aparece el dedo, se acerca, onda y tap. */
  async tap(locator, { after = 450 } = {}) {
    if (this.fast) return locator.click();
    const { x, y } = await this.center(locator);
    const p = this.page;
    await p.evaluate(([x, y]) => window.__cmrec?.finger(x + 34, y + 46, false), [x, y]);
    await sleep(30);
    await p.evaluate(([x, y]) => window.__cmrec?.finger(x + 34, y + 46, true), [x, y]);
    await sleep(140);
    await p.evaluate(([x, y]) => {
      const f = document.getElementById("cmrec-finger");
      if (f) f.style.transition = "opacity .18s ease, transform .32s cubic-bezier(.3,.7,.4,1)";
      window.__cmrec?.finger(x, y, true);
    }, [x, y]);
    await sleep(360);
    await p.evaluate(([x, y]) => window.__cmrec?.ripple(x, y), [x, y]);
    await sleep(90);
    await locator.tap();
    await sleep(160);
    await p.evaluate(([x, y]) => window.__cmrec?.finger(x, y, false), [x, y]).catch(() => {});
    await sleep(after);
  }

  /** Click en desktop: el cursor viaja con easing hasta el elemento. */
  async click(locator, { after = 450, travel = 650 } = {}) {
    if (this.fast) return locator.click();
    const { x, y } = await this.center(locator);
    await this.moveTo(x, y, travel);
    await sleep(160);
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
    await sleep(after);
  }

  async moveTo(x, y, ms = 650) {
    const from = { ...this.mouse };
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      await this.page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await sleep(ms / steps / 2);
    }
    this.mouse = { x, y };
  }

  async type(locator, text, { delay = 38 } = {}) {
    if (this.fast) return locator.fill(text);
    if (this.mode === "mobile") await this.tap(locator, { after: 150 });
    else await this.click(locator, { after: 150 });
    await locator.pressSequentially(text, { delay });
    await sleep(250);
  }

  /** Corta la grabación mientras navega y la retoma con la página nueva lista. */
  async navigate(action, urlRe, { settle = 350 } = {}) {
    await action();
    if (this.cast) await this.cast.pause();
    await this.page.waitForURL(urlRe, { timeout: 30000 });
    await this.page.waitForLoadState("networkidle").catch(() => {});
    // Esperar a que no queden esqueletos de carga (Suspense / streaming).
    await this.page.waitForFunction(() => !document.querySelector('[data-slot="skeleton"], .animate-pulse'), null, { timeout: 15000 }).catch(() => {});
    await sleep(settle);
    if (this.cast) await this.cast.resume();
  }
}
