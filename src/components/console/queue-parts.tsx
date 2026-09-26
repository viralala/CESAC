import type { ReactNode } from "react";

import { Chip, type ChipTone } from "@/components/console/shell";
import { CONTRIBUTION_LABEL, TOPIC_LABEL, rupees } from "@/lib/console/options";
import { KIND_LABEL, LEVEL_LABEL, SLOT_LABEL, isPublication } from "@/lib/console/records";
import { FILE_KIND, humanBytes, recordFacts, recordState, stamp, waited } from "@/lib/console/record-view";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * The two rows both consoles show, in one place.
 *
 * The organiser's records page and the verifier's queue print the same record
 * and the same question, with a different set of buttons on the end. They were
 * two copies of five hundred lines of markup for about a day, which is how
 * long it took for the first difference to creep in.
 *
 * Server components on purpose. They are handed to FilterList, which is a
 * client component, as already-rendered nodes: nothing crosses the boundary
 * but the payload React builds, so there is no function to serialize and no
 * repeat of what broke /admin/events.
 */

/** As much of a student as either console is allowed to see. */
export type QueuePerson = {
  full_name: string | null;
  email: string;
  prn?: string | null;
  student_class?: string | null;
  year?: string | null;
} | null;

export type QueueFile = Pick<Tables<"certificate_files">, "id" | "slot" | "drive_link">;

const PLACE_TONE: Record<string, ChipTone> = {
  first: "lime",
  second: "teal",
  third: "teal",
  participation: "muted",
};

const STATE_TONE: Record<string, ChipTone> = {
  waiting: "muted",
  verified: "lime",
  "turned down": "red",
};

/**
 * Who a row belongs to, in terms somebody can look them up by.
 *
 * A name on its own does not find a row on a class list, and the reason
 * anybody is reading either of these queues is to check that the name on the
 * file is the name on the row.
 */
export function personLine(person: QueuePerson): string {
  if (!person) return "Account deleted";
  const bits = [person.student_class, person.year, person.prn].filter(Boolean);
  return bits.length ? `${person.email} · ${bits.join(" · ")}` : person.email;
}

// ---------------------------------------------------------------------------
// A record
// ---------------------------------------------------------------------------

/**
 * The line a folded record shows.
 *
 * The buttons are here rather than in the detail below, because a queue is
 * worked by deciding and putting the verb behind a disclosure adds a click to
 * every row. What folds is the evidence, which you only need for the ones you
 * are not sure about.
 */
export function RecordSummary({
  record,
  owner,
  files,
  actions,
}: {
  record: Tables<"certificates">;
  owner: QueuePerson;
  files: readonly QueueFile[];
  actions?: ReactNode;
}) {
  const state = recordState(record);
  const days = waited(record.created_at);
  const attachments = files.length + (record.drive_link ? 1 : 0);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[1.02rem] leading-snug text-ink">{record.event_name}</p>
        <p className="label-sm mt-1 break-words text-muted">
          {owner?.full_name ?? owner?.email ?? "Account deleted"}
          {owner?.student_class ? ` · ${owner.student_class}` : ""}
          {attachments === 0 ? (
            <span className="text-red-deep"> · nothing attached</span>
          ) : (
            ` · ${attachments} ${attachments === 1 ? "file" : "files"}`
          )}
          {state === "waiting" && days >= 1 ? ` · ${days}d waiting` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Chip tone={STATE_TONE[state]}>{state}</Chip>
        <Chip tone="ink">{KIND_LABEL[record.kind] ?? record.kind}</Chip>
        {record.level ? <Chip tone="teal">{LEVEL_LABEL[record.level]}</Chip> : null}
        {isPublication(record.kind) ? null : (
          <Chip tone={PLACE_TONE[record.contribution] ?? "muted"}>
            {CONTRIBUTION_LABEL[record.contribution] ?? record.contribution}
          </Chip>
        )}
        {record.prize_amount_inr ? <Chip tone="ink">{rupees(record.prize_amount_inr)}</Chip> : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">{actions}</div>
      ) : null}
    </div>
  );
}

/** Everything the record claims, and the files behind it. */
export function RecordDetail({
  record,
  owner,
  files,
  children,
}: {
  record: Tables<"certificates">;
  owner: QueuePerson;
  files: readonly QueueFile[];
  /** Anything the page wants under the evidence. */
  children?: ReactNode;
}) {
  const state = recordState(record);
  const facts = recordFacts(record);

  const certificate =
    record.file_name && record.mime_type && record.size_bytes
      ? [record.file_name, FILE_KIND[record.mime_type] ?? "File", humanBytes(record.size_bytes)].join(
          " · ",
        )
      : null;

  return (
    <>
      <p className="label-sm break-words text-muted">{personLine(owner)}</p>

      {facts.length ? (
        <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-baseline gap-x-3">
              <dt className="label-sm text-muted">{k}</dt>
              <dd className="min-w-0 break-words text-[0.92rem] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* The proof. A record with nothing on it says so plainly rather than
          showing an empty strip, because a missing file is the single most
          important thing either console can notice. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/10 pt-4">
        <span className="label-sm text-muted">Proof</span>
        {record.drive_link ? (
          <a
            href={record.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="label-sm rounded-full border-2 border-teal/40 px-3.5 py-1.5 text-teal transition-colors hover:bg-teal hover:text-white"
          >
            The certificate
          </a>
        ) : null}
        {files.map((file) => (
          <a
            key={file.id}
            href={file.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-muted transition-colors hover:border-teal hover:text-teal"
          >
            {SLOT_LABEL[file.slot] ?? file.slot}
          </a>
        ))}
        {!record.drive_link && files.length === 0 ? (
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

      {children}
    </>
  );
}

// ---------------------------------------------------------------------------
// A question
// ---------------------------------------------------------------------------

export function QuestionSummary({
  query,
  asker,
  outOfRoom = false,
}: {
  query: Tables<"queries">;
  asker: QueuePerson;
  /** They are holding every slot they have, so they cannot ask again. */
  outOfRoom?: boolean;
}) {
  const days = waited(query.created_at);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[1.02rem] leading-snug text-ink">{query.subject}</p>
        <p className="label-sm mt-1 break-words text-muted">
          {asker?.full_name ?? asker?.email ?? "Unknown"}
          {asker?.student_class ? ` · ${asker.student_class}` : ""}
          {query.status === "open" && days >= 1 ? ` · ${days}d waiting` : ""}
          {query.answered_at ? ` · answered ${stamp(query.answered_at)}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Chip tone={query.status === "open" ? "muted" : query.status === "closed" ? "ink" : "lime"}>
          {query.status}
        </Chip>
        {/* Only a question asked before the title replaced the dropdown
            carries a bucket worth printing; everything since is "other". */}
        {query.topic !== "other" && TOPIC_LABEL[query.topic] ? (
          <Chip tone="teal">{TOPIC_LABEL[query.topic]}</Chip>
        ) : null}
        {outOfRoom ? <Chip tone="red">out of room</Chip> : null}
      </div>
    </div>
  );
}

/** What was asked, what went back, and room to write or correct an answer. */
export function QuestionDetail({
  query,
  asker,
  children,
}: {
  query: Tables<"queries">;
  asker: QueuePerson;
  children?: ReactNode;
}) {
  return (
    <>
      <p className="label-sm break-words text-muted">{personLine(asker)}</p>
      <p className="label-sm mt-1 text-muted">
        {query.topic !== "other" && TOPIC_LABEL[query.topic] ? `${TOPIC_LABEL[query.topic]} · ` : ""}
        asked {stamp(query.created_at)}
      </p>

      <p className="mt-3 whitespace-pre-line rounded-[var(--r-md)] bg-cream-2 px-5 py-4 text-[0.98rem] leading-relaxed text-ink">
        {query.body}
      </p>

      {query.answer ? (
        <div className="mt-4 border-l-2 border-teal pl-5">
          <p className="label-sm text-teal">What went back</p>
          <p className="mt-2 whitespace-pre-line text-[0.98rem] leading-relaxed text-ink">
            {query.answer}
          </p>
        </div>
      ) : query.status !== "open" ? (
        <p className="serif-it mt-4 text-[0.92rem] leading-relaxed text-muted">
          This left the queue unanswered, so write a reply below to tell the student.
        </p>
      ) : null}

      {children}
    </>
  );
}
