import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { scoreTeam } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel, Row } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getChapters, getChapterSubmissions } from "@/lib/data/console";
import { handInFor } from "@/lib/data/hand-ins";
import { SUBMISSIONS_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Grade a chapter",
  robots: { index: false, follow: false },
};

/**
 * Grading, one chapter at a time.
 *
 * Reads every hand-in for the chapter and puts a score box next to each. File
 * links are signed for an hour on render rather than stored, so a link copied
 * out of this page stops working on its own.
 */
export default async function GradePage(props: PageProps<"/admin/grade/[chapterId]">) {
  await requireAdmin();
  await requireCap("events");
  const { chapterId } = await props.params;

  const chapters = await getChapters();
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const [submissions, supabase] = await Promise.all([
    getChapterSubmissions(chapterId),
    createClient(),
  ]);

  const spec = handInFor(chapterId);

  // One signed URL per file, minted for this render.
  const paths = submissions.flatMap((s) => s.files.map((f) => f.storage_path));
  const { data: signed } = paths.length
    ? await supabase.storage.from(SUBMISSIONS_BUCKET).createSignedUrls(paths, 60 * 60)
    : { data: [] };

  const urlFor = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));

  const { data: scores } = await supabase.from("scores").select("*").eq("chapter_id", chapterId);
  const scoreFor = new Map((scores ?? []).map((s) => [s.team_id, s]));

  const handedIn = submissions.filter((s) => s.status !== "draft");

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">Chapter {chapter.numeral}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">{chapter.title}</h1>
            <p className="serif-it mt-4 text-[1.05rem] leading-relaxed text-muted">
              {chapter.task}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Chip tone={chapter.state === "open" ? "teal" : "muted"}>{chapter.state}</Chip>
              <Chip tone="muted">{chapter.weight}% of the total</Chip>
              <Chip tone="muted">out of {chapter.max_points}</Chip>
              <Link href="/admin" className="label text-teal hover:underline">
                Back to command
              </Link>
            </div>
          </header>

          <p className="serif-it mt-8 text-[1.05rem] text-muted">
            {handedIn.length} handed in, {submissions.length - handedIn.length} still in draft.
          </p>

          {submissions.length === 0 ? (
            <div className="mt-6">
              <Empty>
                Nothing has been handed in for this chapter. Teams can only hand in while the
                chapter is open, so if that is unexpected, check its state on the command page.
              </Empty>
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              {submissions.map((submission) => {
                const payload = (submission.payload ?? {}) as Record<string, string>;
                const score = scoreFor.get(submission.team_id);

                return (
                  <Panel
                    key={submission.id}
                    eyebrow={submission.team?.seat ? `Seat ${submission.team.seat}` : "No seat"}
                    title={submission.team?.name ?? "Unknown team"}
                    aside={
                      <span className="flex flex-wrap items-center gap-2">
                        <Chip
                          tone={
                            submission.status === "locked"
                              ? "ink"
                              : submission.status === "submitted"
                                ? "lime"
                                : "muted"
                          }
                        >
                          {submission.status}
                        </Chip>
                        {score ? <Chip tone="teal">{score.points} pts</Chip> : null}
                      </span>
                    }
                  >
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                      <div>
                        {spec?.fields.map((field) =>
                          payload[field.name] ? (
                            <div key={field.name} className="mb-5 last:mb-0">
                              <p className="label text-muted">{field.label}</p>
                              <p className="mt-2 whitespace-pre-wrap rounded-[var(--r-md)] bg-cream-2 px-5 py-4 text-[0.95rem] leading-relaxed text-ink">
                                {payload[field.name]}
                              </p>
                            </div>
                          ) : null,
                        )}

                        {submission.files.length ? (
                          <div className="mt-5">
                            <p className="label text-muted">Files</p>
                            <ul className="mt-2 grid gap-2">
                              {submission.files.map((file) => {
                                const href = urlFor.get(file.storage_path);
                                return (
                                  <li key={file.id}>
                                    {href ? (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 rounded-[var(--r-md)] bg-cream-2 px-5 py-3 text-[0.95rem] text-teal hover:underline"
                                      >
                                        <Chip tone="muted">{file.kind}</Chip>
                                        <span className="min-w-0 truncate">
                                          {file.original_name}
                                        </span>
                                      </a>
                                    ) : (
                                      <span className="label-sm text-muted">
                                        {file.original_name}, link could not be signed
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}

                        <dl className="mt-6">
                          <Row
                            k="Handed in"
                            v={
                              submission.submitted_at
                                ? new Date(submission.submitted_at).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "Still a draft"
                            }
                          />
                        </dl>
                      </div>

                      <div className="rounded-[var(--r-md)] border-2 border-ink/10 p-6">
                        <ActionForm action={scoreTeam} submit="Save the score" tone="lime">
                          <input type="hidden" name="team_id" value={submission.team_id} />
                          <input type="hidden" name="chapter_id" value={chapterId} />

                          <label
                            htmlFor={`points-${submission.id}`}
                            className="label block text-ink"
                          >
                            Score out of {chapter.max_points}
                          </label>
                          <input
                            id={`points-${submission.id}`}
                            name="points"
                            type="number"
                            step="0.5"
                            min={0}
                            max={chapter.max_points}
                            defaultValue={score?.points ?? ""}
                            required
                            className="field mt-2.5"
                          />

                          <label
                            htmlFor={`notes-${submission.id}`}
                            className="label mt-4 block text-ink"
                          >
                            Notes
                          </label>
                          <textarea
                            id={`notes-${submission.id}`}
                            name="notes"
                            rows={3}
                            maxLength={600}
                            defaultValue={score?.notes ?? ""}
                            placeholder="Only organisers see this."
                            className="field mt-2.5 min-h-[4.5rem] resize-y py-3 leading-relaxed"
                          />
                        </ActionForm>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
