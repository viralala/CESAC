"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { uploadCertificate, type CertificateState } from "@/app/actions/certificates";
import { Notice } from "@/components/console/shell";
import type { Certificate } from "@/lib/data/certificates";

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const KIND: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

/**
 * The student's own certificates, and the form that adds one.
 *
 * The files live in Google Drive, in a folder named after this student and
 * made on their first upload. Nothing is kept in the app's own storage, so
 * every link here points at Drive and the department keeps one copy of each
 * certificate rather than two that can drift apart.
 */
export function Certificates({
  certificates,
  configured,
}: {
  certificates: Certificate[];
  configured: boolean;
}) {
  const [state, action, pending] = useActionState<CertificateState, FormData>(
    uploadCertificate,
    {},
  );
  const uid = useId();
  const form = useRef<HTMLFormElement>(null);

  // A successful upload leaves the chosen file sitting in the input, which
  // reads as though it has not been sent yet. Clear it once it has, after the
  // render rather than during it.
  useEffect(() => {
    if (state.notice) form.current?.reset();
  }, [state.notice]);

  return (
    <div className="grid gap-7">
      {certificates.length === 0 ? (
        <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
          Nothing uploaded yet. Anything you add here is visible only to you and the committee.
        </p>
      ) : (
        <ul className="grid gap-0">
          {certificates.map((certificate) => (
            <li
              key={certificate.id}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-ink/10 py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <a
                  href={certificate.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[1.02rem] text-ink underline decoration-teal decoration-2 underline-offset-4 transition-colors hover:text-teal"
                >
                  {certificate.title}
                </a>
                <p className="label-sm mt-1 text-muted">
                  {KIND[certificate.mime_type] ?? "File"} · {human(certificate.size_bytes)} ·{" "}
                  {when(certificate.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {configured ? (
        <form ref={form} action={action} className="grid gap-5 border-t-2 border-ink/10 pt-7">
          <div>
            <label htmlFor={`${uid}-title`} className="label block text-ink">
              What is it
            </label>
            <input
              id={`${uid}-title`}
              name="title"
              type="text"
              maxLength={160}
              placeholder="Smart India Hackathon, finalist"
              className="field mt-2.5"
            />
            <p className="serif-it mt-2 text-[0.85rem] text-muted">
              Optional. The filename is used if you leave this empty.
            </p>
          </div>

          <div>
            <label htmlFor={`${uid}-file`} className="label block text-ink">
              Certificate
            </label>
            <input
              id={`${uid}-file`}
              name="file"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="field mt-2.5 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-cream"
            />
            <p className="serif-it mt-2 text-[0.85rem] text-muted">
              PDF, JPG or PNG, up to 10MB.
            </p>
          </div>

          {state.error ? <Notice tone="error">{state.error}</Notice> : null}
          {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

          <button
            type="submit"
            disabled={pending}
            className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
          >
            {pending ? "Uploading" : "Upload certificate"}
          </button>
        </form>
      ) : (
        <p className="serif-it border-t-2 border-ink/10 pt-7 text-[1.02rem] leading-relaxed text-muted">
          Uploads are not switched on yet. The committee still has to connect the department Drive.
        </p>
      )}
    </div>
  );
}
