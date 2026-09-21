import { SiteFooter } from "@/components/site/footer";
import { HomeEvents } from "@/components/sections/home/events";
import { HomeHero } from "@/components/sections/home/hero";
import { HomeJoin } from "@/components/sections/home/join";
import { HomeShowcase } from "@/components/sections/home/showcase";
import { HomeTeam } from "@/components/sections/home/team";
import { HomeWhat } from "@/components/sections/home/what";
import { getRoster, rosterTotal } from "@/lib/data/site";

/**
 * The community home.
 *
 * CESAC first, the event second. A visitor should be able to answer "what is
 * this committee" before they are asked to enter anything, so the order is:
 * what it is, what it does, what is running, who is doing well at it, who runs
 * it, how to get involved.
 *
 * Standouts sits after the events rather than before, because the answer to
 * "what is this" has to land before a list of names means anything. It renders
 * nothing at all until the committee has something to show, and the switch to
 * turn it off entirely is on the console.
 *
 * Attack on Token has its own route. It used to be this page, which made the
 * committee look like a single hackathon.
 */
export default async function Home() {
  // The hero is a client component, so its two counts are passed in. Every
  // other section reads the roster itself, and getRoster is cached per
  // request, so all of them together are one query.
  const groups = await getRoster();

  return (
    <>
      <HomeHero
        members={rosterTotal(groups)}
        verticals={groups.filter((g) => g.kind === "vertical").length}
      />
      <HomeWhat />
      <HomeEvents />
      <HomeShowcase />
      <HomeTeam />
      <HomeJoin />
      <SiteFooter />
    </>
  );
}
