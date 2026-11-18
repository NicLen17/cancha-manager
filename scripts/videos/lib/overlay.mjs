// Capa visual que se inyecta en cada página durante la grabación:
// oculta el indicador de Next en dev, dibuja el cursor (desktop) o el toque
// (mobile) y muestra rótulos de paso. No modifica el código de la app.
export function overlayInit({ mode }) {
  const install = () => {
    if (document.getElementById("cmrec-style")) return;
    const style = document.createElement("style");
    style.id = "cmrec-style";
    style.textContent = `
      nextjs-portal, [data-nextjs-dev-tools-button], [data-next-badge-root] { display: none !important; }
      html { scroll-behavior: auto !important; }
      #cmrec-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
        transform: translate(-200px, -200px); will-change: transform; }
      #cmrec-cursor svg { display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
      #cmrec-finger { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
        width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 999px;
        background: rgba(255,255,255,.38); border: 2px solid rgba(255,255,255,.9);
        box-shadow: 0 4px 14px rgba(0,0,0,.28); opacity: 0; transform: translate(-200px,-200px) scale(.6);
        transition: opacity .18s ease, transform .18s ease; }
      #cmrec-finger.on { opacity: 1; }
      .cmrec-ripple { position: fixed; z-index: 2147483646; pointer-events: none; width: 20px; height: 20px;
        margin: -10px 0 0 -10px; border-radius: 999px; border: 3px solid #a3e635;
        animation: cmrec-ripple .55s ease-out forwards; }
      @keyframes cmrec-ripple { from { transform: scale(.4); opacity: .95; } to { transform: scale(3.2); opacity: 0; } }
      #cmrec-caption { position: fixed; z-index: 2147483645; pointer-events: none; left: 50%;
        display: flex; align-items: center; gap: 10px; max-width: calc(100% - 28px);
        padding: 10px 16px 10px 10px; border-radius: 999px;
        background: rgba(8, 36, 24, .92); color: #fff; backdrop-filter: blur(8px);
        border: 1px solid rgba(163, 230, 53, .35);
        box-shadow: 0 10px 30px rgba(0,0,0,.30);
        font: 600 15px/1.2 "DM Sans", ui-sans-serif, system-ui, sans-serif; letter-spacing: -.01em;
        white-space: nowrap; opacity: 0; transform: translate(-50%, 8px);
        transition: opacity .28s ease, transform .28s ease; }
      #cmrec-caption.on { opacity: 1; transform: translate(-50%, 0); }
      #cmrec-caption b { display: inline-grid; place-items: center; min-width: 26px; height: 26px; border-radius: 999px;
        background: #a3e635; color: #0b2a1c; font-size: 14px; font-weight: 800; }
      #cmrec-caption.top { top: 14px; } #cmrec-caption.bottom { bottom: 18px; }
      #cmrec-caption.desk { font-size: 17px; padding: 12px 20px 12px 12px; }
      #cmrec-caption.desk b { min-width: 30px; height: 30px; font-size: 15px; }
    `;
    document.documentElement.appendChild(style);

    if (mode === "desktop") {
      const c = document.createElement("div");
      c.id = "cmrec-cursor";
      c.innerHTML = `<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2 L3 24 L9 18.5 L13 27.5 L17 25.8 L13 17 L21 17 Z" fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`;
      document.documentElement.appendChild(c);
      const last = window.__cmrecPos || { x: -200, y: -200 };
      c.style.transform = `translate(${last.x - 3}px, ${last.y - 2}px)`;
      document.addEventListener("mousemove", (e) => {
        window.__cmrecPos = { x: e.clientX, y: e.clientY };
        c.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`;
      }, true);
      document.addEventListener("mousedown", (e) => window.__cmrec.ripple(e.clientX, e.clientY), true);
    } else {
      const f = document.createElement("div");
      f.id = "cmrec-finger";
      document.documentElement.appendChild(f);
    }
    const cap = document.createElement("div");
    cap.id = "cmrec-caption";
    document.documentElement.appendChild(cap);
  };

  window.__cmrec = {
    ripple(x, y) {
      const r = document.createElement("div");
      r.className = "cmrec-ripple";
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      document.documentElement.appendChild(r);
      setTimeout(() => r.remove(), 700);
    },
    finger(x, y, on) {
      const f = document.getElementById("cmrec-finger");
      if (!f) return;
      f.classList.toggle("on", on);
      f.style.transform = `translate(${x}px, ${y}px) scale(${on ? 1 : 0.6})`;
    },
    caption(step, text, pos) {
      const c = document.getElementById("cmrec-caption");
      if (!c) return;
      if (!text) { c.classList.remove("on"); return; }
      c.className = `${pos || "bottom"} ${mode === "desktop" ? "desk" : ""}`;
      c.innerHTML = (step ? `<b>${step}</b>` : "") + `<span></span>`;
      c.querySelector("span").textContent = text;
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("on")));
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
}
