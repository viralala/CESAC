import type { Metadata } from "next";

import { CertificateRecord } from "@/components/console/certificate-record";
import { Panel } from "@/components/console/shell";
import { PointsScale } from "@/components/console/standing";
import { requireParticipant } from "@/lib/auth/guard";
import { getMyCertificates } from "@/lib/data/certificates";
import { driveConfigured } from "@/lib/drive/client";

export const metadata: Metadata = {
  title: "Certificates",
  robots: { index: false, follow: false },
};

/**
 * Everything the student has to show for themselves.
 *
 * The files live in Google Drive, in a folder made for this student on their
 * first upload. Nothing is stored in the app, so there is one copy of each
 * certificate and not two that can drift apart, and the department can hand
 * the whole folder to somebody without exporting anything.
 */
export default async function CertificatesPage() {
  await requireParticipant();

  const certificates = await getMyCertificates();
  const driveReady = driveConfigured();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <Panel
        eyebrow="Your record"
        title="Certificates"
        aside={certificates.length ? `${certificates.length} on file` : undefined}
      >
        <CertificateRecord certificates={certificates} configured={driveReady} />
      </Panel>

      <Panel eyebrow="How it counts" title="Points">
        <PointsScale />
      </Panel>
    </div>
  );
}
