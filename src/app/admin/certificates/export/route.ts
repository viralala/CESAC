import { requireAdmin } from "@/lib/auth/guard";
import { certificateState, getCertificatesForReview } from "@/lib/data/certificates";

/**
 * The whole certificate table as CSV, for the department's own records and
 * for anything that has to go to the office.
 *
 * A route handler rather than a server action, because the point is a file.
 * An action can return a string and then something has to turn it into a
 * download in the browser, which means a client component holding a blob and
 * an object URL to do what Content-Disposition does on its own.
 *
 * It calls requireAdmin like every page in this folder. The proxy bounces
 * signed-out requests to /admin/* before they arrive, but a route handler is
 * a URL anybody can type and the proxy is an optimisation rather than the
 * check, exactly as lib/auth/guard.ts says. This is the one that decides.
 *
 * Nothing is cached. The file is a snapshot of real student names and Drive
 * links at the moment it was asked for, and a stale one would be worse than
 * useless: somebody reconciling against it would be reading last week's
 * answer about who is verified.
 */
export const dynamic = "force-dynamic";

const COLUMNS = [
  "student",
  "email",
  "class",
  "prn",
  "event",
  "contribution",
  "prize_inr",
  "state",
  "verified_by",
  "verified_at",
  "uploaded_at",
  "file_name",
  "drive_link",
] as const;

/**
 * One CSV field.
 *
 * Everything is quoted rather than only the fields that need it. Student
 * names carry commas, event names carry quotes, and deciding case by case is
 * how a file ends up with one row shifted a column to the left that nobody
 * notices until it is in a spreadsheet in the office.
 *
 * The leading apostrophe guard is for the other end. Excel reads a field
 * beginning =, +, - or @ as a formula, so a value that started with one would
 * be executed on opening rather than read. Nothing on this table should ever
 * begin with one, which is exactly the argument for handling it here rather
 * than trusting that.
 */
function field(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  await requireAdmin();

  const rows = await getCertificatesForReview();

  const csv = [
    COLUMNS.join(","),
    ...rows.map((c) =>
      [
        c.owner?.full_name ?? "",
        c.owner?.email ?? "",
        c.owner?.student_class ?? "",
        c.owner?.prn ?? "",
        c.event_name,
        c.contribution,
        c.prize_amount_inr ?? "",
        certificateState(c),
        c.verifier?.full_name ?? "",
        c.verified_at ?? "",
        c.created_at,
        c.file_name,
        c.drive_link,
      ]
        .map(field)
        .join(","),
    ),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`﻿${csv}`, {
    headers: {
      // The BOM in front is for Excel, which otherwise reads the file as the
      // system codepage and mangles any name with an accent in it.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cesac-certificates-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
