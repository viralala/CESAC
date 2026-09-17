"use client";

import { useActionState, useId } from "react";

import { saveStudentData, type StudentDataState } from "@/app/actions/student";
import { Notice } from "@/components/console/shell";
import type { Profile } from "@/lib/data/student";

/**
 * The four things the department needs to be able to find a student: their
 * name, their class, their PRN and a number to ring.
 *
 * The address is shown and not editable. It is the one the roster was imported
 * on, it is what the account signs in with, and the database reverts a change
 * made to it anywhere but through auth, so an editable box would be a lie.
 */
export function StudentDataForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<StudentDataState, FormData>(
    saveStudentData,
    {},
  );
  const uid = useId();

  const bad = (field: StudentDataState["field"]) => (state.field === field ? "border-red" : "");

  return (
    <form action={action} className="grid gap-5">
      <div>
        <label htmlFor={`${uid}-name`} className="label block text-ink">
          Full name
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={profile.full_name ?? ""}
          autoComplete="name"
          aria-invalid={state.field === "name" || undefined}
          className={`field mt-2.5 ${bad("name")}`}
        />
        <p className="serif-it mt-2 text-[0.85rem] text-muted">
          As it should read on a certificate.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-class`} className="label block text-ink">
            Class
          </label>
          <input
            id={`${uid}-class`}
            name="student_class"
            type="text"
            maxLength={24}
            defaultValue={profile.student_class ?? ""}
            placeholder="SY-F"
            aria-invalid={state.field === "student_class" || undefined}
            className={`field mt-2.5 ${bad("student_class")}`}
          />
          <p className="serif-it mt-2 text-[0.85rem] text-muted">
            The way the timetable writes it.
          </p>
        </div>

        <div>
          <label htmlFor={`${uid}-prn`} className="label block text-ink">
            PRN
          </label>
          <input
            id={`${uid}-prn`}
            name="prn"
            type="text"
            maxLength={20}
            defaultValue={profile.prn ?? ""}
            placeholder="12345678"
            aria-invalid={state.field === "prn" || undefined}
            className={`field mt-2.5 ${bad("prn")}`}
          />
          <p className="serif-it mt-2 text-[0.85rem] text-muted">
            Yours alone. Two accounts cannot hold the same one.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-phone`} className="label block text-ink">
          Mobile number
        </label>
        <input
          id={`${uid}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          maxLength={20}
          defaultValue={profile.phone ?? ""}
          placeholder="9876543210"
          autoComplete="tel"
          aria-invalid={state.field === "phone" || undefined}
          className={`field mt-2.5 ${bad("phone")}`}
        />
        <p className="serif-it mt-2 text-[0.85rem] text-muted">
          Ten digits. Used on event day and nowhere else.
        </p>
      </div>

      <div>
        <span className="label block text-ink">Email</span>
        <p className="field mt-2.5 bg-cream-2 text-muted [overflow-wrap:anywhere]">
          {profile.email}
        </p>
        <p className="serif-it mt-2 text-[0.85rem] text-muted">
          Fixed. This is the address the department registered you on, and the one you sign in
          with. An organiser has to change it.
        </p>
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      <button
        type="submit"
        disabled={pending}
        className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Saving" : "Save my details"}
      </button>
    </form>
  );
}
