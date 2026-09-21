import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { AnswerBox } from "@/components/console/answer-box";
import { Chip, Empty, Panel, Stat } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { TOPIC_LABEL } from "@/lib/console/options";
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

/**
 * How many settled questions the record shows.
 *
 * The same six questions arrive hundreds of times, so this list grows without
 * limit and nobody scrolls it. The page says plainly how many there are in
 * total and shows the most recent of them.
 */
const SHOWN = 20;

const DAY = 24 * 60 * 60 * 1000;

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

/** Whole days between the question being asked and this request. */
function waited(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

/**
 * Who asked, in the terms an organiser can actually look somebody up by.
 * A name alone does not find a row on a class list, and most of what gets
 * asked here is a question about one particular record.
 */
function askerLine(person: QueryForOrganiser["author"]): string {
  if (!person) return "Account deleted";
  const bits = [person.student_class, person.prn].filter(Boolean);
  return bits.length ? `${person.email} · ${bits.join(" · ")}` : person.email;
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
 * Every number here is counted from the rows fetched for this request. There
 * is nothing on this page that decides anything: the admin update policy on
 * `queries` is what lets an answer be written, and it is checked by Postgres
 * on the row rather than by anything here.
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
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">{EVENT.host}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Questions</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              Everything students have sent the committee, oldest first. Only the person who asked
              and an organiser can read a question, and the answer lands on their own console
              rather than in their inbox.
            </p>
            <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
              Work it from the top. A student may have {CEILING} questions waiting at once and no
              more, so a queue nobody clears does not pile up where anyone can see it: it stops the
              people who asked first from asking anything else.
            </p>
          </header>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              value={open.length}
              label="Waiting"
              note={oldest ? `Oldest asked ${day(oldest.created_at)}` : "Nothing waiting"}
            />
            <Stat value={perAsker.size} label="Students waiting" note="With at least one open" />
            <Stat
              value={stuck}
              label="Out of room"
              note={`${CEILING} waiting, cannot ask again`}
            />
            <Stat value={settled.length} label="Answered" note="Over the whole event" />
          </div>

          <div className="mt-10 grid gap-8">
            <Panel
              eyebrow="Queue"
              title="Waiting on an answer"
              aside={open.length ? `${open.length} in the queue` : undefined}
            >
              {open.length === 0 ? (
                <Empty>
                  Nothing is waiting. Every question that has been asked has an answer on it.
                  Anything new arrives at the bottom of this list, because the queue is worked
                  oldest first.
                </Empty>
              ) : (
                <ul className="grid gap-5">
                  {open.map((query) => {
                    const days = waited(query.created_at);
                    const held = perAsker.get(query.author_id) ?? 0;

                    return (
                      <li
                        key={query.id}
                        className="rounded-[var(--r-md)] border-2 border-ink/10 px-6 py-5"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                          <h3 className="label text-ink">{query.subject}</h3>
                          <span className="flex flex-wrap items-center gap-2">
                            <Chip tone="teal">{TOPIC_LABEL[query.topic] ?? "Something else"}</Chip>
                            {days >= 1 ? (
                              <Chip tone="muted">
                                {days === 1 ? "1 day waiting" : `${days} days waiting`}
                              </Chip>
                            ) : null}
                            {held >= CEILING ? <Chip tone="red">out of room</Chip> : null}
                          </span>
                        </div>

                        <p className="mt-2 text-[1.02rem] text-ink">
                          {query.author?.full_name ?? query.author?.email ?? "Unknown"}
                        </p>
                        <p className="label-sm mt-1 break-words text-muted">
                          {askerLine(query.author)}
                        </p>
                        <p className="label-sm mt-1 text-muted">Asked {stamp(query.created_at)}</p>

                        <p className="mt-4 whitespace-pre-line rounded-[var(--r-md)] bg-cream-2 px-5 py-4 text-[0.98rem] leading-relaxed text-ink">
                          {query.body}
                        </p>

                        <div className="mt-5 border-t border-ink/10 pt-5">
                          <AnswerBox queryId={query.id} answer={query.answer} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              eyebrow="Record"
              title="Answered"
              aside={settled.length ? `${settled.length} in all` : undefined}
            >
              {settled.length === 0 ? (
                <Empty>
                  No question has been answered yet. Answered ones move down here, so what was said
                  can be read back and corrected if it was wrong.
                </Empty>
              ) : (
                <>
                  <p className="serif-it -mt-1 mb-5 text-[1.02rem] leading-relaxed text-muted">
                    Most recently answered first
                    {settled.length > SHOWN ? `, the latest ${SHOWN} of ${settled.length}` : ""}.
                    Opening one shows what was asked and what went back. The answer box is there a
                    second time on purpose: an answer that was wrong is corrected by writing over
                    it, and the student reads the replacement rather than a second message.
                  </p>

                  <ul className="grid gap-3">
                    {settled.slice(0, SHOWN).map((query) => (
                      <li
                        key={query.id}
                        className="rounded-[var(--r-md)] border-2 border-ink/10 px-6 py-4"
                      >
                        <details>
                          <summary className="cursor-pointer marker:text-muted">
                            <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                              <span className="min-w-0">
                                <span className="label block text-ink">{query.subject}</span>
                                <span className="label-sm mt-1 block break-words text-muted">
                                  {query.author?.full_name ?? query.author?.email ?? "Unknown"}
                                  {query.answered_at
                                    ? ` · answered ${day(query.answered_at)}`
                                    : ""}
                                  {query.answerer?.full_name
                                    ? ` by ${query.answerer.full_name}`
                                    : ""}
                                </span>
                              </span>
                              <Chip tone={query.status === "closed" ? "muted" : "lime"}>
                                {query.status}
                              </Chip>
                            </span>
                          </summary>

                          <div className="mt-5 border-t border-ink/10 pt-5">
                            <p className="label-sm text-muted">
                              {TOPIC_LABEL[query.topic] ?? "Something else"} · asked{" "}
                              {stamp(query.created_at)}
                            </p>
                            <p className="mt-3 whitespace-pre-line text-[0.98rem] leading-relaxed text-ink/80">
                              {query.body}
                            </p>

                            {query.answer ? (
                              <div className="mt-4 border-l-2 border-teal pl-5">
                                <p className="label-sm text-teal">What went back</p>
                                <p className="mt-2 whitespace-pre-line text-[0.98rem] leading-relaxed text-ink">
                                  {query.answer}
                                </p>
                              </div>
                            ) : (
                              <p className="serif-it mt-4 text-[0.92rem] leading-relaxed text-muted">
                                This one was moved out of the queue without an answer on it, so the
                                student has been told nothing. Writing one below puts it right.
                              </p>
                            )}

                            <div className="mt-5 border-t border-ink/10 pt-5">
                              <AnswerBox queryId={query.id} answer={query.answer} />
                            </div>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
