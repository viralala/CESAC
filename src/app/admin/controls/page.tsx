import type { Metadata } from "next";
import Link from "next/link";

import { applyCut, setChapterState, updateSettings } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getChapters, getSettings } from "@/lib/data/console";
import { EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Event controls",
  robots: { index: false, follow: false },
};

const CHAPTER_STATES = [
  { value: "locked", label: "Lock" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Close" },
  { value: "graded", label: "Mark graded" },
] as const;

/**
 * The switches, on a page of their own.
 *
 * They used to live on the page an organiser lands on, which put the one
 * control that can shut registration for the whole department above the fold
 * of a page people open to go somewhere else. A switch this consequential
 * should take a deliberate click to reach.
 *
 * Everything here is live: a box ticked on this page changes what every
 * visitor sees on their next request.
 */
export default async function ControlsPage() {
  await requireAdmin();
  await requireCap("settings");

  const [settings, chapters] = await Promise.all([getSettings(), getChapters()]);

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[48ch]">
          <Label tone="teal">Switches</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,3.8rem)] text-ink">Event controls</h1>
          <p className="serif-it mt-4 text-[1.08rem] leading-relaxed text-muted">
            Everything on this page takes effect at once. There is no save-and-publish step and no
            draft: the next visitor gets what is set here.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Panel eyebrow="Switches" title="What is open">
            <ActionForm action={updateSettings} submit="Save controls" tone="lime">
              <div className="grid gap-4">
                {[
                  {
                    name: "registration_open",
                    label: "Registration open",
                    note: "Lets participants make and join teams.",
                    on: settings.registration_open,
                  },
                  {
                    name: "leaderboard_public",
                    label: "Leaderboard published",
                    note: "Opens every team's standing to every participant. Off means each team sees only its own.",
                    on: settings.leaderboard_public,
                  },
                  {
                    name: "showcase_public",
                    label: "Standouts on the front page",
                    note: "Names a few students publicly, with their year and one number. Off means the section does not render at all. Set the categories up under Site.",
                    on: settings.showcase_public,
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.name}
                    className="flex cursor-pointer items-start gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                  >
                    <input
                      type="checkbox"
                      name={toggle.name}
                      defaultChecked={toggle.on}
                      className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
                    />
                    <span>
                      <span className="label block text-ink">{toggle.label}</span>
                      <span className="mt-1 block text-[0.9rem] leading-relaxed text-muted">
                        {toggle.note}
                      </span>
                    </span>
                  </label>
                ))}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="seats_cap" className="label block text-ink">
                      Seat cap
                    </label>
                    <input
                      id="seats_cap"
                      name="seats_cap"
                      type="number"
                      min={1}
                      defaultValue={settings.seats_cap}
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="entry_fee_inr" className="label block text-ink">
                      Entry fee, rupees
                    </label>
                    <input
                      id="entry_fee_inr"
                      name="entry_fee_inr"
                      type="number"
                      min={0}
                      defaultValue={settings.entry_fee_inr}
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="upi_id" className="label block text-ink">
                      UPI ID
                    </label>
                    <input
                      id="upi_id"
                      name="upi_id"
                      type="text"
                      defaultValue={settings.upi_id ?? ""}
                      placeholder="cesac@bank"
                      className="field mt-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="upi_payee_name" className="label block text-ink">
                      Payee name
                    </label>
                    <input
                      id="upi_payee_name"
                      name="upi_payee_name"
                      type="text"
                      defaultValue={settings.upi_payee_name ?? ""}
                      className="field mt-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="announcement" className="label block text-ink">
                    Announcement
                  </label>
                  <textarea
                    id="announcement"
                    name="announcement"
                    rows={3}
                    maxLength={400}
                    defaultValue={settings.announcement ?? ""}
                    placeholder="Shown at the top of every participant console. Leave empty for none."
                    className="field mt-2.5 min-h-[5rem] resize-y py-3 leading-relaxed"
                  />
                </div>
              </div>
            </ActionForm>
          </Panel>

          <Panel eyebrow="Run of show" title="Chapter control" aside={EVENT.tagline}>
            <div className="grid gap-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="rounded-[var(--r-md)] border-2 border-ink/10 p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="d-tall text-[2rem] leading-none text-ink">
                        {chapter.numeral}
                      </span>
                      <div>
                        <h3 className="d-tall text-[1.25rem] text-ink">{chapter.title}</h3>
                        <p className="label-sm mt-1 text-muted">
                          {chapter.weight}% of score, cut {chapter.cut_from} to {chapter.cut_to}
                        </p>
                      </div>
                    </div>
                    <Chip
                      tone={
                        chapter.state === "open"
                          ? "teal"
                          : chapter.state === "graded"
                            ? "lime"
                            : chapter.state === "closed"
                              ? "ink"
                              : "muted"
                      }
                    >
                      {chapter.state}
                    </Chip>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    {CHAPTER_STATES.filter((s) => s.value !== chapter.state).map((s) => (
                      <ActionForm
                        key={s.value}
                        action={setChapterState}
                        submit={s.label}
                        tone={s.value === "open" ? "lime" : "ghost"}
                        className="contents"
                      >
                        <input type="hidden" name="chapter_id" value={chapter.id} />
                        <input type="hidden" name="state" value={s.value} />
                      </ActionForm>
                    ))}

                    <Link href={`/admin/grade/${chapter.id}`} className="pill pill-ghost mt-4">
                      Grade
                    </Link>
                  </div>

                  <div className="mt-5 border-t border-ink/10 pt-5">
                    <ActionForm
                      action={applyCut}
                      submit={`Cut to ${chapter.cut_to} ${chapter.cut_to === 1 ? "team" : "teams"}`}
                      tone="danger"
                      confirm={`This marks every team below the top ${chapter.cut_to} as eliminated at ${chapter.title}. Teams can be put back one at a time. Continue?`}
                    >
                      <input type="hidden" name="chapter_id" value={chapter.id} />
                      <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                        Ranks the teams still in by their score for this chapter and keeps the top{" "}
                        {chapter.cut_to}. Score everyone first.
                      </p>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Container>
    </div>
  );
}
