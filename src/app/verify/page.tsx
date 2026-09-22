import type { Metadata } from "next";

import { reviewRecord } from "@/app/actions/verify";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { AnswerBox } from "@/components/console/answer-box";
import { FilterList, type Facet, type ListRow } from "@/components/console/filter-list";
import {
  QuestionDetail,
  QuestionSummary,
  RecordDetail,
  RecordSummary,
} from "@/components/console/queue-parts";
import { Empty, Stat } from "@/components/console/shell";
import { requireVerifier } from "@/lib/auth/guard";
import { TOPICS } from "@/lib/console/options";
import { LAYOUTS, LEVELS } from "@/lib/console/records";
import { recordState } from "@/lib/console/record-view";
import {
  getQuestionsToAnswer,
  getRecordsToCheck,
  type QuestionToAnswer,
  type RecordToCheck,
} from "@/lib/data/verify";
import { CESAC } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Checking records",
  robots: { index: false, follow: false },
};

/** How many questions one student may have waiting at once. */
const CEILING = 5;

const RECORD_FACETS: readonly Facet[] = [
  {
    name: "kind",
    label: "Kind",
    options: LAYOUTS.map((l) => ({ value: l.kind, label: l.label })),
  },
  {
    name: "level",
    label: "Level",
    options: LEVELS.map((l) => ({ value: l.value, label: l.label })),
  },
  {
    name: "proof",
    label: "Proof",
    options: [
      { value: "yes", label: "Has a file" },
      { value: "no", label: "Nothing attached" },
    ],
  },
];

const STATE_FACET: Facet = {
  name: "state",
  label: "Decision",
  options: [
    { value: "verified", label: "Verified" },
    { value: "turned down", label: "Turned down" },
  ],
};

const TOPIC_FACET: Facet = {
  name: "topic",
  label: "About",
  options: TOPICS.map((t) => ({ value: t.value, label: t.label })),
};

/** Everything the search box on a record should look through. */
function recordHaystack(record: RecordToCheck): string {
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function questionHaystack(query: QuestionToAnswer): string {
  return [
    query.subject,
    query.body,
    query.answer,
    query.author?.full_name,
    query.author?.email,
    query.author?.prn,
    query.author?.student_class,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

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

function recordRow(record: RecordToCheck): ListRow {
  const state = recordState(record);

  const actions = MOVES[state].map((move) => (
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
  ));

  return {
    id: record.id,
    facets: {
      state,
      kind: record.kind,
      level: record.level ?? "other",
      proof: record.drive_link || record.files.length ? "yes" : "no",
    },
    search: recordHaystack(record),
    summary: (
      <RecordSummary
        record={record}
        owner={record.owner}
        files={record.files}
        actions={actions}
      />
    ),
    detail: <RecordDetail record={record} owner={record.owner} files={record.files} />,
  };
}

function questionRow(query: QuestionToAnswer, outOfRoom: boolean): ListRow {
  return {
    id: query.id,
    facets: { status: query.status, topic: query.topic },
    search: questionHaystack(query),
    summary: <QuestionSummary query={query} asker={query.author} outOfRoom={outOfRoom} />,
    detail: (
      <QuestionDetail query={query} asker={query.author}>
        <div className="mt-5 border-t border-ink/10 pt-5">
          <AnswerBox queryId={query.id} answer={query.answer} />
        </div>
      </QuestionDetail>
    ),
  };
}

/**
 * The verifier console, and the whole of it.
 *
 * Two jobs, and they are the same job seen twice: check what students have
 * filed, and answer what they ask about it. Most of what arrives on the
 * questions desk is somebody asking whether their certificate has been
 * counted, so the person checking the certificates is the person who can
 * answer it.
 *
 * A verifier cannot open the organiser console, edit the site, see a payment
 * or read the audit log, and that is not because those links are missing from
 * this page: their role fails `is_admin()`, which is the test every one of
 * those is gated on in Postgres. Hiding a link is a courtesy; the database is
 * the lock.
 *
 * What they can change is narrower still. Two functions, `verify_record` and
 * `answer_question`, and nothing else. A trigger refuses any other edit to a
 * record from a verifier by comparing the row before and after with the three
 * verification columns taken out, and there is no update policy on `queries`
 * for them at all.
 */
export default async function VerifyPage() {
  const viewer = await requireVerifier();
  const [records, questions] = await Promise.all([getRecordsToCheck(), getQuestionsToAnswer()]);

  const waiting = records.filter((r) => recordState(r) === "waiting");
  const settled = records.filter((r) => recordState(r) !== "waiting");
  const verified = records.filter((r) => recordState(r) === "verified");
  const mine = records.filter((r) => r.verified_by === viewer.id).length;

  const openQuestions = questions.filter((q) => q.status === "open");
  const answered = questions.filter((q) => q.status !== "open");

  // How many each person is holding, so the ones who cannot ask again are
  // marked. The ceiling is a database trigger; this only reports it.
  const held = new Map<string, number>();
  for (const query of openQuestions) {
    held.set(query.author_id, (held.get(query.author_id) ?? 0) + 1);
  }

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[54ch]">
          <Label tone="teal">{CESAC.abbr}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">The queue</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Signed in as {viewer.name}. Two lists: what students have filed, and what they have
            asked. Open a row to see everything it claims and the files behind it. Nothing else on
            the site is yours to change, which is the point of this account.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat value={waiting.length} label="To check" note="Nobody has decided" />
          <Stat value={verified.length} label="Verified" note="Checked and agreed" />
          <Stat value={mine} label="By you" note="Records you decided" />
          <Stat value={openQuestions.length} label="Questions" note="Waiting on an answer" />
          <Stat value={answered.length} label="Answered" note="Over the whole year" />
        </div>

        <div className="mt-6 grid gap-6">
          <FilterList
            eyebrow="The work"
            title="Records waiting on a check"
            noun="record"
            blurb="Open the files, check the row says what they say, then verify it or turn it down. A record with nothing attached is the one worth looking at hardest."
            facets={RECORD_FACETS}
            rows={waiting.map(recordRow)}
            searchPlaceholder="Title, student, PRN, journal, organiser"
            empty={
              <Empty>
                Nothing is waiting. Every record filed so far has been decided on. This fills up
                again the moment a student uploads something.
              </Empty>
            }
          />

          <FilterList
            eyebrow="The desk"
            title="Questions waiting on an answer"
            noun="question"
            blurb={`Worked oldest first, and that is the whole design: a student may have ${CEILING} questions waiting at once and no more, so a queue nobody clears stops the people who asked first from asking anything else.`}
            facets={[TOPIC_FACET]}
            rows={openQuestions.map((query) =>
              questionRow(query, (held.get(query.author_id) ?? 0) >= CEILING),
            )}
            searchPlaceholder="Subject, what they wrote, student, PRN"
            empty={
              <Empty>
                Nothing is waiting. Every question that has been asked has an answer on it.
              </Empty>
            }
          />

          <FilterList
            eyebrow="Settled"
            title="Records already decided"
            noun="record"
            startFolded
            blurb="Verified and turned down together. Anything here can be put back in the queue, which is how a decision made too quickly gets undone."
            facets={[STATE_FACET, ...RECORD_FACETS]}
            rows={settled.map(recordRow)}
            searchPlaceholder="Title, student, PRN, journal, organiser"
            empty={<Empty>Nothing has been decided yet.</Empty>}
          />

          <FilterList
            eyebrow="Settled"
            title="Questions already answered"
            noun="question"
            startFolded
            blurb="What was said, and room to say it again differently. An answer that was wrong is corrected by writing over it: the student reads the replacement rather than a second message contradicting the first."
            facets={[TOPIC_FACET]}
            rows={answered.map((query) => questionRow(query, false))}
            searchPlaceholder="Subject, what they wrote, the answer, student"
            empty={<Empty>No question has been answered yet.</Empty>}
          />
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
