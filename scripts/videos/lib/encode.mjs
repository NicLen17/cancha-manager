// Arma el video con ffmpeg: cuadros CDP -> master 30 fps -> loop limpio
// (fundido final hacia el primer cuadro) -> MP4 H.264 + WebM VP9 + póster JPG.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 30;

function ff(args) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg falló: ${args.join(" ")}`);
}

export async function encode({ cast, name, width, height, out, publicDir, posterAt, crf = { h264: 24, vp9: 36 } }) {
  const list = path.join(out, `${name}.concat.txt`);
  const dur = cast.writeConcat(list);
  const raw = path.join(out, `${name}.raw.mp4`);
  const master = path.join(out, `${name}.master.mp4`);
  const fit = `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0b2a1c,setsar=1`;

  // 1) Cuadros con duración variable -> 30 fps constantes, casi sin pérdida.
  ff(["-f", "concat", "-safe", "0", "-i", list, "-vf", `${fit},fps=${FPS},format=yuv420p`, "-c:v", "libx264", "-preset", "fast", "-crf", "8", raw]);

  // 2) Loop limpio: el final se funde con el primer cuadro.
  const xf = 0.6;
  const hold = 0.8;
  const filter = [
    `[0:v]split[a][b]`,
    `[b]trim=end_frame=1,loop=loop=${Math.round(hold * FPS) - 1}:size=1:start=0,setpts=N/${FPS}/TB,fps=${FPS}[s]`,
    `[a]fps=${FPS},settb=1/${FPS}[m]`,
    `[m][s]xfade=transition=fade:duration=${xf}:offset=${(dur - xf).toFixed(3)},format=yuv420p[v]`,
  ].join(";");
  ff(["-i", raw, "-filter_complex", filter, "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "8", master]);

  const mp4 = path.join(publicDir, `${name}.mp4`);
  const webm = path.join(publicDir, `${name}.webm`);
  const jpg = path.join(publicDir, `${name}.jpg`);

  // 3) Entregables optimizados para web, sin audio.
  ff(["-i", master, "-an", "-c:v", "libx264", "-preset", "veryslow", "-tune", "animation", "-crf", String(crf.h264),
    "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", String(FPS * 4), "-movflags", "+faststart", mp4]);
  ff(["-i", master, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf.vp9), "-row-mt", "1",
    "-deadline", "good", "-cpu-used", "1", "-g", String(FPS * 4), "-pix_fmt", "yuv420p", webm]);
  ff(["-ss", String(posterAt ?? 1), "-i", master, "-frames:v", "1", "-q:v", "3", jpg]);

  const size = (f) => `${(fs.statSync(f).size / 1024 / 1024).toFixed(2)} MB`;
  console.log(`${name}: ${(dur - xf + hold).toFixed(1)} s · ${width}x${height} · mp4 ${size(mp4)} · webm ${size(webm)} · jpg ${size(jpg)}`);
}
