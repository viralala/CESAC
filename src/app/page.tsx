import { SiteFooter } from "@/components/site/footer";
import { HomeEvents } from "@/components/sections/home/events";
import { HomeHero } from "@/components/sections/home/hero";
import { HomeJoin } from "@/components/sections/home/join";
import { HomeTeam } from "@/components/sections/home/team";
import { HomeWhat } from "@/components/sections/home/what";

/**
 * The community home.
 *
 * CESAC first, the event second. A visitor should be able to answer "what is
 * this committee" before they are asked to enter anything, so the order is:
 * what it is, what it does, what is running, who runs it, how to get involved.
 *
 * Attack on Token has its own route. It used to be this page, which made the
 * committee look like a single hackathon.
 */
export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeWhat />
      <HomeEvents />
      <HomeTeam />
      <HomeJoin />
      <SiteFooter />
    </>
  );
}
