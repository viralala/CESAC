import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { ResetForm } from "@/components/sections/reset-form";
import { SiteFooter } from "@/components/site/footer";
import { CONTACT } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Sign-in help",
  description: "Reset your Attack on Token password, or find out why you cannot get in.",
  robots: { index: false, follow: false },
};

/**
 * There is a real reset now: Supabase Auth mails a one-time link and the
 * account sets its own new password. The steps below are the cases that a
 * reset does not solve, which are the ones people actually hit.
 */
const STEPS = [
  {
    index: "01",
    title: "Try the way you signed up",
    body: "An account made with Google has no password to reset. If you first came in through Google, GitHub or Facebook, use that same button rather than the email form.",
  },
  {
    index: "02",
    title: "Use the address you signed up with",
    body: "The account is keyed to one email. A reset sent to a different address will never arrive, even if both addresses belong to you.",
  },
  {
    index: "03",
    title: "Look in spam, then wait a minute",
    body: "Reset mail sometimes lands in spam or promotions. Asking repeatedly makes it slower, not faster: too many requests in a row from one place are turned away for a minute.",
  },
  {
    index: "04",
    title: "Ask the Technical vertical",
    body: "Passwords cannot be read back by anyone, including the committee. What the committee can do is confirm which email your account is on, and help if that address no longer reaches you.",
  },
];

export default function SignInHelpPage() {
  return (
    <>
      <div className="washi grain min-h-[100svh] pb-20 pt-32 sm:pt-40">
        <Container>
          <header className="max-w-[26ch]">
            <Label tone="teal">Access</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.8rem,9vw,5.5rem)] text-ink">Sign-in help</h1>
          </header>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="card p-7 sm:p-9">
              <Label tone="teal">Reset</Label>
              <h2 className="d-tall mt-2.5 text-[1.75rem] text-ink">Send me a link</h2>
              <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
                Enter the email on the account. If there is one, a link to set a new password is on
                its way.
              </p>
              <ResetForm />
            </div>

            <ol className="grid gap-4 sm:grid-cols-2 lg:content-start">
              {STEPS.map((step) => (
                <li key={step.index} className="card flex flex-col p-7">
                  <span className="d-tall text-[2.2rem] leading-none text-teal">{step.index}</span>
                  <h2 className="d-tall mt-4 text-[1.3rem] text-ink">{step.title}</h2>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="card mt-6 p-7 sm:p-9">
            <Label tone="teal">Who to ask</Label>
            <p className="serif-it mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-ink/80">
              {CONTACT.email
                ? `Account problems go to the Technical vertical. Write to ${CONTACT.email} from the address your account is on, or find a committee member on the day.`
                : `Account problems go to the Technical vertical. ${CONTACT.note}`}
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
