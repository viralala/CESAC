export type EventCategory =
  | "outreach"
  | "workshop"
  | "seminar"
  | "meeting"
  | "social"
  | "competition";

export type CesacEvent = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: EventCategory;
  featured?: boolean;
  startDate: string;
  endDate?: string;
  venue: string;
  capacity: number;
  pattern: 0 | 1 | 2 | 3;
  isSample: true;
};

export type TeamGroup = "core" | "committee" | "advisers";

export type TeamMember = {
  slug: string;
  role: string;
  group: TeamGroup;
  name?: string;
  bio: string;
  isSample: true;
};

export type AnnouncementCategory = "general" | "event" | "portal";

export type Announcement = {
  slug: string;
  title: string;
  body: string;
  publishedAt: string;
  category: AnnouncementCategory;
  isSample: true;
};

export type GalleryItem = {
  id: string;
  caption: string;
  eventLabel: string;
  year: string;
  pattern: 0 | 1 | 2 | 3;
  isSample: true;
};

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  outreach: "Outreach",
  workshop: "Workshop",
  seminar: "Seminar",
  meeting: "Meeting",
  social: "Social",
  competition: "Competition",
};

export const TEAM_GROUP_LABEL: Record<TeamGroup, string> = {
  core: "Core officers",
  committee: "Committee heads",
  advisers: "Advisers",
};
