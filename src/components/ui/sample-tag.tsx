import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Marks content that is illustrative placeholder data rather than real CESAC
 * content, per the build brief's rule against unmarked fabricated content.
 */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border border-dashed border-fg-muted/40 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-fg-muted",
        className
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      Sample content
    </span>
  );
}
