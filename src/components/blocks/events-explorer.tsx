"use client";

import { useMemo, useState } from "react";

import type { CesacEvent, EventCategory } from "@/lib/data/types";
import { EVENT_CATEGORY_LABEL } from "@/lib/data/types";
import { EventCard } from "@/components/blocks/event-card";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(EVENT_CATEGORY_LABEL) as EventCategory[];

export function EventsExplorer({ events }: { events: CesacEvent[] }) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");

  const filtered = useMemo(() => {
    if (activeCategory === "all") return events;
    return events.filter((event) => event.category === activeCategory);
  }, [events, activeCategory]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by category">
        <FilterChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
          All
        </FilterChip>
        {CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {EVENT_CATEGORY_LABEL[category]}
          </FilterChip>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <Reveal key={event.slug} delay={Math.min(i, 6) * 0.05}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-fg-muted">
          No upcoming events in this category right now. Check back soon, or view all events.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-[3px] border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
        active
          ? "border-accent bg-accent text-ink"
          : "border-line text-fg-muted hover:border-accent/50 hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}
