import type { Metadata } from "next";

import { QueryDesk } from "@/components/console/query-desk";
import { Panel } from "@/components/console/shell";
import { requireParticipant } from "@/lib/auth/guard";
import { getMyQueries } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Questions",
  robots: { index: false, follow: false },
};

/**
 * Ask the committee something, and read what they said, in the same place.
 *
 * Only the student who asked and the committee can read a question. Nothing
 * here is a forum and nothing is public.
 */
export default async function QueriesPage() {
  await requireParticipant();

  const queries = await getMyQueries();
  const waiting = queries.filter((query) => query.status === "open").length;

  return (
    <Panel
      eyebrow="Ask us"
      title="Questions"
      aside={waiting ? `${waiting} waiting` : undefined}
    >
      <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
        Anything about your record, an entry, a payment or signing in. Only you and the committee
        can read what you send, and the answer arrives on this page rather than in your inbox.
      </p>

      <QueryDesk queries={queries} />
    </Panel>
  );
}
