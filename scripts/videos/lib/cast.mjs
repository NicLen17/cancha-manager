// Grabación nítida vía CDP (Page.startScreencast) con reloj virtual.
// - Cada cuadro se guarda como JPEG con su instante en "tiempo de video".
// - pause()/resume() recortan tramos que no queremos (cargas, navegación).
// - switchTo(page) permite seguir grabando en otra pestaña (p. ej. el comprobante).
import fs from "node:fs";
import path from "node:path";

export class Cast {
  constructor(dir, { maxWidth, maxHeight, quality = 92 }) {
    this.dir = dir;
    this.opts = { format: "jpeg", quality, maxWidth, maxHeight, everyNthFrame: 1 };
    this.frames = [];
    this.marks = {};
    this.running = false;
    this.pausedTotal = 0;
    this.pausedAt = null;
    this.cdp = null;
    this.page = null;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  now() {
    const wall = performance.now() / 1000;
    return wall - this.pausedTotal - (this.pausedAt !== null ? wall - this.pausedAt : 0);
  }

  async attach(page) {
    if (this.cdp) await this.cdp.detach().catch(() => {});
    this.page = page;
    this.cdp = await page.context().newCDPSession(page);
    this.cdp.on("Page.screencastFrame", ({ data, sessionId }) => {
      const cdp = this.cdp;
      cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
      if (!this.running) return;
      const file = path.join(this.dir, `f${String(this.frames.length).padStart(5, "0")}.jpg`);
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      this.frames.push({ file, t: this.now() });
    });
  }

  async start(page) {
    await this.attach(page);
    this.t0 = this.now();
    await this.resume();
  }

  async resume() {
    if (this.pausedAt !== null) {
      this.pausedTotal += performance.now() / 1000 - this.pausedAt;
      this.pausedAt = null;
    }
    this.running = true;
    // Reiniciar el screencast fuerza un cuadro inmediato del estado actual.
    await this.cdp.send("Page.startScreencast", this.opts);
  }

  async pause() {
    this.running = false;
    this.pausedAt = performance.now() / 1000;
    await this.cdp.send("Page.stopScreencast").catch(() => {});
  }

  async switchTo(page) {
    const wasRunning = this.running;
    if (wasRunning) await this.pause();
    await this.attach(page);
    if (wasRunning) await this.resume();
  }

  mark(name) {
    this.marks[name] = this.now() - this.t0;
  }

  async stop() {
    this.end = this.now();
    this.running = false;
    await this.cdp.send("Page.stopScreencast").catch(() => {});
    await this.cdp.detach().catch(() => {});
  }

  /** Lista para el demuxer concat de ffmpeg (duración por cuadro). */
  writeConcat(file) {
    const lines = [];
    const fr = this.frames;
    for (let i = 0; i < fr.length; i++) {
      const next = i + 1 < fr.length ? fr[i + 1].t : this.end;
      const d = Math.max(0.001, next - fr[i].t);
      lines.push(`file '${fr[i].file.replace(/\\/g, "/")}'`, `duration ${d.toFixed(4)}`);
    }
    lines.push(`file '${fr[fr.length - 1].file.replace(/\\/g, "/")}'`);
    fs.writeFileSync(file, lines.join("\n"));
    return this.end - fr[0].t;
  }
}
