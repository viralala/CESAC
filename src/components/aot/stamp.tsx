/**
 * Rotating circular seal — the spinning badge device from the Crypko reference,
 * redrawn in the deck's ink/gold.
 */
export function Stamp({
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
      <svg viewBox="0 0 200 200" className="animate-stamp h-full w-full">
        <defs>
          <path id="stamp-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text
          fill="currentColor"
          style={{
            fontFamily: "var(--font-mono-jb), ui-monospace, monospace",
            fontSize: "12.5px",
            letterSpacing: "3.1px",
            textTransform: "uppercase",
          }}
        >
          <textPath href="#stamp-ring" startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>

      <span className="pointer-events-none absolute inset-[22%] grid place-items-center rounded-full border-2 border-current">
        <span className="display-tight text-center text-[0.65rem] leading-[1.15] tracking-[0.16em]">
          {center ?? (
            <>
              Enlist
              <br />
              Now
            </>
          )}
        </span>
      </span>
    </div>
  );
}
