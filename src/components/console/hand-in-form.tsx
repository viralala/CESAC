"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";

import {
  handIn as handInAction,
  recordUpload,
  removeUpload,
  saveHandIn,
  type HandInState,
} from "@/app/actions/submissions";
import { Chip, Notice } from "@/components/console/shell";
import { acceptAttribute, MAX_UPLOAD_BYTES, type HandIn } from "@/lib/data/hand-ins";
import type { Chapter, SubmissionWithFiles } from "@/lib/data/console";
import { createClient } from "@/lib/supabase/client";
import { SUBMISSIONS_BUCKET } from "@/lib/supabase/config";

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Keeps a storage path predictable and free of anything that needs escaping. */
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
}

/**
 * One chapter's hand-in.
 *
 * Saving and handing in are separate on purpose. A draft can be edited for as
 * long as the chapter is open; handing in is the commitment, and for Chapter
 * II it is irreversible because the deck calls that a hard lock. The button
 * says which of the two it is doing.
 *
 * Uploads go straight from this browser to storage rather than through a
 * server action, because a 15 second video would not survive the body limit.
 * The storage policy checks the first path segment against the uploader's
 * team, so a rewritten path cannot land in anyone else's folder.
 */
export function HandInForm({
  chapter,
  handIn,
  submission,
  teamId,
}: {
  chapter: Chapter;
  handIn: HandIn;
  submission: SubmissionWithFiles | null;
  teamId: string;
}) {
  const [saveState, saveAction, saving] = useActionState<HandInState, FormData>(saveHandIn, {});
  const [sendState, sendAction, sending] = useActionState<HandInState, FormData>(handInAction, {});
  const [upload, setUpload] = useState<HandInState>({});
  const [busy, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const uid = useId();

  const payload = (submission?.payload ?? {}) as Record<string, string>;
  const status = submission?.status ?? "draft";
  const locked = status === "locked";
  const open = chapter.state === "open";
  const editable = open && !locked;
  const takesFiles = handIn.accepts.images || handIn.accepts.video || handIn.accepts.docs;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUpload({});

    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setUpload({ error: `${file.name} is over 100 MB. Compress it and try again.` });
        continue;
      }

      const path = `${teamId}/${chapter.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error } = await supabase.storage.from(SUBMISSIONS_BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (error) {
        setUpload({ error: `${file.name} did not upload. ${error.message}` });
        continue;
      }

      const result = await recordUpload({
        chapterId: chapter.id,
        storagePath: path,
        originalName: file.name,
        mime: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      // The row is what makes the file part of the hand-in. If it fails, the
      // object would sit in storage attached to nothing, so take it back out.
      if (result.error) {
        await supabase.storage.from(SUBMISSIONS_BUCKET).remove([path]);
        setUpload(result);
        return;
      }
    }

    if (fileInput.current) fileInput.current.value = "";
    setUpload({ notice: "Uploaded." });
  }

  return (
    <div className="card p-7 sm:p-9">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-4">
          <span className="d-tall text-[2.5rem] leading-none text-ink">{chapter.numeral}</span>
          <div>
            <h3 className="d-tall text-[1.5rem] text-ink">{chapter.title}</h3>
            <p className="label-sm mt-1 text-muted">{chapter.deliver}</p>
          </div>
        </div>
        <Chip tone={locked ? "ink" : status === "submitted" ? "lime" : open ? "teal" : "muted"}>
          {locked
            ? "Locked"
            : status === "submitted"
              ? "Handed in"
              : open
                ? "Open, draft"
                : chapter.state === "graded"
                  ? "Graded"
                  : chapter.state === "closed"
                    ? "Closed"
                    : "Not open yet"}
        </Chip>
      </header>

      <p className="mt-5 text-[1rem] leading-relaxed text-muted">{chapter.task}</p>

      {!open && status === "draft" ? (
        <p className="serif-it mt-6 rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-6 text-[1rem] leading-relaxed text-muted">
          {chapter.state === "locked"
            ? "This chapter has not been opened. The form appears here the moment organisers open it on the day."
            : "This chapter is closed. Nothing further can be handed in."}
        </p>
      ) : (
        <>
          <form action={saveAction} className="mt-7 grid gap-5">
            <input type="hidden" name="chapter_id" value={chapter.id} />

            {handIn.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={`${uid}-${field.name}`} className="label block text-ink">
                  {field.label}
                  {field.required ? "" : " (optional)"}
                </label>
                {field.kind === "textarea" ? (
                  <textarea
                    id={`${uid}-${field.name}`}
                    name={field.name}
                    defaultValue={payload[field.name] ?? ""}
                    required={field.required}
                    maxLength={field.maxLength}
                    rows={field.name === "system_prompt" ? 10 : 5}
                    disabled={!editable}
                    placeholder={field.placeholder}
                    aria-invalid={saveState.field === field.name || undefined}
                    className={`field mt-2.5 min-h-[7rem] resize-y py-3 leading-relaxed disabled:opacity-70 ${
                      saveState.field === field.name ? "border-red" : ""
                    }`}
                  />
                ) : (
                  <input
                    id={`${uid}-${field.name}`}
                    name={field.name}
                    type={field.kind === "url" ? "url" : "text"}
                    defaultValue={payload[field.name] ?? ""}
                    required={field.required}
                    maxLength={field.maxLength}
                    disabled={!editable}
                    placeholder={field.placeholder}
                    aria-invalid={saveState.field === field.name || undefined}
                    className={`field mt-2.5 disabled:opacity-70 ${
                      saveState.field === field.name ? "border-red" : ""
                    }`}
                  />
                )}
                {field.hint ? (
                  <p className="serif-it mt-2 text-[0.88rem] leading-relaxed text-muted">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            ))}

            {saveState.error ? <Notice tone="error">{saveState.error}</Notice> : null}
            {saveState.notice ? <Notice tone="ok">{saveState.notice}</Notice> : null}

            {editable ? (
              <button
                type="submit"
                disabled={saving}
                className="pill pill-ghost w-full disabled:cursor-progress disabled:opacity-70"
              >
                {saving ? "Saving" : "Save draft"}
              </button>
            ) : null}
          </form>

          {takesFiles ? (
            <div className="mt-7 rounded-[var(--r-md)] border-2 border-ink/10 p-6">
              <p className="label text-ink">Files</p>
              {handIn.fileHint ? (
                <p className="serif-it mt-2 text-[0.92rem] leading-relaxed text-muted">
                  {handIn.fileHint}
                </p>
              ) : null}

              {submission?.files?.length ? (
                <ul className="mt-5 grid gap-2.5">
                  {submission.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--r-md)] bg-cream-2 px-5 py-3.5"
                    >
                      <Chip tone="muted">{file.kind}</Chip>
                      <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">
                        {file.original_name}
                      </span>
                      <span className="label-sm text-muted">{human(file.size_bytes ?? 0)}</span>
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => {
                            startUpload(async () => setUpload(await removeUpload(file.id)));
                          }}
                          className="label-sm text-red hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="serif-it mt-4 text-[0.95rem] text-muted">Nothing uploaded yet.</p>
              )}

              {upload.error ? (
                <div className="mt-4">
                  <Notice tone="error">{upload.error}</Notice>
                </div>
              ) : null}

              {editable ? (
                <>
                  <input
                    ref={fileInput}
                    id={`${uid}-files`}
                    type="file"
                    multiple
                    accept={acceptAttribute(handIn)}
                    onChange={(event) => startUpload(() => onFiles(event.target.files))}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`${uid}-files`}
                    className="pill pill-ghost mt-5 flex w-full cursor-pointer justify-center"
                    aria-disabled={busy}
                  >
                    {busy ? "Uploading" : "Add files"}
                  </label>
                </>
              ) : null}
            </div>
          ) : null}

          {editable ? (
            <form action={sendAction} className="mt-7">
              <input type="hidden" name="chapter_id" value={chapter.id} />
              {sendState.error ? <Notice tone="error">{sendState.error}</Notice> : null}
              {!chapter.allow_edit_after_submit ? (
                <p className="serif-it mb-4 text-[0.92rem] leading-relaxed text-muted">
                  This one locks the moment you hand it in. Save the draft, read it once more,
                  then hand in.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={sending || status !== "draft"}
                className="pill pill-lime w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending
                  ? "Handing in"
                  : status !== "draft"
                    ? "Already handed in"
                    : chapter.allow_edit_after_submit
                      ? "Hand in"
                      : "Hand in and lock"}
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
