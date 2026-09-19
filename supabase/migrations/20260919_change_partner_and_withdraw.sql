-- ============================================================
-- Changing your mind about who you entered with.
--
-- An entry names a partner and, until this, named them permanently. The only
-- way out of a typo or a partner who dropped was to find an organiser and
-- have them edit the row, which is a support queue for something the student
-- can safely do themselves.
--
-- Two ways out, and the line between them is the money:
--
--   change_event_partner  swaps the partner, keeping the entry and anything
--                         paid against it.
--   withdraw_event_entry  gives up the entry entirely, which frees both
--                         people to enter again with somebody else.
--
-- Both refuse once the fee is verified. That is the whole rule. A paid entry
-- is a seat somebody has been charged for, and letting it be rewritten
-- afterwards means a refund conversation the site cannot have. Once paid, an
-- organiser handles it.
--
-- The partner rules are the same ones register_for_event applies, repeated
-- rather than shared because they are checked against a different row and
-- factoring them into a helper would hide which of the two is being enforced
-- when one of them changes.
--
-- Idempotent and re-runnable.
-- ============================================================


-- ------------------------------------------------------------
-- Swap the partner on an entry.
--
-- The entry keeps its id, its place and its Razorpay order, so a student who
-- has a checkout half open does not lose it. Only the name changes.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.change_event_partner(
    p_registration_id UUID,
    p_partner_email   TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg        public.event_registrations;
    ev         public.dept_events;
    me         public.profiles;
    mate       public.profiles;
    mate_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.' USING errcode = 'P0001';
    END IF;

    SELECT * INTO me FROM public.profiles WHERE id = auth.uid();

    SELECT * INTO reg FROM public.event_registrations
     WHERE id = p_registration_id FOR UPDATE;

    IF reg.id IS NULL OR reg.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'That is not your entry.' USING errcode = 'P0001';
    END IF;

    IF reg.status <> 'registered' THEN
        RAISE EXCEPTION 'That entry has been withdrawn.' USING errcode = 'P0001';
    END IF;

    -- The line. Everything above this is about whose entry it is; this is
    -- about whether it has been paid for.
    IF reg.payment_status = 'verified' THEN
        RAISE EXCEPTION 'The fee is paid, so this entry is settled. Ask an organiser to change it.'
            USING errcode = 'P0001';
    END IF;

    SELECT * INTO ev FROM public.dept_events WHERE slug = reg.event_slug;

    IF ev.state <> 'open' THEN
        RAISE EXCEPTION 'Entries for % are not open, so it cannot be changed.', ev.name
            USING errcode = 'P0001';
    END IF;

    IF ev.team_size <> 2 THEN
        RAISE EXCEPTION 'This one is entered on your own. There is no partner to change.'
            USING errcode = 'P0001';
    END IF;

    mate_email := lower(btrim(coalesce(p_partner_email, '')));

    IF mate_email = '' THEN
        RAISE EXCEPTION 'Give the new partner''s email address.' USING errcode = 'P0001';
    END IF;

    IF mate_email !~ '^[a-z0-9._%+-]+@vit\.edu$' THEN
        RAISE EXCEPTION 'A partner has to use their VIT address, the one ending in @vit.edu.'
            USING errcode = 'P0001';
    END IF;

    IF mate_email = lower(me.email) THEN
        RAISE EXCEPTION 'Your partner has to be somebody other than you.' USING errcode = 'P0001';
    END IF;

    SELECT * INTO mate FROM public.profiles WHERE lower(email) = mate_email;

    IF mate.id IS NULL THEN
        RAISE EXCEPTION 'No account on this site uses %. Check the spelling with them.', mate_email
            USING errcode = 'P0001';
    END IF;

    IF mate.id = reg.partner_id THEN
        RAISE EXCEPTION '% is already your partner.', mate_email USING errcode = 'P0001';
    END IF;

    -- Any other live entry, theirs or somebody else's naming them. This
    -- entry is excluded so the check does not trip over itself.
    IF EXISTS (
        SELECT 1 FROM public.event_registrations r
         WHERE r.event_slug = reg.event_slug
           AND r.id <> reg.id
           AND r.status = 'registered'
           AND (r.student_id = mate.id OR r.partner_id = mate.id)
    ) THEN
        RAISE EXCEPTION '% is already entered for this one.', mate_email USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET partner_id = mate.id,
           updated_at = now()
     WHERE id = reg.id;

    PERFORM public.audit('event_entry.partner_changed', 'registration', reg.id::text,
        jsonb_build_object(
            'event_slug', reg.event_slug,
            'from',       reg.partner_id,
            'to',         mate.id
        ));
END;
$function$;


-- ------------------------------------------------------------
-- Give up an entry.
--
-- Leaves the row rather than deleting it, because register_for_event upserts
-- onto a withdrawn row and that is what lets the student enter again without
-- an organiser unpicking anything.
--
-- The Razorpay order id is cleared on the way out, and that matters. Without
-- it, a checkout window left open from before the withdrawal could still come
-- back with a valid signature and confirm a fee against an entry nobody
-- holds. Cleared, that confirmation finds nothing and says so.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_event_entry(p_registration_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.' USING errcode = 'P0001';
    END IF;

    SELECT * INTO reg FROM public.event_registrations
     WHERE id = p_registration_id FOR UPDATE;

    IF reg.id IS NULL OR reg.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'That is not your entry.' USING errcode = 'P0001';
    END IF;

    IF reg.status <> 'registered' THEN
        RAISE EXCEPTION 'That entry is already withdrawn.' USING errcode = 'P0001';
    END IF;

    IF reg.payment_status = 'verified' THEN
        RAISE EXCEPTION 'The fee is paid, so this entry is settled. Ask an organiser to withdraw it.'
            USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET status            = 'withdrawn',
           partner_id        = NULL,
           razorpay_order_id = NULL,
           updated_at        = now()
     WHERE id = reg.id;

    PERFORM public.audit('event_entry.withdrawn_by_student', 'registration', reg.id::text,
        jsonb_build_object('event_slug', reg.event_slug, 'partner_was', reg.partner_id));
END;
$function$;


GRANT EXECUTE ON FUNCTION public.change_event_partner(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_event_entry(UUID) TO authenticated;
