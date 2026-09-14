import "server-only";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { PROVIDERS, type Provider } from "./providers";

/**
 * Which ways in are actually switched on.
 *
 * Supabase publishes this, so the sign-in page can show the buttons that work
 * rather than every button that might. Pressing a provider that is not enabled
 * would otherwise dump a student on a raw JSON error page on a domain they do
 * not recognise, and enabling one in the dashboard now lights the button up
 * within the minute without a deploy.
 *
 * Cached for a minute: this changes about three times in the life of the
 * project, and never during an event.
 */
export async function authMethods(): Promise<{ providers: Provider[]; autoConfirm: boolean }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (!response.ok) return { providers: [], autoConfirm: false };

    const settings = (await response.json()) as {
      external?: Record<string, boolean>;
      mailer_autoconfirm?: boolean;
    };

    return {
      providers: PROVIDERS.filter((id) => settings.external?.[id] === true),
      autoConfirm: settings.mailer_autoconfirm === true,
    };
  } catch {
    // An unreachable settings endpoint should cost the social buttons, not the
    // page. Email and password still work.
    return { providers: [], autoConfirm: false };
  }
}
