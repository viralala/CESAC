-- ============================================================
-- Make the per-IP half of the sign-in throttle survive the registration
-- window.
--
-- The per-address half is untouched and is the one that actually protects an
-- account: ten failures on one address in fifteen minutes and that address
-- waits. Nothing here changes it.
--
-- The per-IP half was written for "a whole lecture hall can share one campus
-- NAT address" and sized at sixty failed attempts. The population it now
-- faces is the whole department: 1,871 accounts, 1,864 of them still holding
-- the password they were imported with, all about to sign in for the first
-- time in the same few days, from behind one campus NAT. Sixty failures is
-- perhaps sixty confused students, after which every student on campus is
-- locked out for fifteen minutes, including the ones typing the right
-- password. That is worse than the attack it prevents, and it would arrive
-- exactly when nobody is watching.
--
-- Two changes, both about the signal rather than the number.
--
-- Count distinct addresses rather than attempts. "One source working through
-- many addresses" is what the rule is for and what this now measures. One
-- student retrying ten times is one address, and the per-address rule already
-- has them.
--
-- Then look at whether that source is also succeeding. This is what separates
-- the two cases an IP alone cannot: a campus mid-rush produces failures and
-- successes together, because most people do know their password. A sprayer
-- working a list produces failures and almost nothing else. The lockout needs
-- both a broad spread of addresses and a near-absence of successes.
--
-- On a shared campus NAT this rule is close to inert by design, and that is
-- the honest trade. It is a backstop against a source that is plainly only
-- guessing, not a general rate limit. The per-address rule and Supabase Auth's
-- own limits are what hold otherwise.
--
-- Verified against three scenarios before shipping: 200 failing addresses
-- with 120 successes from one IP is allowed, 200 failing addresses with no
-- successes is throttled, and ten failures on one address is still throttled.
-- ============================================================

CREATE OR REPLACE FUNCTION public.login_throttle_check(p_email TEXT, p_ip TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  key_email  text := lower(trim(coalesce(p_email, '')));
  window_ago timestamptz := now() - interval '15 minutes';
  last_ok    timestamptz;
  by_email   integer;
  spread     integer;
  wins       integer;
  newest     timestamptz;
begin
  if key_email = '' then return 0; end if;

  select max(attempted_at) into last_ok
    from public.login_attempts
   where email = key_email and succeeded;

  select count(*), max(attempted_at) into by_email, newest
    from public.login_attempts
   where email = key_email
     and not succeeded
     and attempted_at > greatest(window_ago, coalesce(last_ok, window_ago));

  -- Ten tries on one address in a quarter of an hour is well past a person
  -- who has forgotten which password they set. Unchanged.
  if by_email >= 10 then
    return greatest(1, ceil(extract(epoch from (newest + interval '15 minutes' - now())))::integer);
  end if;

  -- One source working through many addresses, and getting nowhere.
  if p_ip is not null and p_ip <> '' then
    select count(distinct email), max(attempted_at) into spread, newest
      from public.login_attempts
     where ip = p_ip and not succeeded and attempted_at > window_ago;

    select count(*) into wins
      from public.login_attempts
     where ip = p_ip and succeeded and attempted_at > window_ago;

    if spread >= 80 and wins * 4 < spread then
      return greatest(1, ceil(extract(epoch from (newest + interval '15 minutes' - now())))::integer);
    end if;
  end if;

  return 0;
end;
$function$;

REVOKE ALL ON FUNCTION public.login_throttle_check(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_throttle_check(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.login_throttle_check(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.login_throttle_check(TEXT, TEXT) TO service_role;
