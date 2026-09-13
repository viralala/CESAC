import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { AnnouncementCard } from "@/components/blocks/announcement-card";
import { getAllAnnouncements } from "@/lib/data/announcements";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Updates from CESAC: registration openings, portal changes and general notices.",
};

export default function AnnouncementsPage() {
  const announcements = getAllAnnouncements();

  return (
    <>
      <PageHeader
        eyebrow="Announcements"
        title="Latest updates"
        description="Registration openings, portal changes and general notices from CESAC, newest first."
      />

      <Section>
        <div className="flex flex-col gap-4">
          {announcements.map((announcement, i) => (
            <Reveal key={announcement.slug} delay={Math.min(i, 6) * 0.05}>
              <AnnouncementCard announcement={announcement} />
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
