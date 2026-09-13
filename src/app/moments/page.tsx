import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";
import { Reveal } from "@/components/ui/reveal";
import { GalleryTile } from "@/components/blocks/gallery-tile";
import { getAllGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "Moments",
  description: "Photos and moments from past CESAC events and programs.",
};

export default function MomentsPage() {
  const items = getAllGalleryItems();

  return (
    <>
      <PageHeader
        eyebrow="Moments"
        title="From past programs"
        description="A running gallery of CESAC events. Real photography replaces these placeholders as it comes in."
      />

      <Section>
        <div className="flex flex-col gap-8">
          <PlaceholderNotice>
            These tiles use abstract placeholders instead of stock or generated photos. Real
            event photography will replace them here, tile by tile.
          </PlaceholderNotice>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 8) * 0.04}>
                <GalleryTile item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
