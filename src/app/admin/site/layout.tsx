import { Container, Label } from "@/components/aot/bits";
import { ConsoleTabs, type Tab } from "@/components/console/tabs";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { EVENT } from "@/lib/data/event";

/**
 * Everything on the site that used to need a deploy.
 *
 * Four pages rather than one, because each is a different job and one page
 * carrying all four would load the roster, the copy, the scale and the
 * showcase on every visit to change a single sentence. The capability is
 * checked here and again on each page inside: a guard that lives only in a
 * layout is a guard a page added later can quietly miss.
 */
const TABS: readonly Tab[] = [
  { href: "/admin/site", label: "Words" },
  { href: "/admin/site/roster", label: "Roster" },
  { href: "/admin/site/points", label: "Points" },
  { href: "/admin/site/showcase", label: "Front page" },
];

export default async function SiteLayout({ children }: LayoutProps<"/admin/site">) {
  await requireAdmin();
  await requireCap("content");

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">The site itself</h1>
          <p className="serif-it mt-4 text-[1.05rem] leading-relaxed text-muted">
            The roster, public wording, points and front page names, all live without a deploy.
          </p>
        </header>

        <div className="mt-8">
          <ConsoleTabs tabs={TABS} />
        </div>

        <div className="mt-7 grid gap-6">{children}</div>
      </Container>
    </div>
  );
}
