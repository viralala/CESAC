/**
 * What each chapter actually collects.
 *
 * One description, read by both the form that draws the fields and the action
 * that validates them, so the two cannot drift apart. The deck decides these:
 * Chapter I takes an image, a video and the prompt log; Chapter II takes a
 * single system prompt and nothing else; Chapter III takes a build and a
 * pitch.
 */
export type FieldKind = "text" | "textarea" | "url";

export type HandInField = {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  required: boolean;
  maxLength: number;
  placeholder?: string;
};

export type HandIn = {
  chapterId: string;
  /** Files are part of the hand-in for chapters that take them. */
  accepts: { images: boolean; video: boolean; docs: boolean };
  fileHint?: string;
  fields: readonly HandInField[];
};

export const HAND_INS: Record<string, HandIn> = {
  "vision-forge": {
    chapterId: "vision-forge",
    accepts: { images: true, video: true, docs: false },
    fileHint: "One still and one 10 to 15 second video. PNG, JPEG or WebP, and MP4 or WebM.",
    fields: [
      {
        name: "prompt_log",
        label: "Prompt log",
        kind: "textarea",
        hint: "Every prompt you used, in order. Fewer prompts scores better, so this is the evidence.",
        required: true,
        maxLength: 8000,
        placeholder: "1. ...\n2. ...",
      },
      {
        name: "notes",
        label: "Anything the judges should know",
        kind: "textarea",
        required: false,
        maxLength: 1000,
      },
    ],
  },
  "token-trials": {
    chapterId: "token-trials",
    accepts: { images: false, video: false, docs: false },
    fields: [
      {
        name: "system_prompt",
        label: "System prompt",
        kind: "textarea",
        hint: "One prompt. Once you hand this in it is locked and cannot be edited.",
        required: true,
        maxLength: 12000,
        placeholder: "You are...",
      },
    ],
  },
  "fusion-awakening": {
    chapterId: "fusion-awakening",
    accepts: { images: true, video: true, docs: true },
    fileHint: "Screenshots, a demo recording, or a PDF of the deck. Up to 100 MB per file.",
    fields: [
      {
        name: "chits",
        label: "Your three chits",
        kind: "text",
        hint: "The user, the capability and the twist you drew.",
        required: true,
        maxLength: 300,
        placeholder: "A night-shift nurse / voice / must work offline",
      },
      {
        name: "what_it_is",
        label: "What you built",
        kind: "textarea",
        hint: "Three or four sentences. The pitch is three minutes; this is not the pitch.",
        required: true,
        maxLength: 2000,
      },
      {
        name: "repo_url",
        label: "Repository or project link",
        kind: "url",
        required: false,
        maxLength: 500,
        placeholder: "https://github.com/...",
      },
      {
        name: "demo_url",
        label: "Live demo link",
        kind: "url",
        required: false,
        maxLength: 500,
        placeholder: "https://...",
      },
    ],
  },
};

export function handInFor(chapterId: string): HandIn | null {
  return HAND_INS[chapterId] ?? null;
}

/** Accepted upload types, as an accept attribute and as a guard. */
export function acceptAttribute(handIn: HandIn): string {
  const types: string[] = [];
  if (handIn.accepts.images) types.push("image/png", "image/jpeg", "image/webp", "image/avif");
  if (handIn.accepts.video) types.push("video/mp4", "video/webm", "video/quicktime");
  if (handIn.accepts.docs) types.push("application/pdf", "application/zip", "text/plain");
  return types.join(",");
}

export function kindOf(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "doc";
  return "other";
}

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
