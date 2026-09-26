import type { Metadata } from "next";

import { saveSiteText } from "@/app/actions/console-content";
import { ActionForm } from "@/components/console/action-form";
import { Empty, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getSiteText } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Site copy",
  robots: { index: false, follow: false },
};

/**
 * The sentences on the public pages.
 *
 * One form per section rather than one per field, because rewording a heading
 * and the line under it should be one save and not two. The key is printed
 * next to each box in small type: it is the thing to quote when asking why a
 * sentence is not where it was expected, and it is what the fallback in
 * lib/data/site.ts is keyed on.
 */
export default async function SiteCopyPage() {
  await requireAdmin();
  await requireCap("content");

  const rows = await getSiteText();

  const sections = [...new Set(rows.map((r) => r.section))];

  return (
    <>
      <Panel eyebrow="How this works" title="Where these end up">
        <p className="serif-it text-[1rem] leading-relaxed text-muted">
          Each box is one sentence on the public site, live on the next page load.
        </p>
      </Panel>

      {sections.length === 0 ? (
        <Panel eyebrow="Copy" title="Nothing to edit">
          <Empty>
            The site copy table is empty, so the pages are showing the wording in the source.
          </Empty>
        </Panel>
      ) : null}

      {sections.map((section) => {
        const inSection = rows.filter((r) => r.section === section);

        return (
          <Panel
            key={section}
            eyebrow="Copy"
            title={section}
            aside={`${inSection.length} ${inSection.length === 1 ? "line" : "lines"}`}
          >
            <ActionForm action={saveSiteText} submit={`Save ${section.toLowerCase()}`} tone="lime">
              <div className="grid gap-5">
                {inSection.map((row) => (
                  <div key={row.key}>
                    <label htmlFor={`t-${row.key}`} className="label block text-ink">
                      {row.label}
                    </label>
                    {row.hint ? (
                      <p className="serif-it mt-1 text-[0.85rem] leading-relaxed text-muted">
                        {row.hint}
                      </p>
                    ) : null}

                    {row.multiline ? (
                      <textarea
                        id={`t-${row.key}`}
                        name={`text.${row.key}`}
                        rows={3}
                        maxLength={2000}
                        defaultValue={row.value}
                        className="field mt-2.5 min-h-[5rem] resize-y py-3 leading-relaxed"
                      />
                    ) : (
                      <input
                        id={`t-${row.key}`}
                        name={`text.${row.key}`}
                        type="text"
                        maxLength={2000}
                        defaultValue={row.value}
                        className="field mt-2.5"
                      />
                    )}

                    <p className="label-sm mt-2 font-mono text-muted">{row.key}</p>
                  </div>
                ))}
              </div>
            </ActionForm>
          </Panel>
        );
      })}
    </>
  );
}
