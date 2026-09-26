import type { Metadata } from "next";

import {
  addShowcasePick,
  deleteShowcaseCategory,
  removeShowcasePick,
  saveShowcaseCategory,
} from "@/app/actions/console-content";
import { updateSettings } from "@/app/actions/admin";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Notice, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getSettings } from "@/lib/data/console";
import {
  METRICS,
  METRIC_LABEL,
  getShowcase,
  getShowcaseCategories,
  getShowcasePicks,
  metricUnit,
  type ShowcasePick,
} from "@/lib/data/site";
import { rupees } from "@/lib/console/options";
import type { Tables } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Front page",
  robots: { index: false, follow: false },
};

/**
 * Who the front page names.
 *
 * A category is either counted or chosen. A counted one ranks students on
 * something the database can work out from the records they have uploaded; a
 * chosen one is whoever the committee names, which is the only way to say
 * something like best outgoing student, because no number will decide that.
 *
 * **What the public page shows is deliberately thin**: a name, a year and one
 * number. The database function it reads returns nothing else, so a page
 * written later cannot print an address or a PRN by accident. There is no
 * per-student opt-out any more; everybody with a record who is picked for a
 * category, or who scores into a counted one, is named.
 */
export default async function ShowcasePage() {
  await requireAdmin();
  await requireCap("content");

  const [categories, picks, live, settings] = await Promise.all([
    getShowcaseCategories(),
    getShowcasePicks(),
    getShowcase(),
    getSettings(),
  ]);

  const shownNow = live.filter((c) => c.entries.length > 0).length;

  return (
    <>
      <Panel eyebrow="The section" title="On or off" aside={`${shownNow} showing`}>
        {settings.showcase_public ? null : (
          <div className="mb-6">
            <Notice tone="error">
              The whole section is switched off, so the front page shows nothing from this page
              however many categories are set up below.
            </Notice>
          </div>
        )}

        <p className="serif-it text-[1rem] leading-relaxed text-muted">
          A category with nobody in it stays hidden until someone qualifies.
        </p>

        <ActionForm action={updateSettings} submit="Save" tone="lime">
          <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
            <input
              type="checkbox"
              name="showcase_public"
              defaultChecked={settings.showcase_public}
              className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
            />
            <span>
              <span className="label block text-ink">Show standouts on the front page</span>
              <span className="mt-1 block text-[0.9rem] leading-relaxed text-muted">
                Off means the section does not render at all, for anybody.
              </span>
            </span>
          </label>

          {/* updateSettings writes the whole row, so every other control on it
              has to travel with this form or a save here would quietly turn
              registration off. */}
          <input
            type="hidden"
            name="registration_open"
            value={settings.registration_open ? "on" : ""}
          />
          <input
            type="hidden"
            name="leaderboard_public"
            value={settings.leaderboard_public ? "on" : ""}
          />
          <input type="hidden" name="seats_cap" value={settings.seats_cap} />
          <input type="hidden" name="entry_fee_inr" value={settings.entry_fee_inr} />
          <input type="hidden" name="upi_id" value={settings.upi_id ?? ""} />
          <input type="hidden" name="upi_payee_name" value={settings.upi_payee_name ?? ""} />
          <input type="hidden" name="announcement" value={settings.announcement ?? ""} />
        </ActionForm>
      </Panel>

      {categories.length === 0 ? (
        <Panel eyebrow="Categories" title="Nothing set up">
          <Empty>
            No category exists, so add one below to show standouts on the front page.
          </Empty>
        </Panel>
      ) : null}

      {categories.map((category) => (
        <CategoryPanel
          key={category.id}
          category={category}
          picks={picks.filter((p) => p.category_id === category.id)}
          entries={live.find((c) => c.id === category.id)?.entries ?? []}
        />
      ))}

      <Panel eyebrow="Categories" title="Add a category">
        <p className="serif-it text-[1rem] leading-relaxed text-muted">
          An id that already exists edits that category rather than making a second one.
        </p>
        <CategoryForm />
      </Panel>
    </>
  );
}

function CategoryPanel({
  category,
  picks,
  entries,
}: {
  category: Tables<"showcase_categories">;
  picks: ShowcasePick[];
  entries: { place: number; studentId: string; name: string; year: string | null; value: number }[];
}) {
  const manual = category.metric === "manual";

  return (
    <Panel
      eyebrow={category.visible ? "Category" : "Hidden category"}
      title={category.title}
      aside={
        <span className="flex flex-wrap items-center gap-2">
          <Chip tone="ink">{METRIC_LABEL[category.metric] ?? category.metric}</Chip>
          <Chip tone="muted">{category.slots} shown</Chip>
          {category.visible ? null : <Chip tone="red">hidden</Chip>}
        </span>
      }
    >
      <p className="label text-ink">On the front page right now</p>
      {entries.length === 0 ? (
        <div className="mt-3">
          <Empty>
            {manual
              ? "Nobody named yet, so this category does not render."
              : "Nobody scores anything on this yet, so this category does not render."}
          </Empty>
        </div>
      ) : (
        <ol className="mt-3 grid gap-0">
          {entries.map((entry) => (
            <li
              key={entry.studentId}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-2.5 last:border-0"
            >
              <span className="text-[0.98rem] text-ink">
                <span className="label-sm mr-3 text-muted">{entry.place}</span>
                {entry.name}
                {entry.year ? <span className="label-sm ml-3 text-muted">{entry.year}</span> : null}
              </span>
              {manual ? null : (
                <span className="label-sm text-teal">
                  {category.metric === "prize_money"
                    ? rupees(entry.value)
                    : `${entry.value} ${metricUnit(category.metric)}`}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {manual ? (
        <div className="mt-7 border-t border-ink/10 pt-6">
          <p className="label text-ink">Who is named</p>

          {picks.length ? (
            <ul className="mt-4 grid gap-2">
              {picks.map((pick) => (
                <li
                  key={pick.student_id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--r-md)] bg-cream-2 px-5 py-3.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="label block truncate text-ink">
                      {pick.student?.full_name ?? pick.student?.email ?? pick.student_id}
                    </span>
                    <span className="label-sm block truncate text-muted">
                      {pick.note ?? pick.student?.email ?? ""}
                    </span>
                  </span>
                  <Chip tone="muted">order {pick.position}</Chip>
                  <ActionForm
                    action={removeShowcasePick}
                    submit="Remove"
                    tone="danger"
                    className="contents"
                  >
                    <input type="hidden" name="category_id" value={category.id} />
                    <input type="hidden" name="student_id" value={pick.student_id} />
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : null}

          <ActionForm action={addShowcasePick} submit="Name them" tone="solid">
            <input type="hidden" name="category_id" value={category.id} />
            <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1.4fr_auto]">
              <span>
                <label className="label-sm block text-muted">College address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@vit.edu"
                  className="field mt-1.5"
                />
              </span>
              <span>
                <label className="label-sm block text-muted">Note, shown under their name</label>
                <input
                  name="note"
                  type="text"
                  maxLength={160}
                  placeholder="Three years on the technical vertical"
                  className="field mt-1.5"
                />
              </span>
              <span>
                <label className="label-sm block text-muted">Order</label>
                <input
                  name="position"
                  type="number"
                  step={1}
                  defaultValue={picks.length + 1}
                  className="field mt-1.5 w-20"
                />
              </span>
            </div>
          </ActionForm>
        </div>
      ) : null}

      <details className="mt-7 border-t border-ink/10 pt-6">
        <summary className="label cursor-pointer text-muted hover:text-ink">
          Category settings
        </summary>
        <div className="mt-5">
          <CategoryForm category={category} />

          <div className="mt-6 border-t border-ink/10 pt-5">
            <ActionForm
              action={deleteShowcaseCategory}
              submit="Delete this category"
              tone="danger"
              confirm={`Delete ${category.title}? Anybody named for it is unnamed too.`}
            >
              <input type="hidden" name="category_id" value={category.id} />
              <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                To take it off the front page for now, untick &ldquo;Show it&rdquo; above instead.
              </p>
            </ActionForm>
          </div>
        </div>
      </details>
    </Panel>
  );
}

function CategoryForm({ category }: { category?: Tables<"showcase_categories"> }) {
  return (
    <ActionForm
      action={saveShowcaseCategory}
      submit={category ? "Save category" : "Add the category"}
      tone="lime"
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <span>
          <label className="label-sm block text-muted">Id</label>
          <input
            name="category_id"
            type="text"
            required
            readOnly={Boolean(category)}
            defaultValue={category?.id ?? ""}
            placeholder="best-outgoing"
            className="field mt-1.5 read-only:bg-cream-2 read-only:text-muted"
          />
        </span>
        <span>
          <label className="label-sm block text-muted">Heading</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={category?.title ?? ""}
            placeholder="Best outgoing student"
            className="field mt-1.5"
          />
        </span>

        <span className="sm:col-span-2">
          <label className="label-sm block text-muted">One line under the heading</label>
          <input
            name="blurb"
            type="text"
            maxLength={160}
            defaultValue={category?.blurb ?? ""}
            placeholder="Chosen by the committee."
            className="field mt-1.5"
          />
        </span>

        <span className="sm:col-span-2">
          <label className="label-sm block text-muted">What it ranks on</label>
          <select
            name="metric"
            defaultValue={category?.metric ?? "points"}
            className="field mt-1.5"
          >
            {METRICS.map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label} — {metric.note}
              </option>
            ))}
          </select>
        </span>

        <span>
          <label className="label-sm block text-muted">How many to show</label>
          <input
            name="slots"
            type="number"
            min={1}
            max={12}
            step={1}
            defaultValue={category?.slots ?? 3}
            className="field mt-1.5"
          />
        </span>
        <span>
          <label className="label-sm block text-muted">Order</label>
          <input
            name="position"
            type="number"
            step={1}
            defaultValue={category?.position ?? 9}
            className="field mt-1.5"
          />
        </span>

        <label className="flex cursor-pointer items-center gap-3 self-end pb-3">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={category?.visible ?? true}
            className="h-4 w-4 accent-[var(--teal)]"
          />
          <span className="label text-ink">Show it on the front page</span>
        </label>
      </div>
    </ActionForm>
  );
}
