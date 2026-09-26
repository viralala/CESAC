import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { AnswerBox } from "@/components/console/answer-box";
import { FilterList, type Facet, type ListRow } from "@/components/console/filter-list";
import { QuestionDetail, QuestionSummary } from "@/components/console/queue-parts";
import { Empty, Stat } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { stamp } from "@/lib/console/record-view";
import { EVENT } from "@/lib/data/event";
import { getQueryQueue, type QueryForOrganiser } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Questions",
  robots: { index: false, follow: false },
};

/**
 * How many questions one student may have waiting at once.
 *
 * The rule itself is a check on the table and it is the database's to
 * enforce; this restates it so the page can say how many people have run out
 * of room. If the two ever disagree, the database is right and this is a bug.
 */
const CEILING = 5;


const STATUS_FACET: Facet = {
  name: "status",
  label: "State",
  options: [
    { value: "answered", label: "Answered" },
    { value: "closed", label: "Closed" },
  ],
};

function day(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
}

function haystack(query: QueryForOrganiser): string {
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

function row(query: QueryForOrganiser, outOfRoom: boolean): ListRow {
  return {
    id: query.id,
    facets: { status: query.status },
    search: haystack(query),
    summary: <QuestionSummary query={query} asker={query.author} outOfRoom={outOfRoom} />,
    detail: (
      <QuestionDetail query={query} asker={query.author}>
        {query.answered_at ? (
          <p className="label-sm mt-3 text-muted">
            Answered {stamp(query.answered_at)}
            {query.answerer?.full_name ? ` by ${query.answerer.full_name}` : ""}
          </p>
        ) : null}
        <div className="mt-5 border-t border-ink/10 pt-5">
          <AnswerBox queryId={query.id} answer={query.answer} />
        </div>
      </QuestionDetail>
    ),
  };
}

/**
 * The questions desk.
 *
 * Until this page existed the only way to answer a student was to type into
 * the `queries` table in the Supabase dashboard, so in practice nobody was
 * answered. The queue is worked oldest first, and that is the whole design:
 * a student may have five questions waiting at once and no more, so an
 * unworked queue does not pile up visibly, it quietly stops the people who
 * asked first from asking anything else.
 *
 * Two lists since 22 September, each of them searchable and foldable whole.
 * The same six questions arrive hundreds of times, so the settled list grows
 * without limit and nobody scrolls it; being able to shut it and to search it
 * is the difference between a record and a wall. It used to filter by topic
 * as well, until the student form stopped asking for one: a question now
 * carries a title the student typed, and the search box reads that.
 *
 * Nothing on this page decides anything by itself. `answer_question` in the
 * database checks whether whoever is asking may answer at all, which is what
 * lets the verifier console share this desk.
 */
export default async function QueriesPage() {
  await requireAdmin();
  await requireCap("queries");
  const queries = await getQueryQueue();

  // getQueryQueue returns oldest first, which is the order the waiting list
  // wants and the opposite of the one the record wants.
  const open = queries.filter((query) => query.status === "open");
  const settled = queries
    .filter((query) => query.status !== "open")
    .sort((a, b) => (b.answered_at ?? b.created_at).localeCompare(a.answered_at ?? a.created_at));

  const perAsker = new Map<string, number>();
  for (const query of open) {
    perAsker.set(query.author_id, (perAsker.get(query.author_id) ?? 0) + 1);
  }
  const stuck = [...perAsker.values()].filter((n) => n >= CEILING).length;

  const oldest = open[0];

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Questions</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Everything students have asked, oldest first, visible only to them and the committee.
          </p>
          <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
            Work from the top, because a student with {CEILING} open questions cannot ask another.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            value={open.length}
            label="Waiting"
            note={oldest ? `Oldest asked ${day(oldest.created_at)}` : "Nothing waiting"}
          />
          <Stat value={perAsker.size} label="Students waiting" note="With at least one open" />
          <Stat value={stuck} label="Out of room" note={`${CEILING} waiting, cannot ask again`} />
          <Stat value={settled.length} label="Answered" note="Over the whole year" />
        </div>

        <div className="mt-10 grid gap-6">
          <FilterList
            eyebrow="Queue"
            title="Waiting on an answer"
            noun="question"
            blurb="Open one to reply, and edit a standard reply before sending it."
            facets={[]}
            rows={open.map((query) =>
              row(query, (perAsker.get(query.author_id) ?? 0) >= CEILING),
            )}
            searchPlaceholder="Title, what they wrote, student, PRN"
            empty={
              <Empty>
                Nothing is waiting, and anything new arrives here, oldest first.
              </Empty>
            }
          />

          <FilterList
            eyebrow="Record"
            title="Answered"
            noun="question"
            startFolded
            blurb="Most recently answered first, and writing over an answer replaces what the student reads."
            facets={[STATUS_FACET]}
            rows={settled.map((query) => row(query, false))}
            searchPlaceholder="Title, what they wrote, the answer, student"
            empty={
              <Empty>
                No question has been answered yet, and answered ones move down here.
              </Empty>
            }
          />
        </div>
      </Container>
    </div>
  );
}
