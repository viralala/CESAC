/** The organiser console's own nav, shared by every page inside it. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Command" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/queries", label: "Questions" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/events", label: "Event system" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/students", label: "Students" },
  { href: "/people", label: "Roster" },
  { href: "/events/attack-on-token", label: "Event page" },
] as const;
