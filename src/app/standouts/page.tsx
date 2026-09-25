import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, Container } from "@/components/aot/bits";
import { PageHead } from "@/components/sections/page-head";
import { StandoutsBoard } from "@/components/sections/standouts-board";
import { SiteFooter } from "@/components/site/footer";
import { getSettings } from "@/lib/data/console";
import { getCopy, getStandouts } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Standouts",
  description:
    "Every student the Computer Engineering department is putting its name to, ranked on what they have put on their record, with a search.",
  alternates: { canonical: "/standouts" },
};

/**
 * The whole list behind the front page's top three.
 *
 * The same categories, the same counting and the same thin shape: a name, a
 * year, one number and a photo. Nobody who has switched themselves off the
 * showcase is on it, and when the committee has the showcase switched off
 * this page says so rather than showing it anyway.
 */
export default async function StandoutsPage(props: PageProps<"/standouts">) {
  const [categories, settings, t, { c }] = await Promise.all([
    getStandouts(),
    getSettings(),
    getCopy(),
    props.searchParams,
  ]);

  const showing = settings.showcase_public ? categories.filter((cat) => cat.entries.length > 0) : [];

  return (
    <>
      <PageHead
        kicker={t("home.showcase.eyebrow")}
        title={t("home.showcase.title")}
        lede={t("home.showcase.aside")}
      />

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          {showing.length ? (
            <StandoutsBoard categories={showing} initial={typeof c === "string" ? c : undefined} />
          ) : (
            <div className="card p-8 sm:p-10">
              <p className="serif-it max-w-[60ch] text-[1.08rem] leading-relaxed text-muted">
                {settings.showcase_public
                  ? "Nobody is on the list yet. It fills in as students add hackathons and publications to their record, and the first one to do it is the first one here."
                  : "The committee has the standouts switched off for now. They come back here and on the front page when it is switched on again."}
              </p>
            </div>
          )}

          <p className="serif-it mt-6 max-w-[70ch] text-[0.98rem] leading-relaxed text-muted">
            {t("home.showcase.foot")} A student who would rather not be named can switch themselves
            off it from their own console.
          </p>

          <Link
            href="/dashboard/certificates"
            className="group mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-7 transition-colors hover:bg-cream-3"
          >
            <span>
              <span className="d-tall text-[1.5rem] text-ink">Put yours on the board</span>
              <span className="serif-it mt-1 block max-w-[62ch] text-[0.95rem] leading-relaxed text-muted">
                Sign in and add a hackathon, a prize or a paper to your record. It counts the moment
                it is saved.
              </span>
            </span>
            <span className="dot-btn">
              <Arrow />
            </span>
          </Link>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
