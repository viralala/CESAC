import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { PlaceholderNotice } from "@/components/ui/placeholder-notice";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with CESAC through the contact form.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Questions about a specific event, membership or a partnership. The form below reaches the CESAC team."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ContactForm />
          </div>
          <div className="flex flex-col gap-6 border-t border-line pt-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <PlaceholderNotice>
              Office location, hours and a direct email will be added once confirmed. The form is
              the reliable way to reach CESAC in the meantime.
            </PlaceholderNotice>
            <div className="flex items-start gap-3 text-sm text-fg-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>Office location pending.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-fg-muted">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>Office hours pending.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-fg-muted">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>For event-specific questions, mention the event name in your message.</span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
