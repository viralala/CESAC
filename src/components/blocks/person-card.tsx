import type { TeamMember } from "@/lib/data/types";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { SampleTag } from "@/components/ui/sample-tag";

export function PersonCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col gap-4 border border-line bg-ink-2 p-5">
      <AvatarPlaceholder label={member.name ?? member.role} className="w-full" />
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-medium text-fg">{member.role}</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-fg-muted/70">
          {member.name ?? "Profile pending"}
        </p>
        <p className="text-sm leading-relaxed text-fg-muted">{member.bio}</p>
      </div>
      <SampleTag className="self-start" />
    </div>
  );
}
