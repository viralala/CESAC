import type { TeamMember } from "./types";

// Placeholder roster. Real names and photos are intentionally left out
// rather than invented; each entry shows the position only until CESAC
// supplies real member information.
export const TEAM: TeamMember[] = [
  {
    slug: "chairperson",
    role: "Chairperson",
    group: "core",
    bio: "Leads CESAC's overall direction, represents the organization to the department, and oversees committee coordination.",
    isSample: true,
  },
  {
    slug: "vice-chairperson",
    role: "Vice Chairperson",
    group: "core",
    bio: "Supports the chairperson, oversees internal operations, and steps in on programs and scheduling.",
    isSample: true,
  },
  {
    slug: "secretary",
    role: "Secretary",
    group: "core",
    bio: "Keeps official records, minutes and communications, and manages the announcements published to members.",
    isSample: true,
  },
  {
    slug: "treasurer",
    role: "Treasurer",
    group: "core",
    bio: "Manages budgets for programs and events, and reports on funds at general assemblies.",
    isSample: true,
  },
  {
    slug: "programs-committee-head",
    role: "Programs Committee Head",
    group: "committee",
    bio: "Plans and runs CESAC's outreach programs and workshops from proposal through post-activity reporting.",
    isSample: true,
  },
  {
    slug: "publicity-committee-head",
    role: "Publicity Committee Head",
    group: "committee",
    bio: "Handles event promotion, the moments gallery and CESAC's public-facing announcements.",
    isSample: true,
  },
  {
    slug: "faculty-adviser",
    role: "Faculty Adviser",
    group: "advisers",
    bio: "Provides institutional guidance and approves programs on behalf of the department.",
    isSample: true,
  },
];

export function getTeamByGroup(group: TeamMember["group"]) {
  return TEAM.filter((member) => member.group === group);
}
