"use client";

import { useActionState, useId, useState } from "react";

import {
  deleteRecord,
  removeRecordFile,
  saveRecord,
  uploadRecordFile,
  type CertificateState,
} from "@/app/actions/certificates";
import { Chip, Notice } from "@/components/console/shell";
import { MAX_CERTIFICATE_BYTES, MAX_CERTIFICATE_LABEL } from "@/lib/console/limits";
import { CONTRIBUTIONS, rupees } from "@/lib/console/options";
import {
  EXTRA_SLOTS,
  KIND_LABEL,
  LAYOUTS,
  LAYOUT,
  LEVELS,
  LEVEL_LABEL,
  isPublication,
  type Field,
  type Layout,
} from "@/lib/console/records";
import type { CertificateFile, CertificateWithFiles } from "@/lib/data/certificates";

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

function onDay(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const PLACE: Record<string, { label: string; tone: "lime" | "teal" | "muted" }> = {
  first: { label: "First prize", tone: "lime" },
  second: { label: "Second prize", tone: "teal" },
  third: { label: "Third prize", tone: "teal" },
  participation: { label: "Participation", tone: "muted" },
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

/**
 * The student's own record, and everything they can do to it.
 *
 * A row is a claim about something they did, not a file with a name. It used
 * to be one shape, a certificate for an event; it is now five, because the
 * department files publications on four more layouts and wanted them here
 * rather than on a spreadsheet somebody emails around.
 *
 * A new record has to arrive with something attached. The committee asked for
 * that on 22 September and the reason is the one that matters: a row nobody
 * can check is a row nobody can count, and the queue was filling with claims
 * that had no proof behind them. One file is the bar, not four. For a
 * hackathon it is the certificate; for a paper it is the paper, or a
 * screenshot of the listing, or the acceptance mail. The three photo slots on
 * a saved record stay optional and always will.
 */
export function CertificateRecord({
  certificates,
  configured,
  optedOut,
  emptyNote,
  studentName,
}: {
  certificates: CertificateWithFiles[];
  configured: boolean;
  optedOut: boolean;
  emptyNote: string;
  /** Prefilled as the primary author, because usually it is them. */
  studentName: string;
}) {
  const [adding, setAdding] = useState(certificates.length === 0);

  return (
    <div className="grid gap-8">
      {certificates.length === 0 ? (
        <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
          {emptyNote}
        </p>
      ) : (
        <ul className="grid gap-3">
          {certificates.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              configured={configured}
              optedOut={optedOut}
            />
          ))}
        </ul>
      )}

      <div className="border-t-2 border-ink/10 pt-8">
        {adding ? (
          <AddPanel
            configured={configured}
            studentName={studentName}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="pill pill-lime">
            Add something to my record
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The add form, remounted on every success.
 *
 * Keyed on the stamp the action returns, which is what clears the file input
 * and puts the fields back rather than an effect reaching in to reset them
 * afterwards.
 */
function AddPanel({
  configured,
  studentName,
  onDone,
}: {
  configured: boolean;
  studentName: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<CertificateState, FormData>(saveRecord, {});

  return (
    <RecordForm
      key={state.at ?? 0}
      action={action}
      pending={pending}
      state={state}
      configured={configured}
      studentName={studentName}
      submit="Add to my record"
      onCancel={onDone}
    />
  );
}

/** One record, with the four slots and the two ways to change it. */
function RecordCard({
  record,
  configured,
  optedOut,
}: {
  record: CertificateWithFiles;
  configured: boolean;
  optedOut: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [editState, editAction, editPending] = useActionState<CertificateState, FormData>(
    saveRecord,
    {},
  );
  const [removeState, removeAction, removePending] = useActionState<CertificateState, FormData>(
    deleteRecord,
    {},
  );

  const standing = PLACE[record.contribution] ?? PLACE.participation;
  const date = onDay(record.happened_on);
  const files = record.files.length + (record.drive_link ? 1 : 0);

  return (
    <li className="rounded-[var(--r-md)] border-2 border-ink/10 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        {record.drive_link ? (
          <a
            href={record.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 text-[1.05rem] text-ink underline decoration-teal decoration-2 underline-offset-4 transition-colors hover:text-teal"
          >
            {record.event_name}
          </a>
        ) : (
          <span className="min-w-0 text-[1.05rem] text-ink">{record.event_name}</span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="ink">{KIND_LABEL[record.kind] ?? "Record"}</Chip>
          {record.level ? <Chip tone="teal">{LEVEL_LABEL[record.level]}</Chip> : null}
          {isPublication(record.kind) ? null : (
            <Chip tone={standing.tone}>{standing.label}</Chip>
          )}
          {record.prize_amount_inr ? (
            <Chip tone="lime">{rupees(record.prize_amount_inr)}</Chip>
          ) : null}
          {record.verified ? <Chip tone="lime">Verified</Chip> : null}
        </div>
      </div>

      <p className="label-sm mt-1.5 text-muted">
        {record.venue_name ? `${record.venue_name} · ` : ""}
        {date ?? (record.publication_year ? String(record.publication_year) : `added ${when(record.created_at)}`)}
        {" · "}
        {files === 0 ? "no files" : `${files} ${files === 1 ? "file" : "files"}`}
        {record.verified ? null : " · not checked by an organiser yet"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {configured ? (
          <button
            type="button"
            onClick={() => setShowFiles((open) => !open)}
            className="label rounded-full border-2 border-ink/15 px-4 py-2 text-ink transition-colors hover:border-ink/40"
          >
            {showFiles ? "Hide files" : "Files and photos"}
          </button>
        ) : null}

        {record.verified ? null : (
          <>
            <button
              type="button"
              onClick={() => setEditing((open) => !open)}
              className="label rounded-full border-2 border-ink/15 px-4 py-2 text-ink transition-colors hover:border-ink/40"
            >
              {editing ? "Stop editing" : "Edit"}
            </button>

            <form
              action={removeAction}
              onSubmit={(event) => {
                if (!window.confirm(`Remove ${record.event_name} from your record?`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="record_id" value={record.id} />
              <button
                type="submit"
                disabled={removePending}
                className="label rounded-full border-2 border-red/40 px-4 py-2 text-red-deep transition-colors hover:bg-red/10 disabled:opacity-60"
              >
                {removePending ? "Removing" : "Remove"}
              </button>
            </form>
          </>
        )}
      </div>

      {removeState.error ? (
        <div className="mt-4">
          <Notice tone="error">{removeState.error}</Notice>
        </div>
      ) : null}

      {showFiles ? (
        <Files record={record} locked={record.verified} optedOut={optedOut} />
      ) : null}

      {editing ? (
        <div className="mt-6 border-t-2 border-ink/10 pt-6">
          <RecordForm
            key={editState.at ?? 0}
            action={editAction}
            pending={editPending}
            state={editState}
            configured={false}
            submit="Save changes"
            record={record}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : null}
    </li>
  );
}

/**
 * The four slots.
 *
 * Each is its own form and its own request, because a Vercel function refuses
 * any body over 4.5MB whatever Next.js is told to allow, and four files at the
 * size this site accepts do not fit in one. Uploading into a slot that is
 * already filled replaces what is there: a button labelled "The prize" reads
 * as one photo and not a growing pile.
 */
function Files({
  record,
  locked,
  optedOut,
}: {
  record: CertificateWithFiles;
  locked: boolean;
  optedOut: boolean;
}) {
  const bySlot = new Map(record.files.map((f) => [f.slot, f]));

  return (
    <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5">
      <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
        All four are optional. Upload what you have; an empty slot costs you nothing.
        {optedOut ? null : " Nothing here is shown on the public site."}
      </p>

      <SlotRow
        recordId={record.id}
        slot="certificate"
        label="The certificate"
        hint="The certificate itself, or the paper."
        link={record.drive_link}
        detail={
          record.file_name && record.size_bytes
            ? `${record.file_name} · ${human(record.size_bytes)}`
            : null
        }
        locked={locked}
      />

      {EXTRA_SLOTS.map((slot) => {
        const file = bySlot.get(slot.slot) as CertificateFile | undefined;
        return (
          <SlotRow
            key={slot.slot}
            recordId={record.id}
            slot={slot.slot}
            label={slot.label}
            hint={slot.hint}
            link={file?.drive_link ?? null}
            detail={file ? `${file.file_name} · ${human(file.size_bytes)}` : null}
            fileId={file?.id}
            locked={locked}
          />
        );
      })}
    </div>
  );
}

function SlotRow({
  recordId,
  slot,
  label,
  hint,
  link,
  detail,
  fileId,
  locked,
}: {
  recordId: string;
  slot: string;
  label: string;
  hint: string;
  link: string | null;
  detail: string | null;
  fileId?: string;
  locked: boolean;
}) {
  const uid = useId();
  const [state, action, pending] = useActionState<CertificateState, FormData>(
    uploadRecordFile,
    {},
  );
  const [dropState, dropAction, dropping] = useActionState<CertificateState, FormData>(
    removeRecordFile,
    {},
  );
  const [oversize, setOversize] = useState<string | null>(null);

  return (
    <div className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <span>
          <span className="label block text-ink">{label}</span>
          <span className="mt-0.5 block text-[0.85rem] leading-snug text-muted">{hint}</span>
        </span>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="label-sm text-teal underline underline-offset-4"
          >
            Open
          </a>
        ) : (
          <span className="label-sm text-muted">Nothing yet</span>
        )}
      </div>

      {detail ? <p className="label-sm mt-2 text-muted">{detail}</p> : null}

      {locked ? (
        <p className="serif-it mt-3 text-[0.85rem] text-muted">
          Verified, so the files are fixed now.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <form action={action} key={state.at ?? 0} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="record_id" value={recordId} />
            <input type="hidden" name="slot" value={slot} />
            <input
              id={`${uid}-file`}
              name="file"
              type="file"
              required
              accept={ACCEPT}
              onChange={(event) => {
                const chosen = event.currentTarget.files?.[0];
                if (chosen && chosen.size > MAX_CERTIFICATE_BYTES) {
                  setOversize(
                    `That file is ${human(chosen.size)}, and the limit is ${MAX_CERTIFICATE_LABEL}.`,
                  );
                  event.currentTarget.value = "";
                  return;
                }
                setOversize(null);
              }}
              className="field max-w-full file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-cream"
            />
            <button
              type="submit"
              disabled={pending}
              className="pill pill-ghost disabled:cursor-progress disabled:opacity-70"
            >
              {pending ? "Uploading" : link ? "Replace" : "Upload"}
            </button>
          </form>

          {fileId ? (
            <form action={dropAction}>
              <input type="hidden" name="file_id" value={fileId} />
              <button
                type="submit"
                disabled={dropping}
                className="label rounded-full border-2 border-red/40 px-4 py-2 text-red-deep transition-colors hover:bg-red/10 disabled:opacity-60"
              >
                {dropping ? "Removing" : "Remove"}
              </button>
            </form>
          ) : null}
        </div>
      )}

      {oversize ? (
        <div className="mt-3">
          <Notice tone="error">{oversize}</Notice>
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-3">
          <Notice tone="error">{state.error}</Notice>
        </div>
      ) : null}
      {dropState.error ? (
        <div className="mt-3">
          <Notice tone="error">{dropState.error}</Notice>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The record itself, in whichever of the five shapes it is.
 *
 * The kind is picked first and everything below it changes, because a journal
 * and a hackathon share a title and almost nothing else. Both the add form and
 * the edit form are this component: two copies of a twenty-field form would
 * have drifted apart inside a week.
 */
function RecordForm({
  action,
  pending,
  state,
  configured,
  studentName,
  submit,
  record,
  onCancel,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  state: CertificateState;
  /** Whether to offer a certificate on the form itself. Editing does not. */
  configured: boolean;
  studentName?: string;
  submit: string;
  record?: CertificateWithFiles;
  onCancel?: () => void;
}) {
  const uid = useId();
  const [kind, setKind] = useState<string>(record?.kind ?? "event");
  const [place, setPlace] = useState<string>(record?.contribution ?? "participation");
  const [oversize, setOversize] = useState<string | null>(null);

  const layout: Layout = LAYOUT[kind] ?? LAYOUT.event;
  const won = place !== "participation";

  return (
    <form action={action} className="grid gap-6">
      {record ? <input type="hidden" name="record_id" value={record.id} /> : null}

      <fieldset>
        <legend className="label block text-ink">What are you adding?</legend>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LAYOUTS.map((option) => (
            <label
              key={option.kind}
              className={`flex cursor-pointer items-center gap-3 rounded-[var(--r-md)] border-2 px-4 py-3 transition-colors ${
                kind === option.kind
                  ? "border-teal bg-teal/[0.07]"
                  : "border-ink/15 hover:border-ink/35"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.kind}
                checked={kind === option.kind}
                onChange={() => setKind(option.kind)}
                className="h-4 w-4 shrink-0 accent-[var(--teal)]"
              />
              <span className="label text-ink">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="serif-it mt-2.5 text-[0.85rem] leading-relaxed text-muted">
          {layout.blurb}
        </p>
      </fieldset>

      <div>
        <label htmlFor={`${uid}-title`} className="label block text-ink">
          {layout.titleLabel}
        </label>
        <input
          id={`${uid}-title`}
          name="event_name"
          type="text"
          required
          maxLength={240}
          defaultValue={record?.event_name ?? ""}
          placeholder={layout.titlePlaceholder}
          className="field mt-2.5"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-level`} className="label block text-ink">
            How far did it reach?
          </label>
          <select
            id={`${uid}-level`}
            name="level"
            required
            defaultValue={record?.level ?? ""}
            className="field mt-2.5"
          >
            <option value="" disabled>
              Pick one
            </option>
            {LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="serif-it mt-2 text-[0.82rem] leading-snug text-muted">
            {LEVELS.find((l) => l.value === (record?.level ?? ""))?.note ??
              "International, national, state, zonal, or inside VIT."}
          </p>
        </div>

        <div>
          <label htmlFor={`${uid}-date`} className="label block text-ink">
            {layout.dateLabel}
            {layout.dated ? "" : " (optional)"}
          </label>
          <input
            id={`${uid}-date`}
            name="happened_on"
            type="date"
            required={layout.dated}
            defaultValue={record?.happened_on ?? ""}
            className="field mt-2.5"
          />
        </div>
      </div>

      {layout.placed ? (
        <>
          <fieldset>
            <legend className="label block text-ink">What did you come away with?</legend>
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
              defaultValue={record?.prize_amount_inr ? String(record.prize_amount_inr) : ""}
              placeholder={won ? "5000" : "Only for a prize"}
              className="field mt-2.5 disabled:cursor-not-allowed disabled:bg-cream-2 disabled:text-muted"
            />
            <p className="serif-it mt-2 text-[0.85rem] text-muted">
              {won
                ? "In rupees. Leave it blank if the prize was not cash."
                : "Participation has no winning amount, so this is off."}
            </p>
          </div>
        </>
      ) : null}

      {layout.fields.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {layout.fields.map((field) => (
            <LayoutField
              key={field.name}
              uid={uid}
              field={field}
              record={record}
              studentName={studentName}
            />
          ))}
        </div>
      ) : null}

      {configured ? (
        <div>
          <label htmlFor={`${uid}-file`} className="label block text-ink">
            Proof, and this one is needed
          </label>
          <input
            id={`${uid}-file`}
            name="file"
            type="file"
            accept={ACCEPT}
            // Not merely an attribute the browser enforces. saveRecord refuses
            // a new record with nothing attached, because a form is a
            // courtesy and a server action is the rule.
            required={!record}
            // Caught here, in the browser, because a file over the limit is
            // refused by the server before the action runs and there is no way
            // to answer it with a sentence at that point.
            onChange={(event) => {
              const chosen = event.currentTarget.files?.[0];
              if (chosen && chosen.size > MAX_CERTIFICATE_BYTES) {
                setOversize(
                  `That file is ${human(chosen.size)}, and the limit is ${MAX_CERTIFICATE_LABEL}. A lower quality scan, or a photo taken at a smaller size, will fit.`,
                );
                event.currentTarget.value = "";
                return;
              }
              setOversize(null);
            }}
            className="field mt-2.5 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-cream"
          />
          <p className="serif-it mt-2 text-[0.85rem] leading-relaxed text-muted">
            PDF, JPG or PNG, up to {MAX_CERTIFICATE_LABEL}. One file has to come with every
            record: the certificate for an event, and for a paper the paper itself, the
            acceptance mail or a photo of the listing. The prize, the event and the photo with
            the HOD are added from the record once it is saved, and those stay optional.
          </p>
          {oversize ? (
            <div className="mt-3">
              <Notice tone="error">{oversize}</Notice>
            </div>
          ) : null}
        </div>
      ) : null}

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="pill pill-lime disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? "Saving" : submit}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="label text-muted hover:text-ink">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** One field off the layout, rendered as whatever its type says it is. */
function LayoutField({
  uid,
  field,
  record,
  studentName,
}: {
  uid: string;
  field: Field;
  record?: CertificateWithFiles;
  studentName?: string;
}) {
  const id = `${uid}-${field.name}`;
  const stored = record
    ? (record as unknown as Record<string, string | number | boolean | null>)[field.name]
    : null;

  // The sheet wants a primary author against every publication and it is
  // nearly always the student filling the form in. Typed in for them, and
  // editable, because "nearly always" is not "always".
  const current =
    stored === null && field.name === "primary_author" && studentName ? studentName : stored;
  const wide = field.half ? "" : "sm:col-span-2";

  if (field.type === "bool") {
    return (
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-[var(--r-md)] bg-cream-2 px-5 py-4 ${wide}`}
      >
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={current === true}
          className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
        />
        <span>
          <span className="label block text-ink">{field.label}</span>
          {field.hint ? (
            <span className="mt-1 block text-[0.85rem] leading-relaxed text-muted">
              {field.hint}
            </span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <div className={wide}>
      <label htmlFor={id} className="label block text-ink">
        {field.label}
        {field.required ? "" : <span className="ml-2 text-muted">optional</span>}
      </label>
      <input
        id={id}
        name={field.name}
        type={field.type === "year" ? "number" : field.type === "decimal" ? "number" : "text"}
        step={field.type === "decimal" ? "0.001" : undefined}
        min={field.type === "year" ? 1900 : field.type === "decimal" ? 0 : undefined}
        max={field.type === "year" ? 2100 : undefined}
        required={field.required}
        maxLength={field.type === "text" ? 240 : undefined}
        defaultValue={current === null || current === undefined ? "" : String(current)}
        placeholder={field.placeholder}
        list={field.options ? `${id}-options` : undefined}
        className="field mt-2.5"
      />
      {field.options ? (
        <datalist id={`${id}-options`}>
          {field.options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
      {field.hint ? (
        <p className="serif-it mt-2 text-[0.82rem] leading-snug text-muted">{field.hint}</p>
      ) : null}
    </div>
  );
}
