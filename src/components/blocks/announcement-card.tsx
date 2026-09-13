import { Megaphone } from "lucide-react";

import type { Announcement, AnnouncementCategory } from "@/lib/data/types";
import { formatEventDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SampleTag } from "@/components/ui/sample-tag";

const CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  general: "General",
  event: "Event",
  portal: "Portal",
};

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="flex flex-col gap-4 border border-line bg-ink-2 p-6 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex size-10 shrink-0 items-center justify-center border border-line text-accent">
        <Megaphone className="size-4" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{CATEGORY_LABEL[announcement.category]}</Badge>
          <span className="font-mono text-xs uppercase tracking-wider text-fg-muted/70">
            {formatEventDate(announcement.publishedAt)}
          </span>
          <SampleTag />
        </div>
        <h3 className="font-display text-xl font-medium text-fg">{announcement.title}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">{announcement.body}</p>
      </div>
    </article>
  );
}
