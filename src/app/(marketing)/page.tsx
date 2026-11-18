import { existsSync } from "node:fs";
import { join } from "node:path";
import { ArrowUpRightIcon, PlusIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { DemoLink } from "@/components/marketing/demo-link";
import { PlayerMock, VenueMock } from "@/components/marketing/flow-mocks";
import {
  FlowVideo,
  type FlowVideoSources,
} from "@/components/marketing/flow-video";
import { HeroTurnero } from "@/components/marketing/hero-turnero";
import { MarkO, MarkX, PitchLines } from "@/components/marketing/pitch";

/**
 * Los videos los entrega otra tarea en public/videos. Se resuelve en el
 * servidor qué archivos existen: si faltan, no se pide nada por red y queda
 * la maqueta de respaldo dentro del mismo marco.
 */
function videoSources(name: string): FlowVideoSources {
  const has = (ext: string) =>
    existsSync(join(process.cwd(), "public", "videos", `${name}.${ext}`));
  return {
    webm: has("webm") ? `/videos/${name}.webm` : undefined,
    mp4: has("mp4") ? `/videos/${name}.mp4` : undefined,
    poster: has("jpg") ? `/videos/${name}.jpg` : undefined,
  };
}

const TAPE = [
  "Fútbol 5",
  "Fútbol 7",
  "Fútbol 9",
  "Fútbol 11",
  "Pádel",
  "Handball",
  "Futsal",
];

const VERSUS = [
  {
    topic: "Los turnos",
    now: "Contestar “¿tenés a las 21?” mensaje por mensaje, a cualquier hora.",
    after:
      "El jugador ve qué está libre y cuánto sale, y reserva solo desde el celular. Sin cuenta y sin bajar una app.",
  },
  {
    topic: "La seña",
    now: "Buscar la captura de la transferencia entre los chats del día.",
    after:
      "El comprobante se sube dentro de la reserva. Lo abrís al lado del turno y confirmás.",
  },
  {
    topic: "La agenda",
    now: "El mismo turno prometido a dos equipos.",
    after:
      "El turno queda retenido 15 minutos mientras se completa la reserva. Dos reservas no pueden ocupar el mismo horario.",
  },
];

const PLAYER_STEPS = [
  {
    title: "Elige día y deporte",
    text: "Entra a la web de tu complejo desde el celular. No crea una cuenta.",
  },
  {
    title: "Elige horario y cancha",
    text: "En el plano de tu predio o en una lista, con el precio a la vista.",
  },
  {
    title: "Deja sus datos y el comprobante",
    text: "Efectivo, seña o transferencia. Si transfiere, adjunta el comprobante ahí mismo.",
  },
  {
    title: "Se lleva su código",
    text: "Con el estado de la reserva y un resumen listo para mandar por WhatsApp.",
  },
];

const VENUE_STEPS = [
  {
    title: "Entra como pendiente",
    text: "Las reservas nuevas aparecen primero. La lista se actualiza sola.",
  },
  {
    title: "Mirás el comprobante",
    text: "Está al lado de la reserva. Lo revisás contra tu cuenta.",
  },
  {
    title: "Confirmás o cancelás",
    text: "El jugador ve el estado actualizado con su código.",
  },
];

const BOARD = [
  {
    title: "Reservas",
    text: "Las pendientes primero, con contacto y agenda del día.",
  },
  {
    title: "Comprobantes",
    text: "Cada archivo junto a su reserva, para revisar y confirmar.",
  },
  {
    title: "Plano",
    text: "Dibujás tu predio: medidas, posición y tamaño de cada cancha.",
  },
  {
    title: "Horarios",
    text: "Horario semanal y cierres por torneo o mantenimiento.",
  },
  {
    title: "Precios",
    text: "Precio base por cancha y reglas por franja horaria o por día.",
  },
  {
    title: "Canchas",
    text: "Alta, edición y baja de las canchas de tu complejo.",
  },
];

const DOES = [
  {
    title: "Es tu web, no un marketplace.",
    text: "Tus jugadores reservan en tu página, no en una app donde también aparece el complejo de enfrente.",
  },
  {
    title: "La seña por transferencia, de punta a punta.",
    text: "El jugador ve el alias, transfiere y adjunta el comprobante. Vos lo confirmás en el panel.",
  },
  {
    title: "La cancha se elige en el plano de tu predio.",
    text: "Tus canchas dibujadas a escala, con su disponibilidad. También hay vista de lista.",
  },
  {
    title: "WhatsApp sigue en el equipo.",
    text: "La reserva termina con un mensaje armado que el jugador decide enviar. Ya llega con horario y cancha.",
  },
];

const DOES_NOT = [
  "No cobra online. Funciona con efectivo, seña o transferencia.",
  "No verifica transferencias. La reserva queda pendiente hasta que vos la confirmás.",
  "No manda mensajes automáticos. El WhatsApp lo envía el jugador.",
];

const FAQ = [
  {
    q: "Ya estoy en un marketplace de canchas. ¿Para qué quiero esto?",
    a: "Podés seguir ahí. Esto es tu propia web: el jugador que te busca a vos reserva con tu nombre, sin ver otros complejos al lado.",
  },
  {
    q: "Mis clientes reservan por WhatsApp. ¿Los pierdo?",
    a: "No. La reserva termina con un mensaje listo para WhatsApp. Lo que cambia es que ya llega con horario, cancha y comprobante.",
  },
  {
    q: "¿Y si el comprobante es falso?",
    a: "El sistema no da el pago por hecho. La reserva queda pendiente hasta que la revisás contra tu cuenta y la confirmás.",
  },
  {
    q: "No tengo tiempo de configurar nada.",
    a: "El plano, las canchas, los horarios y los precios se preparan con vos como parte de la propuesta. Después, el día a día es revisar y confirmar.",
  },
  {
    q: "¿Cuánto sale?",
    a: "Depende de cuántas canchas tenés y qué necesitás. Lo cotizamos después de ver tu complejo.",
  },
  {
    q: "¿Hay complejos que ya lo usan?",
    a: "Todavía no mostramos clientes. Lo que ves es una demo con un complejo ficticio, y la podés probar entera.",
  },
];

function TapeSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="lp-tape-set" aria-hidden={hidden || undefined}>
      {TAPE.map((item, i) => (
        <span key={item} className="contents">
          <span>{item}</span>
          {i % 2 === 0 ? <MarkX /> : <MarkO />}
        </span>
      ))}
    </div>
  );
}

function ContactLink({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={`lp-btn ${className}`}
      href={BRAND.contact}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRightIcon aria-hidden="true" />
    </a>
  );
}

export default function HomePage() {
  const playerVideo = videoSources("reserva-flujo");
  const venueVideo = videoSources("admin-flujo");

  return (
    <>
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true" />
        <PitchLines className="lp-hero-pitch" />
        <div className="lp-wrap">
          <h1 className="lp-display lp-hero-title">
            <span className="lp-line">
              <span>¿Tenés</span>
            </span>
            <span className="lp-line">
              <span className="lp-accent">a las 21?</span>
            </span>
          </h1>
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-hero-answer">Que lo responda tu web.</p>
              <p className="lp-lede">
                Cancha Manager le da a tu complejo su propia página de
                reservas. El jugador elige día, horario y cancha, y sube el
                comprobante. Vos lo revisás y confirmás desde el panel.
              </p>
              <div className="lp-actions">
                <ContactLink className="lp-btn-cone lp-btn-lg">
                  Solicitar demo
                </ContactLink>
                <DemoLink className="lp-btn-line lp-btn-lg">
                  Probar demo
                </DemoLink>
              </div>
              <p className="lp-fine">
                La demo es un complejo ficticio, con datos y precios de
                ejemplo.
              </p>
            </div>
            <div className="lp-hero-sim">
              <HeroTurnero />
            </div>
          </div>
        </div>
      </section>

      <div className="lp-tape">
        <p className="sr-only">
          Canchas del complejo de demo: {TAPE.join(", ")}.
        </p>
        <div className="lp-tape-track" aria-hidden="true">
          <TapeSet />
          <TapeSet hidden />
        </div>
      </div>

      <section id="producto" className="lp-section lp-tone-paper">
        <div className="lp-wrap">
          <div className="lp-head">
            <h2 className="lp-display lp-h2">
              <span className="lp-line">
                <span>El chat no es</span>
              </span>
              <span className="lp-line">
                <span className="lp-accent">una agenda.</span>
              </span>
            </h2>
            <p className="lp-lede">
              Los turnos, las señas y los horarios hoy viven en conversaciones.
              Cancha Manager los pone en un solo lugar, con el nombre de tu
              complejo.
            </p>
          </div>
          <div className="lp-versus">
            {VERSUS.map((row) => (
              <div className="lp-versus-row lp-reveal" key={row.topic}>
                <h3 className="lp-versus-topic">{row.topic}</h3>
                <div className="lp-versus-now">
                  <span className="lp-versus-tag">Hoy</span>
                  <p>{row.now}</p>
                </div>
                <div className="lp-versus-with">
                  <span className="lp-versus-tag">Con Cancha Manager</span>
                  <p>{row.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="flujo" className="lp-section lp-tone-night2">
        <div className="lp-wrap">
          <div className="lp-head">
            <h2 className="lp-display lp-h2">
              <span className="lp-line">
                <span>Dos pantallas.</span>
              </span>
              <span className="lp-line">
                <span className="lp-accent">Un mismo turno.</span>
              </span>
            </h2>
            <p className="lp-lede" style={{ color: "var(--lp-dim)" }}>
              Lo que el jugador reserva desde el celular es lo que vos ves en
              el panel. El recorrido completo, sin cortes.
            </p>
          </div>

          <div className="lp-flow lp-flow-player">
            <div className="lp-flow-media">
              <FlowVideo
                kind="phone"
                sources={playerVideo}
                label="Video: un jugador reserva una cancha desde el celular."
              >
                <PlayerMock />
              </FlowVideo>
              <p className="lp-device-note">
                Complejo de demostración. Datos y precios ficticios.
              </p>
            </div>
            <div>
              <p className="lp-kicker">Desde el celular</p>
              <h3 className="lp-display lp-flow-title">
                <span className="lp-line">
                  <span>Así reserva un jugador.</span>
                </span>
              </h3>
              <ol className="lp-steps">
                {PLAYER_STEPS.map((step) => (
                  <li key={step.title}>
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lp-flow lp-flow-venue">
            <div>
              <p className="lp-kicker">Desde el panel</p>
              <h3 className="lp-display lp-flow-title">
                <span className="lp-line">
                  <span>Así la confirmás vos.</span>
                </span>
              </h3>
              <ol className="lp-steps">
                {VENUE_STEPS.map((step) => (
                  <li key={step.title}>
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lp-flow-media">
              <FlowVideo
                kind="desktop"
                sources={venueVideo}
                label="Video: el complejo revisa el comprobante y confirma la reserva desde el panel."
              >
                <VenueMock />
              </FlowVideo>
              <p className="lp-device-note">
                Complejo de demostración. Datos y precios ficticios.
              </p>
            </div>
          </div>

          <div className="lp-flow-cta lp-reveal">
            <div>
              <p className="lp-display lp-flow-cta-title">
                Mejor que mirarlo: reservá una cancha.
              </p>
              <p className="lp-flow-cta-text">
                La demo está abierta. Elegí un turno en el complejo ficticio y
                completá la reserva, sin pagar nada.
              </p>
            </div>
            <DemoLink className="lp-btn-cone lp-btn-lg">Probar demo</DemoLink>
          </div>
        </div>
      </section>

      <section id="panel" className="lp-section lp-tone-turf">
        <div className="lp-wrap">
          <div className="lp-head">
            <h2 className="lp-display lp-h2">
              <span className="lp-line">
                <span>Tu complejo,</span>
              </span>
              <span className="lp-line">
                <span className="lp-accent">en el pizarrón.</span>
              </span>
            </h2>
            <p className="lp-lede">
              Un panel privado para manejar el día: qué entró, qué falta
              confirmar, cuándo abrís y cuánto sale cada turno.
            </p>
          </div>
          <div className="lp-board lp-reveal">
            {BOARD.map((zone, i) => (
              <article className="lp-board-zone" key={zone.title}>
                {i % 2 === 0 ? (
                  <MarkO className="lp-board-mark" />
                ) : (
                  <MarkX className="lp-board-mark" />
                )}
                <div>
                  <h3 className="lp-display">{zone.title}</h3>
                  <p className="mt-2">{zone.text}</p>
                </div>
              </article>
            ))}
            <span className="lp-board-circle" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="lp-section lp-tone-paper">
        <div className="lp-wrap">
          <div className="lp-head">
            <h2 className="lp-display lp-h2">
              <span className="lp-line">
                <span>Tu complejo</span>
              </span>
              <span className="lp-line">
                <span className="lp-accent">juega de local.</span>
              </span>
            </h2>
            <p className="lp-lede">
              Qué hace distinto Cancha Manager y, para que no haya sorpresas,
              qué no hace todavía.
            </p>
          </div>
          <div className="lp-ledger">
            <div className="lp-ledger-yes">
              <h3 className="lp-display">Lo que hace</h3>
              <ul>
                {DOES.map((item) => (
                  <li key={item.title}>
                    <MarkO />
                    <span>
                      <strong className="block font-bold">{item.title}</strong>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-ledger-no">
              <h3 className="lp-display">Lo que no hace hoy</h3>
              <ul>
                {DOES_NOT.map((item) => (
                  <li key={item}>
                    <MarkX />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="preguntas" className="lp-section">
        <div className="lp-wrap lp-faq">
          <div>
            <h2 className="lp-display lp-h2">
              <span className="lp-line">
                <span>Antes del</span>
              </span>
              <span className="lp-line">
                <span className="lp-accent">pitazo.</span>
              </span>
            </h2>
            <p className="lp-lede mt-5" style={{ color: "var(--lp-dim)" }}>
              Lo que nos preguntan los dueños de complejos cuando ven la demo.
            </p>
          </div>
          <div>
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <PlusIcon aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-closing">
        <span className="lp-closing-circle" aria-hidden="true" />
        <div className="lp-wrap">
          <h2 className="lp-display">
            <span className="lp-line">
              <span>¿Armamos</span>
            </span>
            <span className="lp-line">
              <span className="lp-accent">el tuyo?</span>
            </span>
          </h2>
          <p className="lp-lede">
            Contanos cuántas canchas tenés y cómo manejás hoy las reservas.
            Preparamos una propuesta para tu complejo.
          </p>
          <div className="lp-actions">
            <ContactLink className="lp-btn-cone lp-btn-lg">
              Solicitar demo por WhatsApp
            </ContactLink>
            <DemoLink className="lp-btn-line lp-btn-lg">Probar demo</DemoLink>
          </div>
        </div>
      </section>
    </>
  );
}
