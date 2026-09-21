import type { Metadata } from "next";

import { CertificateRecord } from "@/components/console/certificate-record";
import { ActionForm } from "@/components/console/action-form";
import { Notice, Panel } from "@/components/console/shell";
import { PointsScale } from "@/components/console/standing";
import { setShowcaseOptOut } from "@/app/actions/certificates";
import { requireParticipant } from "@/lib/auth/guard";
import { getMyCertificates } from "@/lib/data/certificates";
import { getCopy, getScale } from "@/lib/data/site";
import { getMyProfile } from "@/lib/data/student";
import { driveConfigured } from "@/lib/drive/client";

export const metadata: Metadata = {
  title: "My record",
  robots: { index: false, follow: false },
};

/**
 * Everything the student has to show for themselves.
 *
 * It was certificates and nothing else. It is now five kinds of record: the
 * hackathon certificate it always held, and the four publication layouts the
 * department files on, each asking for what its own layout asks for and
 * nothing more.
 *
 * The files live in Google Drive, in a folder made for this student on their
 * first upload. Nothing is stored in the app, so there is one copy of each
 * file and not two that can drift apart, and the department can hand the whole
 * folder to somebody without exporting anything.
 */
export default async function CertificatesPage() {
  const viewer = await requireParticipant();

  const [certificates, profile, scale, t] = await Promise.all([
    getMyCertificates(),
    getMyProfile(),
    getScale(),
    getCopy(),
  ]);

  const driveReady = driveConfigured();
  const optedOut = profile?.showcase_opt_out ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start">
      <Panel
        eyebrow="Your record"
        title="Hackathons and publications"
        aside={certificates.length ? `${certificates.length} on file` : undefined}
      >
        {driveReady ? null : (
          <div className="mb-6">
            <Notice tone="error">
              Uploads are not switched on yet, so a record can be saved but no file can be
              attached to it. Everything you add now keeps its place and takes its files later.
            </Notice>
          </div>
        )}

        <CertificateRecord
          certificates={certificates}
          configured={driveReady}
          optedOut={optedOut}
          emptyNote={t("console.records.empty")}
          studentName={viewer.name}
        />
      </Panel>

      <div className="grid gap-6">
        <Panel eyebrow="How it counts" title="Points">
          <PointsScale scale={scale} />
        </Panel>

        <Panel eyebrow="The front page" title="Being named publicly">
          <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
            The front page of the site names a few students each term, with their year and one
            number, worked out from what is on their record. It never shows a record, a file, an
            address or a PRN. This switch is about that page only: your standing on the signed-in
            ranking does not change either way.
          </p>

          <ActionForm
            action={setShowcaseOptOut}
            submit={optedOut ? "Let the front page name me" : "Keep me off the front page"}
            tone={optedOut ? "lime" : "ghost"}
          >
            <input type="hidden" name="opt_out" value={optedOut ? "false" : "true"} />
            <p className="label mt-4 text-ink">
              {optedOut ? "You are not being named." : "You can be named."}
            </p>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
