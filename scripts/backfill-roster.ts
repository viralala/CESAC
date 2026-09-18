/**
 * Fill in the PRN and class the roster import never carried.
 *
 *   npx tsx scripts/backfill-roster.ts              # report only, writes nothing
 *   npx tsx scripts/backfill-roster.ts --commit     # actually write them
 *
 * The import on 17 September created 1,868 accounts with a name, an address
 * and a year, and nothing else. `profiles.prn` and `profiles.student_class`
 * were left for students to fill in from their own profile page, and two of
 * them have. So the organiser console shows "No class or PRN on the row"
 * against very nearly every student, and the one place that matters is a desk
 * on the day, where somebody is holding a printed class list and needs to find
 * the person in front of them on it.
 *
 * Both numbers are in the spreadsheets the accounts were made from, so this
 * reads the same two files through the same parser and writes only what is
 * missing.
 *
 * Deliberately a local script and not an admin route, for the reason set out
 * at the top of import-students.ts: the service role key overrides every row
 * level security policy in the project, and it belongs on a laptop for the few
 * minutes this runs rather than in the deployment for the rest of the
 * project's life.
 *
 * WHAT IT WILL NOT DO
 *
 * It never overwrites. A student who has typed their own PRN or class into
 * their profile keeps what they typed, because they are a better authority on
 * it than a spreadsheet, and because silently replacing something somebody
 * entered by hand is how you lose a correction.
 *
 * It skips any address the roster gives two different answers for. There are
 * two such addresses, each claimed by two different students, and they are the
 * same fault that kept five accounts out of the original import. Guessing
 * which one is right would stamp somebody else's number on a real student.
 *
 * Safe to re-run: a second run finds nothing left to do.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Database } from "../src/lib/supabase/database.types";
import { SOURCES, parseWorkbook, type Student } from "./students";

const DATA_DIR = resolve(process.cwd(), "..", "Data");
const REPORT = resolve(process.cwd(), "backfill-report.csv");
const COMMIT = process.argv.includes("--commit");

/** Rows per update round trip. Small enough to read in the log if one fails. */
const BATCH = 100;

const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;

function env(): { url: string; key: string } {
  const local = resolve(process.cwd(), ".env.local");
  if (existsSync(local)) {
    for (const line of readFileSync(local, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lgshgaltulbnjqfxjsme.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) {
    console.error(
      red("\n  SUPABASE_SERVICE_ROLE_KEY is not set.\n") +
        "  Put it in .env.local. It is gitignored and is only read here.\n",
    );
    process.exit(1);
  }
  return { url, key };
}

async function main() {
  console.log(`\n  Roster backfill${COMMIT ? "" : dim("  (reporting only, nothing is written)")}\n`);

  // ---- read the spreadsheets -------------------------------------------
  const rows: Student[] = [];
  for (const source of SOURCES) {
    const { students, rowsRead } = await parseWorkbook(DATA_DIR, source);
    rows.push(...students);
    console.log(`  ${dim("read")} ${source.file.padEnd(26)} ${rowsRead} rows, ${students.length} usable`);
  }

  // ---- one answer per address, or none ---------------------------------
  const byEmail = new Map<string, Student>();
  const disputed = new Set<string>();

  for (const s of rows) {
    const seen = byEmail.get(s.email);
    if (!seen) {
      byEmail.set(s.email, s);
      continue;
    }
    // The same person listed twice is fine. Two different numbers against one
    // address is the roster contradicting itself, and neither answer is safe.
    if (seen.prn !== s.prn || seen.studentClass !== s.studentClass) disputed.add(s.email);
  }
  for (const email of disputed) byEmail.delete(email);

  /*
   * Hold back a number that is not the shape of any scheme in use.
   *
   * There is more than one scheme, and the first cut of this check assumed
   * there was one per year and held back sixty-five perfectly good students.
   * Most of TY carries an eight digit PRN, all of SY carries a ten digit GR
   * number, and a group inside TY carries a ten digit one too. So the test is
   * not "the usual length for your year", it is "a length this roster
   * actually uses", counted here rather than written down, with a floor so
   * that one mistyped cell cannot establish itself as a scheme.
   *
   * What that leaves is the genuinely odd ones, and there are two: a seven
   * digit number that looks like an older intake and is probably right, and a
   * nine digit one belonging to the truncated cell that kept a student out of
   * the original import, where the address and the number are short together
   * so the number would be recorded wrong. Both want a person, not a rule.
   */
  const SCHEME_FLOOR = 10;
  const lengths = new Map<number, number>();
  for (const s of byEmail.values()) {
    if (s.prn) lengths.set(s.prn.length, (lengths.get(s.prn.length) ?? 0) + 1);
  }
  const schemes = new Set(
    [...lengths.entries()].filter(([, n]) => n >= SCHEME_FLOOR).map(([len]) => len),
  );

  const oddLength: Student[] = [];
  for (const [email, s] of byEmail) {
    if (s.prn && !schemes.has(s.prn.length)) {
      oddLength.push(s);
      byEmail.delete(email);
    }
  }

  console.log(
    `\n  ${byEmail.size} addresses with one clear answer` +
      (disputed.size ? `, ${yellow(String(disputed.size))} the roster disagrees with itself about` : ""),
  );
  for (const email of disputed) console.log(`    ${yellow("?")} ${email}`);

  if (oddLength.length) {
    console.log(
      `\n  ${yellow(String(oddLength.length))} held back, the number is not the shape of any scheme on the roster` +
        dim(`  (in use: ${[...schemes].sort().join(" and ")} digits)`),
    );
    for (const s of oddLength) {
      console.log(
        `    ${yellow("?")} ${s.email.padEnd(34)} ${s.prn} ` +
          dim(`(${s.prn?.length} digits, ${s.year})`),
      );
    }
    console.log(dim("      Worth a look in the spreadsheet, then set by hand if they are right."));
  }

  // ---- what the database already has -----------------------------------
  const { url, key } = env();
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = new Map<string, { id: string; prn: string | null; cls: string | null }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("profiles")
      .select("id, email, prn, student_class")
      .range(from, from + 999);
    if (error) throw new Error(`could not read profiles: ${error.message}`);
    for (const p of data ?? []) {
      existing.set(p.email.toLowerCase(), { id: p.id, prn: p.prn, cls: p.student_class });
    }
    if (!data || data.length < 1000) break;
  }
  console.log(`  ${existing.size} accounts on the site\n`);

  // ---- decide, without overwriting anybody -----------------------------
  type Change = { id: string; email: string; prn?: string; student_class?: string };
  const changes: Change[] = [];
  let noAccount = 0;
  let alreadySet = 0;
  let nothingToAdd = 0;

  for (const [email, s] of byEmail) {
    const have = existing.get(email);
    if (!have) {
      noAccount++;
      continue;
    }

    const change: Change = { id: have.id, email };
    if (!have.prn && s.prn) change.prn = s.prn;
    if (!have.cls && s.studentClass) change.student_class = s.studentClass;

    if (change.prn === undefined && change.student_class === undefined) {
      if (have.prn || have.cls) alreadySet++;
      else nothingToAdd++;
      continue;
    }
    changes.push(change);
  }

  console.log(`  ${green(String(changes.length))} accounts would gain a PRN, a class, or both`);
  console.log(`  ${dim(String(alreadySet))} already have theirs and are left alone`);
  if (nothingToAdd) console.log(`  ${dim(String(nothingToAdd))} have nothing on the sheet to add`);
  if (noAccount) console.log(`  ${dim(String(noAccount))} roster rows have no account on the site`);

  writeFileSync(
    REPORT,
    [
      ["email", "prn", "class"],
      ...changes.map((c) => [c.email, c.prn ?? "", c.student_class ?? ""]),
    ]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n"),
    "utf8",
  );
  console.log(`\n  Written to ${dim(REPORT)}`);
  console.log(`  ${dim("That file holds real names and addresses. It is gitignored.")}`);

  if (!COMMIT) {
    console.log(
      `\n  ${yellow("Nothing was written.")} Read the report, then run again with --commit.\n`,
    );
    return;
  }

  // ---- write ------------------------------------------------------------
  let done = 0;
  const failed: { email: string; reason: string }[] = [];

  for (let i = 0; i < changes.length; i += BATCH) {
    const batch = changes.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (c) => {
        const patch: { prn?: string; student_class?: string } = {};
        if (c.prn !== undefined) patch.prn = c.prn;
        if (c.student_class !== undefined) patch.student_class = c.student_class;

        const { error } = await db.from("profiles").update(patch).eq("id", c.id);
        if (error) failed.push({ email: c.email, reason: error.message });
        else done++;
      }),
    );
    process.stdout.write(`\r  writing ${done}/${changes.length}`);
  }

  console.log(`\n\n  ${green(String(done))} updated`);
  if (failed.length) {
    console.log(`  ${red(String(failed.length))} failed:`);
    for (const f of failed.slice(0, 20)) console.log(`    ${red("x")} ${f.email}  ${f.reason}`);
  }
  console.log();
}

main().catch((e) => {
  console.error(red(`\n  ${e instanceof Error ? e.message : String(e)}\n`));
  process.exit(1);
});
