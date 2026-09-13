import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";
import { Reveal } from "@/components/ui/reveal";
import { PersonCard } from "@/components/blocks/person-card";
import { TEAM_GROUP_LABEL } from "@/lib/data/types";
import { getTeamByGroup } from "@/lib/data/people";

export const metadata: Metadata = {
  title: "People",
  description: "The officers, committee heads and advisers behind CESAC's programs.",
};

const GROUPS = Object.keys(TEAM_GROUP_LABEL) as (keyof typeof TEAM_GROUP_LABEL)[];

export default function PeoplePage() {
  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Who runs CESAC"
        description="Officers, committee heads and advisers who plan and run CESAC's programs."
      />

      <Section>
        <div className="flex flex-col gap-20">
          <PlaceholderNotice>
            Names and photos are withheld until real member information is supplied. Roles and
            committee structure are illustrative.
          </PlaceholderNotice>

          {GROUPS.map((group) => {
            const members = getTeamByGroup(group);
            if (members.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-8">
                <SectionHeading title={TEAM_GROUP_LABEL[group]} />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {members.map((member, i) => (
                    <Reveal key={member.slug} delay={i * 0.06}>
                      <PersonCard member={member} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
