import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { CertificateRecord } from "@/components/console/certificate-record";
import { ActionForm } from "@/components/console/action-form";
import { Notice, Panel } from "@/components/console/shell";
import { PointsScale } from "@/components/console/standing";
import { setShowcaseOptOut } from "@/app/actions/certificates";
import { requireAdmin } from "@/lib/auth/guard";
import { getMyCertificates } from "@/lib/data/certificates";
import { getCopy, getScale } from "@/lib/data/site";
import { getMyProfile } from "@/lib/data/student";
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
 * that any other student gets. It is the same form, the same five layouts and
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

  const [certificates, profile, scale, t] = await Promise.all([
    getMyCertificates(),
    getMyProfile(),
    getScale(),
    getCopy(),
  ]);

  const driveReady = driveConfigured();
  const optedOut = profile?.showcase_opt_out ?? false;

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">My record</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Filed the same way any student files one, and checked the same way: by somebody else.
            Another organiser holding Student records, or the verifier, has to look at this before
            it carries the verified mark, the same rule that applies to everyone else&apos;s record.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start">
          <Panel
            eyebrow="Your record"
            title="Hackathons and publications"
            aside={certificates.length ? `${certificates.length} on file` : undefined}
          >
            {driveReady ? null : (
              <div className="mb-6">
                <Notice tone="error">
                  Uploads are not switched on yet, so a record can be saved but no file can be
                  attached to it. Everything you add now keeps its place and takes its files
                  later.
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
                number, worked out from what is on their record. It never shows a record, a file,
                an address or a PRN. This switch is about that page only.
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
      </Container>
    </div>
  );
}
