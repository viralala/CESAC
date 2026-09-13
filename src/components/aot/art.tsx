/**
 * Original artwork only — flat vector, no copyrighted characters or frames.
 * Drawn to sit on the cream washi ground as the boards' character graphics do.
 */

/** "Wings of Prompt" — an original two-tone fanned-blade crest. */
export function Emblem({ className = "" }: { className?: string }) {
  const blades = [
    "M59,46 L17,13 L13,22 L52,51 Z",
    "M59,46 L21,26 L19,35 L54,54 Z",
    "M59,46 L27,38 L27,46 L56,56 Z",
    "M59,46 L33,50 L35,57 L57,59 Z",
  ];

  return (
    <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
      <g fill="currentColor">
        {blades.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="var(--red)" transform="translate(120,0) scale(-1,1)">
        {blades.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d="M60,24 L67,45 L60,66 L53,45 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The Token Titan — the character graphic that the giant headline runs behind,
 * the way the Reika board layers its subject over the display word.
 */
export function TitanFigure({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const teeth = Array.from({ length: 10 }, (_, i) => 110 + i * 9.2);
  const steam = [
    { x: 52, d: "0s", h: 118 },
    { x: 100, d: "1.1s", h: 168 },
    { x: 150, d: "2.3s", h: 94 },
    { x: 200, d: "0.6s", h: 146 },
    { x: 244, d: "1.8s", h: 108 },
  ];

  // Cream stroke on every part, so the figure stays cut out against the
  // display word behind it and the limbs read separately from the torso.
  const cut = {
    fill: "currentColor",
    stroke: "var(--cream)",
    strokeWidth: 9,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 300 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="titan-steam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <g fill="url(#titan-steam)" opacity="0.18">
        {steam.map((s) => (
          <rect
            key={s.x}
            className="animate-steam"
            x={s.x}
            y={330 - s.h}
            width="7"
            height={s.h}
            rx="3.5"
            style={{ animationDelay: s.d }}
          />
        ))}
      </g>

      {/* arms, hanging outside the torso */}
      <path d="M40,228 L14,274 L5,342 L3,400 L41,400 L43,338 L54,280 Z" {...cut} />
      <path d="M260,228 L286,274 L295,342 L297,400 L259,400 L257,338 L246,280 Z" {...cut} />

      {/* torso — heavy shoulders tapering down */}
      <path d="M114,170 L74,186 L36,224 L24,288 L28,400 L272,400 L276,288 L264,224 L226,186 L186,170 Z" {...cut} />

      {/* skull */}
      <path
        d="M150,8 C110,8 86,42 86,88 C86,116 97,138 113,152 L113,168 L187,168
           L187,152 C203,138 214,116 214,88 C214,42 190,8 150,8 Z"
        {...cut}
      />

      {/* the grin */}
      <rect x="102" y="112" width="96" height="32" rx="9" fill="var(--cream)" />
      <g stroke="currentColor" strokeWidth="3.4">
        {teeth.map((x) => (
          <line key={x} x1={x} y1="112" x2={x} y2="144" />
        ))}
        <line x1="102" y1="128" x2="198" y2="128" strokeWidth="2.4" opacity="0.55" />
      </g>

      {/* eye slits, set deep under the brow */}
      <g fill="var(--red)">
        <rect x="99" y="68" width="28" height="10" rx="5" />
        <rect x="173" y="68" width="28" height="10" rx="5" />
      </g>

      {/* exposed musculature, drawn in the ground colour */}
      <g stroke="var(--cream)" strokeLinecap="round" fill="none">
        <path d="M150,214 L150,392" strokeWidth="4" opacity="0.5" />
        <path d="M62,258 Q106,276 148,264" strokeWidth="4.5" opacity="0.6" />
        <path d="M238,258 Q194,276 152,264" strokeWidth="4.5" opacity="0.6" />
        <path d="M78,314 Q150,330 222,314" strokeWidth="3.6" opacity="0.4" />
        <path d="M30,286 Q46,300 52,322" strokeWidth="3.4" opacity="0.4" />
        <path d="M270,286 Q254,300 248,322" strokeWidth="3.4" opacity="0.4" />
      </g>
    </svg>
  );
}

/** Stone course wall — used behind the three-walls panel. */
export function WallBand({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`} aria-hidden="true">
      <span className="h-[9px] w-full shrink-0 rounded-full bg-current opacity-90" />
      <span className="h-[6px] w-full shrink-0" />
      <span
        className="w-full flex-1 bg-current opacity-80"
        style={{
          maskImage:
            "repeating-linear-gradient(90deg, #000 0 56px, transparent 56px 58px), repeating-linear-gradient(0deg, #000 0 50px, transparent 50px 52px)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "repeating-linear-gradient(90deg, #000 0 56px, transparent 56px 58px), repeating-linear-gradient(0deg, #000 0 50px, transparent 50px 52px)",
          WebkitMaskComposite: "source-in",
        }}
      />
    </div>
  );
}

/** Yonika's gradient strip, used to close a dark panel. */
export function GradientStrip({ className = "" }: { className?: string }) {
  const swatches = [
    "#e51f2c",
    "#8e1a2e",
    "#3b2340",
    "#12656f",
    "#17808c",
    "#c9a227",
    "#e07a4a",
    "#7b2e3c",
    "#1d3b52",
    "#e51f2c",
    "#2a2233",
    "#12656f",
  ];
  return (
    <div className={`flex w-full ${className}`} aria-hidden="true">
      {swatches.map((c, i) => (
        <span
          key={i}
          className="h-full flex-1"
          style={{ background: `linear-gradient(to top, ${c} 0%, transparent 100%)` }}
        />
      ))}
    </div>
  );
}
