"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";

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
    <section className="washi grain flex min-h-[100svh] items-center pt-24">
      <Container className="relative py-24">
        <Label>Something broke through</Label>
        <h1 className="d-tall mt-5 text-[clamp(2.6rem,8vw,5.5rem)] text-ink">
          That did not <span className="text-teal">load</span>.
        </h1>
        <p className="serif-it mt-5 max-w-[48ch] text-[1.1rem] leading-relaxed text-muted">
          An unexpected error interrupted this page. Try again, or head back to the committee home.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className="pill pill-lime">
            Try again
          </button>
          <Link href="/" className="pill pill-ghost">
            Back to CESAC
          </Link>
        </div>
        {error.digest ? <p className="label mt-8 text-muted">Reference: {error.digest}</p> : null}
      </Container>
    </section>
  );
}
