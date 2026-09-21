import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import {
  certificateState,
  getCertificatesForReview,
  type CertificateForOrganiser,
} from "@/lib/data/certificates";
import { LEVEL_LABEL } from "@/lib/console/records";

/**
 * Student records as CSV, for the department's own files and for the office.
 *
 * Two shapes, because two different people ask for this. `?sheet=journal` and
 * its three siblings produce **exactly the columns of "Formats.xlsx"**, in
 * exactly that order, so the office can paste a block straight into the
 * workbook they already keep. No argument at all produces everything on one
 * wide sheet, which is what somebody reconciling the review queue wants.
 *
 * Three of the sheet's columns are filled in here rather than asked of the
 * student, because the site already knows them: the department is always
 * Computer Engineering, the serial number is the row's position in this
 * export, and "Data entered by" is whichever account typed it.
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

/** The one value the sheet wants that is the same on every row. */
const DEPARTMENT = "Computer Engineering";

type Row = CertificateForOrganiser;
type Column = { head: string; read: (row: Row, index: number) => unknown };

const yesNo = (value: boolean | null) => (value === null ? "" : value ? "Yes" : "No");

/** The sheet writes a month by name and a date in full, in two columns. */
const month = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "long" }) : "";

const enteredBy = (row: Row) => row.enteredBy?.full_name ?? row.enteredBy?.email ?? "";

/** International or National, which is all the sheet's own column offers. */
const level = (row: Row) => (row.level ? LEVEL_LABEL[row.level] : "");

const COMMON: Column[] = [
  { head: "student", read: (r) => r.owner?.full_name ?? "" },
  { head: "email", read: (r) => r.owner?.email ?? "" },
  { head: "class", read: (r) => r.owner?.student_class ?? "" },
  { head: "prn", read: (r) => r.owner?.prn ?? "" },
  { head: "kind", read: (r) => r.kind },
  { head: "title", read: (r) => r.event_name },
  { head: "level", read: level },
  { head: "date", read: (r) => r.happened_on ?? "" },
  { head: "contribution", read: (r) => (r.kind === "event" ? r.contribution : "") },
  { head: "prize_inr", read: (r) => r.prize_amount_inr ?? "" },
  { head: "primary_author", read: (r) => r.primary_author ?? "" },
  { head: "secondary_authors", read: (r) => r.secondary_authors ?? "" },
  { head: "journal_or_conference", read: (r) => r.venue_name ?? "" },
  { head: "chapter", read: (r) => r.chapter_name ?? "" },
  { head: "indexing", read: (r) => r.indexing ?? "" },
  { head: "quartile", read: (r) => r.quartile ?? "" },
  { head: "impact_factor", read: (r) => r.impact_factor ?? "" },
  { head: "peer_reviewed", read: (r) => yesNo(r.peer_reviewed) },
  { head: "e_journal", read: (r) => yesNo(r.e_journal) },
  { head: "specialization", read: (r) => r.specialization ?? "" },
  { head: "volume", read: (r) => r.volume ?? "" },
  { head: "edition", read: (r) => r.edition ?? "" },
  { head: "is_edited", read: (r) => yesNo(r.is_edited) },
  { head: "isbn_issn", read: (r) => r.isbn_issn ?? "" },
  { head: "publisher", read: (r) => r.publisher ?? "" },
  { head: "place_of_publication", read: (r) => r.place_of_publication ?? "" },
  { head: "publication_year", read: (r) => r.publication_year ?? "" },
  { head: "page_numbers", read: (r) => r.page_numbers ?? "" },
  { head: "location", read: (r) => r.location ?? "" },
  { head: "state", read: (r) => certificateState(r) },
  { head: "verified_by", read: (r) => r.verifier?.full_name ?? "" },
  { head: "verified_at", read: (r) => r.verified_at ?? "" },
  { head: "entered_by", read: enteredBy },
  { head: "uploaded_at", read: (r) => r.created_at },
  { head: "certificate_file", read: (r) => r.file_name ?? "" },
  { head: "certificate_link", read: (r) => r.drive_link ?? "" },
  {
    head: "photos",
    read: (r) => r.files.map((f) => `${f.slot}: ${f.drive_link}`).join(" | "),
  },
];

/**
 * The four layouts out of "Formats.xlsx", column for column.
 *
 * The headings are the sheet's own wording, typos and inconsistent
 * capitalisation included, because the point of these is that a block pastes
 * into the workbook the office already has. Do not tidy them.
 */
const SHEETS: Record<string, { name: string; columns: Column[] }> = {
  journal: {
    name: "journal-publications",
    columns: [
      { head: "Dept Name", read: () => DEPARTMENT },
      { head: "Sr. No", read: (_r, i) => i + 1 },
      { head: "Title of the publication", read: (r) => r.event_name },
      { head: "Primary Author", read: (r) => r.primary_author ?? "" },
      { head: "Secondary Author(s)", read: (r) => r.secondary_authors ?? "" },
      { head: "Name of the Journal", read: (r) => r.venue_name ?? "" },
      { head: "Indexing", read: (r) => r.indexing ?? "" },
      { head: "Quartile", read: (r) => r.quartile ?? "" },
      { head: "Impact Factor", read: (r) => r.impact_factor ?? "" },
      { head: "National/ International", read: level },
      { head: "Peer Reviewed? (Yes/No)", read: (r) => yesNo(r.peer_reviewed) },
      { head: "Is it an e-journal?", read: (r) => yesNo(r.e_journal) },
      { head: "Area of Specialization", read: (r) => r.specialization ?? "" },
      { head: "Month of publication", read: (r) => month(r.happened_on) },
      { head: "Date of publication", read: (r) => r.happened_on ?? "" },
      { head: "Volume", read: (r) => r.volume ?? "" },
      { head: "Edition No.", read: (r) => r.edition ?? "" },
      { head: "ISBN/ ISSN", read: (r) => r.isbn_issn ?? "" },
      { head: "Data entered by", read: enteredBy },
    ],
  },
  conference: {
    name: "conference-publications",
    columns: [
      { head: "Dept name", read: () => DEPARTMENT },
      { head: "Sr. No.", read: (_r, i) => i + 1 },
      { head: "Title of the publication", read: (r) => r.event_name },
      { head: "Primary Author", read: (r) => r.primary_author ?? "" },
      { head: "Secondary Author(s)", read: (r) => r.secondary_authors ?? "" },
      { head: "Name of the Conference", read: (r) => r.venue_name ?? "" },
      { head: "National/ International", read: level },
      { head: "Conference Paper Indexing", read: (r) => r.indexing ?? "" },
      { head: "Date of the conference", read: (r) => r.happened_on ?? "" },
      { head: "Location of the conference", read: (r) => r.location ?? "" },
      { head: "Page Numbers", read: (r) => r.page_numbers ?? "" },
      { head: "Place of publication", read: (r) => r.place_of_publication ?? "" },
      { head: "Publisher of the proceedings", read: (r) => r.publisher ?? "" },
      { head: "Data Entered by", read: enteredBy },
    ],
  },
  book: {
    name: "book-publications",
    columns: [
      { head: "Dept", read: () => DEPARTMENT },
      { head: "Sr. No.", read: (_r, i) => i + 1 },
      { head: "Book Title", read: (r) => r.event_name },
      { head: "Primary Author", read: (r) => r.primary_author ?? "" },
      { head: "Secondary Author(s)", read: (r) => r.secondary_authors ?? "" },
      { head: "Book Edition", read: (r) => r.edition ?? "" },
      { head: "Is the book edited?", read: (r) => yesNo(r.is_edited) },
      { head: "Publisher", read: (r) => r.publisher ?? "" },
      { head: "Place of publication", read: (r) => r.place_of_publication ?? "" },
      { head: "Publication Year", read: (r) => r.publication_year ?? "" },
      { head: "ISBN/ISSN No", read: (r) => r.isbn_issn ?? "" },
      { head: "Data Entered by", read: enteredBy },
    ],
  },
  book_chapter: {
    name: "book-chapter-publications",
    columns: [
      { head: "Dept", read: () => DEPARTMENT },
      { head: "Sr. No.", read: (_r, i) => i + 1 },
      { head: "Book Title", read: (r) => r.event_name },
      { head: "Chapter number and Name", read: (r) => r.chapter_name ?? "" },
      { head: "Primary Author", read: (r) => r.primary_author ?? "" },
      { head: "Secondary Author(s)", read: (r) => r.secondary_authors ?? "" },
      { head: "Book Edition", read: (r) => r.edition ?? "" },
      { head: "Is the book edited?", read: (r) => yesNo(r.is_edited) },
      { head: "Publisher", read: (r) => r.publisher ?? "" },
      { head: "Place of publication", read: (r) => r.place_of_publication ?? "" },
      { head: "Publication Year", read: (r) => r.publication_year ?? "" },
      { head: "ISBN/ISSN No", read: (r) => r.isbn_issn ?? "" },
      { head: "Data Entered by", read: enteredBy },
    ],
  },
};

/** Not exported: a route file may only export the handlers and the route
 *  segment config, and an extra export is a build error. */
const SHEET_NAMES = Object.keys(SHEETS);

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

export async function GET(request: Request) {
  await requireAdmin();
  await requireCap("records");

  const wanted = new URL(request.url).searchParams.get("sheet");
  const sheet = wanted ? SHEETS[wanted] : null;

  // An unknown sheet name is answered rather than silently handed the wide
  // export, because a file that is not the shape somebody asked for is worse
  // than no file: they will paste it into the workbook before noticing.
  if (wanted && !sheet) {
    return new Response(`No such sheet. Try one of: ${SHEET_NAMES.join(", ")}.`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const all = await getCertificatesForReview();
  const rows = sheet ? all.filter((row) => row.kind === wanted) : all;
  const columns = sheet ? sheet.columns : COMMON;

  const csv = [
    columns.map((column) => field(column.head)).join(","),
    ...rows.map((row, i) => columns.map((column) => field(column.read(row, i))).join(",")),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const name = sheet ? sheet.name : "student-records";

  return new Response(`﻿${csv}`, {
    headers: {
      // The BOM in front is for Excel, which otherwise reads the file as the
      // system codepage and mangles any name with an accent in it.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cesac-${name}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
