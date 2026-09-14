import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { homeFor } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every sign-in that leaves the site comes back to.
 *
 * Three arrivals land here: an OAuth provider returning a `code`, an email
 * confirmation or password reset returning a `token_hash`, and a provider
 * refusing with an `error`. All three end at a page that explains itself
 * rather than a blank screen.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");

  // Only same-origin paths are honoured, so a crafted next cannot bounce a
  // freshly signed-in visitor off the site with their session in tow.
  const requested = searchParams.get("next") ?? "";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : null;

  if (providerError) {
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(providerError)}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(error.message)}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent("That link has expired. Ask for a new one.")}`,
      );
    }
  } else {
    return NextResponse.redirect(`${origin}/signin`);
  }

  if (next) return NextResponse.redirect(`${origin}${next}`);

  // No target given, so send them wherever their role belongs. The profile
  // row is written by trigger the moment the account appears; on the rare
  // race where it has not landed, the participant console is the right guess.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  return NextResponse.redirect(`${origin}${homeFor(profile?.role ?? "participant")}`);
}
