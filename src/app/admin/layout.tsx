import { AdminArea } from "@/components/console/admin-area";
import { ConsoleBar } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { getMyCaps } from "@/lib/auth/caps";
import { navFor } from "./nav";

/**
 * The organiser console's chrome.
 *
 * It used to be rendered by every page, which is why the console felt slow:
 * clicking a nav link threw the whole screen away, including the bar that had
 * just been clicked, and put nothing back until the server had finished every
 * query the next page asked for. That is three to five seconds of blank page
 * on a console whose pages count rows across the whole department.
 *
 * In a layout it survives navigation. Next.js keeps a shared layout mounted
 * and interactive while the segment below it loads, so the bar stays, the nav
 * stays clickable, and loading.tsx next to this file fills the content area in
 * the meantime. The click now looks instant even when the data behind it is
 * not.
 *
 * requireAdmin is called here for the bar, and again by every page inside it.
 * That is on purpose and not an oversight, and it is the same arrangement the
 * student console uses: a guard that lives only in a layout is a guard a page
 * added later can quietly miss. getViewer is cached per request, so the two
 * calls are one query.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [viewer, caps] = await Promise.all([requireAdmin(), getMyCaps()]);

  return (
    <>
      <ConsoleBar viewer={viewer} area={<AdminArea />} nav={navFor(caps)} />
      {children}
    </>
  );
}
