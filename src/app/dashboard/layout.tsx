import { Container } from "@/components/aot/bits";
import { ConsoleBar } from "@/components/console/shell";
import { ConsoleTabs, type Tab } from "@/components/console/tabs";
import { requireParticipant } from "@/lib/auth/guard";

/** Out of the console and back to the public site. */
const OUT = [
  { href: "/events", label: "Events" },
  { href: "/", label: "Site" },
] as const;

/**
 * The seven things a student has on this site.
 *
 * In the order somebody would actually use them: what have I got, what is it
 * worth, what can I enter, what do I want to ask, and who am I.
 *
 * Events and Competitions sit side by side because they are two different
 * decisions. Events is the department calendar, entered alone or in a pair
 * and signed off by an organiser. Competitions is the team system: you build
 * a team of up to eight, people accept, and the seat is claimed and paid for
 * in one move.
 */
const TABS: readonly Tab[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/certificates", label: "My record" },
  { href: "/dashboard/ranking", label: "Ranking" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/competitions", label: "Competitions" },
  { href: "/dashboard/queries", label: "Questions" },
  { href: "/dashboard/profile", label: "My details" },
];

/**
 * The student console's chrome.
 *
 * requireParticipant is called here for the bar, and again by every page
 * inside it. That is on purpose and not an oversight: a guard that lives only
 * in a layout is a guard a page added later can quietly miss, so the layout
 * uses it for the name in the corner and each page still does its own
 * checking. getViewer is cached per request, so the two calls are one query.
 */
export default async function ConsoleLayout({ children }: LayoutProps<"/dashboard">) {
  const viewer = await requireParticipant();

  return (
    <>
      <ConsoleBar viewer={viewer} area="Student console" nav={OUT} />

      <div className="washi grain min-h-[100svh] py-8 sm:py-12">
        <Container>
          <ConsoleTabs tabs={TABS} />
          <div className="mt-7">{children}</div>
        </Container>
      </div>
    </>
  );
}
