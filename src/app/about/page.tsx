import type { Metadata } from "next";
import { HandHeart, Megaphone, Users2, Wrench } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";
import { Reveal } from "@/components/ui/reveal";
import { CTABlock } from "@/components/blocks/cta-block";
import { TEAM_GROUP_LABEL } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "About",
  description: "What CESAC is, how it is organized, and the kinds of programs it runs.",
};

const FOCUS_AREAS = [
  {
    icon: HandHeart,
    title: "Outreach",
    body: "Clean-up drives, tree planting and partner activities that put CESAC in the surrounding community.",
  },
  {
    icon: Wrench,
    title: "Skill-building",
    body: "Workshops and seminars on planning, proposal writing and running an activity from start to finish.",
  },
  {
    icon: Users2,
    title: "Membership",
    body: "Orientation, committee onboarding and the general assemblies that keep everyone aligned.",
  },
  {
    icon: Megaphone,
    title: "Communication",
    body: "Announcements and the moments gallery that keep the wider student body in the loop.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="What CESAC does"
        description="CESAC organizes community extension programs, campus events and volunteer activities, and runs the portal that handles registration and certificates for them."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <SectionHeading eyebrow="Purpose" title="A mission statement belongs here" />
            <PlaceholderNotice>
              This paragraph is a placeholder for CESAC&apos;s official mission statement. Replace
              it with the organization&apos;s actual wording before launch; nothing here should be
              read as an approved statement.
            </PlaceholderNotice>
            <p className="text-lg leading-relaxed text-fg-muted">
              Until then: CESAC exists to connect students with community extension work and
              campus activities, and to make it straightforward to find a program, sign up for
              it, and keep a record of having done it.
            </p>
          </div>
          <div className="flex flex-col gap-4 border-t border-line pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="font-mono text-xs uppercase tracking-wider text-fg-muted/70">
              What the site covers
            </p>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-fg-muted">
              <li className="border-b border-line pb-3">
                Public pages for events, people and past moments.
              </li>
              <li className="border-b border-line pb-3">
                A student portal for registrations and certificates.
              </li>
              <li>An admin CMS so officers can publish updates without touching code.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="paper" className="border-t border-line">
        <div className="flex flex-col gap-12">
          <SectionHeading tone="light" eyebrow="Focus areas" title="The kinds of programs CESAC runs" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FOCUS_AREAS.map((area, i) => (
              <Reveal key={area.title} delay={i * 0.06}>
                <div className="flex h-full flex-col gap-4 border border-paper-line bg-paper-2/60 p-6">
                  <area.icon className="size-6 text-accent" aria-hidden strokeWidth={1.5} />
                  <h3 className="font-display text-xl font-medium text-paper-fg">{area.title}</h3>
                  <p className="text-sm leading-relaxed text-paper-fg-muted">{area.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow="Structure" title="How CESAC is organized" />
          <PlaceholderNotice>
            The roles below reflect a typical CESAC structure for layout purposes. Committee
            names and responsibilities should be confirmed against the real organization chart.
          </PlaceholderNotice>
          <div className="grid gap-6 sm:grid-cols-3">
            {Object.entries(TEAM_GROUP_LABEL).map(([key, label]) => (
              <div key={key} className="border border-line bg-ink-2 p-6">
                <h3 className="font-display text-lg font-medium text-fg">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {key === "core" &&
                    "Officers responsible for CESAC's overall direction, operations and records."}
                  {key === "committee" &&
                    "Heads who plan and run programs within their focus area, from proposal to wrap-up."}
                  {key === "advisers" &&
                    "Faculty guidance and institutional approval for CESAC's programs."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <CTABlock
          eyebrow="Meet the team"
          title="See who is behind these programs"
          description="Officer and committee roles, with real profiles to follow as they are confirmed."
          primary={{ href: "/people", label: "View people" }}
          secondary={{ href: "/events", label: "See upcoming events" }}
        />
      </Section>
    </>
  );
}
