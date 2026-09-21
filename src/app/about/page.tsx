import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { PageHead } from "@/components/sections/page-head";
import { SiteFooter } from "@/components/site/footer";
import { CESAC, DOES } from "@/lib/data/cesac";
import { getCopy, getRoster, rosterTotal } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "CESAC is the Computer Engineering Student Activities Committee at VIT Pune: faculty and student leadership, a board of executives and four student verticals.",
  alternates: { canonical: "/about" },
};

const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];
const ON_POPS = ["var(--ink)", "var(--white)", "var(--ink)", "var(--white)"];

export default async function AboutPage() {
  const [groups, t] = await Promise.all([getRoster(), getCopy()]);

  const faculty = groups.find((g) => g.id === "faculty")?.people ?? [];
  const studentLeadership = groups.find((g) => g.id === "student-leadership")?.people ?? [];
  const verticals = groups.filter((g) => g.kind === "vertical");

  return (
    <>
      <PageHead
        kicker="About"
        title={
          <>
            What CESAC
            <br />
            is
          </>
        }
        lede={t("home.what")}
      />

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          {/* the structural facts, as plates rather than a paragraph */}
          <Reveal>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Full name", v: CESAC.name },
                { t: "Department", v: CESAC.department },
                { t: "Institute", v: CESAC.institute },
                {
                  t: "Members",
                  v: `${rosterTotal(groups)} across ${verticals.length} verticals`,
                },
              ].map((f) => (
                <div key={f.t} className="card h-full p-6">
                  <dt className="label-sm text-muted">{f.t}</dt>
                  <dd className="mt-3 text-[1rem] font-semibold leading-snug text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="mt-14">
            <h2 className="d-tall text-[clamp(2rem,5vw,3.4rem)] text-ink">What the committee does</h2>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOES.map((d, i) => (
              <Reveal key={d.id} delay={i * 70}>
                <article className="card flex h-full flex-col p-7">
                  <span className="jp text-sm text-muted">{d.jp}</span>
                  <h3 className="d-tall mt-3 text-[1.8rem] text-ink">{d.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/75">{d.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <h2 className="d-tall text-[clamp(2rem,5vw,3.4rem)] text-ink">The four verticals</h2>
            <p className="mt-4 max-w-[58ch] text-[0.975rem] leading-relaxed text-muted">
              {t("home.structure")}
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {verticals.map((v, i) => (
              <Reveal key={v.id} delay={i * 70}>
                <article className="card flex h-full flex-col p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full text-[0.85rem] font-extrabold"
                      style={{ background: POPS[i], color: ON_POPS[i] }}
                    >
                      {v.indexLabel}
                    </span>
                    <span className="jp text-sm text-muted">{v.jp}</span>
                  </div>
                  <h3 className="d-tall mt-5 text-[1.8rem] text-ink">{v.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/75">{v.remit}</p>
                  <p className="label-sm mt-6 border-t border-ink/10 pt-5 text-muted">
                    {v.people.length} members
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="card h-full p-7 sm:p-9">
                <Label>Faculty leadership</Label>
                <ul className="mt-5 grid gap-3">
                  {faculty.map((p) => (
                    <li
                      key={p.id ?? p.name}
                      className="rounded-[var(--r-md)] bg-cream px-5 py-4"
                    >
                      <p className="d-tall text-[1.2rem] leading-tight text-ink">{p.name}</p>
                      <p className="label-sm mt-2 text-muted">{p.role}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card h-full p-7 sm:p-9">
                <Label>Student leadership</Label>
                <ul className="mt-5 grid gap-3">
                  {studentLeadership.map((p) => (
                    <li
                      key={p.id ?? p.name}
                      className="rounded-[var(--r-md)] bg-cream px-5 py-4"
                    >
                      <p className="d-tall text-[1.2rem] leading-tight text-ink">{p.name}</p>
                      <p className="label-sm mt-2 text-muted">{p.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-4">
            <Link
              href="/people"
              className="group flex flex-wrap items-center justify-between gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-7 transition-colors hover:bg-cream-3"
            >
              <span className="d-tall text-[1.6rem] text-ink">See the full roster</span>
              <span className="dot-btn">
                <Arrow />
              </span>
            </Link>
          </Reveal>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
