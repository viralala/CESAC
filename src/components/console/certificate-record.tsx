"use client";

import { useActionState, useId, useState } from "react";

import { uploadCertificate, type CertificateState } from "@/app/actions/certificates";
import { Chip, Notice } from "@/components/console/shell";
import { CONTRIBUTIONS, rupees } from "@/lib/console/options";
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

const PLACE: Record<string, { label: string; tone: "lime" | "teal" | "muted" }> = {
  first: { label: "First prize", tone: "lime" },
  second: { label: "Second prize", tone: "teal" },
  third: { label: "Third prize", tone: "teal" },
  participation: { label: "Participation", tone: "muted" },
};

/**
 * The student's own record, and the form that adds to it.
 *
 * A row here is a claim about an event, not a file with a name: which event,
 * what they came away with, what they won. The file backing it lives in Google
 * Drive, in a folder made for this student on their first upload, and nothing
 * is kept in the app's own storage, so the department holds one copy of each
 * certificate rather than two that drift apart.
 */
export function CertificateRecord({
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

  return (
    <div className="grid gap-8">
      {certificates.length === 0 ? (
        <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
          Nothing on your record yet. Anything you add is visible to you and to the committee, and
          to nobody else on the site.
        </p>
      ) : (
        <ul className="grid gap-0">
          {certificates.map((certificate) => {
            const standing = PLACE[certificate.contribution] ?? PLACE.participation;
            return (
              <li key={certificate.id} className="border-b border-ink/10 py-4 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <a
                    href={certificate.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 text-[1.05rem] text-ink underline decoration-teal decoration-2 underline-offset-4 transition-colors hover:text-teal"
                  >
                    {certificate.event_name}
                  </a>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={standing.tone}>{standing.label}</Chip>
                    {certificate.prize_amount_inr ? (
                      <Chip tone="ink">{rupees(certificate.prize_amount_inr)}</Chip>
                    ) : null}
                    {certificate.verified ? <Chip tone="lime">Verified</Chip> : null}
                  </div>
                </div>
                <p className="label-sm mt-1.5 text-muted">
                  {KIND[certificate.mime_type] ?? "File"} {"·"} {human(certificate.size_bytes)}{" "}
                  {"·"} added {when(certificate.created_at)}
                  {certificate.verified ? null : " · not checked by an organiser yet"}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {configured ? (
        // Keyed on the stamp the action returns, so a success remounts an
        // empty form. That is what clears the file input and puts the radios
        // back, rather than an effect reaching in to reset them afterwards.
        <AddForm key={state.at ?? 0} action={action} pending={pending} state={state} />
      ) : (
        <p className="serif-it border-t-2 border-ink/10 pt-8 text-[1.02rem] leading-relaxed text-muted">
          Uploads are not switched on yet. The committee still has to connect the department Drive.
        </p>
      )}
    </div>
  );
}

/**
 * What the department needs to know about one certificate.
 *
 * The winning amount is off until a place is picked, because participation has
 * no prize money by definition and the database refuses the combination. A box
 * that cannot be filled in wrongly beats an error message explaining why it
 * was.
 */
function AddForm({
  action,
  pending,
  state,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  state: CertificateState;
}) {
  const uid = useId();
  const [place, setPlace] = useState<string>("participation");
  const won = place !== "participation";

  return (
    <form action={action} className="grid gap-5 border-t-2 border-ink/10 pt-8">
      <div>
        <label htmlFor={`${uid}-event`} className="label block text-ink">
          Name of the event
        </label>
        <input
          id={`${uid}-event`}
          name="event"
          type="text"
          required
          maxLength={160}
          placeholder="Smart India Hackathon 2026"
          className="field mt-2.5"
        />
      </div>

      <fieldset>
        <legend className="label block text-ink">Your contribution</legend>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {CONTRIBUTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-full border-2 px-5 py-3 transition-colors ${
                place === option.value
                  ? "border-teal bg-teal/[0.07]"
                  : "border-ink/15 hover:border-ink/35"
              }`}
            >
              <input
                type="radio"
                name="contribution"
                value={option.value}
                checked={place === option.value}
                onChange={() => setPlace(option.value)}
                className="h-4 w-4 accent-[var(--teal)]"
              />
              <span className="label text-ink">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${uid}-prize`} className="label block text-ink">
          Winning amount
        </label>
        <input
          id={`${uid}-prize`}
          name="prize"
          type="text"
          inputMode="numeric"
          maxLength={12}
          disabled={!won}
          placeholder={won ? "5000" : "Only for a prize"}
          className="field mt-2.5 disabled:cursor-not-allowed disabled:bg-cream-2 disabled:text-muted"
        />
        <p className="serif-it mt-2 text-[0.85rem] text-muted">
          {won
            ? "In rupees. Leave it blank if the prize was not cash."
            : "Participation has no winning amount, so this is off."}
        </p>
      </div>

      <div>
        <label htmlFor={`${uid}-file`} className="label block text-ink">
          The certificate
        </label>
        <input
          id={`${uid}-file`}
          name="file"
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="field mt-2.5 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-cream"
        />
        <p className="serif-it mt-2 text-[0.85rem] text-muted">PDF, JPG or PNG, up to 10MB.</p>
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      <button
        type="submit"
        disabled={pending}
        className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Uploading" : "Add to my record"}
      </button>
    </form>
  );
}
