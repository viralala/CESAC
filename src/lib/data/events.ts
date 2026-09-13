import type { CesacEvent } from "./types";

// Placeholder events for layout and interaction testing. Replace with real
// CESAC event data before launch; every card built from this file renders a
// visible "Sample content" tag so it cannot be mistaken for a real listing.
export const EVENTS: CesacEvent[] = [
  {
    slug: "community-clean-up-drive",
    title: "Community Clean-Up Drive",
    summary: "A campus and neighborhood clean-up with waste sorting and a short briefing on local disposal programs.",
    description:
      "Volunteers meet at the main grounds for a safety briefing, then split into teams covering campus paths and the adjoining barangay streets. Gloves, bags and sorting bins are provided. Closed shoes and a reusable water bottle are recommended.",
    category: "outreach",
    featured: true,
    startDate: "2026-09-20T07:30:00+08:00",
    endDate: "2026-09-20T11:00:00+08:00",
    venue: "Main Campus Grounds",
    capacity: 80,
    pattern: 0,
    isSample: true,
  },
  {
    slug: "volunteer-orientation-seminar",
    title: "Volunteer Orientation Seminar",
    summary: "An introduction to CESAC's programs, committees and how to sign up for the semester's activities.",
    description:
      "A short seminar for anyone new to CESAC: what the committees do, how event registration and certificates work in the student portal, and how to get involved with ongoing programs.",
    category: "seminar",
    startDate: "2026-09-27T13:00:00+08:00",
    endDate: "2026-09-27T15:00:00+08:00",
    venue: "Student Center, Room 204",
    capacity: 60,
    pattern: 1,
    isSample: true,
  },
  {
    slug: "foundations-of-community-extension-workshop",
    title: "Foundations of Community Extension",
    summary: "A hands-on workshop covering how to plan, propose and run a community extension activity.",
    description:
      "Small-group workshop walking through proposal writing, budgeting basics, partner coordination and post-activity reporting, using past CESAC programs as working examples.",
    category: "workshop",
    startDate: "2026-10-03T09:00:00+08:00",
    endDate: "2026-10-03T12:00:00+08:00",
    venue: "Multipurpose Hall",
    capacity: 45,
    pattern: 2,
    isSample: true,
  },
  {
    slug: "cesac-general-assembly",
    title: "CESAC General Assembly",
    summary: "The semestral general assembly covering officer updates, committee reports and open forum.",
    description:
      "All members are expected to attend. The assembly covers a recap of completed programs, upcoming plans for the rest of the term and an open floor for questions and proposals.",
    category: "meeting",
    startDate: "2026-10-10T16:00:00+08:00",
    endDate: "2026-10-10T18:00:00+08:00",
    venue: "Main Auditorium",
    capacity: 150,
    pattern: 3,
    isSample: true,
  },
  {
    slug: "tree-planting-initiative",
    title: "Tree Planting Initiative",
    summary: "A partner outreach activity planting native seedlings along the community watershed area.",
    description:
      "Run with a local environmental partner group, this activity covers a short orientation on native species, planting technique and site care, followed by the planting itself.",
    category: "outreach",
    startDate: "2026-11-07T06:30:00+08:00",
    endDate: "2026-11-07T10:00:00+08:00",
    venue: "Community Watershed Area",
    capacity: 50,
    pattern: 0,
    isSample: true,
  },
  {
    slug: "annual-recognition-night",
    title: "Annual Recognition Night",
    summary: "A close-out evening recognizing volunteers, committees and partner organizations for the year.",
    description:
      "A recognition program for outgoing officers, active volunteers and partner organizations, with a short awarding segment and open program.",
    category: "social",
    startDate: "2026-08-15T18:00:00+08:00",
    endDate: "2026-08-15T21:00:00+08:00",
    venue: "Covered Court",
    capacity: 200,
    pattern: 1,
    isSample: true,
  },
];

export function getAllEvents() {
  return EVENTS;
}

export function getEventBySlug(slug: string) {
  return EVENTS.find((event) => event.slug === slug);
}

export function getFeaturedEvent() {
  return EVENTS.find((event) => event.featured) ?? EVENTS[0];
}

export function isUpcoming(event: CesacEvent, now: Date = new Date()) {
  return new Date(event.endDate ?? event.startDate) >= now;
}

export function getUpcomingEvents(now: Date = new Date()) {
  return EVENTS.filter((event) => isUpcoming(event, now)).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export function getPastEvents(now: Date = new Date()) {
  return EVENTS.filter((event) => !isUpcoming(event, now)).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}
