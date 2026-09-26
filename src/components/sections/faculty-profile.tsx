import { Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import type { FacultyDetails } from "@/lib/data/roster-profiles";

/**
 * The long form of a faculty member's page.
 *
 * Everything here is transcribed from the Institute's own faculty profile,
 * which is linked at the foot so a reader can check it. A section with
 * nothing in it is left out rather than padded: a thin source makes a short
 * page, never an invented one. The same page's phone number and date of
 * birth are deliberately not transcribed.
 */
export function FacultyProfile({ details }: { details: FacultyDetails }) {
  const publications = details.publications ?? [];
  const pubCount = publications.reduce((n, g) => n + g.items.length, 0);
  const patents = details.patents ?? [];
  const projects = details.projects ?? [];
  const training = details.training ?? [];
  const qualifications = details.qualifications ?? [];
  const career = details.career ?? [];
  const responsibilities = details.responsibilities ?? [];

  const stats = [
    details.experience ? { value: details.experience, label: "Experience" } : null,
    details.joined ? { value: details.joined, label: "Joined the Institute" } : null,
    pubCount ? { value: String(pubCount), label: pubCount === 1 ? "Publication" : "Publications" } : null,
    patents.length ? { value: String(patents.length), label: patents.length === 1 ? "Patent" : "Patents" } : null,
    projects.length
      ? { value: String(projects.length), label: "Funded projects and grants" }
      : null,
  ].filter((s): s is { value: string; label: string } => s !== null);

  return (
    <div className="grid gap-3">
      {stats.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="card px-5 py-6 text-center">
              <p className="d-tall text-[1.55rem] leading-tight text-ink">{stat.value}</p>
              <p className="label mt-2 text-teal">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {qualifications.length ? (
          <Reveal>
            <article className="card h-full p-7 sm:p-9">
              <Label tone="teal">Qualifications</Label>
              <ul className="mt-5 grid gap-3">
                {qualifications.map((q, i) => (
                  <li key={`${q.degree}-${i}`} className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
                    <span>
                      <span className="d-tall block text-[1.25rem] text-ink">{q.degree}</span>
                      {q.from ? <span className="block text-[0.95rem] text-muted">{q.from}</span> : null}
                    </span>
                    {q.year ? <span className="label text-ink">{q.year}</span> : null}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ) : null}

        {career.length ? (
          <Reveal delay={60}>
            <article className="card h-full p-7 sm:p-9">
              <Label tone="teal">Career</Label>
              <ol className="mt-5 grid gap-3">
                {career.map((c, i) => (
                  <li key={`${c.org}-${c.from}-${i}`} className="border-l-2 border-teal/40 pl-4">
                    <span className="block text-[1rem] text-ink">{c.role ?? c.org}</span>
                    {c.role ? <span className="block text-[0.92rem] text-muted">{c.org}</span> : null}
                    {c.from ? (
                      <span className="label-sm mt-1 block text-muted">
                        {c.from} to {c.to ?? "present"}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </article>
          </Reveal>
        ) : null}
      </div>

      {responsibilities.length ? (
        <Reveal>
          <article className="card p-7 sm:p-9">
            <Label tone="teal">Responsibilities</Label>
            <ul className="mt-5 flex flex-wrap gap-2">
              {responsibilities.map((r) => (
                <li key={r} className="label-sm rounded-full bg-cream-2 px-3.5 py-2 text-ink">
                  {r}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ) : null}

      {publications.length ? (
        <Reveal>
          <article className="card p-7 sm:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Label tone="teal">Publications</Label>
              <span className="label text-muted">{pubCount}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {publications.map((group, g) => (
                <details
                  key={group.type}
                  open={g === 0}
                  className="group rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4">
                    <span className="d-tall text-[1.2rem] text-ink">{group.type}</span>
                    <span className="label text-muted">
                      {group.items.length}
                      <span aria-hidden className="ml-2 inline-block transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </span>
                  </summary>
                  <ol className="mt-4 grid gap-3">
                    {group.items.map((item, i) => (
                      <li key={`${item.title}-${i}`} className="grid gap-0.5 border-t border-ink/10 pt-3">
                        <span className="text-[0.98rem] leading-snug text-ink">{item.title}</span>
                        <span className="text-[0.88rem] leading-snug text-muted">
                          {[item.venue, item.year].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </article>
        </Reveal>
      ) : null}

      {patents.length || projects.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {patents.length ? (
            <Reveal>
              <article className="card h-full p-7 sm:p-9">
                <Label tone="teal">Patents</Label>
                <ul className="mt-5 grid gap-2.5">
                  {patents.map((p) => (
                    <li key={p} className="border-b border-ink/10 pb-2.5 text-[0.98rem] leading-snug text-ink last:border-0 last:pb-0">
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ) : null}
          {projects.length ? (
            <Reveal delay={60}>
              <article className="card h-full p-7 sm:p-9">
                <Label tone="teal">Funded projects and research grants</Label>
                <ul className="mt-5 grid gap-2.5">
                  {projects.map((p, i) => (
                    <li key={`${p}-${i}`} className="border-b border-ink/10 pb-2.5 text-[0.98rem] leading-snug text-ink last:border-0 last:pb-0">
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ) : null}
        </div>
      ) : null}

      {training.length ? (
        <Reveal>
          <article className="card p-7 sm:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Label tone="teal">Talks, training and faculty development</Label>
              <span className="label text-muted">{training.length}</span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr>
                    {["Programme", "Type", "Role", "When"].map((h) => (
                      <th key={h} scope="col" className="label-sm border-b-2 border-ink/15 px-2 py-2 font-normal text-muted first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {training.map((t, i) => (
                    <tr key={`${t.name}-${i}`} className="align-top">
                      <td className="border-b border-ink/10 px-2 py-3 pl-0 text-[0.95rem] leading-snug text-ink">
                        {t.name}
                        {t.note ? (
                          <span className="mt-0.5 block text-[0.85rem] text-muted">{t.note}</span>
                        ) : null}
                      </td>
                      <td className="border-b border-ink/10 px-2 py-3 text-[0.9rem] text-ink/85">{t.type}</td>
                      <td className="border-b border-ink/10 px-2 py-3 text-[0.9rem] text-ink/85">{t.role}</td>
                      <td className="label-sm border-b border-ink/10 px-2 py-3 whitespace-nowrap text-muted">
                        {t.from === t.to || !t.to ? t.from : `${t.from} to ${t.to}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </Reveal>
      ) : null}

      {details.source ? (
        <p className="serif-it mt-3 text-[0.92rem] leading-relaxed text-muted">
          Transcribed from the{" "}
          <a
            href={details.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal underline underline-offset-4 hover:text-ink"
          >
            Institute&apos;s faculty profile
          </a>
          , where it is kept up to date.
        </p>
      ) : null}
    </div>
  );
}
