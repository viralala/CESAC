import type { HRPop } from "@/lib/data/hr-final-boss";

/**
 * The blue-and-white equivalent of the AoT sticker kit: a floating badge, but
 * a rounded chip rather than a burst or a scallop, since this page's shape
 * language is a game HUD, not an anime sticker sheet.
 */
const POP: Record<HRPop, { bg: string; fg: string; border: string }> = {
  azure: { bg: "var(--hb-azure)", fg: "#ffffff", border: "var(--hb-azure-deep)" },
  maya: { bg: "var(--hb-maya)", fg: "var(--hb-ink)", border: "var(--hb-azure)" },
  ink: { bg: "var(--hb-ink)", fg: "var(--hb-ghost)", border: "var(--hb-ink-2)" },
};

export function Chip({
  pop = "azure",
  rotate = 0,
  float = 0,
  className = "",
  children,
}: {
  pop?: HRPop;
  rotate?: number;
  float?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { bg, fg, border } = POP[pop];

  return (
    <span
      className={`hb-chip animate-float rounded-[1.4rem] border-2 px-4 py-2 text-[0.85rem] font-semibold leading-snug shadow-[0_10px_24px_-14px_rgba(7,26,51,0.55)] ${className}`}
      style={
        {
          background: bg,
          color: fg,
          borderColor: border,
          "--st-rot": `${rotate}deg`,
          transform: `rotate(${rotate}deg)`,
          animationDelay: `${float}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

/** A small stat tag for the boss file: a label and a value, nothing scaled. */
export function StatTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-md)] border-2 border-hb-azure/25 bg-hb-ghost px-4 py-3">
      <p className="label-sm text-hb-azure-deep">{label}</p>
      <p className="hb-display mt-1 text-[1.15rem] text-hb-ink">{value}</p>
    </div>
  );
}
