// Genera un comprobante de transferencia de ejemplo (PNG) con datos ficticios.
export async function makeReceipt(browser, file, { amount, payer, alias, holder }) {
  const page = await browser.newPage({ viewport: { width: 420, height: 640 }, deviceScaleFactor: 2 });
  const now = new Date();
  const fecha = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Tucuman", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(now);
  await page.setContent(`<!doctype html><html><body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#eef2f7">
  <div style="margin:22px;background:#fff;border-radius:18px;padding:26px 24px;box-shadow:0 6px 22px rgba(15,23,42,.12)">
    <div style="display:flex;align-items:center;gap:10px;color:#1e3a8a;font-weight:700;font-size:15px">
      <div style="width:30px;height:30px;border-radius:9px;background:#1e40af"></div> Banco de ejemplo
    </div>
    <div style="margin-top:26px;width:54px;height:54px;border-radius:99px;background:#dcfce7;display:grid;place-items:center;color:#16a34a;font-size:30px;font-weight:700">✓</div>
    <div style="margin-top:14px;font-size:20px;font-weight:700;color:#0f172a">Transferencia enviada</div>
    <div style="margin-top:6px;font-size:34px;font-weight:800;color:#0f172a">${amount}</div>
    <div style="margin-top:4px;color:#64748b;font-size:14px">${fecha} hs</div>
    <div style="margin-top:22px;border-top:1px dashed #cbd5e1"></div>
    ${[["Para", holder], ["Alias", alias], ["De", payer], ["Concepto", "Varios"], ["N.º de operación", "000482193"]]
      .map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:14px"><span style="color:#64748b">${k}</span><span style="color:#0f172a;font-weight:600;text-align:right">${v}</span></div>`).join("")}
    <div style="margin-top:22px;padding:10px;border-radius:10px;background:#fef9c3;color:#854d0e;font-size:12px;text-align:center">Comprobante de ejemplo · datos ficticios</div>
  </div></body></html>`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}
