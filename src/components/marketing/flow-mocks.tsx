import { MiniPitch } from "./pitch";

/**
 * Maquetas estáticas de respaldo para los marcos de video. Representan las
 * pantallas reales (/reservar y /admin/reservas) con datos de ejemplo.
 */

export function PlayerMock() {
  return (
    <div
      className="lp-mock"
      role="img"
      aria-label="Vista de ejemplo de la reserva desde el celular: fecha, deporte, horarios disponibles y cancha elegida."
    >
      <div aria-hidden="true" className="contents">
        <div className="lp-mock-bar">
          <span>Reservar cancha</span>
          <span className="lp-mono">1 de 2</span>
        </div>
        <div className="lp-mock-body">
          <span className="lp-mock-label">Fecha</span>
          <div className="lp-mock-chips">
            <span className="lp-mock-chip" data-on="">
              Hoy
            </span>
            <span className="lp-mock-chip">Mañana</span>
            <span className="lp-mock-chip">Sábado</span>
          </div>
          <span className="lp-mock-label">Deporte</span>
          <div className="lp-mock-chips">
            <span className="lp-mock-chip" data-on="">
              Fútbol 5
            </span>
            <span className="lp-mock-chip">Fútbol 7</span>
            <span className="lp-mock-chip">Pádel</span>
          </div>
          <span className="lp-mock-label">Horario</span>
          <div className="lp-mock-hours lp-mono">
            <span data-off="">19:00</span>
            <span>20:00</span>
            <span data-on="">21:00</span>
            <span>22:00</span>
            <span data-off="">23:00</span>
            <span>00:00</span>
          </div>
          <div className="lp-mock-court">
            <MiniPitch />
            <span>Cancha 2</span>
          </div>
          <div className="lp-mock-cta">Continuar con las 21:00</div>
        </div>
      </div>
    </div>
  );
}

const ROWS = [
  { code: "CM-4F2K", who: "Equipo de los jueves", slot: "Hoy 21:00, C2", k: "pend" },
  { code: "CM-9QX1", who: "Reserva de pádel", slot: "Hoy 20:00, P1", k: "ok" },
  { code: "CM-7M3D", who: "Fútbol 7", slot: "Mañana 19:00", k: "ok" },
  { code: "CM-2BV8", who: "Fútbol 5", slot: "Mañana 22:00, C1", k: "pend" },
] as const;

export function VenueMock() {
  return (
    <div
      className="lp-mock"
      role="img"
      aria-label="Vista de ejemplo del panel de administración: lista de reservas con su estado y la acción para revisar el comprobante y confirmar."
    >
      <div aria-hidden="true" className="contents">
        <div className="lp-mock-bar">
          <span>Administración</span>
          <span>Datos de ejemplo</span>
        </div>
        <div className="lp-mock-split">
          <div className="lp-mock-side">
            <span>Dashboard</span>
            <span>Mapa</span>
            <span>Canchas</span>
            <span data-on="">Reservas</span>
            <span>Horarios</span>
            <span>Precios</span>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-table">
              <div className="lp-mock-tr" data-head="">
                <span>Código</span>
                <span>Reserva</span>
                <span>Turno</span>
                <span>Estado</span>
                <span />
              </div>
              {ROWS.map((r) => (
                <div className="lp-mock-tr" key={r.code}>
                  <span className="lp-mono">{r.code}</span>
                  <span>{r.who}</span>
                  <span>{r.slot}</span>
                  <span className="lp-mock-pill" data-k={r.k}>
                    {r.k === "pend" ? "Pendiente" : "Confirmada"}
                  </span>
                  {r.k === "pend" ? (
                    <span className="lp-mock-act">Ver comprobante</span>
                  ) : (
                    <span className="lp-mock-act" data-ghost="">
                      Ver detalle
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
