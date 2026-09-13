import type { Announcement } from "./types";

export const ANNOUNCEMENTS: Announcement[] = [
  {
    slug: "registration-open-clean-up-drive",
    title: "Registration is open for the Community Clean-Up Drive",
    body: "Slots are limited to 80 volunteers. Register through the student portal and bring closed shoes and a reusable water bottle. A short safety briefing starts promptly at 7:30 AM.",
    publishedAt: "2026-09-08T09:00:00+08:00",
    category: "event",
    isSample: true,
  },
  {
    slug: "portal-certificate-downloads",
    title: "Certificates from last term are now downloadable",
    body: "Participation and volunteer certificates for last term's programs are available under Certificates in the student portal. Reach out through the contact page if one is missing.",
    publishedAt: "2026-09-05T10:00:00+08:00",
    category: "portal",
    isSample: true,
  },
  {
    slug: "general-assembly-attendance",
    title: "Attendance at the general assembly is required for members",
    body: "All active members are expected to attend the general assembly on October 10. Committee heads should prepare a short report on completed and upcoming activities.",
    publishedAt: "2026-09-02T08:00:00+08:00",
    category: "general",
    isSample: true,
  },
  {
    slug: "committee-applications-open",
    title: "Committee applications open for the second term",
    body: "Members interested in joining the Programs or Publicity committees can apply through the form linked on the announcements page. Orientation follows shortly after selection.",
    publishedAt: "2026-08-28T08:00:00+08:00",
    category: "general",
    isSample: true,
  },
];

export function getAllAnnouncements() {
  return [...ANNOUNCEMENTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
