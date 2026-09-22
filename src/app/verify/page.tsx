import type { Metadata } from "next";

import { reviewRecord } from "@/app/actions/verify";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel, Stat, type ChipTone } from "@/components/console/shell";
import { requireVerifier } from "@/lib/auth/guard";
import { CONTRIBUTION_LABEL, rupees } from "@/lib/console/options";
import { KIND_LABEL, LEVEL_LABEL, SLOT_LABEL, isPublication } from "@/lib/console/records";
import {
  FILE_KIND,
  humanBytes,
  recordFacts,
  recordState,
  stamp,
  waited,
} from "@/lib/console/record-view";
import { getRecordsToCheck, type RecordToCheck } from "@/lib/data/verify";
import { CESAC } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Checking records",
  robots: { index: false, follow: false },
};

/**
 * How many settled records the two lists underneath show.
 *
 * The queue itself is never cut short, because it is the work and a row hidden
 * below a limit is a row nobody ever decides about. The settled lists are
 * there to undo a mistake somebody remembers making, which is nearly always a
 * recent one.
 */
const SHOWN = 25;

const PLACE_TONE: Record<string, ChipTone> = {
  first: "lime",
  second: "teal",
  third: "teal",
  participation: "muted",
};

/**
 * The moves offered, per state the record is in. Never the one it is already
 * in: a button that writes back what is already on the row reads like a
 * decision and does nothing, which is how somebody ends up certain they have
 * dealt with a record they have not.
 */
const MOVES = {
  waiting: [
    { to: "verify", label: "Verify", tone: "lime" as const },
    {
      to: "reject",
      label: "Turn it down",
      tone: "danger" as const,
      confirm:
        "Turn this record down? It leaves the queue and stops coming back. The row stays on the student record and the files stay where they are.",
    },
  ],
  verified: [{ to: "reopen", label: "Put back in the queue", tone: "ghost" as const }],
  "turned down": [
    { to: "reopen", label: "Put back in the queue", tone: "ghost" as const },
    { to: "verify", label: "Verify", tone: "lime" as const },
  ],
};

/**
 * Who the record belongs to, in terms somebody can look a student up by.
 *
 * A name on its own does not find a row on a class list, and the reason a
 * verifier is reading this page at all is to check that the name on the file
 * is the name on the row.
 */
function ownerLine(person: RecordToCheck["owner"]): string {
  if (!person) return "Account deleted";
  const bits = [person.student_class, person.year, person.prn].filter(Boolean);
  return bits.length ? `${person.email} · ${bits.join(" · ")}` : person.email;
}

/**
 * One record, everything it claims, and the moves that can be made on it.
 *
 * Every file is a link and every link opens in its own tab, because opening
 * the proof is the only thing that decides anything here. A server component
 * with server components inside it: every control is an ActionForm holding
 * nothing but hidden inputs, so nothing but strings crosses into a client
 * component.
 */
function Card({ record }: { record: RecordToCheck }) {
  const state = recordState(record);
  const days = waited(record.created_at);
  const facts = recordFacts(record);

  const certificate =
    record.file_name && record.mime_type && record.size_bytes
      ? [record.file_name, FILE_KIND[record.mime_type] ?? "File", humanBytes(record.size_bytes)].join(
          " · ",
        )
      : null;

  return (
    <li className="rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[1.15rem] leading-snug text-ink">{record.event_name}</p>
          <p className="mt-1.5 text-[1.02rem] text-ink">
            {record.owner?.full_name ?? record.owner?.email ?? "Account deleted"}
          </p>
          <p className="label-sm mt-1 break-words text-muted">{ownerLine(record.owner)}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Chip tone="ink">{KIND_LABEL[record.kind] ?? record.kind}</Chip>
          {record.level ? <Chip tone="teal">{LEVEL_LABEL[record.level]}</Chip> : null}
          {isPublication(record.kind) ? null : (
            <Chip tone={PLACE_TONE[record.contribution] ?? "muted"}>
              {CONTRIBUTION_LABEL[record.contribution] ?? record.contribution}
            </Chip>
          )}
          {record.prize_amount_inr ? <Chip tone="ink">{rupees(record.prize_amount_inr)}</Chip> : null}
          {state === "waiting" && days >= 1 ? (
            <Chip tone="muted">{days === 1 ? "1 day waiting" : `${days} days waiting`}</Chip>
          ) : null}
        </div>
      </div>

      {facts.length ? (
        <dl className="mt-4 grid gap-x-6 gap-y-1 border-t border-ink/10 pt-4 sm:grid-cols-2">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-baseline gap-x-3">
              <dt className="label-sm text-muted">{k}</dt>
              <dd className="min-w-0 break-words text-[0.92rem] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* The proof, all of it in one row. A record with nothing attached says
          so plainly rather than showing an empty strip, because a missing file
          is the single most important thing a verifier can notice. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4">
        <span className="label-sm text-muted">Proof</span>
        {record.drive_link ? (
          <a
            href={record.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="pill pill-ghost"
          >
            The certificate
          </a>
        ) : null}
        {record.files.map((file) => (
          <a
            key={file.id}
            href={file.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="pill pill-ghost"
          >
            {SLOT_LABEL[file.slot] ?? file.slot}
          </a>
        ))}
        {!record.drive_link && record.files.length === 0 ? (
          <span className="label-sm text-red-deep">Nothing attached</span>
        ) : null}
      </div>

      <p className="label-sm mt-3 break-words text-muted">
        {certificate ? `${certificate} · ` : ""}
        Filed {stamp(record.created_at)}
        {record.verified_at
          ? ` · ${state === "verified" ? "verified" : "turned down"} ${stamp(record.verified_at)}`
          : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {MOVES[state].map((move) => (
          <ActionForm
            key={move.to}
            action={reviewRecord}
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
      </div>
    </li>
  );
}

/**
 * The verifier console, and the whole of it.
 *
 * One page with one job. A verifier cannot open the organiser console, edit
 * the site, see a payment or read the audit log, and that is not because those
 * links are missing from this page: their role fails `is_admin()`, which is
 * the test every one of those is gated on in Postgres. Hiding a link is a
 * courtesy; the database is the lock.
 *
 * What they can change is narrower still. The only write available to them is
 * `verify_record`, and a trigger refuses any other edit to a record from a
 * verifier by comparing the row before and after with the three verification
 * columns taken out.
 */
export default async function VerifyPage() {
  const viewer = await requireVerifier();
  const records = await getRecordsToCheck();

  const waiting = records.filter((r) => recordState(r) === "waiting");
  const verified = records.filter((r) => recordState(r) === "verified");
  const refused = records.filter((r) => recordState(r) === "turned down");
  const mine = records.filter((r) => r.verified_by === viewer.id).length;

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[54ch]">
          <Label tone="teal">{CESAC.abbr}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">The queue</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Signed in as {viewer.name}. Every record a student files lands here. Open what they
            attached, check it says what the row says, and verify it or turn it down. Nothing else
            on the site is yours to change, which is the point of this account.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={waiting.length} label="Waiting" note="Nobody has decided yet" />
          <Stat value={verified.length} label="Verified" note="Checked and agreed" />
          <Stat value={refused.length} label="Turned down" note="Out of the queue" />
          <Stat value={mine} label="By you" note="Records you decided" />
        </div>

        <div className="mt-6 grid gap-6">
          <Panel
            eyebrow="The work"
            title="Waiting on a check"
            aside={
              waiting.length
                ? `${waiting.length} ${waiting.length === 1 ? "record" : "records"}`
                : undefined
            }
          >
            {waiting.length ? (
              <ul className="grid gap-4">
                {waiting.map((record) => (
                  <Card key={record.id} record={record} />
                ))}
              </ul>
            ) : (
              <Empty>
                Nothing is waiting. Every record filed so far has been decided on. This fills up
                again the moment a student uploads something.
              </Empty>
            )}
          </Panel>

          {verified.length ? (
            <Panel
              eyebrow="Settled"
              title="Verified"
              aside={`${verified.length} in all, latest ${Math.min(SHOWN, verified.length)} shown`}
            >
              <ul className="grid gap-4">
                {[...verified]
                  .reverse()
                  .slice(0, SHOWN)
                  .map((record) => (
                    <Card key={record.id} record={record} />
                  ))}
              </ul>
            </Panel>
          ) : null}

          {refused.length ? (
            <Panel
              eyebrow="Settled"
              title="Turned down"
              aside={`${refused.length} in all, latest ${Math.min(SHOWN, refused.length)} shown`}
            >
              <ul className="grid gap-4">
                {[...refused]
                  .reverse()
                  .slice(0, SHOWN)
                  .map((record) => (
                    <Card key={record.id} record={record} />
                  ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <p className="serif-it mt-8 max-w-[62ch] text-[0.98rem] leading-relaxed text-muted">
          Turning a record down does not take its points off the ranking. That is deliberate: the
          board counts what a student says they did, and a disputed claim is a thing the department
          has looked at rather than a thing it has deleted. If a row should never have existed at
          all, an organiser can remove it from their own console.
        </p>
      </Container>
    </div>
  );
}
