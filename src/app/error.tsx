"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button, LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <Eyebrow>Something went wrong</Eyebrow>
      <h1 className="font-display text-4xl font-medium text-fg sm:text-5xl">
        That did not load correctly.
      </h1>
      <p className="max-w-md text-lg text-fg-muted">
        An unexpected error interrupted this page. You can try again, or head back to the
        homepage.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => retry()} variant="primary">
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </Button>
        <LinkButton href="/" variant="secondary">
          Back to home
        </LinkButton>
      </div>
      {error.digest ? (
        <p className="font-mono text-xs text-fg-muted/60">Reference: {error.digest}</p>
      ) : null}
    </Container>
  );
}
