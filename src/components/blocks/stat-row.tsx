import type { LucideIcon } from "lucide-react";

export type StatItem = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

/**
 * Renders figures the app actually computes (e.g. counts derived from real
 * data). Not used for marketing copy: the build brief bans invented
 * attendance numbers and vanity counters, so nothing here should ever be a
 * hardcoded, unverifiable claim.
 */
export function StatRow({ stats }: { stats: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2 border-l-2 border-accent pl-4">
          {stat.icon ? <stat.icon className="size-4 text-fg-muted" aria-hidden /> : null}
          <dd className="font-display text-3xl font-medium text-fg">{stat.value}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-fg-muted">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}
