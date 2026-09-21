/**
 * Rotating circular seal — the Crypko board's spinning badge, with its
 * starred inner medallion.
 */
export function Seal({
  text = "CESAC · VIT PUNE · ATTACK ON TOKEN · PROMPT ENGINEERING · ",
  center,
  className = "",
}: {
  text?: string;
  center?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="animate-seal h-full w-full">
        <defs>
          <path id="seal-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text
          fill="currentColor"
          style={{
            fontFamily: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "2.6px",
          }}
        >
          <textPath href="#seal-ring" startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>

      {/* scalloped medallion */}
      <span className="pointer-events-none absolute inset-[24%] grid place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <path
            d={scallop(50, 50, 48, 44, 22)}
            fill="currentColor"
            opacity="0.14"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <span className="label-sm relative text-center leading-[1.25]">
          {center ?? (
            <>
              Register
              <br />
              Now
            </>
          )}
        </span>
      </span>
    </div>
  );
}

/** Builds the scalloped badge outline used on the Crypko seal. */
function scallop(cx: number, cy: number, outer: number, inner: number, points: number) {
  const step = (Math.PI * 2) / (points * 2);
  const d: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `${d.join(" ")} Z`;
}
