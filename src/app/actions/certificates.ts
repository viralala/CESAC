"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { MAX_CERTIFICATE_BYTES, MAX_CERTIFICATE_LABEL } from "@/lib/console/limits";
import { CONTRIBUTIONS, type Contribution } from "@/lib/console/options";
import { LAYOUT, LEVELS, SLOTS, type Kind, type Level, type Slot } from "@/lib/console/records";
import {
  DriveError,
  driveCredentials,
  ensureStudentFolder,
  trashFile,
  uploadToFolder,
  type DriveCredentials,
} from "@/lib/drive/client";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type CertificateState = {
  error?: string;
  notice?: string;
  /**
   * When the write landed, as a millisecond stamp.
   *
   * The form is keyed on it, so a success remounts an empty form: the file
   * input lets go of the file it has already sent and the fields go back to
   * their defaults. Two records with the same title produce the same notice
   * and would otherwise be indistinguishable, which is why it is a stamp and
   * not the message.
   */
  at?: number;
};

const MAX_BYTES = MAX_CERTIFICATE_BYTES;

const TYPES = [
  { mime: "application/pdf", label: "PDF", ext: ".pdf" },
  { mime: "image/png", label: "PNG", ext: ".png" },
  { mime: "image/jpeg", label: "JPG", ext: ".jpg" },
] as const;

const PLACES = new Set<string>(CONTRIBUTIONS.map((c) => c.value));
const RUNGS = new Set<string>(LEVELS.map((l) => l.value));
const SLOT_NAMES = new Set<string>(SLOTS.map((s) => s.slot));

/**
 * What the bytes actually are.
 *
 * The type the browser reports is taken from the file extension and is trivial
 * to change, so it decides nothing here. These three formats all announce
 * themselves in their first few bytes, which is what gets checked: a .pdf that
 * is really a script is rejected on its contents, whatever it is called.
 */
function sniff(bytes: Uint8Array): (typeof TYPES)[number] | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);

  // %PDF
  if (starts(0x25, 0x50, 0x44, 0x46)) return TYPES[0];
  // \x89 P N G \r \n \x1a \n
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return TYPES[1];
  // JPEG SOI plus the start of any APPn marker
  if (starts(0xff, 0xd8, 0xff)) return TYPES[2];

  return null;
}

/**
 * Keep the student's own filename, minus anything that could confuse Drive.
 *
 * Control characters go through \p{Cc} rather than a hex range, because the
 * committed version of this line held the real bytes instead of the escape
 * that names them, NUL included. A source file with a NUL in it is one git
 * treats as binary and will not diff, review or merge.
 */
function safeName(raw: string, ext: string): string {
  const base = raw
    .replace(/\.[^.]+$/, "")
    .replace(/[\\/:*?"<>|]|\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "certificate"}${ext}`;
}

/**
 * A prize amount, as somebody would actually type it.
 *
 * A rupee sign and thousands separators both turn up, and both mean the same
 * number. An empty box means no prize and is not an error: most certificates
 * are for turning up.
 */
function readAmount(raw: string): { value: number | null; error?: string } {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (!cleaned) return { value: null };

  const n = Number(cleaned);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { value: null, error: "Write the winning amount in whole rupees, or leave it blank." };
  }
  if (n > 10_000_000) {
    return { value: null, error: "That is more than a crore. Check the amount." };
  }
  return { value: n };
}

function text(formData: FormData, name: string, max = 240): string | null {
  const value = String(formData.get(name) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return value || null;
}

/**
 * Put the file where it belongs and hand back what the row has to record.
 *
 * Shared by the record form and the three photo slots, because the checks are
 * the same whichever button sent it: the size, the real type, the student's
 * own folder. The folder id is remembered on the profile, so only the first
 * upload a student ever makes pays for the lookup.
 */
async function putFile(
  creds: DriveCredentials,
  viewer: { id: string; email: string },
  file: File,
): Promise<
  | { ok: true; name: string; mime: string; size: number; driveId: string; link: string }
  | { ok: false; error: string }
> {
  if (file.size > MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `That file is ${mb}MB. The limit is ${MAX_CERTIFICATE_LABEL}.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) {
    return { ok: false, error: "Uploads have to be a PDF, a JPG or a PNG." };
  }

  const name = safeName(file.name, type.ext);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("drive_folder_id")
    .eq("id", viewer.id)
    .single();

  let folderId = profile?.drive_folder_id ?? null;
  if (!folderId) {
    folderId = await ensureStudentFolder(creds, viewer.email);
    await supabase.from("profiles").update({ drive_folder_id: folderId }).eq("id", viewer.id);
  }

  const uploaded = await uploadToFolder(creds, folderId, {
    name,
    mimeType: type.mime,
    bytes,
  });

  return {
    ok: true,
    name,
    mime: type.mime,
    size: file.size,
    driveId: uploaded.id,
    link: uploaded.link,
  };
}

function refresh(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/certificates");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/");
}

/**
 * Add one record, or correct one already there.
 *
 * A row is a claim about something the student did, not a filename: which
 * kind of thing, what it was called, how far it reached, when it happened, and
 * then whatever that kind of thing asks for on top. The five layouts live in
 * src/lib/console/records.ts and this reads the same list the form rendered
 * from, so a field cannot be on the form and unhandled here.
 *
 * The file is optional now, and for a publication it usually does not exist at
 * all. That is the change that made the whole thing possible: the table's five
 * file columns were NOT NULL when it only ever held certificates.
 *
 * Order matters. The file goes to Drive and the row goes to Postgres, in that
 * order, because an orphaned Drive file is a tidy-up job whereas a row
 * pointing at a file that was never uploaded is a broken link on somebody's
 * dashboard. The row is written with the student's own session, so it is
 * subject to the same row level security as everything else and cannot be
 * aimed at another student's account. Drive's credentials never touch the
 * browser.
 */
export async function saveRecord(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  // Also bounces anyone whose password is still their email address.
  const viewer = await requireParticipant();

  const editing = String(formData.get("record_id") ?? "").trim() || null;

  const claimedKind = String(formData.get("kind") ?? "event");
  const layout = LAYOUT[claimedKind];
  if (!layout) return { error: "Pick what kind of record this is." };
  const kind = claimedKind as Kind;

  const title = text(formData, "event_name", 240);
  if (!title || title.length < 3) {
    return { error: `Put in the ${layout.titleLabel.toLowerCase()}.` };
  }

  const claimedLevel = String(formData.get("level") ?? "");
  if (!RUNGS.has(claimedLevel)) {
    return { error: "Say how far this reached: international, national, state, zonal or institute." };
  }
  const level = claimedLevel as Level;

  const happenedOn = String(formData.get("happened_on") ?? "").trim() || null;
  if (layout.dated && !happenedOn) {
    return { error: `${layout.dateLabel} is needed.` };
  }
  if (happenedOn && !/^\d{4}-\d{2}-\d{2}$/.test(happenedOn)) {
    return { error: "Write the date as a date, or leave it blank." };
  }

  // Hackathons ask what the student came away with. A journal does not place,
  // so its contribution column is left at the default and read by nothing.
  let contribution: Contribution = "participation";
  let prize: number | null = null;
  if (layout.placed) {
    const claimed = String(formData.get("contribution") ?? "");
    if (!PLACES.has(claimed)) {
      return { error: "Say whether this was participation or a place." };
    }
    contribution = claimed as Contribution;

    const amount = readAmount(String(formData.get("prize") ?? ""));
    if (amount.error) return { error: amount.error };

    // Participation has no prize money by definition and the database refuses
    // the combination outright. Dropping a stray figure means a student who
    // typed one against the wrong row gets their record filed rather than a
    // constraint violation they cannot act on.
    prize = contribution === "participation" ? null : amount.value;
  }

  // Everything else comes off this kind's own field list, so a field that is
  // not on the layout cannot be written by a hand-made request either.
  const extras: Record<string, string | number | boolean | null> = {};
  for (const field of layout.fields) {
    const raw = String(formData.get(field.name) ?? "").trim();

    if (field.type === "bool") {
      extras[field.name] = raw === "on" || raw === "true";
      continue;
    }

    if (!raw) {
      if (field.required) return { error: `${field.label} is needed.` };
      extras[field.name] = null;
      continue;
    }

    if (field.type === "year") {
      const year = Number(raw);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return { error: `${field.label} has to be a four digit year.` };
      }
      extras[field.name] = year;
      continue;
    }

    if (field.type === "decimal") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 1000) {
        return { error: `${field.label} has to be a number, like 3.412.` };
      }
      extras[field.name] = n;
      continue;
    }

    extras[field.name] = raw.replace(/\s+/g, " ").slice(0, field.type === "long" ? 1000 : 240);
  }

  const row: Partial<TablesInsert<"certificates">> = {
    kind,
    event_name: title,
    level,
    happened_on: happenedOn,
    contribution,
    prize_amount_inr: prize,
    ...extras,
  };

  const supabase = await createClient();

  if (editing) {
    const { data, error } = await supabase
      .from("certificates")
      .update(row)
      .eq("id", editing)
      .select("id");

    if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

    // An update row level security refuses matches nothing and comes back from
    // PostgREST as a success with no error, so without this a student would be
    // told a verified record had been corrected when nothing was written.
    if (!data?.length) {
      return {
        error:
          "Nothing was changed. A record an organiser has already verified cannot be edited; ask on the questions page and we will correct it.",
      };
    }

    refresh();
    return { notice: `${title} updated.`, at: Date.now() };
  }

  // A file on the add form is optional, and for a publication there usually is
  // not one. The other three slots are uploaded from the record's own card
  // afterwards: a Vercel function refuses any request body over 4.5MB, so four
  // files cannot travel in one request however the form is written.
  const file = formData.get("file");
  let uploaded: Awaited<ReturnType<typeof putFile>> | null = null;

  if (file instanceof File && file.size > 0) {
    const creds = driveCredentials();
    if (!creds) {
      return {
        error: "Uploads are not switched on yet. Save the record without a file for now.",
      };
    }
    try {
      uploaded = await putFile(creds, viewer, file);
    } catch (error) {
      if (error instanceof DriveError) {
        console.error("drive upload failed", error.message, error.detail);
        return { error: error.message };
      }
      console.error("record upload failed", error);
      return { error: "The upload did not go through. Try again in a minute." };
    }
    if (!uploaded.ok) return { error: uploaded.error };
  }

  const { error } = await supabase.from("certificates").insert({
    ...(row as TablesInsert<"certificates">),
    owner_id: viewer.id,
    entered_by: viewer.id,
    file_name: uploaded?.ok ? uploaded.name : null,
    mime_type: uploaded?.ok ? uploaded.mime : null,
    size_bytes: uploaded?.ok ? uploaded.size : null,
    drive_file_id: uploaded?.ok ? uploaded.driveId : null,
    drive_link: uploaded?.ok ? uploaded.link : null,
  });

  if (error) {
    if (uploaded?.ok) {
      // The file is in Drive but unlisted. Say so plainly rather than claiming
      // the upload failed, so nobody hunts for a file that is actually there.
      console.error("record insert failed after upload", {
        driveFileId: uploaded.driveId,
        error,
      });
      return {
        error:
          "The file reached Drive but the record could not be saved. Tell an organiser before retrying.",
      };
    }
    return { error: error.message.replace(/^.*?:\s*/, "") };
  }

  refresh();
  return { notice: `${title} added to your record.`, at: Date.now() };
}

/**
 * One file, into one slot on a record that already exists.
 *
 * The certificate goes on the record's own row, where every page and every
 * export written before today looks for it. The other three are rows in
 * certificate_files, one per slot, and uploading a second one into the same
 * slot replaces the first: a button that says "The prize" reads as one photo,
 * not a growing pile.
 */
export async function uploadRecordFile(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  const viewer = await requireParticipant();

  const recordId = String(formData.get("record_id") ?? "").trim();
  const claimedSlot = String(formData.get("slot") ?? "");
  if (!recordId) return { error: "That record is not on the page any more. Reload it." };
  if (!SLOT_NAMES.has(claimedSlot)) return { error: "That is not one of the four slots." };
  const slot = claimedSlot as Slot;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };

  const creds = driveCredentials();
  if (!creds) {
    return { error: "Uploads are not switched on yet. Ask an organiser to finish the setup." };
  }

  const supabase = await createClient();

  // The record has to be this student's, and row level security says so on
  // every write below. Reading it first is what lets the old file be trashed
  // rather than left behind, and what turns "no such record" into a sentence.
  const { data: record } = await supabase
    .from("certificates")
    .select("id, owner_id, verified, drive_file_id")
    .eq("id", recordId)
    .maybeSingle();

  if (!record || record.owner_id !== viewer.id) {
    return { error: "That record is not on the page any more. Reload it." };
  }
  if (record.verified) {
    return {
      error: "An organiser has already verified this record, so its files are fixed now.",
    };
  }

  let uploaded: Awaited<ReturnType<typeof putFile>>;
  try {
    uploaded = await putFile(creds, viewer, file);
  } catch (error) {
    if (error instanceof DriveError) {
      console.error("drive upload failed", error.message, error.detail);
      return { error: error.message };
    }
    console.error("slot upload failed", error);
    return { error: "The upload did not go through. Try again in a minute." };
  }
  if (!uploaded.ok) return { error: uploaded.error };

  if (slot === "certificate") {
    const previous = record.drive_file_id;

    const { data, error } = await supabase
      .from("certificates")
      .update({
        file_name: uploaded.name,
        mime_type: uploaded.mime,
        size_bytes: uploaded.size,
        drive_file_id: uploaded.driveId,
        drive_link: uploaded.link,
      })
      .eq("id", recordId)
      .select("id");

    if (error || !data?.length) {
      console.error("certificate slot write failed", { recordId, error });
      return { error: "The file reached Drive but the record was not updated. Reload and check." };
    }

    // Only once the row points at the new one. A file trashed before the write
    // lands is a file nobody can get back if the write then fails.
    if (previous) await trashFile(creds, previous).catch(() => {});
  } else {
    const { data: existing } = await supabase
      .from("certificate_files")
      .select("id, drive_file_id")
      .eq("certificate_id", recordId)
      .eq("slot", slot)
      .maybeSingle();

    if (existing) {
      await supabase.from("certificate_files").delete().eq("id", existing.id);
    }

    const { error } = await supabase.from("certificate_files").insert({
      certificate_id: recordId,
      owner_id: viewer.id,
      slot,
      file_name: uploaded.name,
      mime_type: uploaded.mime,
      size_bytes: uploaded.size,
      drive_file_id: uploaded.driveId,
      drive_link: uploaded.link,
    });

    if (error) {
      console.error("photo row insert failed", { driveFileId: uploaded.driveId, error });
      return { error: "The file reached Drive but could not be recorded. Tell an organiser." };
    }

    if (existing?.drive_file_id) await trashFile(creds, existing.drive_file_id).catch(() => {});
  }

  refresh();
  return { notice: "Added.", at: Date.now() };
}

/** Take one photo back off a record. The Drive copy goes to the bin. */
export async function removeRecordFile(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  const viewer = await requireParticipant();

  const fileId = String(formData.get("file_id") ?? "").trim();
  if (!fileId) return { error: "That file is not on the page any more. Reload it." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("certificate_files")
    .select("id, owner_id, drive_file_id")
    .eq("id", fileId)
    .maybeSingle();

  if (!row || row.owner_id !== viewer.id) {
    return { error: "That file is not on the page any more. Reload it." };
  }

  const { error } = await supabase.from("certificate_files").delete().eq("id", fileId);
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  const creds = driveCredentials();
  if (creds) await trashFile(creds, row.drive_file_id).catch(() => {});

  refresh();
  return { notice: "Removed.", at: Date.now() };
}

/**
 * Remove a whole record.
 *
 * Only the student's own, and only while nobody has verified it: a record an
 * organiser has checked and agreed with is part of the department's file, not
 * a draft. The row goes first and the files follow, because a row with no
 * files is a fixable mess and a file with no row is one nobody will ever find.
 */
export async function deleteRecord(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  const viewer = await requireParticipant();

  const recordId = String(formData.get("record_id") ?? "").trim();
  if (!recordId) return { error: "That record is not on the page any more. Reload it." };

  const supabase = await createClient();
  const { data: record } = await supabase
    .from("certificates")
    .select("id, owner_id, verified, event_name, drive_file_id, files:certificate_files(drive_file_id)")
    .eq("id", recordId)
    .maybeSingle();

  if (!record || record.owner_id !== viewer.id) {
    return { error: "That record is not on the page any more. Reload it." };
  }
  if (record.verified) {
    return {
      error:
        "An organiser has verified this record, so it stays. Ask on the questions page if it should not be there.",
    };
  }

  const { error } = await supabase.from("certificates").delete().eq("id", recordId);
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  const creds = driveCredentials();
  if (creds) {
    const ids = [
      record.drive_file_id,
      ...(record.files ?? []).map((f: { drive_file_id: string }) => f.drive_file_id),
    ].filter((id): id is string => Boolean(id));

    // Best effort, and deliberately after the row is gone. A file left in
    // Drive is an organiser tidying a folder; a row left behind is a broken
    // link on a dashboard.
    await Promise.all(ids.map((id) => trashFile(creds, id).catch(() => {})));
  }

  refresh();
  return { notice: `${record.event_name} removed from your record.`, at: Date.now() };
}

/**
 * Whether the student wants to be named on the public front page.
 *
 * The showcase prints a name, a year and a number to anybody who loads the
 * site. The signed-in ranking is a different thing and is not affected: this
 * switch is about the public page only, which is what it says on the screen.
 */
export async function setShowcaseOptOut(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  const viewer = await requireParticipant();
  const out = String(formData.get("opt_out") ?? "") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ showcase_opt_out: out })
    .eq("id", viewer.id);

  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  refresh();
  return {
    notice: out
      ? "You will not be named on the front page."
      : "You can be named on the front page again.",
    at: Date.now(),
  };
}
