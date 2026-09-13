import { cn } from "@/lib/utils";

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

type AvatarPlaceholderProps = {
  label: string;
  className?: string;
};

export function AvatarPlaceholder({ label, className }: AvatarPlaceholderProps) {
  return (
    <div
      className={cn(
        "bg-grain relative flex aspect-square items-center justify-center overflow-hidden bg-ink-2",
        className
      )}
    >
      <span className="font-display text-3xl font-medium text-fg-muted/50">
        {getInitials(label)}
      </span>
    </div>
  );
}
