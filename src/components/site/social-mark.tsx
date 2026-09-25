/**
 * The three marks the site links out with: the department's LinkedIn and
 * Instagram in the footer, and a committee member's own accounts on their
 * roster page. Drawn inline at 16px and coloured by currentColor, so they sit
 * in whatever text colour the link around them has.
 */

export type SocialId = "linkedin" | "instagram" | "github";

export function SocialMark({ id }: { id: SocialId }) {
  if (id === "instagram") {
    // Drawn from shapes rather than one path, because the mark is three
    // concentric things and strokes at 16px stay legible where a filled
    // silhouette of the same glyph turns into a blob.
    return (
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4 shrink-0"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="1.45" y="1.45" width="13.1" height="13.1" rx="4" />
        <circle cx="8" cy="8" r="3.1" />
        <circle cx="11.75" cy="4.3" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (id === "github") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden fill="currentColor">
      <path d="M13.63 13.63h-2.37V9.92c0-.89-.02-2.03-1.24-2.03-1.24 0-1.43.97-1.43 1.97v3.77H6.22V6h2.28v1.04h.03c.32-.6 1.09-1.24 2.25-1.24 2.4 0 2.85 1.58 2.85 3.64v4.19ZM3.55 4.96a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76Zm1.19 8.67H2.36V6h2.38v7.63ZM14.82 0H1.18C.53 0 0 .52 0 1.16v13.68C0 15.48.53 16 1.18 16h13.64c.65 0 1.18-.52 1.18-1.16V1.16C16 .52 15.47 0 14.82 0Z" />
    </svg>
  );
}
