"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

export type FlowVideoSources = {
  webm?: string;
  mp4?: string;
  poster?: string;
};

/**
 * Video de un recorrido dentro de un marco de dispositivo.
 * - `children` es la maqueta de respaldo: se ve mientras el video no existe,
 *   no cargó o falló, así el layout nunca queda vacío ni salta.
 * - Nada se descarga hasta que el marco se acerca a la pantalla
 *   (preload="none" + poster diferido). Se reproduce solo cuando está visible
 *   y se pausa al salir. Con movimiento reducido no arranca solo.
 */
export function FlowVideo({
  kind,
  sources,
  label,
  children,
}: {
  kind: "phone" | "desktop";
  sources: FlowVideoSources;
  label: string;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const [skipWebm, setSkipWebm] = useState(false);
  const [playing, setPlaying] = useState(false);

  const webm = skipWebm ? undefined : sources.webm;
  const hasVideo = Boolean(webm || sources.mp4) && !failed;

  // Si el WebM no se puede decodificar en este navegador, se reintenta con
  // el MP4 antes de caer a la maqueta de respaldo.
  function handleVideoError() {
    const current = video.current?.currentSrc ?? "";
    if (!skipWebm && sources.mp4 && current.endsWith(".webm")) {
      setSkipWebm(true);
    } else {
      setFailed(true);
    }
  }

  useEffect(() => {
    const el = frame.current;
    if (!el || !hasVideo) return;
    const nearIo = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          nearIo.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    nearIo.observe(el);
    return () => nearIo.disconnect();
  }, [hasVideo]);

  useEffect(() => {
    const el = frame.current;
    if (!el || !near || !hasVideo) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = video.current;
        if (!v) return;
        if (entry.isIntersecting) {
          if (!reduced && !userPaused.current) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, hasVideo, reduced, skipWebm]);

  function toggle() {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  }

  return (
    <div ref={frame} className={`lp-device lp-device-${kind}`}>
      {children}
      {hasVideo && near ? (
        <>
          <video
            key={skipWebm ? "mp4" : "auto"}
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster={sources.poster}
            aria-label={label}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={handleVideoError}
          >
            {webm ? (
              <source src={webm} type="video/webm" />
            ) : null}
            {sources.mp4 ? (
              <source
                src={sources.mp4}
                type="video/mp4"
                onError={() => setFailed(true)}
              />
            ) : null}
          </video>
          <button
            type="button"
            className="lp-device-toggle"
            onClick={toggle}
            aria-label={playing ? "Pausar el video" : "Reproducir el video"}
          >
            {playing ? (
              <PauseIcon aria-hidden="true" />
            ) : (
              <PlayIcon aria-hidden="true" />
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}
