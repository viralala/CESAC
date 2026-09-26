import type { Metadata } from "next";

import {
  addOrganiserEmail,
  removeOrganiserEmail,
  setAccountPassword,
  setRole,
} from "@/app/actions/admin";
import { clearGrants, setGrants } from "@/app/actions/console-content";
import { addVerifier, removeVerifier, setVerifierPassword } from "@/app/actions/verifiers";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel, Stat } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { CAPS } from "@/lib/auth/caps";
import { stamp } from "@/lib/console/record-view";
import { getOrganisers } from "@/lib/data/console";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Access",
  robots: { index: false, follow: false },
};

/**
 * Who can do what, on one page.
 *
 * Three kinds of login, and they are three kinds and not three settings on one
 * kind. An **organiser** can open the console; a grant row narrows them to
 * named areas of it. A **verifier** is not a narrowed organiser at all but a
 * different role, so `is_admin()` is false for them and the 26 policies built
 * on it keep them out with no branch of their own. The **allowlist** is for
 * somebody who has no account yet: the address becomes an organiser the moment
 * it signs in, through any provider.
 *
 * All of it is enforced in Postgres. Hiding a control here is a courtesy to
 * somebody who cannot use it; the lock is `admin_can()` and the role column.
 */
export default async function AccessPage() {
  const viewer = await requireAdmin();
  await requireCap("people");

  const supabase = await createClient();

  const [organisers, verifiers, allowlist, grants] = await Promise.all([
    getOrganisers(),
    supabase.rpc("admin_verifiers"),
    supabase.from("admin_emails").select("*").order("created_at"),
    supabase.from("admin_grants").select("*"),
  ]);

  // A grant row is a narrowing. No row means the whole console, which is why
  // this is a lookup and not a column on the profile.
  const grantFor = new Map((grants.data ?? []).map((row) => [row.profile_id, row]));
  const checkers = verifiers.data ?? [];

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">Who can do what</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,3.8rem)] text-ink">Access</h1>
          <p className="serif-it mt-4 text-[1.08rem] leading-relaxed text-muted">
            Organisers run this console, verifiers only check records and answer questions, and the
            allowlist is for people without an account yet.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={organisers.length} label="Organisers" note="Can open the console" />
          <Stat value={checkers.length} label="Verifiers" note="Records and questions" />
          <Stat value={grantFor.size} label="Narrowed" note="Held to some areas" />
          <Stat value={allowlist.data?.length ?? 0} label="Allowlisted" note="Organiser on sign-in" />
        </div>

        {/* ---------------------------------------------------------- passwords */}
        <div className="mt-6">
          <Panel eyebrow="Passwords" title="Set somebody's password">
            <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
              Set a new password for anyone locked out; their sessions end, and unless you untick
              the box they pick their own at next sign-in.
            </p>
            <p className="serif-it mt-3 text-[0.98rem] leading-relaxed text-muted">
              {viewer.role === "owner"
                ? "As the owner you can reset anyone's password except your own."
                : "You can reset a student's or a verifier's password; only the owner resets an organiser's."}
            </p>

            <ActionForm action={setAccountPassword} submit="Set the password" tone="solid">
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="reset-email" className="label block text-ink">
                    Their email
                  </label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="name.1251070000@vit.edu"
                    className="field mt-2.5"
                  />
                </div>
                <div>
                  <label htmlFor="reset-password" className="label block text-ink">
                    New password
                  </label>
                  <input
                    id="reset-password"
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
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="must_change"
                  defaultChecked
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--teal)]"
                />
                <span className="text-[0.92rem] leading-snug text-ink">
                  Make them choose their own at their next sign-in
                </span>
              </label>
              <p className="serif-it mt-3 text-[0.85rem] leading-relaxed text-muted">
                It is hashed on save and never written to the audit log.
              </p>
            </ActionForm>
          </Panel>
        </div>

        {/* ---------------------------------------------------------- verifiers */}
        <div className="mt-6">
          <Panel
            eyebrow="Checking"
            title="Verifiers"
            aside={checkers.length ? `${checkers.length} with a login` : undefined}
          >
            <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
              A verifier signs in at the same door, lands on{" "}
              <span className="font-mono text-[0.9rem] text-ink">/verify</span>, and can only check
              records and answer questions there.
            </p>
            <p className="serif-it mt-4 text-[0.98rem] leading-relaxed text-muted">
              The database refuses them everything else, including this console, payments and the
              site.
            </p>

            {checkers.length ? (
              <ul className="mt-6 grid gap-3">
                {checkers.map((person) => (
                  <li key={person.id} className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="min-w-0 flex-1">
                        <span className="label block truncate text-ink">
                          {person.full_name ?? person.email}
                        </span>
                        <span className="label-sm block truncate text-muted">{person.email}</span>
                      </span>
                      <Chip tone="teal">verifier</Chip>
                      <Chip tone={person.checked > 0 ? "lime" : "muted"}>
                        {person.checked} checked
                      </Chip>
                      <ActionForm
                        action={removeVerifier}
                        submit="Remove"
                        tone="danger"
                        className="contents"
                        confirm={`Remove the verifier login for ${person.email}? Records they have already checked stay checked.`}
                      >
                        <input type="hidden" name="profile_id" value={person.id} />
                      </ActionForm>
                    </div>

                    <p className="label-sm mt-2 text-muted">Added {stamp(person.created_at)}</p>

                    <details className="mt-3">
                      <summary className="label-sm cursor-pointer text-muted hover:text-ink">
                        Set a new password
                      </summary>
                      <ActionForm
                        action={setVerifierPassword}
                        submit="Change the password"
                        tone="ghost"
                      >
                        <input type="hidden" name="profile_id" value={person.id} />
                        <div className="mt-4 max-w-sm">
                          <label
                            htmlFor={`pw-${person.id}`}
                            className="label block text-ink"
                          >
                            New password
                          </label>
                          <input
                            id={`pw-${person.id}`}
                            name="password"
                            type="text"
                            required
                            minLength={8}
                            autoComplete="off"
                            placeholder="At least 8 characters"
                            className="field mt-2.5"
                          />
                          <p className="serif-it mt-2 text-[0.85rem] leading-relaxed text-muted">
                            Their old password stops working the moment this saves.
                          </p>
                        </div>
                      </ActionForm>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6">
                <Empty>
                  Nobody holds a verifier login yet, so add one below to share the checking.
                </Empty>
              </div>
            )}

            <div className="mt-7 border-t border-ink/10 pt-6">
              <p className="label text-ink">Add a verifier</p>
              <p className="serif-it mt-2 text-[0.92rem] leading-relaxed text-muted">
                Write the password down before you save, because it cannot be read back.
              </p>

              <ActionForm action={addVerifier} submit="Create the login" tone="solid">
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="verifier-name" className="label block text-ink">
                      Name
                    </label>
                    <input
                      id="verifier-name"
                      name="name"
                      type="text"
                      placeholder="Prof. A. Deshpande"
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="verifier-email" className="label block text-ink">
                      Email
                    </label>
                    <input
                      id="verifier-email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@vit.edu"
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="verifier-password" className="label block text-ink">
                      Password
                    </label>
                    <input
                      id="verifier-password"
                      name="password"
                      type="text"
                      required
                      minLength={8}
                      autoComplete="off"
                      placeholder="At least 8 characters"
                      className="field mt-2.5"
                    />
                  </div>
                </div>
              </ActionForm>
            </div>
          </Panel>
        </div>

        {/* --------------------------------------------------------- organisers */}
        <div className="mt-6">
          <Panel eyebrow="The console" title="Organisers" aside={`${organisers.length} with the role`}>
            <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
              An organiser with nothing ticked can reach everything; tick areas to narrow them, and
              the owner is never narrowed.
            </p>

            <ul className="mt-6 grid gap-3">
              {organisers.map((person) => {
                const grant = grantFor.get(person.id);
                const isOwner = person.role === "owner";
                const isMe = person.id === viewer.id;

                return (
                  <li key={person.id} className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="min-w-0 flex-1">
                        <span className="label block truncate text-ink">
                          {person.full_name ?? person.email}
                        </span>
                        <span className="label-sm block truncate text-muted">{person.email}</span>
                      </span>
                      <Chip tone={isOwner ? "ink" : "teal"}>{person.role}</Chip>
                      <Chip tone={grant ? "muted" : "lime"}>
                        {isOwner
                          ? "everything"
                          : grant
                            ? `${grant.caps.length} of ${CAPS.length}`
                            : "everything"}
                      </Chip>
                      {isMe ? (
                        <span className="label-sm text-muted">You</span>
                      ) : isOwner ? (
                        <span className="label-sm text-muted">Runs the site</span>
                      ) : (
                        <ActionForm
                          action={setRole}
                          submit="Remove"
                          tone="danger"
                          className="contents"
                          confirm={`Remove organiser access from ${person.email}?`}
                        >
                          <input type="hidden" name="profile_id" value={person.id} />
                          <input type="hidden" name="role" value="participant" />
                        </ActionForm>
                      )}
                    </div>

                    {isOwner || isMe ? (
                      <p className="serif-it mt-3 text-[0.88rem] leading-relaxed text-muted">
                        {isOwner
                          ? "The owner holds every area and cannot be narrowed, removed or deleted by anyone else."
                          : "You cannot change your own access."}
                      </p>
                    ) : (
                      <details className="mt-3">
                        <summary className="label-sm cursor-pointer text-muted hover:text-ink">
                          What they can reach
                        </summary>

                        <ActionForm action={setGrants} submit="Save access" tone="ghost">
                          <input type="hidden" name="profile_id" value={person.id} />
                          <div className="mt-4 grid gap-2">
                            {CAPS.map((cap) => (
                              <label
                                key={cap.value}
                                className="flex cursor-pointer items-start gap-3 rounded-[var(--r-md)] bg-white px-4 py-3"
                              >
                                <input
                                  type="checkbox"
                                  name="cap"
                                  value={cap.value}
                                  defaultChecked={grant ? grant.caps.includes(cap.value) : true}
                                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--teal)]"
                                />
                                <span>
                                  <span className="label block text-ink">{cap.label}</span>
                                  <span className="mt-0.5 block text-[0.84rem] leading-snug text-muted">
                                    {cap.note}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </ActionForm>

                        {grant ? (
                          <div className="mt-2">
                            <ActionForm
                              action={clearGrants}
                              submit="Give them the whole console"
                              tone="ghost"
                            >
                              <input type="hidden" name="profile_id" value={person.id} />
                            </ActionForm>
                          </div>
                        ) : null}
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 border-t border-ink/10 pt-6">
              <p className="label text-ink">Allowlist</p>
              <p className="serif-it mt-2 text-[0.92rem] leading-relaxed text-muted">
                An email listed here becomes an organiser the moment it first signs in.
              </p>

              {allowlist.data?.length ? (
                <ul className="mt-4 grid gap-2">
                  {allowlist.data.map((entry) => (
                    <li
                      key={entry.email}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--r-md)] bg-cream-2 px-5 py-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">
                        {entry.email}
                      </span>
                      {entry.note ? <span className="label-sm text-muted">{entry.note}</span> : null}
                      <ActionForm
                        action={removeOrganiserEmail}
                        submit="Remove"
                        tone="danger"
                        className="contents"
                      >
                        <input type="hidden" name="email" value={entry.email} />
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              ) : null}

              <ActionForm action={addOrganiserEmail} submit="Add to the allowlist" tone="solid">
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="organiser-email" className="label block text-ink">
                      Email
                    </label>
                    <input
                      id="organiser-email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@vit.edu"
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="organiser-note" className="label block text-ink">
                      Note
                    </label>
                    <input
                      id="organiser-note"
                      name="note"
                      type="text"
                      placeholder="Technical vertical"
                      className="field mt-2.5"
                    />
                  </div>
                </div>
              </ActionForm>
            </div>
          </Panel>
        </div>
      </Container>
    </div>
  );
}
