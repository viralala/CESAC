import type { Metadata } from "next";

import { reviewCertificate } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, ConsoleBar, Empty, Panel, Stat, type ChipTone } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { CONTRIBUTION_LABEL, rupees } from "@/lib/console/options";
import {
  certificateState,
  getCertificatesForReview,
  type CertificateForOrganiser,
} from "@/lib/data/certificates";
import { EVENT } from "@/lib/data/event";
import { ADMIN_NAV } from "../nav";

export const metadata: Metadata = {
  title: "Certificates",
  robots: { index: false, follow: false },
};

/**
 * How many settled certificates each record shows.
 *
 * The queue itself is never cut short, because it is the work and a row
 * hidden below a limit is a row nobody ever decides about. The two lists
 * underneath are there to undo a mistake somebody remembers making, which
 * is nearly always a recent one, so they show the latest and say how many
 * there are in all. The CSV holds every row either way.
 */
const SHOWN = 25;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Stamps are printed in IST rather than in whatever the machine is set to.
 *
 * This renders on a server, and on Vercel that server runs in UTC, so an
 * upload made at ten in the morning would be listed as half past four. The
 * queue is worked oldest first and these stamps are how an organiser checks
 * they are working it in order, so they have to read as the time the student
 * saw on their own screen.
 */
const ZONE = "Asia/Kolkata";

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONE,
  });
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: ZONE });
}

/** Whole days between the upload landing and this request. */
function waited(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const KIND: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

const PLACE_TONE: Record<string, ChipTone> = {
  first: "lime",
  second: "teal",
  third: "teal",
  participation: "muted",
};

/**
 * The moves offered, per state the certificate is in.
 *
 * Never the one it is already in. A button that writes back what is already
 * on the row reads like a decision and does nothing, which is how somebody
 * ends up certain they have dealt with a certificate they have not. Same
 * shape as MOVES on the entries page, and the same reasoning behind it.
 */
const MOVES = {
  waiting: [
    { to: "verify", label: "Verify", tone: "lime" },
    {
      to: "reject",
      label: "Turn it down",
      tone: "danger",
      confirm:
        "Turn this certificate down? It leaves the queue and stops coming back. The row stays on the student record, it still counts towards the ranking, and the file stays in Drive.",
    },
  ],
  verified: [
    { to: "reopen", label: "Put back in the queue", tone: "ghost" },
    {
      to: "reject",
      label: "Turn it down",
      tone: "danger",
      confirm: "Turn this certificate down instead? The student loses the verified mark on it.",
    },
  ],
  "turned down": [
    { to: "reopen", label: "Put back in the queue", tone: "ghost" },
    { to: "verify", label: "Verify", tone: "lime" },
  ],
} as const;

/**
 * Who the certificate belongs to, in the terms somebody can look a student up
 * by. A name on its own does not find a row on a class list, and the reason
 * an organiser is reading this page at all is to check that the name on the
 * file is the name on the row.
 */
function ownerLine(person: CertificateForOrganiser["owner"]): string {
  if (!person) return "Account deleted";
  const bits = [person.student_class, person.prn].filter(Boolean);
  return bits.length ? `${person.email} · ${bits.join(" · ")}` : person.email;
}

/**
 * One certificate, and the two moves that can be made on it.
 *
 * The event name is the link, deliberately, and not a small word at the end
 * of the row. Opening the file is the only thing that decides anything here,
 * and a link people have to hunt for is a link people stop using by the
 * fortieth row.
 *
 * A server component with server components inside it. Every control is an
 * ActionForm holding nothing but hidden inputs: nothing crosses into a
 * client component but strings, which is the rule that broke /admin/events
 * when it was last bent.
 */
function Record({ certificate }: { certificate: CertificateForOrganiser }) {
  const state = certificateState(certificate);
  const days = waited(certificate.created_at);

  const file = [
    certificate.file_name,
    KIND[certificate.mime_type] ?? "File",
    human(certificate.size_bytes),
    `uploaded ${stamp(certificate.created_at)}`,
  ].join(" · ");

  return (
    <li className="rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <a
            href={certificate.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[1.05rem] text-ink underline decoration-teal decoration-2 underline-offset-4 transition-colors hover:text-teal"
          >
            {certificate.event_name}
          </a>
          <p className="mt-1.5 text-[1.02rem] text-ink">
            {certificate.owner?.full_name ?? certificate.owner?.email ?? "Account deleted"}
          </p>
          <p className="label-sm mt-1 break-words text-muted">{ownerLine(certificate.owner)}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Chip tone={PLACE_TONE[certificate.contribution] ?? "muted"}>
            {CONTRIBUTION_LABEL[certificate.contribution] ?? certificate.contribution}
          </Chip>
          {certificate.prize_amount_inr ? (
            <Chip tone="ink">{rupees(certificate.prize_amount_inr)}</Chip>
          ) : null}
          {state === "waiting" && days >= 1 ? (
            <Chip tone="muted">{days === 1 ? "1 day waiting" : `${days} days waiting`}</Chip>
          ) : null}
        </div>
      </div>

      <p className="label-sm mt-3 break-words text-muted">{file}</p>

      {certificate.verified_at ? (
        <p className="label-sm mt-1 text-muted">
          {state === "verified" ? "Verified" : "Turned down"} {stamp(certificate.verified_at)}
          {certificate.verifier?.full_name ? ` by ${certificate.verifier.full_name}` : ""}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
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
            <input type="hidden" name="certificate_id" value={certificate.id} />
            <input type="hidden" name="decision" value={move.to} />
          </ActionForm>
        ))}
      </div>
    </li>
  );
}

/**
 * The certificate review queue.
 *
 * Every upload lands unverified and, until this page existed, stayed that
 * way: there was no screen that could mark one checked and the only way to
 * do it was to type into the table in the Supabase dashboard. The ranking
 * has been saying so on the student side ever since, which is honest and is
 * not an answer.
 *
 * Read the queue knowing what it does not do. The ranking counts a
 * certificate from the moment it is uploaded, so nothing decided here adds
 * or removes a single point: that rule lives in ranking_board() and moving
 * it is a migration. What this page changes is what the department can say
 * it has actually seen, and the verified mark the student reads on their own
 * record.
 *
 * Every number on the page is counted from the rows fetched for this
 * request. Nothing is cached and nothing is stored: the three lists are one
 * read of the table, split three ways, so the counts above them cannot
 * disagree with the rows underneath them.
 */
export default async function AdminCertificatesPage() {
  const viewer = await requireAdmin();
  const certificates = await getCertificatesForReview();

  // getCertificatesForReview returns oldest first, which is the order the
  // queue wants and the opposite of the one the two records want.
  const waiting = certificates.filter((c) => certificateState(c) === "waiting");
  const settled = certificates
    .filter((c) => certificateState(c) !== "waiting")
    .sort((a, b) => (b.verified_at ?? b.created_at).localeCompare(a.verified_at ?? a.created_at));

  const verified = settled.filter((c) => c.verified);
  const turnedDown = settled.filter((c) => !c.verified);

  const owners = new Set(certificates.map((c) => c.owner_id));
  const oldest = waiting[0];

  return (
    <>
      <ConsoleBar viewer={viewer} area="Certificates" nav={ADMIN_NAV} />

      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">{EVENT.host}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Certificates</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              Everything students have uploaded, oldest first. The file itself is in the
              department Drive and the row here is only the claim made about it, so opening the
              link is the only thing that actually decides anything.
            </p>
            <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
              Nothing on this page moves the ranking. The board counts a certificate from the
              moment it is uploaded, so verifying one adds no points and turning one down takes
              none away. What changes is what the department can say it has seen, and the mark the
              student reads on their own record.
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

          <div className="mt-10 grid gap-8">
            <Panel
              eyebrow="Queue"
              title="Waiting on a decision"
              aside={waiting.length ? `${waiting.length} to check` : undefined}
            >
              {waiting.length === 0 ? (
                <Empty>
                  Nothing is waiting. Every certificate on the site has been looked at by somebody.
                  Anything new arrives at the bottom of this list, because the queue is worked
                  oldest first.
                </Empty>
              ) : (
                <>
                  <p className="serif-it -mt-1 mb-5 text-[1.02rem] leading-relaxed text-muted">
                    Open the file, check the name on it against the name on the row and the claim
                    against what the certificate actually says, then verify it or turn it down.
                    Either way it leaves this list, which is the point: a certificate nobody can
                    finish deciding about comes back to the top of the queue every morning.
                  </p>

                  <ul className="grid gap-3">
                    {waiting.map((certificate) => (
                      <Record key={certificate.id} certificate={certificate} />
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            <Panel
              eyebrow="Record"
              title="Verified"
              aside={verified.length ? `${verified.length} in all` : undefined}
            >
              {verified.length === 0 ? (
                <Empty>
                  Nothing has been verified yet. Certificates move down here as they are checked,
                  so one that was marked in error can be put back in the queue.
                </Empty>
              ) : (
                <>
                  <p className="serif-it -mt-1 mb-5 text-[1.02rem] leading-relaxed text-muted">
                    Most recently decided first
                    {verified.length > SHOWN ? `, the latest ${SHOWN} of ${verified.length}` : ""}.
                    Putting one back in the queue clears the mark and the name against it, because
                    a row waiting to be checked should not carry a claim that somebody already
                    checked it.
                  </p>

                  <ul className="grid gap-3">
                    {verified.slice(0, SHOWN).map((certificate) => (
                      <Record key={certificate.id} certificate={certificate} />
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            <Panel
              eyebrow="Record"
              title="Turned down"
              aside={turnedDown.length ? `${turnedDown.length} in all` : undefined}
            >
              {turnedDown.length === 0 ? (
                <Empty>
                  Nothing has been turned down. A duplicate, a file for somebody else&apos;s event
                  or a screenshot of nothing belongs here rather than back at the top of the queue
                  tomorrow.
                </Empty>
              ) : (
                <>
                  <p className="serif-it -mt-1 mb-5 text-[1.02rem] leading-relaxed text-muted">
                    Most recently decided first
                    {turnedDown.length > SHOWN
                      ? `, the latest ${SHOWN} of ${turnedDown.length}`
                      : ""}
                    . Turning one down takes it out of the queue and nothing else: the row is still
                    on the student record, it still counts towards the ranking, and the file is
                    still in Drive. Deleting either of those is not built yet, so tell the student
                    through Questions if they need to know.
                  </p>

                  <ul className="grid gap-3">
                    {turnedDown.slice(0, SHOWN).map((certificate) => (
                      <Record key={certificate.id} certificate={certificate} />
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            <Panel eyebrow="Export" title="The whole table as CSV" aside="For the office">
              <p className="serif-it text-[1.02rem] leading-relaxed text-muted">
                One row per certificate, whatever state it is in, with the student it belongs to
                and the Drive link beside it. It is built when you press the button and kept
                nowhere, so it is never a stale copy of anything.
              </p>
              <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
                It carries real names, real addresses and real PRNs, the same as this page. It is
                for the department&apos;s own records and for anything that has to go to the
                office, and it should not travel any further than that.
              </p>

              {/*
                A plain anchor and not next/link. The other end is a route
                handler rather than a page, so there is nothing for the router
                to navigate to and typed routes will not accept it as a
                destination. The browser has to make an ordinary request and
                let Content-Disposition do its job.
              */}
              <a href="/admin/certificates/export" className="pill pill-ghost mt-6">
                Download CSV
              </a>
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
