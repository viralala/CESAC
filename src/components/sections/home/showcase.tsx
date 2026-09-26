import Link from "next/link";

import { Arrow, Container, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Avatar } from "@/components/site/avatar";
import { rupees } from "@/lib/console/options";
import { getCopy, getShowcase, metricUnit } from "@/lib/data/site";
import { getSettings } from "@/lib/data/console";

/** One accent per category, in the order they are set on the console. */
const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];
const ON_POPS = ["var(--on-pop)", "var(--on-pop-light)", "var(--on-pop)", "var(--on-pop-light)"];

/**
 * The students the department is putting its name to.
 *
 * Categories, their headings, how many people each shows and what it ranks on
 * are all rows the committee edits from the console. A category that ranks
 * itself is counted from what students have uploaded; one that does not, like
 * best outgoing student, is whoever the committee named, because that is a
 * judgement and no number will make it.
 *
 * **What is shown is deliberately thin.** A name, a year, one number and the
 * student's photo. No record titles, no addresses, no PRNs, and nobody who has
 * asked on their own console not to be named here. The database function this
 * reads returns only those fields, so a page written later cannot print more
 * by accident.
 *
 * Only the top of each category is here. The rest, with a search, is on
 * /standouts, and every card and the button under them go there.
 *
 * An empty category is skipped rather than shown with a placeholder. A new
 * category nobody has been picked for yet is a real state, and a card reading
 * "nobody yet" on the front page of the department's site helps nobody.
 */
export async function HomeShowcase() {
  const [categories, settings, t] = await Promise.all([getShowcase(), getSettings(), getCopy()]);

  if (!settings.showcase_public) return null;

  const showing = categories.filter((c) => c.entries.length > 0);
  if (showing.length === 0) return null;

  return (
    <section id="standouts" className="bg-cream py-20 scroll-mt-24 sm:py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow={t("home.showcase.eyebrow")}
            title={t("home.showcase.title")}
            aside={t("home.showcase.aside")}
          />
        </Reveal>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showing.map((category, i) => (
            <Reveal key={category.id} delay={i * 70}>
              <article className="card flex h-full flex-col p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="d-tall text-[1.55rem] leading-tight text-ink">
                      {category.title}
                    </h3>
                    {category.blurb ? (
                      <p className="mt-2 text-[0.875rem] leading-snug text-muted">
                        {category.blurb}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.7rem] font-extrabold"
                    style={{ background: POPS[i % 4], color: ON_POPS[i % 4] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <ol
                  className="mt-6 grid gap-0 border-t-2 pt-2"
                  style={{ borderColor: POPS[i % 4] }}
                >
                  {category.entries.map((entry) => (
                    <li key={entry.studentId} className="border-b border-ink/10 last:border-0">
                      <Link
                        href={`/standouts/${entry.studentId}`}
                        className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="d-tall w-[1.4rem] shrink-0 text-[1rem] leading-none text-ink/30">
                            {entry.place}
                          </span>
                          <Avatar
                            key={entry.photo ?? "none"}
                            name={entry.name}
                            sources={[entry.photo]}
                            size={44}
                          />
                          <span className="min-w-0">
                            <span className="block text-[0.98rem] leading-snug text-ink decoration-teal decoration-2 underline-offset-4 group-hover:underline">
                              {entry.name}
                            </span>
                            <span className="label-sm block text-muted">
                              {entry.note ?? entry.year ?? ""}
                            </span>
                          </span>
                        </span>

                        {category.metric === "manual" ? null : (
                          <span className="label-sm shrink-0 text-teal">
                            {category.metric === "prize_money"
                              ? rupees(entry.value)
                              : `${entry.value} ${metricUnit(category.metric)}`}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ol>

                <Link
                  href={`/standouts?c=${encodeURIComponent(category.id)}`}
                  className="label mt-auto inline-flex items-center gap-2 self-start pt-5 text-teal transition-colors hover:text-ink"
                >
                  Everyone in {category.title.toLowerCase()}
                  <Arrow className="h-3.5 w-3.5" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {/* The whole list. Asked for by name: the top three stay here, and
            this is the way through to everybody else, with a search. */}
        <Reveal className="mt-8 flex justify-center">
          <Link href="/standouts" className="pill pill-lime px-8 py-4">
            See the full standouts list
            <Arrow />
          </Link>
        </Reveal>

        <Reveal className="mt-8">
          <Link
            href="/dashboard/certificates"
            className="group flex flex-wrap items-center justify-between gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-7 transition-colors hover:bg-cream-3"
          >
            <span>
              <span className="d-tall text-[1.5rem] text-ink">Put yours on the board</span>
              <span className="serif-it mt-1 block max-w-[62ch] text-[0.95rem] leading-relaxed text-muted">
                {t("home.showcase.foot")}
              </span>
            </span>
            <span className="dot-btn">
              <Arrow />
            </span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
