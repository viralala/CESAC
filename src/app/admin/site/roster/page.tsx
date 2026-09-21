import type { Metadata } from "next";

import {
  deleteRosterGroup,
  deleteRosterPerson,
  saveRosterGroup,
  saveRosterPerson,
} from "@/app/actions/console-content";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getRoster, rosterTotal, type RosterGroup, type RosterPerson } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Roster",
  robots: { index: false, follow: false },
};

const KINDS = [
  { value: "people", label: "People with titles" },
  { value: "names", label: "Names only" },
  { value: "vertical", label: "A vertical" },
] as const;

const ACCENTS = ["azure", "violet", "lime", "pink"] as const;

/**
 * The committee roster, editable.
 *
 * It was a constant in the source until today, so correcting a lecturer's
 * title took a commit, a build and a deploy. Every name, title and heading on
 * /people is a row here now, and the /about and front pages read the same
 * rows, so one correction lands everywhere at once.
 *
 * The blocks are ordered by their `order` number and people inside a block by
 * theirs. Numbers rather than drag handles: a number survives a page reload,
 * can be set from a phone at a meeting, and does not need a client component
 * holding the whole roster in memory to work.
 */
export default async function RosterPage() {
  await requireAdmin();
  await requireCap("content");

  // Everything, hidden rows included: a block has to be visible on this page
  // in order to be unhidden.
  const groups = await getRoster(true);

  return (
    <>
      <Panel
        eyebrow="Roster"
        title="What the public page shows"
        aside={`${rosterTotal(groups)} named`}
      >
        <p className="serif-it text-[1rem] leading-relaxed text-muted">
          Blocks render in the order below, and people render in their own order inside a block. A
          block or a person can be hidden without being deleted, which is what to do for somebody
          who has left mid-term and may be back. Hidden rows are not sent to the public page at
          all, so a hidden name is not sitting in the page source of a page that does not show it.
        </p>
      </Panel>

      {groups.length === 0 ? (
        <Panel eyebrow="Roster" title="Nothing here yet">
          <Empty>
            The roster tables came back empty, so /people is rendering the names in the source
            instead. Add a block below and it takes over.
          </Empty>
        </Panel>
      ) : null}

      {groups.map((group) => (
        <GroupPanel key={group.id} group={group} />
      ))}

      <Panel eyebrow="Roster" title="Add a block">
        <p className="serif-it text-[1rem] leading-relaxed text-muted">
          A new block, or the settings of one that exists: putting in an id that is already there
          edits that block instead of making a second one.
        </p>
        <GroupForm />
      </Panel>
    </>
  );
}

function GroupPanel({ group }: { group: RosterGroup }) {
  return (
    <Panel
      eyebrow={group.visible ? "Block" : "Hidden block"}
      title={group.title}
      aside={
        <span className="flex flex-wrap items-center gap-2">
          <Chip tone="ink">{group.kind}</Chip>
          <Chip tone="muted">order {group.position}</Chip>
          {group.visible ? null : <Chip tone="red">hidden</Chip>}
        </span>
      }
    >
      {group.people.length === 0 ? (
        <Empty>Nobody in this block yet.</Empty>
      ) : (
        <ul className="grid gap-2.5">
          {group.people.map((person) => (
            <PersonRow key={person.id ?? person.name} group={group} person={person} />
          ))}
        </ul>
      )}

      <div className="mt-7 border-t border-ink/10 pt-6">
        <p className="label text-ink">Add somebody to {group.title}</p>
        <PersonForm group={group} />
      </div>

      <details className="mt-7 border-t border-ink/10 pt-6">
        <summary className="label cursor-pointer text-muted hover:text-ink">
          Block settings
        </summary>
        <div className="mt-5">
          <GroupForm group={group} />

          <div className="mt-6 border-t border-ink/10 pt-5">
            <ActionForm
              action={deleteRosterGroup}
              submit="Delete this block"
              tone="danger"
              confirm={`This removes ${group.title} and all ${group.people.length} people in it. Continue?`}
            >
              <input type="hidden" name="group_id" value={group.id} />
              <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                Everybody in the block goes with it. To take a block off the page for now, untick
                &ldquo;Show it&rdquo; above instead.
              </p>
            </ActionForm>
          </div>
        </div>
      </details>
    </Panel>
  );
}

/**
 * One person, as a form.
 *
 * Every field is editable in place rather than behind an edit button, because
 * the job this page exists for is "fix a title", and a click to reveal a box
 * before you can fix it is a click for nothing.
 */
function PersonRow({ group, person }: { group: RosterGroup; person: RosterPerson }) {
  if (!person.id) {
    // A fallback row, rendered from the constants because the database has no
    // roster in it. There is nothing to edit yet.
    return (
      <li className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
        <span className="label text-ink">{person.name}</span>
        <span className="label-sm ml-3 text-muted">{person.role ?? person.rank ?? ""}</span>
      </li>
    );
  }

  return (
    <li className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
      <ActionForm action={saveRosterPerson} submit="Save" tone="ghost">
        <input type="hidden" name="person_id" value={person.id} />
        <input type="hidden" name="group_id" value={group.id} />

        <div className="grid gap-4 sm:grid-cols-[1.4fr_1.4fr_auto_auto_auto]">
          <span>
            <label className="label-sm block text-muted">Name</label>
            <input
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={person.name}
              className="field mt-1.5"
            />
          </span>

          <span>
            <label className="label-sm block text-muted">Title</label>
            <input
              name="role"
              type="text"
              maxLength={120}
              defaultValue={person.role ?? ""}
              placeholder={group.kind === "names" ? "Not shown in this block" : "Optional"}
              className="field mt-1.5"
            />
          </span>

          <span>
            <label className="label-sm block text-muted">Rank</label>
            <select name="rank" defaultValue={person.rank ?? ""} className="field mt-1.5 w-28">
              <option value="">None</option>
              <option value="lead">Lead</option>
              <option value="head">Head</option>
            </select>
          </span>

          <span>
            <label className="label-sm block text-muted">Order</label>
            <input
              name="position"
              type="number"
              step={1}
              defaultValue={person.position}
              className="field mt-1.5 w-20"
            />
          </span>

          <label className="flex cursor-pointer items-center gap-2 self-end pb-3">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={person.visible}
              className="h-4 w-4 accent-[var(--teal)]"
            />
            <span className="label-sm text-muted">Show</span>
          </label>
        </div>
      </ActionForm>

      <div className="mt-2">
        <ActionForm
          action={deleteRosterPerson}
          submit="Remove"
          tone="danger"
          confirm={`Take ${person.name} off the roster?`}
        >
          <input type="hidden" name="person_id" value={person.id} />
        </ActionForm>
      </div>
    </li>
  );
}

function PersonForm({ group }: { group: RosterGroup }) {
  return (
    <ActionForm action={saveRosterPerson} submit="Add" tone="solid">
      <input type="hidden" name="group_id" value={group.id} />
      <input type="hidden" name="visible" value="on" />

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1.4fr_auto_auto]">
        <span>
          <label className="label-sm block text-muted">Name</label>
          <input name="name" type="text" required maxLength={120} className="field mt-1.5" />
        </span>
        <span>
          <label className="label-sm block text-muted">Title</label>
          <input name="role" type="text" maxLength={120} className="field mt-1.5" />
        </span>
        <span>
          <label className="label-sm block text-muted">Rank</label>
          <select name="rank" defaultValue="" className="field mt-1.5 w-28">
            <option value="">None</option>
            <option value="lead">Lead</option>
            <option value="head">Head</option>
          </select>
        </span>
        <span>
          <label className="label-sm block text-muted">Order</label>
          <input
            name="position"
            type="number"
            step={1}
            defaultValue={group.people.length + 1}
            className="field mt-1.5 w-20"
          />
        </span>
      </div>
    </ActionForm>
  );
}

function GroupForm({ group }: { group?: RosterGroup }) {
  return (
    <ActionForm action={saveRosterGroup} submit={group ? "Save block" : "Add the block"} tone="lime">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <span>
          <label className="label-sm block text-muted">Id</label>
          <input
            name="group_id"
            type="text"
            required
            readOnly={Boolean(group)}
            defaultValue={group?.id ?? ""}
            placeholder="faculty"
            className="field mt-1.5 read-only:bg-cream-2 read-only:text-muted"
          />
        </span>
        <span>
          <label className="label-sm block text-muted">Heading</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={group?.title ?? ""}
            placeholder="Faculty leadership"
            className="field mt-1.5"
          />
        </span>
        <span>
          <label className="label-sm block text-muted">What it lists</label>
          <select name="kind" defaultValue={group?.kind ?? "people"} className="field mt-1.5">
            {KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </span>
        <span>
          <label className="label-sm block text-muted">Order</label>
          <input
            name="position"
            type="number"
            step={1}
            defaultValue={group?.position ?? 9}
            className="field mt-1.5"
          />
        </span>

        <span className="sm:col-span-2">
          <label className="label-sm block text-muted">
            One line, for a vertical only
          </label>
          <input
            name="remit"
            type="text"
            defaultValue={group?.remit ?? ""}
            placeholder="Platforms, tooling and anything the events run on."
            className="field mt-1.5"
          />
        </span>

        <span>
          <label className="label-sm block text-muted">Japanese, for a vertical</label>
          <input
            name="jp"
            type="text"
            defaultValue={group?.jp ?? ""}
            placeholder="技術"
            className="field mt-1.5"
          />
        </span>
        <span>
          <label className="label-sm block text-muted">Number, for a vertical</label>
          <input
            name="index_label"
            type="text"
            maxLength={4}
            defaultValue={group?.indexLabel ?? ""}
            placeholder="01"
            className="field mt-1.5"
          />
        </span>

        <span>
          <label className="label-sm block text-muted">Colour, for a vertical</label>
          <select name="accent" defaultValue={group?.accent ?? ""} className="field mt-1.5">
            <option value="">Pick by position</option>
            {ACCENTS.map((accent) => (
              <option key={accent} value={accent}>
                {accent}
              </option>
            ))}
          </select>
        </span>

        <label className="flex cursor-pointer items-center gap-3 self-end pb-3">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={group?.visible ?? true}
            className="h-4 w-4 accent-[var(--teal)]"
          />
          <span className="label text-ink">Show it on the site</span>
        </label>
      </div>
    </ActionForm>
  );
}
