import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Portal login",
  description: "Sign in to the CESAC student and admin portal.",
};

export default function LoginPage() {
  return (
    <Section className="flex min-h-[70vh] items-center">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center border border-line text-accent">
            <Lock className="size-5" aria-hidden />
          </span>
          <Eyebrow className="justify-center">Student & admin portal</Eyebrow>
          <h1 className="font-display text-3xl font-medium text-fg sm:text-4xl">
            Sign in to the portal
          </h1>
        </div>

        <PlaceholderNotice>
          The portal (registrations, certificates and the admin CMS) is being built next and
          is not live yet. This screen shows the intended sign-in layout; the form below is
          disabled until authentication is connected.
        </PlaceholderNotice>

        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-fg-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              disabled
              placeholder="you@example.edu"
              className="w-full rounded-[4px] border border-line bg-ink-2 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-fg-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full rounded-[4px] border border-line bg-ink-2 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" disabled className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-fg-muted">
          Questions in the meantime?{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact CESAC
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
