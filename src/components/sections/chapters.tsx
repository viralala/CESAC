import { Chip, Container, Label, SectionHead } from "@/components/aot/bits";
import { Meter } from "@/components/aot/meter";
import { Reveal } from "@/components/aot/reveal";
import { ChapterArt } from "@/components/sections/chapter-art";
import {
  CHAPTERS,
  CHITS,
  RUN_OF_SHOW,
  SIGNATURE_CHALLENGE,
  type Chapter,
} from "@/lib/data/event";

function Flow({ items }: { items: readonly string[] }) {
  return (
    <ol className="grid">
      {items.map((item, i) => (
        <li
          key={item}
          className="flex items-baseline gap-4 border-b border-ink/8 py-3 text-[0.9375rem] text-ink last:border-0"
        >
          <span className="label-sm text-red">{String(i + 1).padStart(2, "0")}</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function RulesTable({ table }: { table: NonNullable<Chapter["table"]> }) {
  return (
    <dl className="grid">
      {table.rows.map(([k, v]) => (
        <div
          key={k}
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-ink/8 py-3.5 last:border-0"
        >
          <dt className="label w-[9.5rem] shrink-0 text-ink">{k}</dt>
          <dd className="flex-1 text-[0.9375rem] text-muted">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChapterBlock({ chapter, alt }: { chapter: Chapter; alt: boolean }) {
  return (
    <article
      id={chapter.id}
      className={`grain relative scroll-mt-24 py-24 sm:py-28 ${alt ? "washi" : "bg-cream"}`}
    >
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow={`Chapter ${chapter.numeral} · ${chapter.wall}`}
            title={chapter.title}
            lede={chapter.blurb}
          />
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div>
            <Reveal>
              <ChapterArt id={chapter.id} />
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-7">
                <Label>Objective</Label>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {chapter.objective}
                </p>
              </div>
            </Reveal>
          </div>

          <div className="grid content-start gap-4">
            <Reveal>
              <div className="rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-38px_rgba(21,20,26,0.6)]">
                <Label>{chapter.id === "fusion-awakening" ? "Deliverables" : "The flow"}</Label>
                <div className="mt-4">
                  <Flow items={chapter.flow} />
                </div>
              </div>
            </Reveal>

            {chapter.table ? (
              <Reveal>
                <div className="rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-38px_rgba(21,20,26,0.6)]">
                  <Label>
                    {chapter.id === "vision-forge" ? "Locked round rules" : "Team experience"}
                  </Label>
                  <div className="mt-4">
                    <RulesTable table={chapter.table} />
                  </div>
                </div>
              </Reveal>
            ) : null}

            {chapter.rubric ? (
              <Reveal>
                <div className="rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-38px_rgba(21,20,26,0.6)]">
                  <Label>{chapter.id === "vision-forge" ? "Recommended rubric" : "Judging"}</Label>
                  <div className="mt-5 grid gap-5">
                    {chapter.rubric.map((r, i) => (
                      <Meter key={r.label} label={r.label} pct={r.pct} delay={i * 110} />
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>

        {/* Chapter II: the locked signature challenge. */}
        {chapter.id === "token-trials" ? (
          <Reveal className="mt-14">
            <div className="washi-dark grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] p-8 text-cream sm:p-12">
              <Label tone="light">{SIGNATURE_CHALLENGE.eyebrow}</Label>
              <h3 className="d-tall mt-4 max-w-[18ch] text-[clamp(2.2rem,5.5vw,4rem)] text-cream">
                {SIGNATURE_CHALLENGE.title}
              </h3>
              <p className="serif-it mt-5 max-w-[62ch] text-[1.05rem] leading-relaxed text-cream/70">
                {SIGNATURE_CHALLENGE.body}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="label-sm text-cream/45">Other ready options</span>
                {SIGNATURE_CHALLENGE.alternates.map((a) => (
                  <Chip key={a} tone="dark">
                    {a}
                  </Chip>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}

        {/* Chapter III: the three-chit engine and the half-day run of show. */}
        {chapter.id === "fusion-awakening" ? (
          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-38px_rgba(21,20,26,0.6)]">
                <Label>The three-chit engine</Label>
                <div className="mt-5 grid gap-3">
                  {CHITS.map((c, i) => (
                    <div
                      key={c.title}
                      className="flex items-center gap-5 rounded-[var(--r-md)] bg-cream px-5 py-4"
                    >
                      <span className="d-wide text-3xl leading-none text-red">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="d-tall text-lg text-ink">{c.title}</p>
                        <p className="serif-it text-[0.95rem] text-muted">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="h-full rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-38px_rgba(21,20,26,0.6)]">
                <Label>Half-day run of show</Label>
                <dl className="mt-5">
                  {RUN_OF_SHOW.map(([time, what]) => (
                    <div
                      key={time}
                      className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-ink/8 py-3 last:border-0"
                    >
                      <dt className="label w-[7.5rem] shrink-0 text-red">{time}</dt>
                      <dd className="text-[0.9375rem] text-ink">{what}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        ) : null}

        {chapter.note ? (
          <Reveal className="mt-6">
            <div className="flex flex-col gap-3 rounded-[var(--r-lg)] bg-cream-2 px-7 py-6 sm:flex-row sm:items-baseline sm:gap-7">
              <Label className="shrink-0">{chapter.note.label}</Label>
              <p className="serif-it max-w-[76ch] text-[1.05rem] leading-relaxed text-ink/75">
                {chapter.note.body}
              </p>
            </div>
          </Reveal>
        ) : null}
      </Container>
    </article>
  );
}

export function Chapters() {
  return (
    <div id="chapters" className="scroll-mt-24">
      {CHAPTERS.map((c, i) => (
        <ChapterBlock key={c.id} chapter={c} alt={i % 2 === 1} />
      ))}
    </div>
  );
}
