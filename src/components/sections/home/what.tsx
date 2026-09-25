import Image from "next/image";

import { Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Ribbon } from "@/components/sections/ribbon";
import { CESAC, DOES, RIBBON_WORDS } from "@/lib/data/cesac";
import { getCopy, getRoster, rosterTotal } from "@/lib/data/site";

const POP: Record<string, string> = {
  azure: "var(--azure)",
  violet: "var(--violet)",
  lime: "var(--lime)",
  pink: "var(--pink)",
};

const ON_POP: Record<string, string> = {
  azure: "var(--on-pop)",
  violet: "var(--on-pop-light)",
  lime: "var(--on-pop)",
  pink: "var(--on-pop-light)",
};

/**
 * What CESAC is, and what it does.
 *
 * Four cards, one per remit, plus the identity plate. The running ribbon sits
 * in the gap between them rather than spanning the section, which is the point
 * of curving it: a band that occupies part of the page reads as an object on
 * the page instead of a divider between two halves of it.
 */
export async function HomeWhat() {
  const [groups, t] = await Promise.all([getRoster(), getCopy()]);
  const members = rosterTotal(groups);
  const verticals = groups.filter((g) => g.kind === "vertical").length;

  return (
    <section id="what" className="scroll-mt-24 bg-cream py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow="The committee"
            title={
              <>
                Run by the
                <br />
                department, for it
              </>
            }
            aside={t("home.structure")}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <Reveal>
            <div className="card flex h-full flex-col justify-between p-8">
              <div className="flex items-start gap-5">
                <Image
                  src="/cesac-mark.png"
                  alt={`${CESAC.abbr}, the ${CESAC.name}`}
                  width={320}
                  height={344}
                  className="mark-adapt h-auto w-[86px] shrink-0"
                  sizes="86px"
                />
                <div>
                  <p className="d-tall text-[1.9rem] leading-none text-ink">{CESAC.abbr}</p>
                  <p className="serif-it mt-2 text-[0.95rem] leading-snug text-muted">
                    {CESAC.name}
                  </p>
                </div>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-5 border-t border-ink/10 pt-7">
                <div>
                  <dt className="label-sm text-muted">Members</dt>
                  <dd className="d-wide mt-2 text-3xl leading-none text-teal">{members}</dd>
                </div>
                <div>
                  <dt className="label-sm text-muted">Verticals</dt>
                  <dd className="d-wide mt-2 text-3xl leading-none text-teal">{verticals}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="label-sm text-muted">Department</dt>
                  <dd className="mt-2 text-[0.95rem] font-semibold leading-snug text-ink">
                    {CESAC.department}
                    <span className="block font-normal text-muted">{CESAC.institute}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {DOES.map((d, i) => (
              <Reveal key={d.id} delay={i * 70}>
                <article className="card flex h-full flex-col p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full text-[0.85rem] font-extrabold"
                      style={{ background: POP[d.pop], color: ON_POP[d.pop] }}
                    >
                      {d.index}
                    </span>
                    <span className="jp text-sm text-muted">{d.jp}</span>
                  </div>
                  <h3 className="d-tall mt-5 text-[1.85rem] text-ink">{d.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/75">{d.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {/* the ribbon: part of the section, not all of it */}
        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_0.42fr]">
          <div className="min-w-0">
            <Ribbon items={RIBBON_WORDS} />
          </div>
          <Reveal>
            <div className="rounded-[var(--r-lg)] bg-cream-2 p-7">
              <Label>Where the work happens</Label>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/75">
                Four verticals split the committee: technical, media and content, event and
                coordination, and industry and outreach. Every event is carried by all four.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
