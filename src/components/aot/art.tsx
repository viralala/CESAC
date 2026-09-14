/**
 * Original artwork only, and nothing figurative.
 *
 * There are no characters anywhere in this file, and none anywhere on the
 * site: no likeness, no silhouette of a person, no licensed or third-party
 * asset. Marks here are crests, masonry and colour. Keep it that way.
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
      <g fill="var(--lime)" transform="translate(120,0) scale(-1,1)">
        {blades.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d="M60,24 L67,45 L60,66 L53,45 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The Wall — an original geometric mark, and there is no figure in it.
 *
 * It stands in for the character graphic that used to sit behind the display
 * word. Masonry and a gate: the motif the event copy already leans on ("this
 * wall has no gate"), drawn as architecture rather than as a body.
 *
 * Two rules keep it from reading as clip art. The bricks are deliberately few
 * and large, so at any size it reads as a graphic device rather than as a
 * texture of tiny rectangles. And every joint is cream, the page's own ground,
 * so the courses separate by paper rather than by a drawn line.
 */
export function WallMark({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  // Odd rows step half a brick, the way a real bond is laid, so the joints
  // never stack into a vertical seam down the middle of the mark.
  const COURSE_H = 46;
  const BRICK_W = 104;
  const courses = Array.from({ length: 6 }, (_, row) => {
    const y = 124 + row * COURSE_H;
    const offset = row % 2 === 0 ? 0 : -BRICK_W / 2;
    return Array.from({ length: 6 }, (_, i) => ({ x: offset + i * BRICK_W - 60, y }));
  }).flat();

  // Light coming up through the gate, so the mark is never completely static
  // behind the type. The old graphic carried an `animate-steam` class that no
  // keyframe ever defined, so it did nothing at all; this is a real animation,
  // and reduced motion switches it off.
  const shafts = [
    { x: 128, d: "0s", h: 104 },
    { x: 152, d: "1.4s", h: 142 },
    { x: 176, d: "2.6s", h: 88 },
  ];

  return (
    <svg viewBox="0 0 320 400" className={className} style={style} aria-hidden="true">
      <defs>
        {/* the arch: everything under this mask is wall, the hole is the gate */}
        <mask id="wall-gate">
          <rect x="0" y="0" width="320" height="400" fill="white" />
          <path d="M112 400 L112 252 A48 48 0 0 1 208 252 L208 400 Z" fill="black" />
        </mask>
        <linearGradient id="wall-shaft" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g mask="url(#wall-gate)" fill="currentColor" stroke="var(--cream)" strokeWidth="7">
        {courses.map((b) => (
          <rect key={`${b.x}-${b.y}`} x={b.x} y={b.y} width={BRICK_W} height={COURSE_H} rx="5" />
        ))}

        {/* the coping course, wider than the wall and set proud of it */}
        <rect x="-18" y="92" width="356" height="34" rx="7" />
      </g>

      {/* the arch ring, drawn over the masked edge so the cut reads as built */}
      <path
        d="M112 400 L112 252 A48 48 0 0 1 208 252 L208 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="square"
      />

      <g fill="url(#wall-shaft)">
        {shafts.map((s) => (
          <rect
            key={s.x}
            className="animate-shaft"
            x={s.x}
            y={400 - s.h}
            width="11"
            height={s.h}
            rx="5.5"
            style={{ animationDelay: s.d }}
          />
        ))}
      </g>
    </svg>
  );
}

/** Yonika's gradient strip, used to close a dark panel. */
export function GradientStrip({ className = "" }: { className?: string }) {
  const swatches = [
    "#12656f",
    "#2fc4dd",
    "#6a2ff0",
    "#c6f733",
    "#ff3d8f",
    "#17808c",
    "#2b4cf0",
    "#c6f733",
    "#e83b2a",
    "#2fc4dd",
    "#6a2ff0",
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
