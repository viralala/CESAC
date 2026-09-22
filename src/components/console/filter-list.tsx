"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Label } from "@/components/aot/bits";

/**
 * One thing a list can be narrowed by: a kind, a level, a topic, a state.
 *
 * The options are given rather than worked out from the rows, so a facet can
 * offer a value nothing currently matches. That is the point of showing the
 * count next to each one: "turned down, 0" is a useful thing to be told, and
 * a chip that only appears once something matches it is a chip nobody learns
 * is there.
 */
export type Facet = {
  /** Key into each row's `facets`. */
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
};

export type ListRow = {
  id: string;
  /** What this row is, per facet. A missing key never matches that facet. */
  facets: Record<string, string>;
  /** Everything the search box should look through, already lowercased. */
  search: string;
  /** The line that is always visible. */
  summary: ReactNode;
  /** What unfolding the row shows. */
  detail: ReactNode;
};

/**
 * A long list of records or questions, as something you can actually work.
 *
 * Three things, all asked for on 22 September and all the same complaint:
 * fifty records rendered in full is a page nobody can find anything in.
 *
 * **Folding the row.** Each row shows one line and opens on click. The
 * decision buttons stay on the folded line rather than going inside, because
 * a queue is worked by deciding, and hiding the verb behind a disclosure adds
 * a click to every single row.
 *
 * **Folding the list.** The whole panel collapses to its header. Somebody who
 * has answered everything wants the settled list out of the way, not scrolled
 * past.
 *
 * **Filtering.** Chips rather than a select, because the counts are half the
 * information: how many are waiting, how many are books, how many reached
 * national. Each facet's counts are worked out against the rows that pass
 * *every other* filter, so narrowing by kind immediately tells you what
 * levels are left inside that kind rather than restating the whole table.
 *
 * All of it is state in the browser and none of it is in the URL. These are
 * consoles somebody stands in front of and sorts through, not pages they
 * link each other to, and a filter in the address bar would be one more
 * thing to have to clear.
 */
export function FilterList({
  eyebrow,
  title,
  blurb,
  noun,
  facets = [],
  rows,
  empty,
  searchPlaceholder = "Search",
  startFolded = false,
}: {
  eyebrow?: string;
  title: string;
  blurb?: ReactNode;
  /** Singular noun for the counts. "record", "question". */
  noun: string;
  facets?: readonly Facet[];
  rows: readonly ListRow[];
  /** Shown when there is nothing in the list at all, before any filtering. */
  empty: ReactNode;
  searchPlaceholder?: string;
  startFolded?: boolean;
}) {
  const [folded, setFolded] = useState(startFolded);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const needle = term.trim().toLowerCase();

  /** Does this row pass everything except the facet named? */
  const passes = useMemo(() => {
    return (row: ListRow, ignore?: string) => {
      if (needle && !row.search.includes(needle)) return false;
      for (const [name, value] of Object.entries(picked)) {
        if (!value || name === ignore) continue;
        if (row.facets[name] !== value) return false;
      }
      return true;
    };
  }, [picked, needle]);

  const shown = useMemo(() => rows.filter((row) => passes(row)), [rows, passes]);

  // Counts per option, against the rows that pass every other filter.
  const counts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const facet of facets) {
      const pool = rows.filter((row) => passes(row, facet.name));
      const tally: Record<string, number> = { "": pool.length };
      for (const option of facet.options) {
        tally[option.value] = pool.filter((row) => row.facets[facet.name] === option.value).length;
      }
      out[facet.name] = tally;
    }
    return out;
  }, [facets, rows, passes]);

  const filtering = needle !== "" || Object.values(picked).some(Boolean);
  const allOpen = shown.length > 0 && shown.every((row) => open.has(row.id));

  function toggleRow(id: string) {
    setOpen((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="card p-7 sm:p-9">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow ? <Label tone="teal">{eyebrow}</Label> : null}
          <h2 className="d-tall mt-2.5 text-[1.75rem] text-ink">{title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="label text-muted">
            {filtering && shown.length !== rows.length
              ? `${shown.length} of ${rows.length}`
              : `${rows.length} ${rows.length === 1 ? noun : `${noun}s`}`}
          </span>
          <button
            type="button"
            onClick={() => setFolded((was) => !was)}
            aria-expanded={!folded}
            className="label flex items-center gap-2 rounded-full border-2 border-ink/15 px-4 py-2 text-muted transition-colors hover:border-ink/40 hover:text-ink"
          >
            <span
              aria-hidden
              className={`inline-block transition-transform duration-200 ${folded ? "" : "rotate-90"}`}
            >
              &rsaquo;
            </span>
            {folded ? "Unfold" : "Fold"}
          </button>
        </div>
      </header>

      {folded ? null : (
        <>
          {blurb ? (
            <p className="serif-it mt-5 text-[1rem] leading-relaxed text-muted">{blurb}</p>
          ) : null}

          {rows.length === 0 ? (
            <div className="mt-6">{empty}</div>
          ) : (
            <>
              {/* ------------------------------------------------- the filters */}
              <div className="mt-6 grid gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-5">
                {facets.map((facet) => (
                  <div key={facet.name} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="label-sm w-24 shrink-0 text-muted">{facet.label}</span>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        on={!picked[facet.name]}
                        count={counts[facet.name]?.[""] ?? 0}
                        onClick={() => setPicked((was) => ({ ...was, [facet.name]: "" }))}
                      >
                        All
                      </Chip>
                      {facet.options.map((option) => (
                        <Chip
                          key={option.value}
                          on={picked[facet.name] === option.value}
                          count={counts[facet.name]?.[option.value] ?? 0}
                          onClick={() =>
                            setPicked((was) => ({
                              ...was,
                              [facet.name]: was[facet.name] === option.value ? "" : option.value,
                            }))
                          }
                        >
                          {option.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <span className="label-sm w-24 shrink-0 text-muted">Search</span>
                  <input
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="field min-w-0 flex-1 bg-white py-2.5"
                  />
                  {filtering ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPicked({});
                        setTerm("");
                      }}
                      className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-muted transition-colors hover:border-red/40 hover:text-red-deep"
                    >
                      Clear
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setOpen(allOpen ? new Set() : new Set(shown.map((row) => row.id)))
                    }
                    className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-muted transition-colors hover:border-teal hover:text-teal"
                  >
                    {allOpen ? "Close all" : "Open all"}
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------- the rows */}
              {shown.length === 0 ? (
                <p className="serif-it mt-6 rounded-[var(--r-md)] border-2 border-dashed border-ink/15 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
                  Nothing matches that. There {rows.length === 1 ? "is" : "are"} {rows.length}{" "}
                  {rows.length === 1 ? noun : `${noun}s`} in this list; clear the filters to see
                  {rows.length === 1 ? " it" : " them"}.
                </p>
              ) : (
                <ul className="mt-6 grid gap-2.5">
                  {shown.map((row) => {
                    const isOpen = open.has(row.id);
                    return (
                      <li
                        key={row.id}
                        className={`rounded-[var(--r-md)] border-2 transition-colors ${
                          isOpen ? "border-teal/40 bg-teal/[0.03]" : "border-ink/10"
                        }`}
                      >
                        <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                          <button
                            type="button"
                            onClick={() => toggleRow(row.id)}
                            aria-expanded={isOpen}
                            aria-controls={`row-${row.id}`}
                            className="mt-0.5 shrink-0 rounded-full px-1.5 text-[1.1rem] leading-none text-muted transition-colors hover:text-teal"
                          >
                            <span
                              aria-hidden
                              className={`inline-block transition-transform duration-200 ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            >
                              &rsaquo;
                            </span>
                            <span className="sr-only">
                              {isOpen ? "Fold this one" : "Open this one"}
                            </span>
                          </button>
                          <div className="min-w-0 flex-1">{row.summary}</div>
                        </div>

                        {isOpen ? (
                          <div
                            id={`row-${row.id}`}
                            className="border-t-2 border-ink/10 px-4 py-4 sm:px-5"
                          >
                            {row.detail}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

/** A filter chip, with how many it would leave. */
function Chip({
  on,
  count,
  onClick,
  children,
}: {
  on: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      // A chip that would empty the list is dimmed rather than removed. Taking
      // it away would make the row of chips jump about as the other filters
      // change, and "none of these are books" is worth being able to read.
      className={`label-sm flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 transition-colors ${
        on
          ? "border-teal bg-teal text-white"
          : count === 0
            ? "border-ink/10 text-muted/50"
            : "border-ink/15 bg-white text-muted hover:border-teal hover:text-teal"
      }`}
    >
      {children}
      <span className={on ? "text-white/70" : "text-muted/60"}>{count}</span>
    </button>
  );
}
