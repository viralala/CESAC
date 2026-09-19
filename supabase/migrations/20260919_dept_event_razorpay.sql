-- ============================================================
-- Paying for a department event entry, online, without an organiser.
--
-- Entering an event was already possible. Paying for it was not, in any way
-- the site could see: the student paid by UPI somewhere else or handed cash
-- across a desk, typed the reference into a box, and the entry sat at
-- 'submitted' until an organiser agreed the money had arrived. That is two
-- people's attention per entry and a reconciliation job on the morning of
-- the event.
--
-- This replaces it with a checkout. The student scans a QR in the Razorpay
-- window, Razorpay signs the result, the server checks the signature against
-- the key secret, and the entry goes straight to 'verified'. Nobody has to
-- agree with it afterwards, because the signature is the agreement.
--
-- The thing that makes that safe is where the confirmation is allowed to
-- come from. confirm_event_razorpay_payment refuses anything that is not the
-- service role, and the service role key only exists on the server. A
-- signed-in student calling this function directly, with a real order id and
-- an invented payment id, is refused by Postgres before any of the rest of
-- it runs. That is deliberately not a check in the application: an
-- application check is a promise the console makes, and the console is the
-- thing an attacker is already talking to.
--
-- The old submit_event_payment is left in place and unused by the student
-- console. It is how an organiser still records a payment that arrived some
-- other way, which is a real situation and not the same as offering a desk.
--
-- Idempotent and re-runnable.
-- ============================================================


-- ------------------------------------------------------------
-- Where the Razorpay side of an entry is kept.
--
-- The signature is stored rather than thrown away once checked. If a student
-- ever disputes a charge, the row has to carry the three things Razorpay
-- will ask about, and reconstructing the signature later is not possible
-- because it is keyed with a secret that may have been rotated by then.
-- ------------------------------------------------------------
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_signature  TEXT;

-- One order belongs to one entry. The confirmation arrives knowing only the
-- order id, so this is what makes that lookup unambiguous rather than "the
-- most recent row that happens to match".
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_razorpay_order_key
    ON public.event_registrations (razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL;


-- ------------------------------------------------------------
-- Record that a checkout has been opened for an entry.
--
-- Runs as the student, so it can be strict about whose entry it is without
-- being told. Everything it refuses is something the checkout should never
-- have been offered for, so the messages are written for a student who has
-- somehow got there anyway rather than for a developer.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_event_razorpay_order(
    p_registration_id UUID,
    p_order_id        TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
    fee INTEGER;
BEGIN
    IF char_length(btrim(coalesce(p_order_id, ''))) < 6 THEN
        RAISE EXCEPTION 'That checkout did not open properly. Try again.' USING errcode = 'P0001';
    END IF;

    -- auth.uid() is NULL for an unauthenticated caller, and "student_id <>
    -- NULL" is NULL rather than true, so a plain <> here would fall straight
    -- through the ownership check for anyone holding the anon key. IS
    -- DISTINCT FROM is the comparison that answers rather than abstains.
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.' USING errcode = 'P0001';
    END IF;

    SELECT * INTO reg FROM public.event_registrations WHERE id = p_registration_id;

    IF reg.id IS NULL OR reg.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'That is not your entry.' USING errcode = 'P0001';
    END IF;

    IF reg.status <> 'registered' THEN
        RAISE EXCEPTION 'That entry has been withdrawn.' USING errcode = 'P0001';
    END IF;

    IF reg.payment_status = 'verified' THEN
        RAISE EXCEPTION 'That entry is already paid up.' USING errcode = 'P0001';
    END IF;

    SELECT fee_inr INTO fee FROM public.dept_events WHERE slug = reg.event_slug;
    IF coalesce(fee, 0) = 0 THEN
        RAISE EXCEPTION 'There is nothing to pay for this one.' USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET razorpay_order_id = btrim(p_order_id),
           updated_at        = now()
     WHERE id = p_registration_id;

    PERFORM public.audit('event_payment.order_started', 'registration', p_registration_id::text,
        jsonb_build_object('event_slug', reg.event_slug, 'order_id', btrim(p_order_id)));
END;
$function$;


-- ------------------------------------------------------------
-- Mark an entry paid, on the strength of a signature the server has already
-- checked.
--
-- Service role only, and that is the whole security model. By the time this
-- runs the application has recomputed HMAC-SHA256 of "order_id|payment_id"
-- with the key secret and compared it in constant time; this function's job
-- is to make sure nothing else can reach the same UPDATE.
--
-- Idempotent on purpose. A student who double-clicks, a retried request, or
-- a webhook added later must all land on the same row without a second audit
-- entry claiming the fee was paid twice.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_event_razorpay_payment(
    p_order_id   TEXT,
    p_payment_id TEXT,
    p_signature  TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
BEGIN
    -- IS DISTINCT FROM, not <>. auth.role() is NULL for a caller with no JWT
    -- claims at all, and "NULL <> 'service_role'" is NULL rather than true,
    -- so a plain <> would wave that caller straight through. The REVOKE at
    -- the bottom of this file is what actually keeps students out; this is
    -- the second lock, and a second lock that abstains is not one.
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Not allowed.' USING errcode = '42501';
    END IF;

    SELECT * INTO reg
      FROM public.event_registrations
     WHERE razorpay_order_id = btrim(p_order_id)
       FOR UPDATE;

    IF reg.id IS NULL THEN
        RAISE EXCEPTION 'No entry was waiting on that order.' USING errcode = 'P0001';
    END IF;

    -- Already done. Say which entry it was and change nothing else.
    IF reg.payment_status = 'verified' THEN
        RETURN reg.id;
    END IF;

    UPDATE public.event_registrations
       SET payment_status      = 'verified',
           payment_method      = 'razorpay',
           payment_reference   = btrim(p_payment_id),
           razorpay_payment_id = btrim(p_payment_id),
           razorpay_signature  = btrim(p_signature),
           submitted_at        = coalesce(submitted_at, now()),
           verified_at         = now(),
           -- Nobody verified this. Razorpay did, and the column points at
           -- profiles, so it stays empty rather than naming a person who was
           -- not involved.
           verified_by         = NULL,
           updated_at          = now()
     WHERE id = reg.id;

    PERFORM public.audit('event_payment.razorpay_verified', 'registration', reg.id::text,
        jsonb_build_object(
            'event_slug', reg.event_slug,
            'order_id',   btrim(p_order_id),
            'payment_id', btrim(p_payment_id)
        ));

    RETURN reg.id;
END;
$function$;


-- ------------------------------------------------------------
-- Who may call these.
--
-- The internal auth.role() check above is the one that actually holds, but a
-- SECURITY DEFINER function is executable by PUBLIC unless told otherwise,
-- and leaving a function that marks fees paid callable by every signed-in
-- student is not something to rely on a single IF for.
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.confirm_event_razorpay_payment(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_event_razorpay_payment(TEXT, TEXT, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.start_event_razorpay_order(UUID, TEXT) TO authenticated;


-- ------------------------------------------------------------
-- The same hole, in the function next door.
--
-- submit_event_payment is how an entry was paid for before this migration
-- and it guards ownership with "reg.student_id <> auth.uid()". For a caller
-- with no session that comparison is NULL, the IF does not fire, and the
-- function carries on to mark somebody else's entry submitted. Reaching it
-- needs a registration id, which is a uuid and not guessable, so this was
-- not an open door; it was a door with the lock fitted the wrong way round.
--
-- Rewritten rather than dropped, because an organiser still records the
-- occasional payment that arrived some other way.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_event_payment(
    p_registration_id UUID,
    p_method          public.payment_method,
    p_reference       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reg public.event_registrations;
    fee INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.' USING errcode = 'P0001';
    END IF;

    SELECT * INTO reg FROM public.event_registrations WHERE id = p_registration_id;
    IF reg.id IS NULL OR reg.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'That is not your entry.' USING errcode = 'P0001';
    END IF;

    SELECT fee_inr INTO fee FROM public.dept_events WHERE slug = reg.event_slug;
    IF coalesce(fee, 0) = 0 THEN
        RAISE EXCEPTION 'There is nothing to pay for this one.' USING errcode = 'P0001';
    END IF;

    IF reg.payment_status = 'verified' THEN
        RAISE EXCEPTION 'That entry is already paid up.' USING errcode = 'P0001';
    END IF;

    IF p_method NOT IN ('upi', 'cash') THEN
        RAISE EXCEPTION 'Record a UPI reference or pay at the desk.' USING errcode = 'P0001';
    END IF;

    IF btrim(coalesce(p_reference, '')) = '' THEN
        RAISE EXCEPTION 'Put in the reference from your payment.' USING errcode = 'P0001';
    END IF;

    UPDATE public.event_registrations
       SET payment_status    = 'submitted',
           payment_method    = p_method,
           payment_reference = btrim(p_reference),
           submitted_at      = now()
     WHERE id = p_registration_id;
END;
$function$;
