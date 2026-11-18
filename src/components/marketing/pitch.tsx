/** Dibujos de cancha y marcas de pizarrón. Decorativos: siempre aria-hidden. */

export function PitchLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 760"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
      className={className}
    >
      <rect x="10" y="10" width="1180" height="740" />
      <path d="M600 10v740" />
      <circle cx="600" cy="380" r="110" />
      <circle cx="600" cy="380" r="5" fill="currentColor" />
      <path d="M10 170h190v420H10M10 280h70v200H10" />
      <path d="M200 300a110 110 0 0 1 0 160" />
      <path d="M1190 170h-190v420h190M1190 280h-70v200h70" />
      <path d="M1000 300a110 110 0 0 0 0 160" />
      <path d="M10 40a30 30 0 0 0 30-30M1160 10a30 30 0 0 0 30 30M10 720a30 30 0 0 1 30 30M1160 750a30 30 0 0 1 30-30" />
    </svg>
  );
}

export function MiniPitch() {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <rect x="1" y="1" width="198" height="118" />
      <path d="M100 1v118M1 35h28v50H1M199 35h-28v50h28" />
      <circle cx="100" cy="60" r="18" />
    </svg>
  );
}

/** "X" de pizarrón táctico. */
export function MarkX({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

/** "O" de pizarrón táctico. */
export function MarkO({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
