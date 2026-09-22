/** The organiser console's own nav, shared by every page inside it. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Command", cap: null },
  { href: "/admin/certificates", label: "Records", cap: "records" },
  { href: "/admin/students", label: "Students", cap: "people" },
  { href: "/admin/queries", label: "Questions", cap: "queries" },
  { href: "/admin/entries", label: "Entries", cap: "events" },
  { href: "/admin/teams", label: "Teams", cap: "events" },
  { href: "/admin/events", label: "Event system", cap: "events" },
  { href: "/admin/site", label: "Site", cap: "content" },
  { href: "/admin/access", label: "Access", cap: "people" },
  { href: "/admin/controls", label: "Controls", cap: "settings" },
  { href: "/people", label: "Roster", cap: null },
] as const;

export type NavItem = (typeof ADMIN_NAV)[number];

/**
 * The nav this organiser should see.
 *
 * A menu, never a lock. Every page inside `/admin` checks its own capability
 * and every write is refused by Postgres without it, so hiding a link is a
 * courtesy to somebody who cannot use it and nothing more. An entry with no
 * capability is on for everybody who can open the console at all.
 */
export function navFor(caps: readonly string[]): NavItem[] {
  return ADMIN_NAV.filter((item) => item.cap === null || caps.includes(item.cap));
}

/** Which nav entry a path is under, longest match first. */
export function areaFor(pathname: string): string {
  const match = [...ADMIN_NAV]
    .filter((item) => item.href.startsWith("/admin"))
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  // /admin/grade/... and /admin/events/[id] have no nav entry of their own.
  return match?.label ?? "Organiser console";
}
