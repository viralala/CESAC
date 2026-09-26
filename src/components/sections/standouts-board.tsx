"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { Avatar } from "@/components/site/avatar";
import { rupees } from "@/lib/console/options";
import { metricUnit } from "@/lib/data/metrics";
import type { ShowcaseCategory, ShowcaseEntry } from "@/lib/data/site";

/** One accent per category, in the order the console sets them. */
const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];
const ON_POPS = ["var(--on-pop)", "var(--on-pop-light)", "var(--on-pop)", "var(--on-pop-light)"];

function amount(metric: string, value: number): string {
  if (metric === "manual") return "";
  if (metric === "prize_money") return rupees(value);
  return `${value} ${metricUnit(metric)}`;
}

function matches(entry: ShowcaseEntry, needle: string): boolean {
  if (!needle) return true;
  return (
    entry.name.toLowerCase().includes(needle) ||
    (entry.year ?? "").toLowerCase().includes(needle) ||
    (entry.note ?? "").toLowerCase().includes(needle)
  );
}

/**
 * Every standout, one category at a time, with a search box.
 *
 * The front page prints the top three of each category and links here for
 * the rest. The list is the same public data the front page draws from, a
 * name, a year, a number and a photo, so searching it in the browser puts
 * nothing in the page that was not already public.
 *
 * The search looks through every category at once and each tab says how many
 * it would show, so "is my friend on here anywhere" is one question rather
 * than one per tab.
 */
export function StandoutsBoard({
  categories,
  initial,
}: {
  categories: ShowcaseCategory[];
  initial?: string;
}) {
  const uid = useId();
  const [active, setActive] = useState(
    categories.some((c) => c.id === initial) ? initial! : (categories[0]?.id ?? ""),
  );
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const counts = useMemo(
    () => new Map(categories.map((c) => [c.id, c.entries.filter((e) => matches(e, needle)).length])),
    [categories, needle],
  );

  const index = Math.max(0, categories.findIndex((c) => c.id === active));
  const category = categories[index];
  const pop = POPS[index % POPS.length];
  const onPop = ON_POPS[index % ON_POPS.length];
  const shown = category ? category.entries.filter((e) => matches(e, needle)) : [];

  function pick(id: string) {
    setActive(id);
    // Kept in the address so the tab survives a reload and can be shared.
    // replaceState rather than a navigation: nothing on the server changes.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("c", id);
      window.history.replaceState(null, "", url);
    } catch {
      // A sandboxed frame can refuse this. The tab still switches.
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <label htmlFor={`${uid}-q`} className="sr-only">
          Search the standouts
        </label>
        <input
          id={`${uid}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or year"
          autoComplete="off"
          className="field min-w-[min(100%,18rem)] flex-1"
        />
        {needle ? (
          <p className="label-sm text-muted" aria-live="polite">
            {[...counts.values()].reduce((a, b) => a + b, 0)} found across{" "}
            {[...counts.values()].filter(Boolean).length} of {categories.length} categories
          </p>
        ) : null}
      </div>

      <div role="tablist" aria-label="Categories" className="flex flex-wrap gap-2">
        {categories.map((c, i) => {
          const on = c.id === category?.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${uid}-panel`}
              onClick={() => pick(c.id)}
              className={`label inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 transition-colors ${
                on ? "border-transparent" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
              style={on ? { background: POPS[i % POPS.length], color: ON_POPS[i % ON_POPS.length] } : undefined}
            >
              {c.title}
              <span className={`label-sm rounded-full px-2 py-0.5 ${on ? "bg-black/10" : "bg-cream-2 text-muted"}`}>
                {counts.get(c.id) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {category ? (
        <section id={`${uid}-panel`} role="tabpanel" className="card p-6 sm:p-9">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-5" style={{ borderColor: pop }}>
            <div>
              <h2 className="d-tall text-[clamp(1.9rem,4vw,2.6rem)] leading-tight text-ink">{category.title}</h2>
              {category.blurb ? (
                <p className="mt-1.5 text-[0.95rem] leading-snug text-muted">{category.blurb}</p>
              ) : null}
            </div>
            <p className="label-sm text-muted">
              {category.entries.length} {category.entries.length === 1 ? "student" : "students"}
              {category.metric === "manual" ? " named by the committee" : " on the list"}
            </p>
          </header>

          {shown.length === 0 ? (
            <p className="serif-it mt-6 rounded-[var(--r-md)] border-2 border-dashed border-ink/15 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
              {needle
                ? `Nobody matching "${query.trim()}" in ${category.title}.`
                : "Nobody in this category yet."}
            </p>
          ) : (
            <ol className="mt-2 grid">
              {shown.map((entry) => {
                const podium = category.metric !== "manual" && entry.place <= 3;
                return (
                  <li key={entry.studentId} className="border-b border-ink/10 last:border-0">
                    <Link
                      href={`/standouts/${entry.studentId}`}
                      className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          className={`d-tall grid h-9 w-9 shrink-0 place-items-center rounded-full text-[1.05rem] leading-none ${
                            podium ? "" : "text-ink/40"
                          }`}
                          style={podium ? { background: pop, color: onPop } : undefined}
                        >
                          {entry.place}
                        </span>
                        <Avatar
                          key={entry.photo ?? "none"}
                          name={entry.name}
                          sources={[entry.photo]}
                          size={52}
                        />
                        <span className="min-w-0">
                          <span className="block text-[1.05rem] leading-snug text-ink decoration-teal decoration-2 underline-offset-4 group-hover:underline">
                            {entry.name}
                          </span>
                          <span className="label-sm block text-muted">{entry.note ?? entry.year ?? ""}</span>
                        </span>
                      </span>
                      {category.metric === "manual" ? null : (
                        <span className="label shrink-0 text-teal">{amount(category.metric, entry.value)}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ) : null}
    </div>
  );
}
