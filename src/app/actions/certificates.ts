"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { MAX_CERTIFICATE_BYTES, MAX_CERTIFICATE_LABEL } from "@/lib/console/limits";
import { CONTRIBUTIONS, type Contribution } from "@/lib/console/options";
import {
  DriveError,
  driveCredentials,
  ensureStudentFolder,
  uploadToFolder,
} from "@/lib/drive/client";
import { createClient } from "@/lib/supabase/server";

export type CertificateState = {
  error?: string;
  notice?: string;
  /**
   * When the upload landed, as a millisecond stamp.
   *
   * The form is keyed on it, so a success remounts an empty form: the file
   * input lets go of the file it has already sent and the radios go back to
   * their default. Two uploads of the same event name produce the same notice
   * and would otherwise be indistinguishable, which is why it is a stamp and
   * not the message.
   */
  at?: number;
};

/**
 * The last of the three checks on file size, and the only one that cannot be
 * skipped by editing the page. See src/lib/console/limits.ts for why the
 * number is what it is.
 */
const MAX_BYTES = MAX_CERTIFICATE_BYTES;

const TYPES = [
  { mime: "application/pdf", label: "PDF", ext: ".pdf" },
  { mime: "image/png", label: "PNG", ext: ".png" },
  { mime: "image/jpeg", label: "JPG", ext: ".jpg" },
] as const;

const PLACES = new Set<string>(CONTRIBUTIONS.map((c) => c.value));

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

/**
 * Add one certificate to the student's record.
 *
 * The row is a claim about an event, not a filename: which event, what they
 * came away with, and what if anything they won. That is what the ranking is
 * built on, and a row nobody can read the meaning of would make the ranking
 * meaningless.
 *
 * The file goes to Drive and the row goes to Postgres, in that order: an
 * orphaned Drive file is a tidy-up job, whereas a row pointing at a file that
 * was never uploaded is a broken link on somebody's dashboard.
 *
 * The row is written with the student's own session, so the insert is subject
 * to the same row level security as everything else and cannot be aimed at
 * another student's account. Drive's credentials never touch the browser.
 */
export async function uploadCertificate(
  _state: CertificateState,
  formData: FormData,
): Promise<CertificateState> {
  // Also bounces anyone whose password is still their email address.
  const viewer = await requireParticipant();

  const creds = driveCredentials();
  if (!creds) {
    return {
      error: "Certificate uploads are not switched on yet. Ask an organiser to finish the setup.",
    };
  }

  const eventName = String(formData.get("event") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (eventName.length < 3) {
    return { error: "Put in the name of the event the certificate is for." };
  }

  const claimed = String(formData.get("contribution") ?? "");
  if (!PLACES.has(claimed)) {
    return { error: "Say whether this was participation or a place." };
  }
  const contribution = claimed as Contribution;

  const amount = readAmount(String(formData.get("prize") ?? ""));
  if (amount.error) return { error: amount.error };

  // Participation has no prize money by definition, and the database refuses
  // the combination outright. Dropping a stray figure here means a student who
  // typed one against the wrong row gets their certificate filed rather than a
  // constraint violation they cannot act on.
  const prize = contribution === "participation" ? null : amount.value;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  if (file.size > MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { error: `That file is ${mb}MB. The limit is ${MAX_CERTIFICATE_LABEL}.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) {
    return { error: "Certificates have to be a PDF, a JPG or a PNG." };
  }

  const name = safeName(file.name, type.ext);
  const supabase = await createClient();

  try {
    // The folder id is remembered on the profile, so only the first upload
    // pays for the lookup.
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

    const { error } = await supabase.from("certificates").insert({
      owner_id: viewer.id,
      event_name: eventName,
      contribution,
      prize_amount_inr: prize,
      file_name: name,
      mime_type: type.mime,
      size_bytes: file.size,
      drive_file_id: uploaded.id,
      drive_link: uploaded.link,
    });

    if (error) {
      // The file is in Drive but unlisted. Say so plainly rather than claiming
      // the upload failed, so nobody hunts for a file that is actually there.
      console.error("certificate row insert failed", { driveFileId: uploaded.id, error });
      return {
        error:
          "The file reached Drive but could not be recorded. Tell an organiser before retrying.",
      };
    }
  } catch (error) {
    if (error instanceof DriveError) {
      // The operator needs the real response; the student needs a sentence.
      console.error("drive upload failed", error.message, error.detail);
      return { error: error.message };
    }
    console.error("certificate upload failed", error);
    return { error: "The upload did not go through. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/certificates");
  revalidatePath("/dashboard/ranking");
  return { notice: `${eventName} added to your record.`, at: Date.now() };
}
