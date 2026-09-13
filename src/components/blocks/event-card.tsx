import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import type { CesacEvent } from "@/lib/data/types";
import { EVENT_CATEGORY_LABEL } from "@/lib/data/types";
import { formatDateRange } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SampleTag } from "@/components/ui/sample-tag";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

export function EventCard({ event }: { event: CesacEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-[4px] border border-line bg-ink-2 transition-colors hover:border-accent/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImagePlaceholder
          pattern={event.pattern}
          label=""
          className="h-full w-full transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 z-[2] flex gap-2">
          <Badge variant="solid">{EVENT_CATEGORY_LABEL[event.category]}</Badge>
        </div>
        <div className="absolute right-3 top-3 z-[2]">
          <SampleTag />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl font-medium text-fg transition-colors group-hover:text-accent">
          {event.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted">{event.summary}</p>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 font-mono text-xs uppercase tracking-wide text-fg-muted/80">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDateRange(event.startDate, event.endDate)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {event.venue}
          </span>
        </div>
      </div>
    </Link>
  );
}
