import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";

import type { CesacEvent } from "@/lib/data/types";
import { EVENT_CATEGORY_LABEL } from "@/lib/data/types";
import { formatDateRange } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SampleTag } from "@/components/ui/sample-tag";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { LinkButton } from "@/components/ui/button";

export function FeaturedEventCard({ event }: { event: CesacEvent }) {
  return (
    <div className="relative overflow-hidden rounded-[6px] border border-line bg-ink-2">
      <div className="relative aspect-[21/9] w-full overflow-hidden sm:aspect-[3/1]">
        <ImagePlaceholder pattern={event.pattern} label="" className="h-full w-full" />
        <div className="absolute left-4 top-4 z-[2] flex flex-wrap gap-2 sm:left-6 sm:top-6">
          <Badge variant="solid">Featured event</Badge>
          <Badge variant="accent">{EVENT_CATEGORY_LABEL[event.category]}</Badge>
        </div>
        <div className="absolute right-4 top-4 z-[2] sm:right-6 sm:top-6">
          <SampleTag />
        </div>
      </div>

      <div aria-hidden className="relative h-0 border-t border-dashed border-line">
        <span className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-ink" />
        <span className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-ink" />
      </div>

      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-3xl font-medium text-fg sm:text-4xl">{event.title}</h3>
          <p className="max-w-xl text-base leading-relaxed text-fg-muted">{event.summary}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide text-fg-muted/80">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDateRange(event.startDate, event.endDate)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5" aria-hidden />
              {event.venue}
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-3.5" aria-hidden />
              {event.capacity} slots
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <LinkButton href={`/events/${event.slug}`} variant="primary">
            View details
            <ArrowUpRight className="size-4" aria-hidden />
          </LinkButton>
          <LinkButton href="/login" variant="secondary">
            Register via portal
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
