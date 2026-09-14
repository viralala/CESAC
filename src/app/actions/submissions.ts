"use server";

import { revalidatePath } from "next/cache";

import { handInFor, kindOf } from "@/lib/data/hand-ins";
import { SUBMISSIONS_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type HandInState = { error?: string; notice?: string; field?: string };

/**
 * Saves the text half of a hand-in as a draft.
 *
 * Nothing here decides whether the chapter is open or whether the row may
 * still be edited. Those are row level security policies, so the same rules
 * hold for anything that reaches the database, not just for this form.
 */
export async function saveHandIn(_state: HandInState, formData: FormData): Promise<HandInState> {
  const chapterId = String(formData.get("chapter_id") ?? "");
  const handIn = handInFor(chapterId);
  if (!handIn) return { error: "Unknown chapter." };

  const payload: Record<string, string> = {};
  for (const field of handIn.fields) {
    const value = String(formData.get(field.name) ?? "").trim();
    if (field.required && !value) {
      return { error: `${field.label} is needed.`, field: field.name };
    }
    if (value.length > field.maxLength) {
      return { error: `${field.label} is too long.`, field: field.name };
    }
    if (field.kind === "url" && value && !/^https?:\/\//i.test(value)) {
      return { error: `${field.label} needs to start with http.`, field: field.name };
    }
    if (value) payload[field.name] = value;
  }

  const supabase = await createClient();
  const { data: teamId } = await supabase.rpc("my_team_id");
  if (!teamId) return { error: "Create or join a team first." };

  const { error } = await supabase
    .from("submissions")
    .upsert(
      { team_id: teamId, chapter_id: chapterId, payload: payload as Json },
      { onConflict: "team_id,chapter_id" },
    );

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "That chapter is not open, or your hand-in is already locked."
          : error.message,
    };
  }

  revalidatePath("/dashboard");
  return { notice: "Saved as a draft. It is not handed in until you hand it in." };
}

/**
 * Hands it in. For Chapter II this is irreversible by design: the deck calls
 * it a hard lock, so the database sets the row to locked in the same
 * statement rather than trusting a later call to do it.
 */
export async function handIn(_state: HandInState, formData: FormData): Promise<HandInState> {
  const chapterId = String(formData.get("chapter_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_chapter", { p_chapter_id: chapterId });
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  revalidatePath("/dashboard");
  return { notice: "Handed in." };
}

/**
 * Records a file that has landed in storage, so it becomes part of the
 * hand-in. Until this runs, the object is just bytes nothing points at.
 *
 * The path is re-checked against the caller's own team here as well as when
 * the upload ticket was minted, because this is a separate request and should
 * not assume the first one is what actually happened.
 */
export async function recordUpload(input: {
  chapterId: string;
  storagePath: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
}): Promise<HandInState> {
  const supabase = await createClient();

  const { data: teamId } = await supabase.rpc("my_team_id");
  if (!teamId) return { error: "Create or join a team first." };

  if (!input.storagePath.startsWith(`${teamId}/`)) {
    return { error: "That file is not in your team's folder." };
  }

  const { data: submission, error: upsertError } = await supabase
    .from("submissions")
    .upsert(
      { team_id: teamId, chapter_id: input.chapterId },
      { onConflict: "team_id,chapter_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (upsertError || !submission) {
    return { error: "That chapter is not open, or your hand-in is already locked." };
  }

  const { error } = await supabase.from("submission_files").insert({
    submission_id: submission.id,
    storage_path: input.storagePath,
    kind: kindOf(input.mime),
    original_name: input.originalName,
    mime: input.mime,
    size_bytes: input.sizeBytes,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { notice: "Uploaded." };
}

/**
 * Mints a one-file upload URL.
 *
 * The browser has no session of its own, by design: the auth cookies are
 * HttpOnly so no script can read them. So it cannot upload directly. Instead
 * the server, which does have the session, asks Storage for a signed URL for
 * one specific path and hands back the token.
 *
 * Creating that URL is itself subject to the storage policy, so this refuses
 * for a path outside the caller's own team folder before a byte is sent. The
 * token is good for that one path and nothing else.
 */
export async function createUploadTicket(
  chapterId: string,
  fileName: string,
): Promise<{ path?: string; token?: string; error?: string }> {
  const supabase = await createClient();

  const { data: teamId } = await supabase.rpc("my_team_id");
  if (!teamId) return { error: "Create or join a team first." };

  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  const path = `${teamId}/${chapterId}/${crypto.randomUUID()}-${safe}`;

  const { data, error } = await supabase.storage
    .from(SUBMISSIONS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { error: "That upload was refused. Check the chapter is still open." };
  }

  return { path: data.path, token: data.token };
}

export async function removeUpload(fileId: string): Promise<HandInState> {
  const supabase = await createClient();

  const { data: file } = await supabase
    .from("submission_files")
    .select("id, storage_path")
    .eq("id", fileId)
    .single();

  if (!file) return { error: "That file is already gone." };

  const { error } = await supabase.from("submission_files").delete().eq("id", fileId);
  if (error) return { error: "That hand-in is locked, so its files cannot be removed." };

  await supabase.storage.from(SUBMISSIONS_BUCKET).remove([file.storage_path]);

  revalidatePath("/dashboard");
  return { notice: "Removed." };
}

/**
 * A short lived link to a private file. Handed out per click rather than
 * stored, so a link that leaks stops working within the hour.
 */
export async function signedFileUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(SUBMISSIONS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  return data?.signedUrl ?? null;
}
