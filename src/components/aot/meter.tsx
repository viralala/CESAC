"use client";

import { useInView } from "./reveal";

/** Percentage bar — soft-ended, in the single accent red. */
export function Meter({
  label,
  pct,
  delay = 0,
  tone = "light",
}: {
  label: string;
  pct: number;
  delay?: number;
  tone?: "light" | "dark";
}) {
  const { ref, shown } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className={`text-[0.9375rem] leading-tight ${tone === "dark" ? "text-cream/80" : "text-ink"}`}>
          {label}
        </p>
        <p className={`label shrink-0 ${tone === "dark" ? "text-cream" : "text-ink"}`}>{pct}%</p>
      </div>
      <div className="meter-track">
        <span
          className="meter-fill"
          style={{ ["--v" as string]: shown ? pct / 100 : 0, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}
