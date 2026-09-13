import { FlaskConical } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PlaceholderNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 border border-dashed border-fg-muted/30 bg-ink-2/60 px-4 py-3 text-sm text-fg-muted",
        className
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
