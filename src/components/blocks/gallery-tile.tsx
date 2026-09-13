import type { GalleryItem } from "@/lib/data/types";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SampleTag } from "@/components/ui/sample-tag";

export function GalleryTile({ item }: { item: GalleryItem }) {
  return (
    <figure className="group relative flex flex-col overflow-hidden border border-line bg-ink-2">
      <div className="relative aspect-square overflow-hidden">
        <ImagePlaceholder
          pattern={item.pattern}
          label=""
          className="h-full w-full transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
        <div className="absolute right-2 top-2 z-[2]">
          <SampleTag />
        </div>
      </div>
      <figcaption className="flex flex-col gap-1 p-4">
        <p className="text-sm text-fg">{item.caption}</p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-fg-muted/70">
          {item.eventLabel}, {item.year}
        </p>
      </figcaption>
    </figure>
  );
}
