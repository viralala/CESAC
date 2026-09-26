import type { Metadata } from "next";

import { deleteCertificate, reviewCertificate } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { FilterList, type Facet, type ListRow } from "@/components/console/filter-list";
import { RecordDetail, RecordSummary } from "@/components/console/queue-parts";
import { Empty, Panel, Stat } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { LAYOUTS, LEVELS } from "@/lib/console/records";
import { recordState, stamp } from "@/lib/console/record-view";
import {
  certificateState,
  getCertificatesForReview,
  type CertificateForOrganiser,
} from "@/lib/data/certificates";
import { EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Records",
  robots: { index: false, follow: false },
};

function day(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
}

const KIND_FACET: Facet = {
  name: "kind",
  label: "Kind",
  options: LAYOUTS.map((l) => ({ value: l.kind, label: l.label })),
};

const LEVEL_FACET: Facet = {
  name: "level",
  label: "Level",
  options: LEVELS.map((l) => ({ value: l.value, label: l.label })),
};

const PROOF_FACET: Facet = {
  name: "proof",
  label: "Proof",
  options: [
    { value: "yes", label: "Has a file" },
    { value: "no", label: "Nothing attached" },
  ],
};

const STATE_FACET: Facet = {
  name: "state",
  label: "Decision",
  options: [
    { value: "verified", label: "Verified" },
    { value: "turned down", label: "Turned down" },
  ],
};

/**
 * The moves offered, per state the record is in.
 *
 * Never the one it is already in. A button that writes back what is already
 * on the row reads like a decision and does nothing, which is how somebody
 * ends up certain they have dealt with a record they have not.
 */
const MOVES = {
  waiting: [
    { to: "verify", label: "Verify", tone: "lime" as const },
    {
      to: "reject",
      label: "Turn it down",
      tone: "danger" as const,
      confirm:
        "Turn this record down? It leaves the queue and stops coming back. The row stays on the student record, it still counts towards the ranking, and the file stays in Drive.",
    },
  ],
  verified: [
    { to: "reopen", label: "Put back in the queue", tone: "ghost" as const },
    {
      to: "reject",
      label: "Turn it down",
      tone: "danger" as const,
      confirm: "Turn this record down instead? The student loses the verified mark on it.",
    },
  ],
  "turned down": [
    { to: "reopen", label: "Put back in the queue", tone: "ghost" as const },
    { to: "verify", label: "Verify", tone: "lime" as const },
  ],
};

/** Everything the search box should look through. */
function haystack(record: CertificateForOrganiser): string {
  return [
    record.event_name,
    record.owner?.full_name,
    record.owner?.email,
    record.owner?.prn,
    record.owner?.student_class,
    record.venue_name,
    record.primary_author,
    record.secondary_authors,
    record.location,
    record.publisher,
    record.isbn_issn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function row(record: CertificateForOrganiser): ListRow {
  const state = recordState(record);

  const actions = (
    <>
      {MOVES[state].map((move) => (
        <ActionForm
          key={move.to}
          action={reviewCertificate}
          submit={move.label}
          pendingLabel="Saving"
          tone={move.tone}
          className="contents"
          confirm={"confirm" in move ? move.confirm : undefined}
        >
          <input type="hidden" name="certificate_id" value={record.id} />
          <input type="hidden" name="decision" value={move.to} />
        </ActionForm>
      ))}
    </>
  );

  return {
    id: record.id,
    facets: {
      state,
      kind: record.kind,
      level: record.level ?? "other",
      proof: record.drive_link || record.files.length ? "yes" : "no",
    },
    search: haystack(record),
    summary: (
      <RecordSummary record={record} owner={record.owner} files={record.files} actions={actions} />
    ),
    detail: (
      <RecordDetail record={record} owner={record.owner} files={record.files}>
        {record.verified_at ? (
          <p className="label-sm mt-1 text-muted">
            {record.verified ? "Verified" : "Turned down"} {stamp(record.verified_at)}
            {record.verifier?.full_name ? ` by ${record.verifier.full_name}` : ""}
          </p>
        ) : null}
        {record.enteredBy && record.enteredBy.id !== record.owner_id ? (
          <p className="label-sm mt-1 text-muted">
            Entered by {record.enteredBy.full_name ?? record.enteredBy.email}
          </p>
        ) : null}

        {/* Turning a record down leaves it on the board, which is the honest
            behaviour for a disputed claim. This is for the row that should
            never have existed: the duplicate, the screenshot of nothing, the
            certificate that belongs to somebody else. It takes the points with
            it, because the row is gone. */}
        <div className="mt-5 border-t border-ink/10 pt-4">
          <ActionForm
            action={deleteCertificate}
            submit="Delete this record"
            pendingLabel="Deleting"
            tone="danger"
            className="contents"
            confirm={`Delete ${record.event_name} from this record? Its points go with it and its files go to the Drive bin. This cannot be undone from here.`}
          >
            <input type="hidden" name="certificate_id" value={record.id} />
          </ActionForm>
        </div>
      </RecordDetail>
    ),
  };
}

/**
 * The record review queue.
 *
 * Read it knowing what it does not do. The ranking counts a record from the
 * moment it is uploaded, so nothing decided here adds or removes a single
 * point: that rule lives in ranking_board() and moving it is a migration.
 * What this page changes is what the department can say it has actually seen,
 * and the verified mark the student reads on their own record.
 *
 * Two lists since 22 September rather than three, each a folding, filterable
 * list rather than a wall of expanded cards. Fifty records printed in full is
 * a page nobody can find anything in, and the facets carry their own counts
 * so "eleven waiting, of which three are books" is readable without opening
 * anything.
 *
 * Every number is counted from the rows fetched for this request. Nothing is
 * cached and nothing is stored: both lists are one read of the table, split
 * two ways, so the counts above them cannot disagree with the rows underneath.
 */
export default async function AdminCertificatesPage() {
  await requireAdmin();
  await requireCap("records");
  const certificates = await getCertificatesForReview();

  // getCertificatesForReview returns oldest first, which is the order the
  // queue wants and the opposite of the one the record wants.
  const waiting = certificates.filter((c) => certificateState(c) === "waiting");
  const settled = certificates
    .filter((c) => certificateState(c) !== "waiting")
    .sort((a, b) => (b.verified_at ?? b.created_at).localeCompare(a.verified_at ?? a.created_at));

  const verified = settled.filter((c) => c.verified);
  const turnedDown = settled.filter((c) => !c.verified);

  const owners = new Set(certificates.map((c) => c.owner_id));
  const oldest = waiting[0];

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Records</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Everything students have filed, with the files in the department Drive, so open the file
            to decide.
          </p>
          <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
            Verifying or turning down a record never changes the ranking, only what the department
            has checked.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            value={certificates.length}
            label="On file"
            note={`From ${owners.size} ${owners.size === 1 ? "student" : "students"}`}
          />
          <Stat
            value={waiting.length}
            label="Waiting on you"
            note={oldest ? `Oldest uploaded ${day(oldest.created_at)}` : "Nothing waiting"}
          />
          <Stat value={verified.length} label="Verified" note="Checked and kept" />
          <Stat value={turnedDown.length} label="Turned down" note="Checked and refused" />
        </div>

        <div className="mt-10 grid gap-6">
          <FilterList
            eyebrow="Queue"
            title="Waiting on a decision"
            noun="record"
            blurb="Open the file, check it matches the row, then verify it or turn it down."
            facets={[KIND_FACET, LEVEL_FACET, PROOF_FACET]}
            rows={waiting.map(row)}
            searchPlaceholder="Title, student, PRN, journal, publisher, organiser"
            empty={
              <Empty>
                Nothing is waiting, and anything new arrives here, oldest first.
              </Empty>
            }
          />

          <FilterList
            eyebrow="Record"
            title="Already decided"
            noun="record"
            startFolded
            blurb="Most recently decided first, and putting one back in the queue clears its mark."
            facets={[STATE_FACET, KIND_FACET, LEVEL_FACET, PROOF_FACET]}
            rows={settled.map(row)}
            searchPlaceholder="Title, student, PRN, journal, publisher, organiser"
            empty={
              <Empty>
                Nothing has been decided yet, and checked records move down here.
              </Empty>
            }
          />

          <Panel eyebrow="Export" title="CSV, for the office" aside="Built on the press">
            <p className="serif-it text-[1.02rem] leading-relaxed text-muted">
              One row per record with the student and every Drive link, built fresh when you press
              the button.
            </p>
            <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
              It holds real names, addresses and PRNs, so keep it within the department.
            </p>

            {/*
              A plain anchor and not next/link. The other end is a route
              handler rather than a page, so there is nothing for the router to
              navigate to and typed routes will not accept it as a destination.
              The browser has to make an ordinary request and let
              Content-Disposition do its job.
            */}
            <a href="/admin/certificates/export" className="pill pill-lime mt-6">
              Everything, one wide sheet
            </a>

            <div className="mt-8 border-t border-ink/10 pt-7">
              <p className="label text-ink">Straight into Formats.xlsx</p>
              <p className="serif-it mt-2 text-[1rem] leading-relaxed text-muted">
                Each file matches the department sheet&rsquo;s columns, ready to paste under the
                headings you already have.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {[
                  { sheet: "journal", label: "Journal publications" },
                  { sheet: "conference", label: "Conference publications" },
                  { sheet: "book", label: "Book publications" },
                  { sheet: "book_chapter", label: "Book chapters" },
                ].map((one) => (
                  <a
                    key={one.sheet}
                    href={`/admin/certificates/export?sheet=${one.sheet}`}
                    className="pill pill-ghost"
                  >
                    {one.label}
                  </a>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </Container>
    </div>
  );
}
