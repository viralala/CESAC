/**
 * One-off roster import.
 *
 *   npx tsx scripts/import-students.ts              # parse and report, writes nothing
 *   npx tsx scripts/import-students.ts --commit     # actually create the accounts
 *
 * Deliberately a local script and not a route.
 *
 * Creating accounts in bulk needs the service role key, which overrides every
 * row level security policy in the project. This codebase has never held one
 * and the running site still does not: the key is read from .env.local, which
 * is gitignored, and is used here on a laptop for a few minutes. Putting the
 * same power behind an admin route would mean shipping that key to the
 * deployment for the rest of the project's life, guarded by nothing but a
 * session check, so that an operation that runs twice a year could be clicked
 * instead of typed. It is not worth it.
 *
 * Each student's first password is their own email address. That is only
 * acceptable because it expires on contact: every imported account is flagged
 * must_change_password, and lib/auth/guard.ts holds the whole app shut until
 * the student has set a real one.
 *
 * Safe to re-run. An address that already has an account is skipped, so a run
 * that dies halfway can simply be run again.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import type { Database } from "../src/lib/supabase/database.types";
import { SOURCES, dedupe, parseWorkbook, type Rejection, type Student } from "./students";

const DATA_DIR = resolve(process.cwd(), "..", "Data");
const REPORT = resolve(process.cwd(), "import-report.csv");
const COMMIT = process.argv.includes("--commit");

/** How many accounts to create at once. Gentle on the auth endpoint. */
const CONCURRENCY = 4;

/** Attempts per account before giving up and reporting it. */
const MAX_TRIES = 5;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * Whether an error is worth another go.
 *
 * Supabase does not document a rate limit on the admin endpoints, which is not
 * the same as promising there is none, and this run makes nearly two thousand
 * calls in a few minutes. A throttle or a dropped connection two thirds of the
 * way through should cost a pause, not a column of failures in the summary.
 * A rejected password or a duplicate address is settled and never retried.
 */
function worthRetrying(message: string): boolean {
  return /rate limit|too many|timeout|timed out|fetch failed|network|socket|ECONN|EAI_AGAIN|502|503|504|unexpected_failure/i.test(
    message,
  );
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * .env.local, parsed here rather than relying on a loader flag, so the script
 * runs the same way on every Node version anyone on the committee has.
 */
function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const bold = (s: string) => `[1m${s}[0m`;
const dim = (s: string) => `[2m${s}[0m`;
const red = (s: string) => `[31m${s}[0m`;
const green = (s: string) => `[32m${s}[0m`;
const yellow = (s: string) => `[33m${s}[0m`;

function rule(label = ""): void {
  const line = "-".repeat(Math.max(0, 74 - label.length));
  console.log(dim(label ? `-- ${label} ${line}` : `--${line}--`));
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal();

  console.log();
  console.log(bold("CESAC roster import"));
  console.log(
    COMMIT
      ? red("  --commit given: this run will create real accounts.")
      : yellow("  Dry run. Nothing will be written. Pass --commit to create accounts."),
  );
  console.log();

  // -- read -----------------------------------------------------------------

  rule("reading");
  const everyone: Student[] = [];
  const rejected: Rejection[] = [];
  let rowsRead = 0;

  for (const source of SOURCES) {
    const path = `${DATA_DIR}/${source.file}`;
    if (!existsSync(path)) {
      console.error(red(`  missing: ${path}`));
      process.exitCode = 1;
      return;
    }
    const result = await parseWorkbook(DATA_DIR, source);
    rowsRead += result.rowsRead;
    everyone.push(...result.students);
    rejected.push(...result.rejected);
    console.log(
      `  ${source.file.padEnd(26)} ${String(result.rowsRead).padStart(5)} rows  ` +
        `${String(result.students.length).padStart(5)} usable  ` +
        `${String(result.rejected.length).padStart(3)} rejected`,
    );
  }

  const { unique, rejected: dupes } = dedupe(everyone);
  rejected.push(...dupes);

  const repaired = unique.filter((s) => s.repairedFrom);
  const review = unique.filter((s) => s.review);

  console.log();
  console.log(`  rows processed      ${bold(String(rowsRead))}`);
  console.log(`  unique students     ${bold(String(unique.length))}`);
  console.log(`  addresses repaired  ${repaired.length}`);
  console.log(`  rejected outright   ${rejected.length}`);
  console.log();

  if (repaired.length) {
    rule("repaired addresses");
    for (const s of repaired) {
      console.log(`  ${s.repairedFrom}`);
      console.log(`    ${green("->")} ${s.email}  ${dim(s.source)}`);
    }
    console.log();
  }

  if (review.length) {
    rule("imported, but worth a look");
    for (const s of review) {
      console.log(`  ${yellow("?")} ${s.email.padEnd(34)} ${s.name}`);
      console.log(`    ${dim(`${s.review} | ${s.source}`)}`);
    }
    console.log();
  }

  if (rejected.length) {
    rule("not imported");
    for (const r of rejected) {
      console.log(`  ${red("x")} ${(r.value || "(no address)").padEnd(34)} ${r.name || "(no name)"}`);
      console.log(`    ${dim(`${r.reason} | ${r.source}`)}`);
    }
    console.log();
  }

  // A file is easier to act on than scrollback when the fix is to edit the
  // spreadsheet and run this again.
  const rows = [
    ["email", "name", "reason", "source"],
    ...rejected.map((r) => [r.value, r.name, r.reason, r.source]),
  ];
  writeFileSync(REPORT, rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n", "utf8");
  console.log(dim(`  rejected rows also written to ${REPORT}`));
  console.log();

  if (!COMMIT) {
    rule("dry run");
    console.log(`  ${bold(String(unique.length))} accounts would be created.`);
    console.log(`  Re-run with ${bold("--commit")} to create them.`);
    console.log();
    return;
  }

  // -- write ----------------------------------------------------------------

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lgshgaltulbnjqfxjsme.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error(red("  SUPABASE_SERVICE_ROLE_KEY is not set."));
    console.error("  Put it in .env.local (gitignored). See README, 'Importing the roster'.");
    process.exitCode = 1;
    return;
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // One query beats 1,873 duplicate-key round trips, and makes a re-run after
  // a half-finished attempt cost almost nothing.
  rule("checking what already exists");
  const existing = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("profiles")
      .select("email")
      .range(from, from + 999);
    if (error) {
      console.error(red(`  could not read existing profiles: ${error.message}`));
      process.exitCode = 1;
      return;
    }
    for (const row of data ?? []) existing.add(row.email.toLowerCase());
    if (!data || data.length < 1000) break;
  }
  console.log(`  ${existing.size} accounts already on the project`);
  console.log();

  const todo = unique.filter((s) => !existing.has(s.email));
  const alreadyThere = unique.length - todo.length;

  rule("creating accounts");
  let created = 0;
  let failed = 0;
  let raced = 0;
  const failures: Rejection[] = [];

  let cursor = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor++;
      if (i >= todo.length) return;
      const s = todo[i];

      let lastError = "";
      let outcome: "created" | "raced" | "failed" = "failed";

      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const { error } = await admin.auth.admin.createUser({
          email: s.email,
          // The student's own address. GoTrue bcrypt-hashes it on the way in;
          // the plaintext exists only for this request and is never stored,
          // logged or printed by this script.
          password: s.email,
          // No confirmation mail for nearly two thousand people who did not ask
          // for one, and the built-in mailer sends two an hour, so a roster
          // this size would take a month to let itself in. The address came
          // from the department's own records, which is a stronger check than
          // a link in an inbox anyway.
          email_confirm: true,
          user_metadata: {
            full_name: s.name,
            phone: s.phone ?? "",
            college: "VIT Pune",
            year: s.year,
            // handle_new_user reads this and arms the forced password change
            // as part of the same insert that creates the profile, so no
            // account ever exists unflagged.
            must_change_password: true,
          },
        });

        if (!error) {
          outcome = "created";
          break;
        }

        // Somebody signed up between the pre-check and now, which is a skip
        // and not a failure.
        if (/already|registered|exists/i.test(error.message)) {
          outcome = "raced";
          break;
        }

        lastError = error.message;
        if (attempt === MAX_TRIES || !worthRetrying(error.message)) break;

        // Back off, and widen the gap each time: 1s, 2s, 4s, 8s.
        await sleep(1000 * 2 ** (attempt - 1));
      }

      if (outcome === "created") created++;
      else if (outcome === "raced") raced++;
      else {
        failed++;
        failures.push({ source: s.source, name: s.name, value: s.email, reason: lastError });
      }

      const done = created + failed + raced;
      if (done % 50 === 0 || done === todo.length) {
        process.stdout.write(`\r  ${done}/${todo.length} processed, ${created} created   `);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n\n");

  // -- summary --------------------------------------------------------------

  rule("summary");
  console.log(`  rows processed          ${bold(String(rowsRead))}`);
  console.log(`  accounts created        ${bold(green(String(created)))}`);
  console.log(`  accounts skipped        ${bold(String(alreadyThere + raced + rejected.length))}`);
  console.log(`    already had one       ${alreadyThere + raced}`);
  console.log(`    unusable row          ${rejected.length}`);
  if (failed) console.log(`  ${red(`failed                  ${failed}`)}`);
  console.log();

  if (failures.length) {
    rule("failures");
    for (const f of failures) {
      console.log(`  ${red("!")} ${f.value.padEnd(34)} ${f.reason}`);
    }
    const all = [
      ["email", "name", "reason", "source"],
      ...[...rejected, ...failures].map((r) => [r.value, r.name, r.reason, r.source]),
    ];
    writeFileSync(REPORT, all.map((r) => r.map(csvCell).join(",")).join("\n") + "\n", "utf8");
    console.log();
  }

  console.log(
    `  Every new account signs in with its own email as the password, and is` +
      ` held at\n  the change-password screen until it sets a real one.`,
  );
  console.log();
}

main().catch((error: unknown) => {
  console.error(red(`\nimport failed: ${error instanceof Error ? error.message : String(error)}`));
  process.exitCode = 1;
});
