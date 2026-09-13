import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

const CATEGORIES = [
  "Outreach",
  "Workshops",
  "Seminars",
  "General Assemblies",
  "Socials",
  "Volunteering",
];

export function Hero() {
  return (
    <section className="border-b border-line pb-16 pt-14 sm:pt-20">
      <Container className="flex flex-col gap-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-8 lg:col-span-8">
            <Eyebrow>Community, events and service</Eyebrow>
            <h1 className="text-balance font-display text-5xl font-medium leading-[1.02] text-fg sm:text-6xl lg:text-7xl">
              Community extension, events and volunteers, together in one place.
            </h1>
            <p className="max-w-xl text-balance text-lg leading-relaxed text-fg-muted">
              Browse CESAC&apos;s upcoming events, register through the student portal, and keep
              track of your certificates once you&apos;re in. From clean-up drives to committee
              workshops, it starts here.
            </p>
            <div className="flex flex-wrap gap-4">
              <LinkButton href="/events" variant="primary" size="lg">
                View upcoming events
                <ArrowUpRight className="size-4" aria-hidden />
              </LinkButton>
              <LinkButton href="/login" variant="secondary" size="lg">
                Enter the portal
              </LinkButton>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 border-t border-line pt-6 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-sm leading-relaxed text-fg-muted">
              CESAC organizes and publishes its own programs. Admins keep this site updated
              directly, so what you see here reflects what is actually happening.
            </p>
            <dl className="flex flex-col gap-3 font-mono text-xs uppercase tracking-wider text-fg-muted">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <dt>Registration</dt>
                <dd className="text-fg">Via student portal</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <dt>Certificates</dt>
                <dd className="text-fg">Issued after events</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Updates</dt>
                <dd className="text-fg">Posted as announcements</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[4px] border border-line">
          <Image
            src="/images/vit-campus-wide.jpg"
            alt="Vishwakarma Institute of Technology, Pune campus building and courtyard"
            width={2000}
            height={922}
            priority
            className="h-auto w-full object-cover"
            sizes="(min-width: 1440px) 1400px, 100vw"
          />
          <span className="absolute bottom-2 right-3 z-[2] font-mono text-[10px] uppercase tracking-wider text-fg/70">
            VIT Pune campus. Photo:{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Vit_image.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-fg/40 hover:text-fg"
            >
              Pranav n24, CC BY-SA 4.0
            </a>
          </span>
        </div>
      </Container>

      <div className="relative z-[2] mt-12 overflow-hidden border-y border-line py-4">
        <div className="flex w-max motion-safe:animate-marquee">
          {[...CATEGORIES, ...CATEGORIES].map((category, i) => (
            <span
              key={`${category}-${i}`}
              className="flex items-center gap-6 pr-6 font-display text-2xl font-medium text-fg-muted/50"
            >
              {category}
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
