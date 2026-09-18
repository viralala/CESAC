/** The organiser console's own nav, shared by every page inside it. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Command" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/events", label: "Events" },
  { href: "/people", label: "Roster" },
  { href: "/events/attack-on-token", label: "Event page" },
] as const;
