/**
 * The sticker kit.
 *
 * The reference board says everything twice: once in a word, once in a shape.
 * A fact worth reading is a badge — a starburst, a blob, a torn ribbon, a leaf,
 * a scallop, an octagon — pinned at a tilt around the headline in a colour that
 * is not the brand teal. That is the whole "make it colourful" brief: the pops
 * live here and nowhere structural.
 *
 * Shapes come from clip-path in globals.css, so the label inside stays real,
 * selectable, screen-readable text rather than baked-in artwork.
 */

type Shape = "burst" | "blob" | "leaf" | "ribbon" | "scallop" | "octo";
type Pop = "lime" | "pink" | "violet" | "blue" | "azure" | "red" | "white" | "ink";

/** Foreground picked per pop so every badge clears contrast without thinking. */
const POP: Record<Pop, { bg: string; fg: string }> = {
  lime: { bg: "var(--lime)", fg: "var(--ink)" },
  pink: { bg: "var(--pink)", fg: "var(--white)" },
  violet: { bg: "var(--violet)", fg: "var(--white)" },
  blue: { bg: "var(--blue)", fg: "var(--white)" },
  azure: { bg: "var(--azure)", fg: "var(--ink)" },
  red: { bg: "var(--red)", fg: "var(--white)" },
  white: { bg: "var(--white)", fg: "var(--ink)" },
  ink: { bg: "var(--ink)", fg: "var(--cream)" },
};

export function Sticker({
  shape = "blob",
  pop = "lime",
  rotate = 0,
  float = 0,
  size,
  className = "",
  children,
}: {
  shape?: Shape;
  pop?: Pop;
  /** Authored tilt, in degrees. The float keyframe bobs around it. */
  rotate?: number;
  /** Animation delay in seconds, so a cluster never bobs in lockstep. */
  float?: number;
  /** Width for the round shapes, which are square by aspect-ratio. */
  size?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { bg, fg } = POP[pop];

  return (
    <span
      className={`sticker st-${shape} animate-float ${className}`}
      style={
        {
          "--st": bg,
          "--st-fg": fg,
          "--st-rot": `${rotate}deg`,
          transform: `rotate(${rotate}deg)`,
          animationDelay: `${float}s`,
          width: size,
          boxShadow: shape === "blob" || shape === "leaf" ? "var(--sh-1)" : undefined,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

/**
 * The lime thread. One continuous stroke that loops through the headline,
 * the gesture that ties the reference board together.
 *
 * It carried node dots at each inflection until those were pulled: a dot on a
 * line reads as a control point, which makes decoration look like a diagram.
 * The stroke alone does the job.
 *
 * It is decorative and sits at z-0, under the type and over the ground, so the
 * headline still reads while the line appears to pass behind and around it.
 */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 760"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M-40 522
           C 160 430, 240 320, 372 344
           S 520 530, 618 560
           S 800 460, 876 398
           S 1080 430, 1260 340"
        stroke="var(--lime)"
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The pen-nib mark from the board — a small outlined glyph dropped near the
 * squiggle so the line reads as something that was drawn, not generated.
 */
export function Nib({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M8 40 L16 32 M14 34 L30 8 a6 6 0 0 1 10 6 L24 40 Z M28 14 L34 20"
        stroke="var(--lime)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The board's cursor tag — an arrow with a label riding beside it. */
export function CursorTag({
  label,
  pop = "lime",
  className = "",
}: {
  label: string;
  pop?: Pop;
  className?: string;
}) {
  const { bg, fg } = POP[pop];

  return (
    <span className={`pointer-events-none flex items-start gap-1 ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill={bg}>
        <path d="M4 2 L20 12 L12 13.5 L9 21 Z" />
      </svg>
      <span
        className="label-sm rounded-full px-3 py-1.5"
        style={{ background: bg, color: fg }}
      >
        {label}
      </span>
    </span>
  );
}
