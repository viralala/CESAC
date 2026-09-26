/**
 * Reading the department roster out of the spreadsheets it actually arrives in.
 *
 * Kept apart from the importer so the parsing can be checked on its own with
 * --dry-run, without a service role key anywhere near it. Nothing here talks
 * to the network.
 */

import ExcelJS from "exceljs";

export type Student = {
  name: string;
  email: string;
  phone: string | null;
  year: "SY" | "TY";
  /**
   * The number the office knows this student by, digits only.
   *
   * The two workbooks do not agree on what that number is. SY carries a ten
   * digit "GR. No", which also turns up inside the student's own address, and
   * TY carries an eight digit "PRN No", which does not. Both land in
   * profiles.prn, because from the console's point of view it is one thing:
   * the number on the sheet the organiser at the desk is holding.
   */
  prn: string | null;
  /** Division, as "SY-A" or "TY-C". Null when the sheet has no division on it. */
  studentClass: string | null;
  /** Where the row came from, so a rejection can be traced back to a cell. */
  source: string;
  /** Set when the address was repaired, for the report. */
  repairedFrom?: string;
  /** Set when the row is syntactically fine but looks wrong to a human. */
  review?: string;
};

export type Rejection = {
  source: string;
  name: string;
  value: string;
  reason: string;
};

export type ParseResult = {
  students: Student[];
  rejected: Rejection[];
  rowsRead: number;
};

/** Deliberately strict: one @, a dot in the domain, no whitespace anywhere. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * A workbook, and how to find the roster inside it.
 *
 * Neither file is a clean table. Header rows sit at different offsets from
 * sheet to sheet, one sheet carries a title banner above the header and
 * another has an empty spacer column part way along, so columns are located by
 * their heading text on every sheet rather than by a fixed index.
 */
export type Source = {
  file: string;
  year: "SY" | "TY";
  /** Sheets to read. Anything not named here is ignored. */
  sheets: (names: string[]) => string[];
  nameHeader: string;
  emailHeader: string;
  phoneHeader: string;
  /** "gr. no" on SY and "prn no" on TY. They are different numbers. */
  prnHeader: string;
  /** Plain letters on SY, "CS-A" on TY, so only the trailing letter is kept. */
  divisionHeader: string;
};

export const SOURCES: Source[] = [
  {
    file: "SY-Student Info.xlsx",
    year: "SY",
    // Twelve division sheets, all of them wanted.
    sheets: (names) => names,
    nameHeader: "name of student",
    emailHeader: "email id",
    phoneHeader: "mobile no",
    prnHeader: "gr. no",
    divisionHeader: "division",
  },
  {
    file: "TY-Student Info.xlsx",
    year: "TY",
    /*
     * Only COMP. 'Sheet1' is the whole institute, every branch, and the sheets
     * named A to N are the same 1037 Computer Engineering students as COMP
     * split by division: reading any of them alongside COMP would just be the
     * same people twice. Verified as identical by email set before choosing.
     */
    sheets: (names) => names.filter((n) => n.trim().toUpperCase() === "COMP"),
    nameHeader: "student name",
    emailHeader: "organization email",
    phoneHeader: "mobile number",
    prnHeader: "prn no",
    divisionHeader: "division",
  },
  /*
   * The two SEDA divisions, added on 26 September 2026. SY students, one
   * sheet each, with the institute's "Subject Registration Report" banner
   * above the header. Their division is written "CS-SEDA-A", which
   * divisionLabel keeps as SY-SEDA-A so they are not filed under SY-A.
   */
  {
    file: "SEDA A.xlsx",
    year: "SY",
    sheets: (names) => names,
    nameHeader: "student name",
    emailHeader: "email",
    phoneHeader: "mobile no",
    prnHeader: "prn no",
    divisionHeader: "division",
  },
  {
    file: "SEDA B.xlsx",
    year: "SY",
    sheets: (names) => names,
    nameHeader: "student name",
    emailHeader: "email",
    phoneHeader: "mobile no",
    prnHeader: "prn no",
    divisionHeader: "division",
  },
];

/**
 * The text of a cell, whatever Excel has wrapped it in.
 *
 * These wrappers nest, and that is not a hypothetical: three addresses in SY-F
 * are hyperlinks whose text is itself a rich-text run, { text: { richText:
 * [...] } }, because somebody reformatted part of the address after Excel had
 * autolinked it. A reader that only unwraps one layer returns an empty string
 * for those and the students behind them vanish from the import without ever
 * looking like an error. So this unwraps all the way down.
 */
function cellText(value: unknown, depth = 0): string {
  if (value === null || value === undefined || depth > 6) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => cellText(v, depth + 1)).join("");

  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    // Rich text: a run of differently formatted fragments of one string.
    if (Array.isArray(v.richText)) return v.richText.map((r) => cellText(r, depth + 1)).join("");
    // A hyperlink, or a rich-text run. Either way the payload is under .text,
    // and it may be another wrapper.
    if (v.text !== undefined && v.text !== null) return cellText(v.text, depth + 1);
    // A formula cell carries its last computed value.
    if (v.result !== undefined && v.result !== null) return cellText(v.result, depth + 1);
    // Last resort: an autolinked address with no display text of its own.
    if (typeof v.hyperlink === "string") return v.hyperlink.replace(/^mailto:/i, "");
  }

  return "";
}

/** Collapse runs of whitespace, including the non-breaking kind Excel loves. */
function tidy(s: string): string {
  return s.replace(/[\s ]+/g, " ").trim();
}

/**
 * A name as it should appear on a dashboard.
 *
 * The TY sheet holds most names in block capitals and the SY sheet does not.
 * Shouting at a student from their own console is a poor greeting, so an
 * all-caps name is recased, and a name that already contains lower-case
 * letters is left exactly as the department wrote it. Particles after an
 * apostrophe or hyphen are capitalised too, so DSOUZA-SMITH keeps both halves.
 */
export function displayName(raw: string): string {
  const name = tidy(raw);
  if (!name || /\p{Ll}/u.test(name)) return name;
  return name
    .toLowerCase()
    .replace(/(^|[\s’'\-.])(\p{L})/gu, (_m, lead: string, ch: string) => lead + ch.toUpperCase());
}

/**
 * Mechanical repairs only.
 *
 * Every rule here fixes damage that is unambiguous on its face: whitespace a
 * person fat-fingered into the middle of an address, a missing @ in front of a
 * domain that is otherwise intact, a stray digit welded onto the end of one.
 * Nothing here guesses at what a human meant. An address that is merely
 * suspicious, a one-letter-off domain say, is returned untouched and flagged
 * for review instead, because inventing a correction to somebody's identity is
 * a worse failure than handing the row back to be looked at. That matters more
 * than usual here: the address is also the password, so a wrong repair locks
 * the student out of an account they cannot guess the credentials for.
 */
export function repairEmail(raw: string): { email: string; repaired: boolean } {
  const before = raw.trim().toLowerCase();
  // All internal whitespace goes: 'sarthak. 125..@vit.edu', 'ayush..@ vit.edu'.
  let email = raw.replace(/[\s ]/g, "").toLowerCase();

  // A missing @ in front of an otherwise complete domain.
  if (!email.includes("@")) {
    const m = email.match(/^(.+?)((?:vit|vitpune)\.edu(?:\.in)?)$/);
    if (m) email = `${m[1]}@${m[2]}`;
  }

  const at = email.lastIndexOf("@");
  if (at > 0) {
    const local = email.slice(0, at);
    let domain = email.slice(at + 1);
    // A bare 'vit' where the .edu did not survive the paste.
    if (domain === "vit") domain = "vit.edu";
    // A digit dragged in from the neighbouring column: 'vit.edu0'.
    domain = domain.replace(/^(vit\.edu)\d+$/, "$1");
    // A trailing separator.
    domain = domain.replace(/[.,;]+$/, "");
    email = `${local}@${domain}`;
  }

  return { email, repaired: email !== before };
}

/** Ten digits, or nothing. A partial number is worse than an absent one. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\.0+$/, "").replace(/\D/g, "");
  const ten = digits.length > 10 && digits.startsWith("91") ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

/** Institutional domains. Anything else is imported, but flagged. */
const EXPECTED_DOMAIN = /^(vit|vitpune)\.edu(\.in)?$/;

/**
 * One label for a division, whichever sheet it came off.
 *
 * SY writes the division as a bare letter and TY writes it as "CS-A". Every
 * student on this site is in the same department, so the "CS" carries no
 * information and keeping it would mean SY and TY students sorted into
 * different-looking classes for no reason. The trailing letter is the whole of
 * what differs, so the label is built from the year and that.
 */
function divisionLabel(year: "SY" | "TY", raw: string): string | null {
  const text = tidy(raw).toUpperCase();
  const letter = text.match(/([A-Z])\s*$/);
  if (!letter) return null;
  // SEDA is its own pair of divisions, not SY-A and SY-B.
  return /\bSEDA\b/.test(text) ? `${year}-SEDA-${letter[1]}` : `${year}-${letter[1]}`;
}

function headerIndex(row: ExcelJS.Row, want: string): number | null {
  let found: number | null = null;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (found !== null) return;
    if (tidy(cellText(cell.value)).toLowerCase().includes(want)) found = col;
  });
  return found;
}

export async function parseWorkbook(dir: string, source: Source): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(`${dir}/${source.file}`);

  const wanted = new Set(source.sheets(wb.worksheets.map((w) => w.name)));
  const students: Student[] = [];
  const rejected: Rejection[] = [];
  let rowsRead = 0;

  for (const sheet of wb.worksheets) {
    if (!wanted.has(sheet.name)) continue;

    // Find the header by looking for the two columns that matter, within the
    // first dozen rows. Title banners and blank spacers above it are skipped.
    let headerRow = 0;
    let cName: number | null = null;
    let cEmail: number | null = null;
    let cPhone: number | null = null;
    let cPrn: number | null = null;
    let cDiv: number | null = null;

    for (let r = 1; r <= Math.min(12, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      const n = headerIndex(row, source.nameHeader);
      const e = headerIndex(row, source.emailHeader);
      if (n !== null && e !== null) {
        headerRow = r;
        cName = n;
        cEmail = e;
        cPhone = headerIndex(row, source.phoneHeader);
        cPrn = headerIndex(row, source.prnHeader);
        cDiv = headerIndex(row, source.divisionHeader);
        break;
      }
    }

    if (!headerRow || cName === null || cEmail === null) {
      rejected.push({
        source: `${source.file}:${sheet.name}`,
        name: "",
        value: "",
        reason: "no header row found in the first 12 rows, sheet skipped entirely",
      });
      continue;
    }

    for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const rawName = tidy(cellText(row.getCell(cName).value));
      const rawEmail = tidy(cellText(row.getCell(cEmail).value));
      if (!rawName && !rawEmail) continue;

      rowsRead++;
      const where = `${source.file} / ${sheet.name} / row ${r}`;

      if (!rawEmail) {
        rejected.push({ source: where, name: rawName, value: "", reason: "no email address in the row" });
        continue;
      }

      const { email, repaired } = repairEmail(rawEmail);

      if (!EMAIL.test(email)) {
        rejected.push({
          source: where,
          name: rawName,
          value: rawEmail,
          reason: "not a usable address even after tidying, looks truncated or mistyped",
        });
        continue;
      }

      if (!rawName) {
        rejected.push({
          source: where,
          name: "",
          value: email,
          reason: "address with no name against it",
        });
        continue;
      }

      const domain = email.slice(email.lastIndexOf("@") + 1);
      const student: Student = {
        name: displayName(rawName),
        email,
        phone: cPhone !== null ? normalisePhone(cellText(row.getCell(cPhone).value)) : null,
        year: source.year,
        source: where,
        prn: cPrn !== null ? cellText(row.getCell(cPrn).value).replace(/\D/g, "") || null : null,
        studentClass: cDiv !== null ? divisionLabel(source.year, cellText(row.getCell(cDiv).value)) : null,
      };
      if (repaired) student.repairedFrom = rawEmail;
      if (!EXPECTED_DOMAIN.test(domain)) {
        student.review = `domain is ${domain}, not the institutional one`;
      }

      students.push(student);
    }
  }

  return { students, rejected, rowsRead };
}

/**
 * Collapse the combined roster to one account per address.
 *
 * Two kinds of repeat turn up and they are not the same thing. The same person
 * listed twice is harmless and the first listing wins. Two different people
 * against one address is a fault in the roster: whoever came second would
 * silently receive an account under the first one's name, so neither is
 * imported and both are reported for correction.
 */
export function dedupe(students: Student[]): { unique: Student[]; rejected: Rejection[] } {
  const byEmail = new Map<string, Student[]>();
  for (const s of students) {
    const list = byEmail.get(s.email);
    if (list) list.push(s);
    else byEmail.set(s.email, [s]);
  }

  const unique: Student[] = [];
  const rejected: Rejection[] = [];

  for (const [email, group] of byEmail) {
    if (group.length === 1) {
      unique.push(group[0]);
      continue;
    }

    const names = new Set(group.map((s) => s.name.toLowerCase()));
    if (names.size === 1) {
      unique.push(group[0]);
      for (const dup of group.slice(1)) {
        rejected.push({
          source: dup.source,
          name: dup.name,
          value: email,
          reason: `same person already listed at ${group[0].source}`,
        });
      }
      continue;
    }

    for (const clash of group) {
      rejected.push({
        source: clash.source,
        name: clash.name,
        value: email,
        reason: `address claimed by ${group.length} different students (${group
          .map((s) => s.name)
          .join(", ")}), roster must be corrected`,
      });
    }
  }

  return { unique, rejected };
}
