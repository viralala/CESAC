"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getViewer, homeFor } from "@/lib/auth/guard";
import { AVATAR_BUCKET, MAX_PHOTO_BYTES } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

export type PhotoState = { error?: string };

const TYPES = [
  { mime: "image/jpeg", ext: "jpg" },
  { mime: "image/png", ext: "png" },
  { mime: "image/webp", ext: "webp" },
] as const;

/**
 * What the bytes actually are, not what the file is called. Same rule the
 * certificate upload applies, for the same reason: a browser's idea of the
 * type comes from the extension, and an extension is one rename away.
 */
function sniff(bytes: Uint8Array): (typeof TYPES)[number] | null {
  const at = (offset: number, ...sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);

  if (at(0, 0xff, 0xd8, 0xff)) return TYPES[0];
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return TYPES[1];
  // RIFF....WEBP
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return TYPES[2];
  return null;
}

/** Same-origin paths only, so ?next= cannot become an open redirect. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value.trim() : "";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/account/photo")) {
    return null;
  }
  return next;
}

/**
 * Put a photo on the signed-in account.
 *
 * The browser has already cropped it square and shrunk it, so what arrives is
 * normally a hundred kilobytes rather than a phone's twelve megapixels; the
 * limits here are for whatever did not come through that form. It is written
 * with the student's own session, into a folder named by their id, and the
 * storage policy refuses any other folder, so one student cannot put a file
 * where another's photo lives.
 *
 * A new name every time rather than overwriting, because the old address may
 * be sitting in a cached page or the image optimiser, and a replaced file at
 * the same address would keep showing the old face for as long as that cache
 * lives. The previous file is deleted once the profile points at the new one.
 */
export async function savePhoto(_state: PhotoState, formData: FormData): Promise<PhotoState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/account/photo");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo first." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "That photo is still over 2MB. Try a smaller one, or a screenshot of it." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return { error: "That is not a JPEG, PNG or WebP photo." };

  const supabase = await createClient();
  const path = `${viewer.id}/${Date.now().toString(36)}.${kind.ext}`;

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: kind.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) {
    console.error("photo upload failed", uploadError);
    return { error: "The photo did not upload. Try again in a minute." };
  }

  // Selected back, because an update that row level security refuses matches
  // nothing and comes back from PostgREST as a success with no error.
  const { data: saved, error: saveError } = await supabase
    .from("profiles")
    .update({ photo_path: path })
    .eq("id", viewer.id)
    .select("id")
    .maybeSingle();

  if (saveError || !saved) {
    console.error("photo save failed", saveError);
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return { error: "The photo uploaded but did not save to your account. Try again." };
  }

  if (viewer.photoPath && viewer.photoPath !== path) {
    // Best effort. A leftover file costs a few kilobytes; failing the whole
    // step over it would cost the student their new photo.
    await supabase.storage.from(AVATAR_BUCKET).remove([viewer.photoPath]);
  }

  revalidatePath("/", "layout");

  redirect(safeNext(formData.get("next")) ?? homeFor(viewer.role));
}
