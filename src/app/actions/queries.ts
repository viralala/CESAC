"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

export type QueryState = {
  error?: string;
  notice?: string;
  field?: "subject" | "body";
};

/**
 * What every question is filed under now.
 *
 * The form used to open on a six-way "what is it about" dropdown, and it was
 * asked to go: the student types a title in their own words instead, which
 * says more than a bucket did. `queries.topic` is still a column with a check
 * constraint on it, and the rows asked before this still carry their bucket,
 * so the column stays and a new question lands on the one value that means
 * "no bucket". Sent from here rather than left to a column default, so this
 * works whether or not the database has been given one.
 */
const TOPIC = "other";

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

  const subject = String(formData.get("subject") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (subject.length < 4) {
    return { error: "Give it a one-line title.", field: "subject" };
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
    .insert({ author_id: viewer.id, topic: TOPIC, subject, body });

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
