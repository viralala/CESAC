import type { Metadata } from "next";
import Link from "next/link";

import { WallMark } from "@/components/aot/art";
import { Container, Label } from "@/components/aot/bits";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section className="washi grain relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[16%] -z-20 aspect-square w-[34vw] max-w-[420px] rounded-full bg-lime opacity-90"
      />
      <WallMark className="pointer-events-none absolute bottom-0 right-[6%] -z-10 h-[58vh] w-auto text-teal-2 opacity-90" />

      <Container className="relative py-24">
        <Label>Error 404</Label>
        <p className="d-wide mt-5 text-[clamp(4.5rem,20vw,13rem)] leading-[0.8] text-teal">404</p>
        <h1 className="d-tall mt-6 text-[clamp(1.8rem,4.5vw,3rem)] text-ink">
          This wall has no gate.
        </h1>
        <p className="serif-it mt-4 max-w-[48ch] text-[1.1rem] leading-relaxed text-muted">
          The page you are looking for does not exist, or it moved. Head back to the committee
          home, or straight to what we are running.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/" className="pill pill-lime">
            Back to CESAC
          </Link>
          <Link href="/events" className="pill pill-ghost">
            See events
          </Link>
        </div>
      </Container>
    </section>
  );
}
