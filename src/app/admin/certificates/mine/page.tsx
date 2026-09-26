import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { CertificateRecord } from "@/components/console/certificate-record";
import { Notice, Panel } from "@/components/console/shell";
import { PointsScale } from "@/components/console/standing";
import { requireAdmin } from "@/lib/auth/guard";
import { getMyCertificates } from "@/lib/data/certificates";
import { getCopy, getScale } from "@/lib/data/site";
import { driveConfigured } from "@/lib/drive/client";
import { EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "My record",
  robots: { index: false, follow: false },
};

/**
 * The organiser-side twin of /dashboard/certificates.
 *
 * Most organisers on this committee are students in the department too, and
 * asked for the same place to file a hackathon certificate or a publication
 * that any other student gets. It is the same form, the same layouts and
 * the same actions, guarded by requireAdmin instead of requireParticipant:
 * see requireRecordOwner in src/lib/auth/guard.ts for the one place that
 * decides who may call saveRecord and the rest.
 *
 * An organiser cannot verify this record once it is filed. verify_record
 * refuses a reviewer deciding on their own row, so filing something here
 * still needs another organiser, or the verifier, to check it, the same as
 * anyone else's.
 */
export default async function MyRecordPage() {
  const viewer = await requireAdmin();

  const [certificates, scale, t] = await Promise.all([
    getMyCertificates(),
    getScale(),
    getCopy(),
  ]);

  const driveReady = driveConfigured();

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">My record</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Your record is checked like anyone else&apos;s, by another organiser or a verifier,
            never by you.
          </p>
        </header>

        <div className="mt-10 grid gap-6">
          <CertificateRecord
            certificates={certificates}
            configured={driveReady}
            emptyNote={t("console.records.empty")}
            studentName={viewer.name}
            notice={
              driveReady ? null : (
                <Notice tone="error">
                  Uploads are not switched on yet, so records save now and take their files later.
                </Notice>
              )
            }
          />

          <Panel eyebrow="How it counts" title="Points">
            <PointsScale scale={scale} wide />
          </Panel>
        </div>
      </Container>
    </div>
  );
}
