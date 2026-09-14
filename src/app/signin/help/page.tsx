import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { SiteFooter } from "@/components/site/footer";
import { CONTACT } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Sign-in help",
  description: "What to do when you cannot get into your Attack on Token account.",
  robots: { index: false, follow: false },
};

/**
 * There is no self-service reset, because there is no mailer and no account
 * database to reset against. Saying so and naming who can actually help is
 * worth more than a form that sends a mail nobody receives.
 */
const STEPS = [
  {
    index: "01",
    title: "Check which door you are at",
    body: "Team logins and organiser logins are separate accounts with separate passwords. A team email will never work on the Admin tab, and an organiser ID will never work on the Participant tab.",
  },
  {
    index: "02",
    title: "Use the email you registered with",
    body: "Team accounts are keyed to the email given at registration, not to a personal address added later. If both partners have registered different addresses, only one of them is the team login.",
  },
  {
    index: "03",
    title: "Wait out a lockout",
    body: "Eight wrong attempts in a row on the same ID pauses that ID for five minutes. Nothing is permanently locked and no account is disabled by it. Wait, then try again.",
  },
  {
    index: "04",
    title: "Ask the Technical vertical",
    body: "Passwords cannot be recovered, only reissued: the site stores a one-way digest and nobody, including the committee, can read your password back. The Technical vertical can set a new one for you.",
  },
];

export default function SignInHelpPage() {
  return (
    <>
      <div className="washi grain min-h-[100svh] pb-20 pt-32 sm:pt-40">
        <Container>
          <header className="max-w-[26ch]">
            <Label tone="teal">Access</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.8rem,9vw,5.5rem)] text-ink">
              Sign-in help
            </h1>
          </header>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => (
              <li key={step.index} className="card flex flex-col p-7 sm:p-8">
                <span className="d-tall text-[2.2rem] leading-none text-teal">{step.index}</span>
                <h2 className="d-tall mt-4 text-[1.4rem] text-ink">{step.title}</h2>
                <p className="mt-3 text-[1rem] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="card mt-6 p-7 sm:p-9">
            <Label tone="teal">Who to ask</Label>
            <p className="serif-it mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-ink/80">
              {CONTACT.email
                ? `Reissues go through the Technical vertical. Write to ${CONTACT.email} from the address your team registered with, or find a committee member on the day.`
                : `Reissues go through the Technical vertical. ${CONTACT.note}`}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signin" className="pill pill-lime">
                Back to sign in
              </Link>
              <Link href="/people" className="pill pill-ghost">
                See the committee
              </Link>
            </div>
          </div>
        </Container>
      </div>
      <SiteFooter />
    </>
  );
}
