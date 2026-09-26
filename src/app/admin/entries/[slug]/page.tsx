import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { resetEventSection, saveEventSection } from "@/app/actions/event-content";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getEventContent } from "@/lib/data/event-content";
import {
  EVENT_SCHEMAS,
  type FieldSpec,
  type Row,
  type SectionSpec,
} from "@/lib/data/event-content-schema";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit event page",
  robots: { index: false, follow: false },
};

/**
 * Everything a running event's page says, editable a section at a time.
 *
 * Asked for on 27 September 2026, because Attack on Token and HR Final Boss
 * were written into the source and changing a prize meant a deploy. Each
 * section saves on its own and can be put back to the original on its own.
 * The date, the venue and whether entries are open stay on the Entries page,
 * where they already were.
 */
export default async function EventContentPage(props: PageProps<"/admin/entries/[slug]">) {
  await requireAdmin();
  await requireCap("events");

  const { slug } = await props.params;
  const schema = EVENT_SCHEMAS[slug];
  if (!schema) notFound();

  const supabase = await createClient();
  const [content, { data: saved }] = await Promise.all([
    getEventContent(slug),
    supabase.from("event_content").select("content, updated_at").eq("slug", slug).maybeSingle(),
  ]);
  const changed = new Set(Object.keys((saved?.content as Record<string, unknown> | null) ?? {}));

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[60ch]">
          <Link href="/admin/entries" className="label inline-flex items-center gap-2 text-teal hover:text-ink">
            <span aria-hidden>←</span> Entries
          </Link>
          <div className="mt-6">
            <Label tone="teal">Event page</Label>
          </div>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">{schema.name}</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Each section saves on its own and shows on{" "}
            <Link href={schema.href} className="text-teal hover:underline">
              the event page
            </Link>{" "}
            straight away.
          </p>
        </header>

        <div className="mt-10 grid gap-6">
          {schema.sections.map((section) => (
            <SectionPanel
              key={section.key}
              slug={slug}
              section={section}
              value={content[section.key]}
              changed={changed.has(section.key)}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

function SectionPanel({
  slug,
  section,
  value,
  changed,
}: {
  slug: string;
  section: SectionSpec;
  value: Row | Row[] | undefined;
  changed: boolean;
}) {
  const rows = section.shape === "list" ? ((value as Row[] | undefined) ?? []) : [];
  const room = section.shape === "list" && rows.length < (section.max ?? 12);

  return (
    <Panel
      eyebrow={changed ? "Edited" : "As written"}
      title={section.label}
      aside={changed ? <Chip tone="teal">changed from the original</Chip> : undefined}
    >
      {section.note ? (
        <p className="serif-it -mt-2 mb-5 text-[0.95rem] leading-relaxed text-muted">{section.note}</p>
      ) : null}

      <ActionForm action={saveEventSection} submit="Save this section" pendingLabel="Saving" tone="lime">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="section" value={section.key} />

        {section.shape === "object" ? (
          <Fields fields={section.fields} prefix="f." row={(value as Row | undefined) ?? {}} />
        ) : (
          <>
            <input type="hidden" name="rows" value={rows.length + (room ? 1 : 0)} />
            <ol className="grid gap-4">
              {rows.map((row, i) => (
                <li key={i} className="rounded-[var(--r-md)] border-2 border-ink/10 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="label text-ink">{i + 1}</span>
                    <label className="flex cursor-pointer items-center gap-2 text-[0.9rem] text-red-deep">
                      <input type="checkbox" name={`r.${i}.__remove`} className="h-4 w-4 accent-[var(--red)]" />
                      Remove this one
                    </label>
                  </div>
                  <Fields fields={section.fields} prefix={`r.${i}.`} row={row} />
                </li>
              ))}
              {room ? (
                <li className="rounded-[var(--r-md)] border-2 border-dashed border-ink/15 p-5">
                  <p className="label mb-4 text-muted">Add another, or leave it blank</p>
                  <Fields fields={section.fields} prefix={`r.${rows.length}.`} row={{}} />
                </li>
              ) : null}
            </ol>
          </>
        )}
      </ActionForm>

      {changed ? (
        <ActionForm
          action={resetEventSection}
          submit="Put back the original"
          pendingLabel="Putting it back"
          tone="danger"
          className="mt-4 border-t border-ink/10 pt-2"
          confirm={`Put ${section.label.toLowerCase()} back to how it was written? Your changes to it are lost.`}
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="section" value={section.key} />
        </ActionForm>
      ) : null}
    </Panel>
  );
}

function Fields({ fields, prefix, row }: { fields: readonly FieldSpec[]; prefix: string; row: Row }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${prefix}${field.key}`;
        const current = row[field.key];
        const text = Array.isArray(current) ? current.join("\n") : (current ?? "");
        return (
          <div key={field.key} className={field.long ? "sm:col-span-2" : ""}>
            <label htmlFor={id} className="label-sm block text-muted">
              {field.label}
            </label>
            {field.long ? (
              <textarea
                id={id}
                name={id}
                defaultValue={text}
                maxLength={field.max}
                rows={field.lines ? 5 : 3}
                className="field mt-1.5"
              />
            ) : (
              <input
                id={id}
                name={id}
                type={field.kind === "url" ? "url" : "text"}
                inputMode={field.kind === "number" ? "decimal" : undefined}
                defaultValue={text}
                maxLength={field.max}
                className="field mt-1.5"
              />
            )}
            {field.hint ? (
              <p className="serif-it mt-1.5 text-[0.82rem] leading-snug text-muted">{field.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
