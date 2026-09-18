"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Disables everything inside it while the surrounding form is in flight.
 *
 * This exists because the obvious way to write it does not work. ActionForm
 * used to take `children` as a render prop so a caller could say
 * `disabled={pending}` on its own fields, and that is fine from another
 * client component and an immediate crash from a server one: a function
 * cannot cross the server/client boundary, so every render of /admin/events
 * threw "Functions cannot be passed directly to Client Components" and the
 * whole page fell over. It built and typechecked cleanly, because nothing
 * about the types said the boundary was there.
 *
 * So the pending state is read here instead of handed down. useFormStatus
 * reports on the nearest parent form, which is ActionForm's own, and a
 * disabled fieldset disables every control inside it without the caller
 * touching a single field. `display: contents` keeps the fieldset out of the
 * layout, so wrapping changes nothing about how the form looks.
 *
 * ActionForm's `children` is plain ReactNode now, so the old shape is a
 * TypeScript error rather than something that only shows up in production.
 */
export function PendingFields({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} className="contents">
      {children}
    </fieldset>
  );
}
