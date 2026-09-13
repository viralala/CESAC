import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

const PATTERNS = [
  { surface: "bg-ink-3", mark: "top-0 left-0 size-3" },
  { surface: "bg-ink-2", mark: "inset-y-0 left-0 w-1.5" },
  { surface: "bg-ink-3", mark: "bottom-0 right-0 size-3" },
  { surface: "bg-ink-2", mark: "inset-x-0 top-0 h-1.5" },
] as const;

type ImagePlaceholderProps = {
  label?: string;
  pattern?: 0 | 1 | 2 | 3;
  className?: string;
  iconClassName?: string;
};

export function ImagePlaceholder({
  label = "Photography pending",
  pattern = 0,
  className,
  iconClassName,
}: ImagePlaceholderProps) {
  const { surface, mark } = PATTERNS[pattern];
  return (
    <div
      className={cn(
        "bg-dot-grid bg-grain relative flex items-center justify-center overflow-hidden",
        surface,
        className
      )}
    >
      <span aria-hidden className={cn("absolute z-[2] bg-accent", mark)} />
      <ImageOff
        className={cn("size-8 text-fg-muted/40", iconClassName)}
        strokeWidth={1.25}
        aria-hidden
      />
      {label ? (
        <span className="absolute bottom-3 left-3 z-[2] font-mono text-[10px] uppercase tracking-wider text-fg-muted/70">
          {label}
        </span>
      ) : null}
    </div>
  );
}
