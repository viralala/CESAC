import Image from "next/image";

import { Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import {
  ASSOCIATES,
  BOARD,
  DEPARTMENT,
  FACULTY,
  TEAM_TOTAL,
  VERTICALS,
} from "@/lib/data/committee";

export function initials(name: string) {
  const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Typographic name plate — no stock avatars, just an initial disc. */
export function NamePlate({ name, role }: { name: string; role?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-full bg-white py-2.5 pl-2.5 pr-5">
      <span className="label-sm grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream-2 text-ink">
        {initials(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.95rem] font-semibold leading-tight text-ink">
          {name}
        </span>
        {role ? <span className="serif-it block text-[0.8rem] text-muted">{role}</span> : null}
      </span>
    </div>
  );
}

export function Committee() {
  return (
    <section id="committee" className="washi grain relative scroll-mt-24 py-24 sm:py-32">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="The host department"
            title="Computer Engineering"
            lede={DEPARTMENT.blurb}
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* the identity plate, framed the Crypko way */}
          <Reveal>
            <div className="shell h-full">
              <div className="shell-inner flex h-full flex-col items-center justify-center bg-white px-7 py-12 text-center">
                <Image
                  src="/cesac-logo.png"
                  alt="CESAC — Computer Engineering Student Activities Committee"
                  width={320}
                  height={344}
                  className="h-auto w-[148px]"
                />
                <Label className="mt-8">{DEPARTMENT.body}</Label>
                <p className="d-tall mt-3 max-w-[20ch] text-[1.45rem] leading-tight text-ink">
                  {DEPARTMENT.expansion}
                </p>
                <p className="serif-it mt-3 text-[0.95rem] text-muted">{DEPARTMENT.institute}</p>

                <div className="mt-9 grid w-full grid-cols-2 gap-3 border-t border-ink/10 pt-7">
                  <div>
                    <p className="d-wide text-3xl leading-none text-red">{TEAM_TOTAL}</p>
                    <p className="label-sm mt-2 text-muted">Members</p>
                  </div>
                  <div>
                    <p className="d-wide text-3xl leading-none text-red">{VERTICALS.length}</p>
                    <p className="label-sm mt-2 text-muted">Verticals</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid content-start gap-10">
            <div>
              <Reveal>
                <Label>Faculty leadership</Label>
              </Reveal>
              <div className="mt-4 grid gap-3">
                {FACULTY.map((p, i) => (
                  <Reveal key={p.name} delay={i * 70}>
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[var(--r-lg)] bg-white px-7 py-6">
                      <p className="d-tall text-[1.5rem] leading-none text-ink">{p.name}</p>
                      <p className="label text-red">{p.role}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <div>
              <Reveal>
                <Label>Board of executives</Label>
              </Reveal>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {BOARD.map((name, i) => (
                  <Reveal key={name} delay={i * 45}>
                    <NamePlate name={name} role="Executive" />
                  </Reveal>
                ))}
              </div>
            </div>

            <div>
              <Reveal>
                <Label>Associate executives</Label>
              </Reveal>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ASSOCIATES.map((name, i) => (
                  <Reveal key={name} delay={i * 45}>
                    <NamePlate name={name} role="Associate executive" />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
