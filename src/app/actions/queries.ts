"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { TOPICS } from "@/lib/console/options";
import { createClient } from "@/lib/supabase/server";

export type QueryState = {
  error?: string;
  notice?: string;
  field?: "topic" | "subject" | "body";
};

const KNOWN = new Set<string>(TOPICS.map((t) => t.value));

/**
 * Ask the committee something, in writing.
 *
 * A question sent here has an author, a date and its answer in the same place,
 * which is the whole point: the alternative is a group chat where the same
 * thing gets answered eleven times and the answer is gone by Tuesday.
 *
 * Nothing about a question can be edited afterwards, by anybody, which is why
 * there is no update policy for students on the table. A thread somebody can
 * rewrite is not a record.
 */
export async function askQuestion(_state: QueryState, formData: FormData): Promise<QueryState> {
  const viewer = await requireParticipant();

  const topic = String(formData.get("topic") ?? "");
  if (!KNOWN.has(topic)) return { error: "Pick what this is about.", field: "topic" };

  const subject = String(formData.get("subject") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (subject.length < 4) {
    return { error: "Give it a one-line subject.", field: "subject" };
  }

  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 4000);
  if (body.length < 10) {
    return { error: "Say a little more, so it can be answered properly.", field: "body" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("queries")
    .insert({ author_id: viewer.id, topic, subject, body });

  if (error) {
    // The five-open-questions ceiling is a database trigger, so its wording
    // arrives here already written for a student.
    if (error.code === "23514") return { error: error.message };
    console.error("query insert failed", error);
    return { error: "That did not send. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/queries");
  return { notice: "Sent. It is below, and the answer appears in the same place." };
}
