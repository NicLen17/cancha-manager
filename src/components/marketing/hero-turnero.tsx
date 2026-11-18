"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon } from "lucide-react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const HOURS = ["19:00", "20:00", "21:00", "22:00", "23:00"];
const COURTS = [
  { name: "Cancha 1", taken: [0, 1, 3] },
  { name: "Cancha 2", taken: [1] },
];
const TARGET = { court: 1, hour: 2 };

const STEPS = [
  { text: "Elige las 21:00 en la cancha 2", who: "Jugador" },
  { text: "El turno queda retenido 15 minutos", who: "Jugador" },
  { text: "Reserva pendiente, con comprobante", who: "Jugador" },
  { text: "Revisás el comprobante y confirmás", who: "Complejo" },
];
const LAST = STEPS.length - 1;
const STEP_MS = 2100;
const HOLD_MS = 3600;

/** El turno de las 21 recorriendo el sistema, en loop. Datos de ejemplo. */
export function HeroTurnero() {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = reduced ? LAST : tick % STEPS.length;

  useEffect(() => {
    if (reduced || !visible) return;
    const id = window.setTimeout(
      () => setTick((t) => t + 1),
      step === LAST ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [reduced, visible, step, tick]);

  return (
    <div
      ref={root}
      className="lp-turnero"
      role="img"
      aria-label="Ejemplo: un jugador elige el turno de las 21 en la cancha 2, el turno queda retenido, la reserva entra como pendiente con su comprobante y el complejo la confirma desde el panel."
    >
      <div aria-hidden="true">
        <div className="lp-turnero-top">
          <span>Hoy, fútbol 5</span>
          <span>Datos de ejemplo</span>
        </div>
        <div className="lp-turnero-grid">
          <span />
          {HOURS.map((h) => (
            <span key={h} className="lp-th lp-mono">
              {h}
            </span>
          ))}
          {COURTS.map((court, ci) => (
            <Row key={court.name} court={court} ci={ci} step={step} />
          ))}
        </div>
        <ol className="lp-turnero-steps">
          {STEPS.map((s, i) => (
            <li
              key={s.text}
              data-state={i === step ? "on" : i < step ? "done" : "todo"}
            >
              <span className="lp-dot" />
              <span>{s.text}</span>
              <span className="lp-who">{s.who}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Row({
  court,
  ci,
  step,
}: {
  court: (typeof COURTS)[number];
  ci: number;
  step: number;
}) {
  return (
    <>
      <span className="lp-rowh">{court.name}</span>
      {HOURS.map((h, hi) => {
        const isTarget = ci === TARGET.court && hi === TARGET.hour;
        if (!isTarget) {
          return (
            <span
              key={h}
              className="lp-slot"
              data-s={court.taken.includes(hi) ? "taken" : "free"}
            />
          );
        }
        return (
          <span key={h} className="lp-slot">
            <span className="lp-slot-layer lp-slot-pick" data-on={step === 0}>
              21
            </span>
            <span
              className="lp-slot-layer lp-slot-pick lp-mono"
              data-on={step === 1}
            >
              15:00
            </span>
            <span className="lp-slot-layer lp-slot-pend" data-on={step === 2}>
              <ClockIcon />
            </span>
            <span className="lp-slot-layer lp-slot-ok" data-on={step === 3}>
              <CheckIcon strokeWidth={3} />
            </span>
          </span>
        );
      })}
    </>
  );
}
