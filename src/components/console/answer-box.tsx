"use client";

import { useId, useRef } from "react";

import { answerQuestion } from "@/app/actions/verify";
import { ActionForm } from "@/components/console/action-form";
import { PendingFields } from "@/components/console/pending-fields";
import { CANNED_ANSWERS } from "@/lib/console/options";

/**
 * The answer box, with the standard replies sitting under it.
 *
 * Used by the organiser's desk and the verifier's alike. The action behind it
 * is answerQuestion, which is one `security definer` function in the database
 * that decides whether the caller may answer at all, so this component needs
 * no opinion about which of them is holding it.
 *
 * A client component for one reason: the canned replies have to reach the
 * textarea, and that is a click handler. Everything else is the console's
 * ordinary ActionForm, so the pending state, the error sentence and the
 * submit button behave the way they do on every other control.
 *
 * The textarea is uncontrolled and written through a ref rather than held in
 * React state. The form reads the field's own value on submit, so state here
 * would be a second copy of a box somebody is mid-sentence in, re-rendering
 * the card on every keystroke to keep the copy honest, and buying nothing.
 *
 * A standard reply is appended rather than dropped on top of what is already
 * there. Replacing would be tidier to read and would throw away a half
 * written answer on a misclick, which is the one thing the box must never do;
 * appending also lets two of them be stacked, which is what the reply to a
 * question about a fee and a partner in the same breath actually looks like.
 */
export function AnswerBox({ queryId, answer }: { queryId: string; answer: string | null }) {
  const box = useRef<HTMLTextAreaElement>(null);
  const uid = useId();

  function drop(text: string) {
    const field = box.current;
    if (!field) return;

    const sofar = field.value.trim();
    field.value = sofar ? `${sofar}\n\n${text}` : text;

    // Put the caret at the end, so the organiser can carry straight on typing
    // rather than hunting for the bottom of what was just pasted in.
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }

  return (
    <ActionForm
      action={answerQuestion}
      submit={answer ? "Save the correction" : "Send the answer"}
      pendingLabel="Sending"
      tone="lime"
    >
      <input type="hidden" name="query_id" value={queryId} />

      <PendingFields>
        <label htmlFor={`${uid}-answer`} className="label block text-ink">
          {answer ? "The answer, as it stands" : "The answer"}
        </label>
        <textarea
          id={`${uid}-answer`}
          ref={box}
          name="answer"
          required
          rows={4}
          maxLength={4000}
          defaultValue={answer ?? ""}
          placeholder="Written to the student, in the words you would use at the desk."
          className="field mt-2.5 min-h-[6rem] resize-y rounded-[var(--r-md)] py-3 leading-relaxed"
        />

        <p className="label-sm mt-5 text-muted">Standard replies</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CANNED_ANSWERS.map((reply) => (
            <button
              key={reply.label}
              type="button"
              onClick={() => drop(reply.text)}
              title={reply.text}
              className="label-sm rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-muted transition-colors hover:border-teal hover:text-teal"
            >
              {reply.label}
            </button>
          ))}
        </div>
        <p className="serif-it mt-2.5 text-[0.85rem] leading-relaxed text-muted">
          These land in the box rather than going to the student, so read one over and change
          whatever does not fit before you send it.
        </p>
      </PendingFields>
    </ActionForm>
  );
}
