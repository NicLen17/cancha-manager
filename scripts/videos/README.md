# Videos de flujo para la landing

Graba dos videos cortos, sin audio y en loop, del producto real en modo mock:

| Archivo (en `public/videos/`) | Qué muestra | Formato |
|---|---|---|
| `reserva-flujo.mp4` / `.webm` / `.jpg` | El jugador reserva desde el celular: día, deporte, horario, cancha en el plano, datos, comprobante y código | 720×1280 (9:16) |
| `admin-flujo.mp4` / `.webm` / `.jpg` | El complejo en desktop: reserva pendiente, comprobante, confirmación y un vistazo a mapa, horarios y precios | 1440×900 (16:10) |

Los nombres son un contrato con la landing. No los cambies.

## Cómo funciona

- **Playwright** maneja el navegador y **CDP `Page.startScreencast`** captura cada cuadro como JPEG a resolución x2 (x1,5 en desktop). La grabación sale mucho más nítida que con `recordVideo`.
- La grabación usa un reloj virtual: se pausa mientras navega o carga, así no aparecen pantallas en blanco (`lib/cast.mjs`).
- En cada página se inyecta una capa visual (`lib/overlay.mjs`): toque con onda en mobile, cursor en desktop y rótulos de paso. También oculta el indicador de Next en dev. No se toca el código de la app.
- `lib/encode.mjs` arma la secuencia a 30 fps con ffmpeg. Funde el final con el primer cuadro para que el loop no tenga corte y exporta H.264 (`+faststart`), VP9 y el póster.
- Antes de grabar, el script restablece la demo (Configuración → Restablecer demo) y carga dos reservas de contexto fuera de cámara.
- Todos los datos son ficticios. El comprobante es una imagen generada que dice "Comprobante de ejemplo · datos ficticios" (`lib/receipt.mjs`).

Sobre el comprobante en mock: en modo mock no hay Storage. La app valida el archivo pero no lo guarda, y `/admin/comprobantes/[id]` responde 404. Para la toma del admin, el script intercepta solo esa ruta y sirve el mismo archivo que subió el jugador, que es lo que haría Supabase Storage en producción.

## Regenerar

Requisitos: Node 22+, ffmpeg en el `PATH` (o la variable `FFMPEG`) y un Chromium para Playwright.

```bash
cd scripts/videos
npm install
npx playwright install chromium
```

Si ya tenés otro Chromium de Playwright instalado, pasalo con `CHROME_PATH=.../chrome.exe` y no hace falta descargarlo.

1. Levantá la app en modo mock, con su propio directorio de build, desde la raíz del repo:

```bash
NEXT_DIST_DIR=.next-videos DATA_ADAPTER=mock ADMIN_PASSCODE=una-clave-de-prueba-larga TZ=America/Argentina/Tucuman npx next dev -p 3103
```

2. Grabá, en otra terminal:

```bash
cd scripts/videos
ADMIN_PASSCODE=una-clave-de-prueba-larga node record.mjs all
```

- `node record.mjs reserva` graba solo el video del jugador.
- `node record.mjs admin` graba solo el del admin. Necesita `RESERVA_CODE` con el código de una reserva pendiente con comprobante.
- `SHOTS=1` guarda capturas de control en `out/shots/`.
- `BASE_URL` cambia el servidor (por defecto `http://localhost:3103`).

Los archivos intermedios (cuadros, masters, capturas) quedan en `out/` y están ignorados por Git.

Atención: `next dev` con `NEXT_DIST_DIR` agrega `.next-videos/...` al `include` de `tsconfig.json`. No lo commitees. Restauralo con `git show HEAD:tsconfig.json > tsconfig.json`.

## Revisar

```bash
ffmpeg -i ../../public/videos/reserva-flujo.mp4 -vf fps=1 out/check/r_%02d.png
```

Mirá los cuadros antes de publicar: que no haya datos rotos, pantallas en blanco ni cortes bruscos.
