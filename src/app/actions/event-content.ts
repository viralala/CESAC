"use server";

import { revalidatePath } from "next/cache";

import type { AdminState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth/guard";
import { EVENT_SCHEMAS, type Row } from "@/lib/data/event-content-schema";
import { refreshPublicData } from "@/lib/data/public-cache";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function refresh(href: string): void {
  refreshPublicData();
  revalidatePath(href);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/faq");
  revalidatePath("/dashboard/events");
}

function tidy(raw: string, max: number): string {
  return raw.replace(/\r\n/g, "\n").trim().slice(0, max);
}

/**
 * Save one section of a running event's page.
 *
 * One section per form, so an organiser correcting a prize does not send the
 * whole page back and cannot overwrite a chapter somebody else changed a
 * minute ago. The fields read are the schema's and nothing else, so a
 * hand-made request cannot store a key the pages would never print. The
 * database checks the Events capability again before it writes.
 */
export async function saveEventSection(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const schema = EVENT_SCHEMAS[slug];
  const section = schema?.sections.find((s) => s.key === String(formData.get("section") ?? ""));
  if (!schema || !section) return { error: "That part of the page is not on the form any more. Reload it." };

  const readField = (name: string, field: (typeof section.fields)[number]) => {
    const raw = String(formData.get(name) ?? "");
    const max = field.max ?? 240;
    if (field.lines) {
      return raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((line) => line.slice(0, 240));
    }
    return tidy(raw, max);
  };

  const problems: string[] = [];
  const check = (field: (typeof section.fields)[number], value: string | string[]) => {
    if (typeof value !== "string" || !value) return;
    if (field.kind === "url" && !/^https:\/\/\S+$/.test(value)) {
      problems.push(`${field.label} has to be a full link starting with https://.`);
    }
    if (field.kind === "url" && /\/edit(\?|#|$)/.test(value)) {
      problems.push(`${field.label} ends in /edit, which would hand every student the form itself.`);
    }
    if (field.kind === "number" && !/^\d+(\.\d+)?$/.test(value)) {
      problems.push(`${field.label} has to be a number.`);
    }
  };

  let value: Row | Row[];
  if (section.shape === "object") {
    const row: Row = {};
    for (const field of section.fields) {
      row[field.key] = readField(`f.${field.key}`, field);
      check(field, row[field.key]);
    }
    value = row;
  } else {
    const count = Math.min(Number(formData.get("rows") ?? 0) || 0, (section.max ?? 12) + 1);
    const rows: Row[] = [];
    for (let i = 0; i < count; i++) {
      if (formData.get(`r.${i}.__remove`) === "on") continue;
      const row: Row = {};
      for (const field of section.fields) {
        row[field.key] = readField(`r.${i}.${field.key}`, field);
        check(field, row[field.key]);
      }
      const empty = Object.values(row).every((v) => (Array.isArray(v) ? v.length === 0 : !v));
      if (!empty) rows.push(row);
    }
    if (rows.length > (section.max ?? 12)) {
      return { error: `${section.label} can have at most ${section.max} entries.` };
    }
    value = rows;
  }

  if (problems.length) return { error: problems[0] };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("event_content")
    .select("content")
    .eq("slug", slug)
    .maybeSingle();

  const content = {
    ...((current?.content as Record<string, Json> | null) ?? {}),
    [section.key]: value as unknown as Json,
  };

  const { error } = await supabase.rpc("admin_save_event_content", {
    p_slug: slug,
    p_content: content,
  });
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  refresh(schema.href);
  return { notice: `Saved. ${section.label} is live on the page now.` };
}

/** Put one section back to the text in the source. */
export async function resetEventSection(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const schema = EVENT_SCHEMAS[slug];
  const section = schema?.sections.find((s) => s.key === String(formData.get("section") ?? ""));
  if (!schema || !section) return { error: "That part of the page is not on the form any more. Reload it." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_event_section", {
    p_slug: slug,
    p_section: section.key,
  });
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };

  refresh(schema.href);
  return { notice: `${section.label} is back to how it was written.` };
}
