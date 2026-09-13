import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms that govern use of the CESAC website and student portal.",
};

const LAST_UPDATED = "September 13, 2026";

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & conditions"
        description={`Last updated: ${LAST_UPDATED}`}
      />

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <PlaceholderNotice>
            This is a starting template, not a finalized legal document. It should be reviewed
            by CESAC&apos;s advisers or the institution before the portal goes live.
          </PlaceholderNotice>

          <TermsSection title="1. Acceptance of terms">
            <p>
              By using this website or the CESAC student portal, you agree to these terms. If
              you do not agree, please do not use the site or portal.
            </p>
          </TermsSection>

          <TermsSection title="2. Who can use the portal">
            <p>
              The student portal is intended for CESAC members and students of the institution.
              Admin access is limited to authorized CESAC officers and advisers.
            </p>
          </TermsSection>

          <TermsSection title="3. Account responsibilities">
            <p>
              You are responsible for the accuracy of information you submit and for keeping
              your portal credentials secure. Notify CESAC promptly if you suspect unauthorized
              access to your account.
            </p>
          </TermsSection>

          <TermsSection title="4. Event registration">
            <p>
              Registering for an event through the portal reserves a slot subject to capacity.
              CESAC may adjust event details, including schedule, venue or capacity, and will
              reflect changes on the event page and through announcements.
            </p>
          </TermsSection>

          <TermsSection title="5. Certificates">
            <p>
              Certificates are issued to confirmed participants after an event, at CESAC&apos;s
              discretion, based on attendance and any stated participation requirements.
            </p>
          </TermsSection>

          <TermsSection title="6. Acceptable use">
            <ul>
              <li>Do not use the site or portal for unlawful purposes.</li>
              <li>Do not attempt to access accounts or data that are not your own.</li>
              <li>Do not interfere with the normal operation of the site or portal.</li>
              <li>Do not submit false information when registering or in the contact form.</li>
            </ul>
          </TermsSection>

          <TermsSection title="7. Content ownership">
            <p>
              Event photography, branding and written content published by CESAC remain the
              property of CESAC and the institution. Content you submit (such as a contact form
              message) may be used internally to respond to and process your request.
            </p>
          </TermsSection>

          <TermsSection title="8. Disclaimer">
            <p>
              The site and portal are provided on an as-is basis. CESAC works to keep event
              information accurate and the portal available, but does not guarantee
              uninterrupted access or that all published information is free of error.
            </p>
          </TermsSection>

          <TermsSection title="9. Changes to these terms">
            <p>
              These terms may be updated as the site and portal evolve. The date at the top of
              this page reflects the most recent revision.
            </p>
          </TermsSection>

          <TermsSection title="10. Contact">
            <p>
              Questions about these terms can be sent through the{" "}
              <Link href="/contact" className="text-accent hover:underline">
                contact page
              </Link>
              .
            </p>
          </TermsSection>
        </div>
      </Section>
    </>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl font-medium text-fg">{title}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-fg-muted [&_a]:text-accent [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-fg [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </div>
  );
}
