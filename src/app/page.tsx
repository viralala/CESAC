import { SiteFooter } from "@/components/site/footer";
import { Awards } from "@/components/sections/awards";
import { Chapters } from "@/components/sections/chapters";
import { Committee } from "@/components/sections/committee";
import { Hero } from "@/components/sections/hero";
import { Marquee } from "@/components/sections/marquee";
import { Operations } from "@/components/sections/operations";
import { Snapshot } from "@/components/sections/snapshot";
import { Sponsor } from "@/components/sections/sponsor";
import { Team } from "@/components/sections/team";
import { Walls } from "@/components/sections/walls";

export default function Home() {
  return (
    <>
      <Hero />
      <Snapshot />
      <Marquee />
      <Walls />
      <Chapters />
      <Awards />
      <Operations />
      <Committee />
      <Team />
      <Sponsor />
      <SiteFooter />
    </>
  );
}
