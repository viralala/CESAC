import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How CESAC collects, uses and protects information submitted through this site.",
};

const LAST_UPDATED = "September 13, 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description={`Last updated: ${LAST_UPDATED}`}
      />

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <PlaceholderNotice>
            This is a starting template, not a finalized policy. It should be reviewed by
            CESAC&apos;s advisers or the institution before the portal collects real student
            data.
          </PlaceholderNotice>

          <PolicySection title="1. What this policy covers">
            <p>
              This policy explains what information CESAC collects through this website and the
              student portal, how it is used, and the choices available to you. It applies to
              the public site, the contact form, and the student and admin portal described in
              this policy.
            </p>
          </PolicySection>

          <PolicySection title="2. Information we collect">
            <ul>
              <li>
                <strong>Contact form.</strong> Name, email address, topic and message content
                when you submit the contact form.
              </li>
              <li>
                <strong>Portal accounts.</strong> Name, email address and student information
                needed to register for events, track registrations and issue certificates, once
                the portal is live.
              </li>
              <li>
                <strong>Event registrations.</strong> Which events you register for and your
                registration status.
              </li>
              <li>
                <strong>Technical data.</strong> Basic, non-identifying technical information
                (such as browser type) that web servers typically log for security and
                reliability.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="3. How information is used">
            <p>
              Information is used to respond to inquiries, process event registrations, issue
              certificates, publish announcements relevant to you, and keep the portal secure
              and working correctly. It is not used for purposes unrelated to CESAC&apos;s
              programs.
            </p>
          </PolicySection>

          <PolicySection title="4. Sharing of information">
            <p>
              CESAC does not sell personal information. Information may be shared with the
              institution or partner organizations directly involved in running a specific
              program (for example, confirming attendance for a joint activity), and with
              service providers that help operate the site and portal, solely to provide that
              service.
            </p>
          </PolicySection>

          <PolicySection title="5. Data retention">
            <p>
              Registration and certificate records are kept for as long as needed for academic
              or organizational record-keeping. Contact form submissions are kept only as long as
              needed to respond to and resolve the inquiry.
            </p>
          </PolicySection>

          <PolicySection title="6. Your choices">
            <p>
              You can ask to see, correct or delete personal information CESAC holds about you by
              reaching out through the contact page. Requests tied to academic records (such as
              certificates) may be subject to the institution&apos;s own records policy.
            </p>
          </PolicySection>

          <PolicySection title="7. Cookies">
            <p>
              The public site does not use tracking or advertising cookies. The portal, once
              live, uses only the minimum cookies or local storage needed to keep you signed in
              and remember your session.
            </p>
          </PolicySection>

          <PolicySection title="8. Changes to this policy">
            <p>
              This policy may be updated as the site and portal evolve. The date at the top of
              this page reflects the most recent revision.
            </p>
          </PolicySection>

          <PolicySection title="9. Contact">
            <p>
              Questions about this policy or your information can be sent through the{" "}
              <Link href="/contact" className="text-accent hover:underline">
                contact page
              </Link>
              .
            </p>
          </PolicySection>
        </div>
      </Section>
    </>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl font-medium text-fg">{title}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-fg-muted [&_a]:text-accent [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-fg [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </div>
  );
}
