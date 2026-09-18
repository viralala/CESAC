-- ============================================================
-- The organiser console's side of the department events.
--
-- Everything here was already a column with nothing behind it. Every event
-- sat at 'locked' and the only way to open one was to type an UPDATE into
-- the Supabase dashboard, which is not a thing to be doing at nine on the
-- morning of an event. Same for verifying an entry fee and for withdrawing
-- somebody: the columns existed, unwritten, and the console had no control.
--
-- These are security definer and check is_admin() themselves rather than
-- leaning on the admin-only write policy on the table. Two reasons: the
-- audit row is written in the same transaction as the change, so a decision
-- somebody disputes later has a record of who made it; and a console that
-- writes columns directly is a console that can be talked into writing the
-- wrong ones by a crafted request.
--
-- public.is_admin() is READ here and never replaced. 26 RLS policies across
-- 14 tables depend on it.
--
-- Idempotent and re-runnable.
-- ============================================================


-- ------------------------------------------------------------
-- Open, lock or close one event.
--
-- This is the single switch the whole student side reads: the events page,
-- the entry form and register_for_event() all gate on dept_events.state, so
-- moving this column opens or shuts everything at once.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_event_state(
    p_slug  TEXT,
    p_state public.dept_event_state
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    ev public.dept_events;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Organisers only.' USING errcode = '42501';
    END IF;

    SELECT * INTO ev FROM public.dept_events WHERE slug = p_slug;
    IF ev.slug IS NULL THEN
        RAISE EXCEPTION 'That event is not on the site.' USING errcode = 'P0001';
    END IF;

    UPDATE public.dept_events
       SET state = p_state,
           updated_by = auth.uid(),
           updated_at = now()
     WHERE slug = p_slug;

    PERFORM public.audit('event.state', 'dept_event', p_slug,
        jsonb_build_object('from', ev.state, 'to', p_state, 'name', ev.name));
END;
$function$;


-- ------------------------------------------------------------
-- Agree that an entry fee arrived, or send it back.
--
-- A student records a UPI reference and the entry sits at 'submitted' until
-- somebody checks it against the account. Nothing in the site could move it
-- off 'submitted' before this.
--
-- Rejecting puts it back to 'pending' rather than parking it at 'rejected',
-- because the student has to be able to try again, and 'rejected' is a dead
-- end with no screen that clears it. The reason goes in the audit row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_verify_event_payment(
    p_registration_id UUID,
    p_verified        BOOLEAN,
    p_reason          TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Organisers only.' USING errcode = '42501';
    END IF;

    SELECT * INTO reg FROM public.event_registrations WHERE id = p_registration_id;
    IF reg.id IS NULL THEN
        RAISE EXCEPTION 'That entry is not there any more.' USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET payment_status = CASE WHEN p_verified THEN 'verified'::public.payment_status
                                 ELSE 'pending'::public.payment_status END,
           verified_by    = CASE WHEN p_verified THEN auth.uid() ELSE NULL END,
           verified_at    = CASE WHEN p_verified THEN now() ELSE NULL END,
           updated_at     = now()
     WHERE id = p_registration_id;

    PERFORM public.audit(
        CASE WHEN p_verified THEN 'entry.payment.verified' ELSE 'entry.payment.returned' END,
        'event_registration', p_registration_id::text,
        jsonb_build_object(
            'event', reg.event_slug,
            'was', reg.payment_status,
            'reference', reg.payment_reference,
            'reason', nullif(btrim(coalesce(p_reason, '')), '')));
END;
$function$;


-- ------------------------------------------------------------
-- Withdraw an entry, or put one back.
--
-- Somebody enters the wrong partner, or drops out. The 'withdrawn' status
-- was on the table from the start with no way to set it.
--
-- A withdrawn row keeps its place rather than being deleted, so the record
-- of who entered and what they paid survives the withdrawal. Withdrawing
-- also frees both people: every check in register_for_event looks for
-- status = 'registered', so a withdrawn row blocks nobody.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_entry_status(
    p_registration_id UUID,
    p_status          public.registration_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Organisers only.' USING errcode = '42501';
    END IF;

    SELECT * INTO reg FROM public.event_registrations WHERE id = p_registration_id;
    IF reg.id IS NULL THEN
        RAISE EXCEPTION 'That entry is not there any more.' USING errcode = 'P0001';
    END IF;

    IF reg.status = p_status THEN
        RETURN;
    END IF;

    -- Putting somebody back can collide with an entry made in the meantime,
    -- by them or by a partner who named them. Say so rather than letting the
    -- unique index throw a message written for a DBA.
    IF p_status = 'registered' AND EXISTS (
        SELECT 1 FROM public.event_registrations r
         WHERE r.event_slug = reg.event_slug
           AND r.status = 'registered'
           AND r.id <> reg.id
           AND (r.student_id = reg.student_id
                OR r.partner_id = reg.student_id
                OR (reg.partner_id IS NOT NULL
                    AND (r.student_id = reg.partner_id OR r.partner_id = reg.partner_id)))
    ) THEN
        RAISE EXCEPTION 'Somebody on this entry has entered % again since it was withdrawn.',
            reg.event_slug USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET status = p_status, updated_at = now()
     WHERE id = p_registration_id;

    PERFORM public.audit(
        CASE WHEN p_status = 'withdrawn' THEN 'entry.withdrawn' ELSE 'entry.restored' END,
        'event_registration', p_registration_id::text,
        jsonb_build_object('event', reg.event_slug, 'was', reg.status));
END;
$function$;


-- ------------------------------------------------------------
-- Add an event, or change one.
--
-- A new event was an INSERT typed into the SQL editor. The slug is the key
-- and the URL both, so it is settled once and never moved: changing it would
-- orphan every entry against it, since event_registrations.event_slug points
-- at this column.
--
-- A new event is always born locked, because the column defaults to locked
-- and nothing here sets it. An event that takes entries the instant somebody
-- fills in a form is one nobody gets to check first.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_upsert_dept_event(
    p_slug       TEXT,
    p_name       TEXT,
    p_kicker     TEXT,
    p_one_liner  TEXT,
    p_when_label TEXT,
    p_fee_inr    INTEGER,
    p_team_size  INTEGER,
    p_position   INTEGER,
    p_href       TEXT DEFAULT NULL,
    p_jp         TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_slug  TEXT := lower(btrim(coalesce(p_slug, '')));
    existed BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Organisers only.' USING errcode = '42501';
    END IF;

    IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
        RAISE EXCEPTION 'The slug is lowercase letters, numbers and single hyphens: attack-on-token.'
            USING errcode = 'P0001';
    END IF;
    IF btrim(coalesce(p_name, '')) = '' THEN
        RAISE EXCEPTION 'An event needs a name.' USING errcode = 'P0001';
    END IF;
    IF coalesce(p_team_size, 1) NOT IN (1, 2) THEN
        RAISE EXCEPTION 'An event is entered solo or in pairs, so team size is 1 or 2.'
            USING errcode = 'P0001';
    END IF;
    IF coalesce(p_fee_inr, 0) < 0 THEN
        RAISE EXCEPTION 'The entry fee cannot be negative.' USING errcode = 'P0001';
    END IF;

    existed := EXISTS (SELECT 1 FROM public.dept_events d WHERE d.slug = v_slug);

    INSERT INTO public.dept_events (
        slug, name, kicker, one_liner, when_label, href, jp,
        fee_inr, team_size, position, updated_by, updated_at)
    VALUES (
        v_slug, btrim(p_name), btrim(coalesce(p_kicker, '')), btrim(coalesce(p_one_liner, '')),
        btrim(coalesce(p_when_label, '')), nullif(btrim(coalesce(p_href, '')), ''),
        nullif(btrim(coalesce(p_jp, '')), ''),
        coalesce(p_fee_inr, 0), coalesce(p_team_size, 1), coalesce(p_position, 0),
        auth.uid(), now())
    ON CONFLICT (slug) DO UPDATE
       SET name       = excluded.name,
           kicker     = excluded.kicker,
           one_liner  = excluded.one_liner,
           when_label = excluded.when_label,
           href       = excluded.href,
           jp         = excluded.jp,
           fee_inr    = excluded.fee_inr,
           team_size  = excluded.team_size,
           position   = excluded.position,
           updated_by = auth.uid(),
           updated_at = now();

    PERFORM public.audit(
        CASE WHEN existed THEN 'event.updated' ELSE 'event.created' END,
        'dept_event', v_slug, jsonb_build_object('name', btrim(p_name)));

    RETURN v_slug;
END;
$function$;


-- ------------------------------------------------------------
-- Let a withdrawn entry be made again.
--
-- register_for_event ended in `on conflict do nothing`, which is correct for
-- somebody entering twice and wrong the moment withdrawing became possible:
-- the withdrawn row stays, the insert hits it, nothing comes back, and the
-- student is told they are already entered for something they were taken off.
-- No screen could fix it.
--
-- The conflict now updates, and only where the existing row is withdrawn, so
-- a genuine double entry still gets the sentence it always got. Whatever was
-- paid is kept: somebody who paid, was withdrawn and re-entered has not
-- stopped having paid, and an organiser who wants it back at pending has the
-- returned-payment control for that.
--
-- This is the whole function re-declared rather than patched, because
-- CREATE OR REPLACE is all Postgres offers. Only the ON CONFLICT clause and
-- this comment differ from what was there.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_slug          TEXT,
    p_partner_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  ev public.dept_events;
  me public.profiles;
  mate public.profiles;
  mate_email text;
  reg_id uuid;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then
    raise exception 'Sign in first.' using errcode = 'P0001';
  end if;

  -- The same gate the rest of the app holds people at. An account still
  -- carrying its imported password is not a student who has proved anything.
  if me.must_change_password then
    raise exception 'Set your own password before entering anything.' using errcode = 'P0001';
  end if;

  select * into ev from public.dept_events where slug = p_slug;
  if ev.slug is null then
    raise exception 'That event is not on the site.' using errcode = 'P0001';
  end if;

  if ev.state = 'locked' then
    raise exception 'Entries for % are not open yet.', ev.name using errcode = 'P0001';
  elsif ev.state = 'closed' then
    raise exception 'Entries for % have closed.', ev.name using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.event_registrations r
    where r.event_slug = p_slug and r.status = 'registered' and r.partner_id = me.id
  ) then
    raise exception 'Somebody has already entered you for % as their partner.', ev.name
      using errcode = 'P0001';
  end if;

  if ev.team_size = 2 then
    mate_email := lower(btrim(coalesce(p_partner_email, '')));

    if mate_email = '' then
      raise exception 'This one is entered in pairs. Give your partner''s email address.'
        using errcode = 'P0001';
    end if;

    -- A VIT address, compulsorily. The roster on this site is the department's
    -- own, so an address outside it belongs to somebody the department cannot
    -- vouch for.
    if mate_email !~ '^[a-z0-9._%+-]+@vit\.edu$' then
      raise exception 'A partner has to use their VIT address, the one ending in @vit.edu.'
        using errcode = 'P0001';
    end if;

    if mate_email = lower(me.email) then
      raise exception 'Your partner has to be somebody other than you.' using errcode = 'P0001';
    end if;

    select * into mate from public.profiles where lower(email) = mate_email;
    if mate.id is null then
      raise exception 'No account on this site uses %. Check the spelling with them.', mate_email
        using errcode = 'P0001';
    end if;

    if exists (
      select 1 from public.event_registrations r
      where r.event_slug = p_slug
        and r.status = 'registered'
        and (r.student_id = mate.id or r.partner_id = mate.id)
    ) then
      raise exception '% is already entered for this one.', mate_email using errcode = 'P0001';
    end if;
  end if;

  insert into public.event_registrations (event_slug, student_id, partner_id, payment_status)
  values (
    p_slug,
    me.id,
    mate.id,
    -- A free event has nothing to pay, so it is not left sitting at "pending"
    -- forever waiting for a payment that will never come.
    case when ev.fee_inr > 0 then 'pending'::public.payment_status
         else 'verified'::public.payment_status end
  )
  on conflict (event_slug, student_id) do update
    set status     = 'registered',
        partner_id = excluded.partner_id,
        updated_at = now()
    where public.event_registrations.status = 'withdrawn'
  returning id into reg_id;

  if reg_id is null then
    raise exception 'You are already entered for %.', ev.name using errcode = 'P0001';
  end if;

  return reg_id;
end;
$function$;


-- ------------------------------------------------------------
-- Grants.
--
-- Creating a function grants EXECUTE to PUBLIC, and PUBLIC includes anon.
-- Every one of these refuses a non-admin on its own, but a door that is shut
-- from the inside is still a door left open. Explicit, as in the ems schema.
-- ------------------------------------------------------------
DO $grants$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname IN ('admin_set_event_state', 'admin_verify_event_payment',
                             'admin_set_entry_status', 'admin_upsert_dept_event')
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    END LOOP;
END $grants$;

-- register_for_event is a student's call and keeps the grants it had; only
-- anon is taken off, which it never needed.
REVOKE ALL ON FUNCTION public.register_for_event(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_for_event(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_for_event(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_event(TEXT, TEXT) TO service_role;


-- ------------------------------------------------------------
-- What a signed-out visitor may know about an event's state.
--
-- Added later the same day, once opening an event made the public pages
-- wrong. The home page and the events index each carry a badge per event,
-- written by hand in src/lib/data/cesac.ts. That was fine while every event
-- sat locked all year and became wrong the minute there was a control to
-- open one: registration for Attack on Token opened and both pages carried
-- on saying "Announced".
--
-- dept_events itself stays closed to anon, and should: it carries
-- updated_by, which is an organiser's user id and no visitor's business.
-- This returns the two columns the badge needs and nothing else. Which state
-- an event is in is not a secret; it is printed on the page, and a visitor
-- learns it by looking.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dept_event_states()
RETURNS TABLE (slug TEXT, state TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT d.slug, d.state::text
      FROM public.dept_events d
     ORDER BY d.position, d.name;
$function$;

REVOKE ALL ON FUNCTION public.dept_event_states() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dept_event_states() TO anon;
GRANT EXECUTE ON FUNCTION public.dept_event_states() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dept_event_states() TO service_role;
