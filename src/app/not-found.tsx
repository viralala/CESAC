import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <Eyebrow>404</Eyebrow>
      <h1 className="font-display text-5xl font-medium text-fg sm:text-6xl">
        This page wandered off.
      </h1>
      <p className="max-w-md text-lg text-fg-muted">
        The page you are looking for does not exist, or may have moved. Try the homepage, or
        browse upcoming events.
      </p>
      <div className="flex flex-wrap gap-4">
        <LinkButton href="/" variant="primary">
          Back to home
        </LinkButton>
        <LinkButton href="/events" variant="secondary">
          <Compass className="size-4" aria-hidden />
          Browse events
        </LinkButton>
      </div>
    </Container>
  );
}
