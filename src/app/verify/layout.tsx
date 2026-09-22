import { ConsoleBar } from "@/components/console/shell";
import { requireVerifier } from "@/lib/auth/guard";

/**
 * The verifier's chrome.
 *
 * One nav entry, because there is one thing to do here. The bar sits in a
 * layout for the same reason the organiser's does: Next keeps a shared layout
 * mounted and interactive while the segment under it loads, so a click keeps
 * the bar and swaps only the middle.
 *
 * requireVerifier is called here and again by the page, which is deliberate
 * and not an oversight: a guard that lives only in a layout is a guard a page
 * added later can quietly miss. getViewer is cached per request, so the two
 * calls are one query.
 */
export default async function VerifyLayout({ children }: LayoutProps<"/verify">) {
  const viewer = await requireVerifier();

  return (
    <>
      <ConsoleBar viewer={viewer} area="Checking" nav={[{ href: "/verify", label: "The queue" }]} />
      {children}
    </>
  );
}
