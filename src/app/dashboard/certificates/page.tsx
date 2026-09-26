import type { Metadata } from "next";

import { CertificateRecord } from "@/components/console/certificate-record";
import { Notice, Panel } from "@/components/console/shell";
import { PointsScale } from "@/components/console/standing";
import { requireParticipant } from "@/lib/auth/guard";
import { getMyCertificates } from "@/lib/data/certificates";
import { getCopy, getScale } from "@/lib/data/site";
import { driveConfigured } from "@/lib/drive/client";

export const metadata: Metadata = {
  title: "My record",
  robots: { index: false, follow: false },
};

/**
 * Everything the student has to show for themselves.
 *
 * It was certificates and nothing else. It is now eleven kinds of record,
 * from hackathons and competitions to internships, courses, patents and the
 * four publication layouts the department files on, each asking for what its
 * own layout asks for and nothing more. Adding one is what the page is for,
 * so the form leads and the points table sits underneath everything.
 *
 * The files live in Google Drive, in a folder made for this student on their
 * first upload. Nothing is stored in the app, so there is one copy of each
 * file and not two that can drift apart, and the department can hand the whole
 * folder to somebody without exporting anything.
 */
export default async function CertificatesPage() {
  const viewer = await requireParticipant();

  const [certificates, scale, t] = await Promise.all([
    getMyCertificates(),
    getScale(),
    getCopy(),
  ]);

  const driveReady = driveConfigured();

  return (
    <div className="grid gap-6">
      <CertificateRecord
        certificates={certificates}
        configured={driveReady}
        emptyNote={t("console.records.empty")}
        studentName={viewer.name}
        notice={
          driveReady ? null : (
            <Notice tone="error">
              Uploads are not switched on yet, so a record can be saved but no file can be
              attached to it.
            </Notice>
          )
        }
      />

      <Panel eyebrow="How it counts" title="Points">
        <PointsScale scale={scale} wide />
        <p className="serif-it mt-5 text-[0.95rem] leading-relaxed text-muted">
          Your name, year, points and what you have done are shown on the public standouts page,
          never your files, address or PRN.
        </p>
      </Panel>
    </div>
  );
}
