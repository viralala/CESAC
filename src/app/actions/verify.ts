"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

export type VerifyState = { error?: string; notice?: string };

const DECISIONS = new Set(["verify", "reject", "reopen"]);

/**
 * One decision on one record.
 *
 * Shared by the verifier's console and the organiser's records page, and it is
 * one function in the database rather than two here: `verify_record` checks
 * that the caller is a verifier or an organiser holding Student records,
 * writes the decision, and writes the audit entry in the same statement. Two
 * screens cannot drift apart if there is only one thing behind them, and the
 * entry cannot be skipped by using whichever screen forgot to write it.
 *
 * The guard here is only that somebody is signed in at all. Which of them may
 * decide is not a question this file can answer honestly, because the answer
 * has to hold for a request that never came through this file.
 */
export async function reviewRecord(
  _state: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in again." };

  const id = String(formData.get("certificate_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");

  if (!id) return { error: "That record is not on the page any more. Reload it." };
  if (!DECISIONS.has(decision)) {
    return { error: "A record is verified, turned down, or put back in the queue." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_record", {
    p_certificate_id: id,
    p_decision: decision,
  });

  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  revalidatePath("/verify");
  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");

  return {
    notice:
      decision === "verify"
        ? "Verified. The student sees it as checked on their own record."
        : decision === "reject"
          ? "Turned down, and out of the queue. It still counts on the ranking, and the file stays where it is."
          : "Back in the queue, with no decision on it.",
  };
}
