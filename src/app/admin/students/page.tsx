import type { Metadata } from "next";
import Link from "next/link";

import { clearPhoto, setAccountPassword } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel, Stat, type ChipTone } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getPasswordHold, searchStudents, type StudentForOrganiser } from "@/lib/data/students";

export const metadata: Metadata = {
  title: "Students",
  robots: { index: false, follow: false },
};

const ROLE_TONE: Record<StudentForOrganiser["role"], ChipTone> = {
  participant: "muted",
  admin: "teal",
  owner: "ink",
  verifier: "lime",
};

/** The page asked for in the address bar, or the first one. */
function pageFrom(value: string | string[] | undefined): number {
  const asked = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(asked) && asked >= 1 ? asked : 1;
}

/** The same search, a page further along. */
function hrefFor(term: string, page: number): string {
  const params = new URLSearchParams({ q: term });
  if (page > 1) params.set("page", String(page));
  return `/admin/students?${params}`;
}

/** The two things a class list is ordered by, for somebody holding one. */
function classAndPrn(student: StudentForOrganiser): string {
  const bits = [student.student_class, student.prn].filter(Boolean);
  return bits.length ? bits.join(" · ") : "No class or PRN on the row";
}

/**
 * The student directory.
 *
 * Every account on the site, and the one number that says whether the imported
 * passwords have been replaced yet. It reads and nothing more: an address is
 * the one field a student cannot change themselves and the database reverts a
 * change made anywhere but through auth, so a box here that looked like it
 * edited one would be lying about what it did.
 *
 * The search runs in Postgres from the query string, not in the browser from
 * a copy of the table. That is not a performance decision. Every row on this
 * page is somebody's real name, address and PRN, and the browser-side version
 * of this page would put all of them in the page source of a search for one.
 *
 * Organiser only, like every page in here, and robots are told to stay away
 * for the same reason.
 */
export default async function AdminStudentsPage(props: PageProps<"/admin/students">) {
  const viewer = await requireAdmin();
  await requireCap("people");

  // Who this organiser may set a password for. The database decides; this
  // only stops the console offering a form that would be refused.
  const mayRepassword = (student: StudentForOrganiser) =>
    student.id !== viewer.id &&
    student.role !== "owner" &&
    (student.role !== "admin" || viewer.role === "owner");
  const { q, page } = await props.searchParams;

  const asked = typeof q === "string" ? q.trim() : "";
  const [hold, found] = await Promise.all([
    getPasswordHold(),
    searchStudents(asked, pageFrom(page)),
  ]);

  // What the database was actually asked, which is not always what was typed:
  // a box holding nothing but punctuation has not searched for anything.
  const searched = found.term.length > 0;
  const firstShown = (found.page - 1) * found.pageSize + 1;
  const lastShown = firstShown + found.rows.length - 1;
  const pastTheEnd = searched && found.total > 0 && found.rows.length === 0;

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">Accounts</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Students</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              Every account, searchable by name, address, PRN or class, and read only.
            </p>
          </header>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat value={hold.accounts} label="Accounts" note="Every profile row" />
            <Stat
              value={hold.waiting}
              label="Still waiting"
              note="Holding an imported password"
            />
            <Stat value={hold.released} label="Set their own" note="Not held at the screen" />
          </div>

          <div className="mt-6 grid gap-6">
            <Panel
              eyebrow="Passwords"
              title="The imported password"
              aside={hold.waiting > 0 ? "Window open" : "Window shut"}
            >
              {hold.waiting > 0 ? (
                <p className="serif-it text-[1.02rem] leading-relaxed text-muted">
                  {hold.waiting} of {hold.accounts} imported accounts still use their own email as the password, so
                  any classmate could sign in to them until this reaches zero.
                </p>
              ) : (
                <p className="serif-it text-[1.02rem] leading-relaxed text-muted">
                  No account is still on its imported password, and the database keeps it that way.
                </p>
              )}

              <p className="serif-it mt-4 text-[1.02rem] leading-relaxed text-muted">
                {hold.released} accounts are past the change-password screen, including any made through Google
                or before the check existed.
              </p>
            </Panel>

            <Panel
              eyebrow="Directory"
              title="Find a student"
              aside={
                searched ? `${found.total} ${found.total === 1 ? "match" : "matches"}` : undefined
              }
            >
              {/*
                A plain GET form, on purpose. The search belongs in the address
                bar: an organiser can send a colleague the result, reload it, or
                go back to it, none of which a server action posting into this
                page would give them. It also means a new search always starts
                at the first page, because the form carries no page number.
              */}
              <form
                method="get"
                action="/admin/students"
                className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
              >
                <div>
                  <label htmlFor="q" className="label block text-ink">
                    Name, address, PRN or class
                  </label>
                  <input
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={asked}
                    autoComplete="off"
                    placeholder="Any part of one of them"
                    className="field mt-2.5"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button type="submit" className="pill">
                    Search
                  </button>
                  {searched ? (
                    <Link href="/admin/students" className="pill pill-ghost">
                      Clear
                    </Link>
                  ) : null}
                </div>
              </form>

              <div className="mt-7 border-t border-ink/10 pt-7">
                {!searched ? (
                  <Empty>
                    Type any part of a name, address, PRN or class to find a student.
                  </Empty>
                ) : found.total === 0 ? (
                  <Empty>
                    Nothing matched <span className="text-ink">{found.term}</span>, so try part of a
                    name, address, PRN or class.
                  </Empty>
                ) : pastTheEnd ? (
                  <Empty>
                    This search has only {found.pages} {found.pages === 1 ? "page" : "pages"}, so go{" "}
                    <Link href={hrefFor(asked, 1)} className="text-ink underline">
                      back to the first one
                    </Link>
                    .
                  </Empty>
                ) : (
                  <>
                    <p className="label-sm text-muted">
                      Showing {firstShown} to {lastShown} of {found.total}
                    </p>

                    <ul className="mt-4 grid gap-3">
                      {found.rows.map((student) => (
                        <li
                          key={student.id}
                          className="rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                            <div className="min-w-0">
                              <p className="text-[1.05rem] text-ink">
                                {student.full_name ?? "No name on the row"}
                              </p>
                              <p className="label-sm mt-1 break-words text-muted">
                                {student.email}
                              </p>
                              <p className="label-sm mt-0.5 text-muted">{classAndPrn(student)}</p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Chip tone={ROLE_TONE[student.role]}>{student.role}</Chip>
                              {student.must_change_password ? (
                                <Chip tone="red">imported password</Chip>
                              ) : (
                                <Chip tone="lime">own password</Chip>
                              )}
                            </div>
                          </div>

                          {mayRepassword(student) ? (
                            <details className="mt-3">
                              <summary className="label-sm cursor-pointer text-muted hover:text-ink">
                                Set a password, or remove their photo
                              </summary>
                              <ActionForm
                                action={setAccountPassword}
                                submit="Set the password"
                                tone="ghost"
                              >
                                <input type="hidden" name="email" value={student.email} />
                                <div className="mt-4 max-w-sm">
                                  <label
                                    htmlFor={`pw-${student.id}`}
                                    className="label block text-ink"
                                  >
                                    New password
                                  </label>
                                  <input
                                    id={`pw-${student.id}`}
                                    name="password"
                                    type="text"
                                    required
                                    minLength={8}
                                    maxLength={72}
                                    autoComplete="off"
                                    placeholder="At least 8 characters"
                                    className="field mt-2.5"
                                  />
                                </div>
                                <label className="mt-3 flex cursor-pointer items-start gap-3">
                                  <input
                                    type="checkbox"
                                    name="must_change"
                                    defaultChecked
                                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--teal)]"
                                  />
                                  <span className="text-[0.9rem] leading-snug text-ink">
                                    Make them choose their own at their next sign-in
                                  </span>
                                </label>
                              </ActionForm>

                              {student.role === "participant" ? (
                                <div className="mt-4 border-t border-ink/10 pt-3">
                                  <ActionForm
                                    action={clearPhoto}
                                    submit="Remove their photo"
                                    tone="danger"
                                    confirm={`Take the photo off ${student.email}? They are asked for a new one next time they open their console.`}
                                  >
                                    <input type="hidden" name="profile_id" value={student.id} />
                                  </ActionForm>
                                </div>
                              ) : null}
                            </details>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {found.pages > 1 ? (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
                        <p className="label-sm text-muted">
                          Page {found.page} of {found.pages}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {found.page > 1 ? (
                            <Link
                              href={hrefFor(asked, found.page - 1)}
                              className="pill pill-ghost"
                            >
                              Previous
                            </Link>
                          ) : null}
                          {found.page < found.pages ? (
                            <Link
                              href={hrefFor(asked, found.page + 1)}
                              className="pill pill-ghost"
                            >
                              Next
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
