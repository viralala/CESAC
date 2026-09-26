"use client";

import { useActionState, useId, useRef, useState, type ReactNode } from "react";

import {
  deleteRecord,
  removeRecordFile,
  saveRecord,
  uploadRecordFile,
  type CertificateState,
} from "@/app/actions/certificates";
import { Chip, Notice, Panel } from "@/components/console/shell";
import { MAX_CERTIFICATE_BYTES, MAX_CERTIFICATE_LABEL } from "@/lib/console/limits";
import { CONTRIBUTIONS, rupees } from "@/lib/console/options";
import {
  EXTRA_SLOTS,
  KIND_LABEL,
  LAYOUTS,
  LAYOUT,
  LAYOUT_GROUPS,
  LEVELS,
  LEVEL_LABEL,
  isPlaced,
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

/** The value an "Other" choice sends while its box is still empty. */
const OTHER = "__other__";

/**
 * The student's own record, and everything they can do to it.
 *
 * Adding something is what this page is for, so the form is the main column
 * and is open from the start, and the records already filed sit beside it
 * in a narrower column. Editing a record opens it in the same main form
 * rather than inside its card, because the side column is too narrow for a
 * form with a dozen fields.
 *
 * A new record has to arrive with something attached. The committee asked for
 * that on 22 September and the reason is the one that matters: a row nobody
 * can check is a row nobody can count. One file is the bar, not four. The
 * three photo slots on a saved record stay optional and always will.
 */
export function CertificateRecord({
  certificates,
  configured,
  emptyNote,
  studentName,
  notice,
}: {
  certificates: CertificateWithFiles[];
  configured: boolean;
  emptyNote: string;
  /** Prefilled as the primary author, because usually it is them. */
  studentName: string;
  /** Shown above the form, for a page that has something to say first. */
  notice?: ReactNode;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const formTop = useRef<HTMLDivElement>(null);
  const editing = certificates.find((c) => c.id === editingId) ?? null;

  const startEditing = (id: string) => {
    setEditingId(id);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
      <div ref={formTop} className="scroll-mt-24">
        <Panel
          eyebrow={editing ? "Correcting a record" : "Your record"}
          title={editing ? `Edit ${editing.event_name}` : "Add to my record"}
        >
          {notice ? <div className="mb-6">{notice}</div> : null}
          {editing ? (
            <EditPanel key={editing.id} record={editing} onDone={() => setEditingId(null)} />
          ) : (
            <AddPanel configured={configured} studentName={studentName} />
          )}
        </Panel>
      </div>

      <Panel
        eyebrow="On file"
        title="My records"
        aside={certificates.length ? `${certificates.length}` : undefined}
        className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto"
      >
        {certificates.length === 0 ? (
          <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-5 py-6 text-[0.98rem] leading-relaxed text-muted">
            {emptyNote}
          </p>
        ) : (
          <ul className="grid gap-3">
            {certificates.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                configured={configured}
                editing={record.id === editingId}
                onEdit={() => startEditing(record.id)}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/**
 * The add form, remounted on every success.
 *
 * Keyed on the stamp the action returns, which is what clears the file input
 * and puts the fields back rather than an effect reaching in to reset them
 * afterwards. The notice is kept above it, so the student still sees that the
 * last one went in.
 */
function AddPanel({ configured, studentName }: { configured: boolean; studentName: string }) {
  const [state, action, pending] = useActionState<CertificateState, FormData>(saveRecord, {});

  return (
    <>
      {state.notice ? (
        <div className="mb-6">
          <Notice tone="ok">{state.notice}</Notice>
        </div>
      ) : null}
      <RecordForm
        key={state.at ?? 0}
        action={action}
        pending={pending}
        state={{ error: state.error }}
        configured={configured}
        studentName={studentName}
        submit="Add to my record"
      />
    </>
  );
}

function EditPanel({ record, onDone }: { record: CertificateWithFiles; onDone: () => void }) {
  const [state, action, pending] = useActionState<CertificateState, FormData>(saveRecord, {});

  return (
    <RecordForm
      key={state.at ?? 0}
      action={action}
      pending={pending}
      state={state}
      configured={false}
      submit="Save changes"
      record={record}
      onCancel={onDone}
      cancelLabel={state.notice ? "Done" : "Cancel"}
    />
  );
}

/** One record in the side column, with its files and the two ways to change it. */
function RecordCard({
  record,
  configured,
  editing,
  onEdit,
}: {
  record: CertificateWithFiles;
  configured: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  const [showFiles, setShowFiles] = useState(false);
  const [removeState, removeAction, removePending] = useActionState<CertificateState, FormData>(
    deleteRecord,
    {},
  );

  const standing = PLACE[record.contribution] ?? PLACE.participation;
  const date = onDay(record.happened_on);
  const files = record.files.length + (record.drive_link ? 1 : 0);

  return (
    <li
      className={`rounded-[var(--r-md)] border-2 p-4 ${
        editing ? "border-teal bg-teal/[0.05]" : "border-ink/10"
      }`}
    >
      {record.drive_link ? (
        <a
          href={record.drive_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[1rem] leading-snug text-ink underline decoration-teal decoration-2 underline-offset-4 transition-colors hover:text-teal"
        >
          {record.event_name}
        </a>
      ) : (
        <span className="block text-[1rem] leading-snug text-ink">{record.event_name}</span>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Chip tone="ink">{KIND_LABEL[record.kind] ?? "Record"}</Chip>
        {record.level ? <Chip tone="teal">{LEVEL_LABEL[record.level]}</Chip> : null}
        {isPlaced(record.kind) ? <Chip tone={standing.tone}>{standing.label}</Chip> : null}
        {record.prize_amount_inr ? <Chip tone="lime">{rupees(record.prize_amount_inr)}</Chip> : null}
        {record.verified ? <Chip tone="lime">Verified</Chip> : null}
      </div>

      <p className="label-sm mt-2 text-muted">
        {record.venue_name ? `${record.venue_name} · ` : ""}
        {date ?? (record.publication_year ? String(record.publication_year) : `added ${when(record.created_at)}`)}
        {" · "}
        {files === 0 ? "no files" : `${files} ${files === 1 ? "file" : "files"}`}
        {record.verified ? null : " · not checked yet"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {configured ? (
          <button
            type="button"
            onClick={() => setShowFiles((open) => !open)}
            className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-ink transition-colors hover:border-ink/40"
          >
            {showFiles ? "Hide files" : "Files and photos"}
          </button>
        ) : null}

        {record.verified ? null : (
          <>
            <button
              type="button"
              onClick={onEdit}
              disabled={editing}
              className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-ink transition-colors hover:border-ink/40 disabled:opacity-60"
            >
              {editing ? "Editing" : "Edit"}
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
                className="label-sm rounded-full border-2 border-red/40 px-3.5 py-1.5 text-red-deep transition-colors hover:bg-red/10 disabled:opacity-60"
              >
                {removePending ? "Removing" : "Remove"}
              </button>
            </form>
          </>
        )}
      </div>

      {removeState.error ? (
        <div className="mt-3">
          <Notice tone="error">{removeState.error}</Notice>
        </div>
      ) : null}

      {showFiles ? <Files record={record} locked={record.verified} /> : null}
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
function Files({ record, locked }: { record: CertificateWithFiles; locked: boolean }) {
  const bySlot = new Map(record.files.map((f) => [f.slot, f]));

  return (
    <div className="mt-4 grid gap-2.5 border-t border-ink/10 pt-4">
      <p className="serif-it text-[0.85rem] leading-relaxed text-muted">
        All four are optional and none of them is shown on the public site.
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
    <div className="rounded-[var(--r-md)] bg-cream-2 px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span>
          <span className="label block text-ink">{label}</span>
          <span className="mt-0.5 block text-[0.82rem] leading-snug text-muted">{hint}</span>
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

      {detail ? <p className="label-sm mt-2 [overflow-wrap:anywhere] text-muted">{detail}</p> : null}

      {locked ? (
        <p className="serif-it mt-2.5 text-[0.82rem] text-muted">Verified, so the files are fixed now.</p>
      ) : (
        <div className="mt-2.5 grid gap-2">
          <form action={action} key={state.at ?? 0} className="grid gap-2">
            <input type="hidden" name="record_id" value={recordId} />
            <input type="hidden" name="slot" value={slot} />
            <input
              id={`${uid}-file`}
              name="file"
              type="file"
              required
              accept={ACCEPT}
              aria-label={`File for ${label}`}
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
              className="field max-w-full text-[0.85rem] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-cream"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className="pill pill-ghost disabled:cursor-progress disabled:opacity-70"
              >
                {pending ? "Uploading" : link ? "Replace" : "Upload"}
              </button>
            </div>
          </form>

          {fileId ? (
            <form action={dropAction}>
              <input type="hidden" name="file_id" value={fileId} />
              <button
                type="submit"
                disabled={dropping}
                className="label-sm rounded-full border-2 border-red/40 px-3.5 py-1.5 text-red-deep transition-colors hover:bg-red/10 disabled:opacity-60"
              >
                {dropping ? "Removing" : "Remove this file"}
              </button>
            </form>
          ) : null}
        </div>
      )}

      {oversize ? (
        <div className="mt-2.5">
          <Notice tone="error">{oversize}</Notice>
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-2.5">
          <Notice tone="error">{state.error}</Notice>
        </div>
      ) : null}
      {dropState.error ? (
        <div className="mt-2.5">
          <Notice tone="error">{dropState.error}</Notice>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The record itself, in whichever of the eleven shapes it is.
 *
 * The kind is picked first, from one dropdown, and everything below it
 * changes, because a journal and a hackathon share a title and almost nothing
 * else. Both the add form and the edit form are this component: two copies of
 * a twenty-field form would have drifted apart inside a week.
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
  cancelLabel = "Cancel",
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
  cancelLabel?: string;
}) {
  const uid = useId();
  const [kind, setKind] = useState<string>(record?.kind ?? "event");
  const [place, setPlace] = useState<string>(record?.contribution ?? "participation");
  const [level, setLevel] = useState<string>(record?.level ?? "");
  const [oversize, setOversize] = useState<string | null>(null);

  const layout: Layout = LAYOUT[kind] ?? LAYOUT.event;
  const won = place !== "participation";

  return (
    <form action={action} className="grid gap-6">
      {record ? <input type="hidden" name="record_id" value={record.id} /> : null}

      <div>
        <label htmlFor={`${uid}-kind`} className="label block text-ink">
          What are you adding?
        </label>
        <select
          id={`${uid}-kind`}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.currentTarget.value)}
          className="field mt-2.5"
        >
          {LAYOUT_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {LAYOUTS.filter((l) => l.group === group).map((option) => (
                <option key={option.kind} value={option.kind}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="serif-it mt-2 text-[0.85rem] leading-relaxed text-muted">{layout.blurb}</p>
      </div>

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
        {layout.leveled ? (
          <div>
            <label htmlFor={`${uid}-level`} className="label block text-ink">
              How far did it reach?
            </label>
            <select
              id={`${uid}-level`}
              name="level"
              required
              value={level}
              onChange={(event) => setLevel(event.currentTarget.value)}
              className="field mt-2.5"
            >
              <option value="" disabled>
                Pick one
              </option>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="serif-it mt-2 text-[0.82rem] leading-snug text-muted">
              {LEVELS.find((l) => l.value === level)?.note ??
                "International, national, state, zonal, or inside VIT."}
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor={`${uid}-date`} className="label block text-ink">
            {layout.dateLabel}
            {layout.dated ? "" : <span className="ml-2 text-muted">optional</span>}
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

        {layout.placed ? (
          <>
            <div>
              <label htmlFor={`${uid}-place`} className="label block text-ink">
                What did you come away with?
              </label>
              <select
                id={`${uid}-place`}
                name="contribution"
                value={place}
                onChange={(event) => setPlace(event.currentTarget.value)}
                className="field mt-2.5"
              >
                {CONTRIBUTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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
              <p className="serif-it mt-2 text-[0.82rem] text-muted">
                {won ? "In rupees, blank if the prize was not cash." : "Participation has no prize."}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {layout.fields.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {layout.fields.map((field) => (
            <LayoutField
              key={`${layout.kind}-${field.name}`}
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
            PDF, JPG or PNG up to {MAX_CERTIFICATE_LABEL}: the certificate, offer letter, paper or
            listing, with more photos added from the record once it is saved.
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
          className="pill pill-lime px-8 text-[1.02rem] disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? "Saving" : submit}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="label text-muted hover:text-ink">
            {cancelLabel}
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
    (stored === null || stored === undefined) && field.name === "primary_author" && studentName
      ? studentName
      : stored;
  const wide = field.half ? "" : "sm:col-span-2";

  const label = (
    <label htmlFor={id} className="label block text-ink">
      {field.label}
      {field.required ? "" : <span className="ml-2 text-muted">optional</span>}
    </label>
  );
  const hint = field.hint ? (
    <p className="serif-it mt-2 text-[0.82rem] leading-snug text-muted">{field.hint}</p>
  ) : null;

  if (field.type === "bool") {
    return (
      <div className={wide}>
        {label}
        <select
          id={id}
          name={field.name}
          defaultValue={current === true ? "yes" : current === false ? "no" : ""}
          className="field mt-2.5"
        >
          <option value="">Not saying</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {hint}
      </div>
    );
  }

  if (field.options) {
    return (
      <div className={wide}>
        {label}
        <OptionField id={id} field={field} current={current == null ? "" : String(current)} />
        {hint}
      </div>
    );
  }

  return (
    <div className={wide}>
      {label}
      <input
        id={id}
        name={field.name}
        type={
          field.type === "year" || field.type === "decimal" || field.type === "int"
            ? "number"
            : field.type === "date"
              ? "date"
              : field.type === "url"
                ? "url"
                : "text"
        }
        step={field.type === "decimal" ? "0.001" : field.type === "int" ? "1" : undefined}
        min={field.type === "year" ? 1900 : field.type === "decimal" || field.type === "int" ? 0 : undefined}
        max={field.type === "year" ? 2100 : undefined}
        required={field.required}
        maxLength={field.type === "text" ? 240 : field.type === "url" ? 500 : undefined}
        defaultValue={current === null || current === undefined ? "" : String(current)}
        placeholder={field.placeholder}
        className="field mt-2.5"
      />
      {hint}
    </div>
  );
}

/**
 * A dropdown, with "Other" opening a box for anything it does not list.
 *
 * Only one of the two carries the field's name at a time, so the form sends
 * exactly one value: the choice, or what was typed once "Other" is picked. A
 * stored value the list does not name opens on "Other" with it typed in, so
 * editing an old record never silently changes what it said.
 */
function OptionField({ id, field, current }: { id: string; field: Field; current: string }) {
  const options = field.options ?? [];
  const known = current === "" || options.includes(current);
  const [choice, setChoice] = useState<string>(
    known ? current : field.other ? OTHER : current,
  );
  const typing = choice === OTHER;

  return (
    <>
      <select
        id={id}
        name={typing ? undefined : field.name}
        required={field.required && !typing}
        value={choice}
        onChange={(event) => setChoice(event.currentTarget.value)}
        className="field mt-2.5"
      >
        <option value="" disabled={field.required}>
          {field.required ? "Pick one" : "Not saying"}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {!known && !field.other ? <option value={current}>{current}</option> : null}
        {field.other ? <option value={OTHER}>Other</option> : null}
      </select>
      {typing ? (
        <input
          name={field.name}
          type="text"
          required={field.required}
          maxLength={240}
          defaultValue={known ? "" : current}
          placeholder="Type it in"
          aria-label={`${field.label}, in your own words`}
          autoFocus={known}
          className="field mt-2.5"
        />
      ) : null}
    </>
  );
}
