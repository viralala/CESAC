-- ============================================================
-- CESAC EVENT MANAGEMENT SYSTEM  (schema: ems)
--
-- This is the "new things for admin and organiser" schema, ported to
-- sit beside the live database instead of on top of it.
--
-- WHY A SEPARATE SCHEMA:
--   public already holds profiles, teams, payments, event_registrations,
--   certificates, audit_log and login_attempts, with different shapes and
--   1882 live profiles behind them. Seven of the new tables collide by
--   name, and CREATE TABLE IF NOT EXISTS would have silently skipped all
--   seven, leaving functions that reference columns that do not exist.
--   Two of the new functions, public.is_admin() and public.handle_new_user(),
--   would have been overwritten by CREATE OR REPLACE; 26 live RLS policies
--   across 14 tables depend on is_admin(), so that alone would have locked
--   every organiser out of every console.
--
--   Nothing in public is created, altered or dropped by this file.
--
-- WHAT IT SHARES WITH THE LIVE DATABASE, read-only:
--   public.profiles      identity, names, PRN. No second profiles table.
--   public.certificates  the single certificate store. The analytics views
--                        at the bottom read it; ems does not copy it.
--   profiles.role        anyone who is already 'admin' or 'owner' in the
--                        live console is a committee admin here too, so the
--                        two systems never disagree about who is in charge.
--
-- WHAT IT DOES NOT DO:
--   No trigger on auth.users. Sign-up keeps working exactly as it does.
--   ems.approved_students is a list the console manages, not a gate on
--   sign-in, so none of the 1882 imported accounts can be locked out.
--
-- FIXED WHILE PORTING (see NOTE comments at each site):
--   can_participate_in_event was LANGUAGE sql with a plpgsql body, which
--   Postgres rejects at CREATE time. Now plpgsql.
--   register_team counted only 'registered' teams against max_teams, so a
--   paid event could oversell every seat still sitting in payment_pending.
--   create_payment_record required auth.uid(), which service role does not
--   have, so the backend could never call it.
-- ============================================================


-- ============================================================
-- 0. SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS ems;

GRANT USAGE ON SCHEMA ems TO anon, authenticated, service_role;


-- ============================================================
-- 1. APPROVED STUDENTS
--
-- Advisory. Managed by the console, consulted by the app, never
-- enforced at sign-in.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.approved_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,

    full_name TEXT,
    prn TEXT,
    phone TEXT,
    college TEXT,
    year TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. ADMIN USERS
--
-- committee: full administrative access.
-- teacher:   oversight and analytics only. Cannot participate,
--            cannot manage organisers.
--
-- A row here is not required for the live organisers. profiles.role
-- already carries them; this table is for the committee/teacher split
-- the live table cannot express.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.admin_users (
    user_id UUID PRIMARY KEY
        REFERENCES public.profiles(id) ON DELETE CASCADE,

    admin_type TEXT NOT NULL
        CHECK (admin_type IN ('committee', 'teacher')),

    added_by UUID
        REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,

    min_team_size INTEGER NOT NULL DEFAULT 1,
    max_team_size INTEGER NOT NULL DEFAULT 1,

    max_teams INTEGER NOT NULL,

    price_inr NUMERIC(10,2) NOT NULL DEFAULT 0,

    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,

    event_start TIMESTAMPTZ NOT NULL,
    event_end TIMESTAMPTZ NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'open', 'closed', 'ongoing', 'completed', 'cancelled')),

    created_by UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT events_team_size_valid
        CHECK (
            min_team_size >= 1
            AND min_team_size <= 8
            AND max_team_size >= 1
            AND max_team_size <= 8
            AND max_team_size >= min_team_size
        ),

    CONSTRAINT events_capacity_valid
        CHECK (
            (min_team_size = 1 AND max_team_size = 1 AND max_teams BETWEEN 1 AND 3000)
            OR
            (NOT (min_team_size = 1 AND max_team_size = 1) AND max_teams BETWEEN 1 AND 1000)
        ),

    CONSTRAINT events_price_valid
        CHECK (price_inr >= 0 AND price_inr <= 5000),

    CONSTRAINT events_registration_dates_valid
        CHECK (registration_end > registration_start),

    CONSTRAINT events_event_dates_valid
        CHECK (event_end > event_start)
);


-- ============================================================
-- 4. EVENT ORGANISERS
--
-- Organiser access is per event. Committee admins do not need rows
-- here; they reach every event.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.event_organisers (
    event_id UUID NOT NULL
        REFERENCES ems.events(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,

    assigned_by UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (event_id, user_id)
);


-- ============================================================
-- 5. TEAMS
--
-- Forming a team is separate from registering it.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id UUID NOT NULL
        REFERENCES ems.events(id) ON DELETE CASCADE,

    name TEXT NOT NULL,

    leader_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'forming'
        CHECK (status IN ('forming', 'ready', 'payment_pending', 'registered', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, name)
);


-- ============================================================
-- 6. TEAM MEMBERS
--
-- Student details are not duplicated. Only the profile id.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID NOT NULL
        REFERENCES ems.teams(id) ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'accepted', 'rejected')),

    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,

    UNIQUE (team_id, student_id)
);


-- ============================================================
-- 7. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id UUID NOT NULL
        REFERENCES ems.events(id) ON DELETE CASCADE,

    team_id UUID NOT NULL UNIQUE
        REFERENCES ems.teams(id) ON DELETE CASCADE,

    leader_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'payment_pending', 'registered', 'cancelled')),

    amount_inr NUMERIC(10,2) NOT NULL DEFAULT 0,

    registered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, team_id),

    CONSTRAINT registration_amount_valid CHECK (amount_inr >= 0)
);


-- ============================================================
-- 8. PAYMENTS
--
-- Razorpay only, order-based. The live public.payments table is the
-- offline/UPI flow for Attack on Token and is left alone.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    registration_id UUID NOT NULL
        REFERENCES ems.event_registrations(id) ON DELETE CASCADE,

    team_id UUID NOT NULL
        REFERENCES ems.teams(id) ON DELETE CASCADE,

    amount_inr NUMERIC(10,2) NOT NULL,

    provider TEXT NOT NULL DEFAULT 'razorpay',

    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,

    status TEXT NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'cancelled')),

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT payment_amount_valid CHECK (amount_inr >= 0)
);


-- ============================================================
-- 9. AUDIT LOG
--
-- Scoped to this schema. public.audit_log keeps its own shape
-- (bigint id, target_type, detail) and its own writers.
-- ============================================================

CREATE TABLE IF NOT EXISTS ems.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_id UUID
        REFERENCES public.profiles(id) ON DELETE SET NULL,

    action TEXT NOT NULL,

    entity_type TEXT,
    entity_id UUID,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ems_approved_students_email ON ems.approved_students(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_ems_events_status ON ems.events(status);
CREATE INDEX IF NOT EXISTS idx_ems_events_registration_dates ON ems.events(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_ems_event_organisers_user ON ems.event_organisers(user_id);
CREATE INDEX IF NOT EXISTS idx_ems_event_organisers_event ON ems.event_organisers(event_id);
CREATE INDEX IF NOT EXISTS idx_ems_teams_event ON ems.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_ems_teams_leader ON ems.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_ems_team_members_team ON ems.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ems_team_members_student ON ems.team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_ems_registrations_event ON ems.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_ems_registrations_status ON ems.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_ems_registrations_leader ON ems.event_registrations(leader_id);
CREATE INDEX IF NOT EXISTS idx_ems_payments_registration ON ems.payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_ems_payments_team ON ems.payments(team_id);
CREATE INDEX IF NOT EXISTS idx_ems_payments_status ON ems.payments(status);
CREATE INDEX IF NOT EXISTS idx_ems_payments_order ON ems.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_ems_audit_log_actor ON ems.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_ems_audit_log_entity ON ems.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ems_audit_log_created ON ems.audit_log(created_at);


-- ============================================================
-- 11. UPDATED_AT
--
-- Its own function rather than public.touch_updated_at(), so that
-- nothing in ems depends on an object in public that somebody could
-- later change without knowing this schema reads it.
-- ============================================================

CREATE OR REPLACE FUNCTION ems.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ems_approved_students_updated_at ON ems.approved_students;
CREATE TRIGGER trg_ems_approved_students_updated_at
BEFORE UPDATE ON ems.approved_students
FOR EACH ROW EXECUTE FUNCTION ems.update_updated_at();

DROP TRIGGER IF EXISTS trg_ems_events_updated_at ON ems.events;
CREATE TRIGGER trg_ems_events_updated_at
BEFORE UPDATE ON ems.events
FOR EACH ROW EXECUTE FUNCTION ems.update_updated_at();

DROP TRIGGER IF EXISTS trg_ems_teams_updated_at ON ems.teams;
CREATE TRIGGER trg_ems_teams_updated_at
BEFORE UPDATE ON ems.teams
FOR EACH ROW EXECUTE FUNCTION ems.update_updated_at();

DROP TRIGGER IF EXISTS trg_ems_registrations_updated_at ON ems.event_registrations;
CREATE TRIGGER trg_ems_registrations_updated_at
BEFORE UPDATE ON ems.event_registrations
FOR EACH ROW EXECUTE FUNCTION ems.update_updated_at();

DROP TRIGGER IF EXISTS trg_ems_payments_updated_at ON ems.payments;
CREATE TRIGGER trg_ems_payments_updated_at
BEFORE UPDATE ON ems.payments
FOR EACH ROW EXECUTE FUNCTION ems.update_updated_at();


-- ============================================================
-- 12. HELPER FUNCTIONS
--
-- All SECURITY DEFINER, all with a pinned search_path, and none of
-- them named the same as anything in public. ems.is_admin() and
-- public.is_admin() are two different functions and always will be.
-- ============================================================


-- ------------------------------------------------------------
-- Teacher admin. Oversight only.
--
-- Deliberately checks only the explicit row: a teacher is never
-- inferred from the live profiles.role.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_teacher_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM ems.admin_users
        WHERE user_id = auth.uid()
          AND admin_type = 'teacher'
    );
$$;


-- ------------------------------------------------------------
-- Committee admin. Full access.
--
-- Three ways in, and one way out. An explicit teacher row beats all
-- of them, so promoting a teacher in the live console by accident
-- cannot hand them committee powers here.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_committee_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT
        NOT EXISTS (
            SELECT 1 FROM ems.admin_users
            WHERE user_id = auth.uid()
              AND admin_type = 'teacher'
        )
        AND (
            EXISTS (
                SELECT 1 FROM ems.admin_users
                WHERE user_id = auth.uid()
                  AND admin_type = 'committee'
            )
            OR EXISTS (
                -- The bridge to the live console. Every organiser who
                -- already exists keeps working here on day one, without
                -- anybody re-adding them by hand.
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                  AND role IN ('admin', 'owner')
            )
            OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'om.kharate241@vit.edu'
        );
$$;


-- ------------------------------------------------------------
-- Any admin at all.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT ems.is_committee_admin() OR ems.is_teacher_admin();
$$;


-- ------------------------------------------------------------
-- Organiser for one event. Committee admins count for every event.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_event_organiser(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT
        ems.is_committee_admin()
        OR EXISTS (
            SELECT 1 FROM ems.event_organisers eo
            WHERE eo.event_id = p_event_id
              AND eo.user_id = auth.uid()
        );
$$;


-- ------------------------------------------------------------
-- May the signed-in person enter this event?
--
-- NOTE: the original was LANGUAGE sql around a DECLARE/BEGIN/END
-- body. Postgres rejects that at CREATE time, so the whole script
-- aborted here. It is plpgsql now, which is what the body was
-- always written for.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.can_participate_in_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    -- Admins and teachers run the thing. They do not enter it.
    IF ems.is_admin() THEN
        RETURN FALSE;
    END IF;

    -- An organiser is barred from their own event, and only theirs.
    IF EXISTS (
        SELECT 1 FROM ems.event_organisers eo
        WHERE eo.event_id = p_event_id
          AND eo.user_id = auth.uid()
    ) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------
-- Team leader / team member.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_team_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM ems.teams
        WHERE id = p_team_id
          AND leader_id = auth.uid()
    );
$$;


CREATE OR REPLACE FUNCTION ems.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM ems.team_members
        WHERE team_id = p_team_id
          AND student_id = auth.uid()
          AND status IN ('accepted', 'invited')
    );
$$;


-- ------------------------------------------------------------
-- Is this address on the approved list?
--
-- Advisory. Nothing calls this on the sign-in path, so a student
-- missing from the list can still sign in and still register. It is
-- here for the console to show the committee who is on the roll.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.is_approved_student_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM ems.approved_students
        WHERE LOWER(email) = LOWER(p_email)
          AND is_active = TRUE
    );
$$;


-- ============================================================
-- 13. CREATE TEAM
-- ============================================================

CREATE OR REPLACE FUNCTION ems.create_team(
    p_event_id UUID,
    p_team_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_event ems.events%ROWTYPE;
    v_team_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.';
    END IF;

    IF NOT ems.can_participate_in_event(p_event_id) THEN
        RAISE EXCEPTION 'You are not allowed to enter this event.';
    END IF;

    SELECT * INTO v_event FROM ems.events WHERE id = p_event_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That event does not exist.';
    END IF;

    IF v_event.status <> 'open' THEN
        RAISE EXCEPTION 'Registration for this event is not open.';
    END IF;

    IF NOW() < v_event.registration_start OR NOW() > v_event.registration_end THEN
        RAISE EXCEPTION 'Registration is not open right now.';
    END IF;

    IF LENGTH(TRIM(COALESCE(p_team_name, ''))) < 2 THEN
        RAISE EXCEPTION 'Give the team a name of at least two characters.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM ems.team_members tm
        JOIN ems.teams t ON t.id = tm.team_id
        WHERE t.event_id = p_event_id
          AND tm.student_id = auth.uid()
          AND tm.status IN ('accepted', 'invited')
    ) THEN
        RAISE EXCEPTION 'You are already in a team for this event.';
    END IF;

    INSERT INTO ems.teams (event_id, name, leader_id)
    VALUES (p_event_id, TRIM(p_team_name), auth.uid())
    RETURNING id INTO v_team_id;

    INSERT INTO ems.team_members (team_id, student_id, status, responded_at)
    VALUES (v_team_id, auth.uid(), 'accepted', NOW());

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(),
        'team_created',
        'team',
        v_team_id,
        jsonb_build_object('event_id', p_event_id, 'team_name', TRIM(p_team_name))
    );

    RETURN v_team_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'A team called that is already entered in this event.';
END;
$$;


-- ============================================================
-- 14. INVITE A MEMBER BY EMAIL
-- ============================================================

CREATE OR REPLACE FUNCTION ems.invite_team_member(
    p_team_id UUID,
    p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_team ems.teams%ROWTYPE;
    v_event ems.events%ROWTYPE;
    v_student public.profiles%ROWTYPE;
    v_member_id UUID;
    v_current_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.';
    END IF;

    SELECT * INTO v_team FROM ems.teams WHERE id = p_team_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That team does not exist.';
    END IF;

    IF v_team.leader_id <> auth.uid() THEN
        RAISE EXCEPTION 'Only the team leader can invite people.';
    END IF;

    SELECT * INTO v_event FROM ems.events WHERE id = v_team.event_id;

    IF v_event.status <> 'open' THEN
        RAISE EXCEPTION 'Registration for this event is not open.';
    END IF;

    IF NOT ems.can_participate_in_event(v_event.id) THEN
        RAISE EXCEPTION 'You are not allowed to enter this event.';
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM ems.team_members
    WHERE team_id = p_team_id
      AND status IN ('accepted', 'invited');

    IF v_current_count >= v_event.max_team_size THEN
        RAISE EXCEPTION 'The team is full at % people.', v_event.max_team_size;
    END IF;

    SELECT * INTO v_student
    FROM public.profiles
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No CESAC account uses that address.';
    END IF;

    IF v_student.id = auth.uid() THEN
        RAISE EXCEPTION 'You are the leader. You are already in.';
    END IF;

    -- Admins, teachers and organisers do not compete.
    IF EXISTS (SELECT 1 FROM ems.admin_users WHERE user_id = v_student.id) THEN
        RAISE EXCEPTION 'That account cannot enter events.';
    END IF;

    IF v_student.role IN ('admin', 'owner') THEN
        RAISE EXCEPTION 'That account cannot enter events.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM ems.event_organisers
        WHERE event_id = v_event.id AND user_id = v_student.id
    ) THEN
        RAISE EXCEPTION 'That account is organising this event.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM ems.team_members tm
        JOIN ems.teams t ON t.id = tm.team_id
        WHERE t.event_id = v_event.id
          AND tm.student_id = v_student.id
          AND tm.status IN ('accepted', 'invited')
    ) THEN
        RAISE EXCEPTION 'They are already in a team for this event.';
    END IF;

    INSERT INTO ems.team_members (team_id, student_id, status)
    VALUES (p_team_id, v_student.id, 'invited')
    RETURNING id INTO v_member_id;

    RETURN v_member_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'They have already been invited.';
END;
$$;


-- ============================================================
-- 15. ACCEPT / REJECT / REMOVE
-- ============================================================

CREATE OR REPLACE FUNCTION ems.accept_team_invitation(p_team_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_member ems.team_members%ROWTYPE;
    v_team ems.teams%ROWTYPE;
    v_event ems.events%ROWTYPE;
BEGIN
    SELECT * INTO v_member
    FROM ems.team_members
    WHERE id = p_team_member_id
      AND student_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That invitation is not yours, or it is gone.';
    END IF;

    IF v_member.status <> 'invited' THEN
        RAISE EXCEPTION 'That invitation has already been answered.';
    END IF;

    SELECT * INTO v_team FROM ems.teams WHERE id = v_member.team_id FOR UPDATE;
    SELECT * INTO v_event FROM ems.events WHERE id = v_team.event_id;

    IF NOT ems.can_participate_in_event(v_event.id) THEN
        RAISE EXCEPTION 'You are not allowed to enter this event.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM ems.team_members tm
        JOIN ems.teams t ON t.id = tm.team_id
        WHERE t.event_id = v_event.id
          AND tm.student_id = auth.uid()
          AND tm.status = 'accepted'
          AND tm.team_id <> v_team.id
    ) THEN
        RAISE EXCEPTION 'You have already joined another team for this event.';
    END IF;

    IF (
        SELECT COUNT(*) FROM ems.team_members
        WHERE team_id = v_team.id AND status IN ('accepted', 'invited')
    ) > v_event.max_team_size THEN
        RAISE EXCEPTION 'The team is full.';
    END IF;

    UPDATE ems.team_members
    SET status = 'accepted', responded_at = NOW()
    WHERE id = p_team_member_id;
END;
$$;


CREATE OR REPLACE FUNCTION ems.reject_team_invitation(p_team_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    UPDATE ems.team_members
    SET status = 'rejected', responded_at = NOW()
    WHERE id = p_team_member_id
      AND student_id = auth.uid()
      AND status = 'invited';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That invitation is not yours, or it is already answered.';
    END IF;
END;
$$;


CREATE OR REPLACE FUNCTION ems.remove_team_member(p_team_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_member ems.team_members%ROWTYPE;
BEGIN
    SELECT tm.* INTO v_member
    FROM ems.team_members tm
    JOIN ems.teams t ON t.id = tm.team_id
    WHERE tm.id = p_team_member_id
      AND t.leader_id = auth.uid()
    FOR UPDATE OF tm;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That person is not on a team you lead.';
    END IF;

    IF v_member.student_id = auth.uid() THEN
        RAISE EXCEPTION 'A leader cannot remove themselves. Cancel the team instead.';
    END IF;

    DELETE FROM ems.team_members WHERE id = p_team_member_id;
END;
$$;


-- ============================================================
-- 16. READINESS
-- ============================================================

CREATE OR REPLACE FUNCTION ems.team_is_ready(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ems, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM ems.teams t
        JOIN ems.events e ON e.id = t.event_id
        WHERE t.id = p_team_id
          AND (
              SELECT COUNT(*) FROM ems.team_members tm
              WHERE tm.team_id = t.id AND tm.status = 'accepted'
          ) >= e.min_team_size
    );
$$;


-- ============================================================
-- 17. REGISTER THE TEAM
--
-- The one transactionally safe step. It locks the event row before
-- it counts seats, so two leaders cannot take the same last slot.
--
-- Free event: registered immediately.
-- Paid event: payment_pending, and the backend opens a Razorpay order.
-- ============================================================

CREATE OR REPLACE FUNCTION ems.register_team(p_team_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_team ems.teams%ROWTYPE;
    v_event ems.events%ROWTYPE;
    v_registration_id UUID;
    v_accepted_count INTEGER;
    v_taken_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.';
    END IF;

    SELECT * INTO v_team FROM ems.teams WHERE id = p_team_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That team does not exist.';
    END IF;

    IF v_team.leader_id <> auth.uid() THEN
        RAISE EXCEPTION 'Only the team leader can register the team.';
    END IF;

    IF NOT ems.can_participate_in_event(v_team.event_id) THEN
        RAISE EXCEPTION 'You are not allowed to enter this event.';
    END IF;

    SELECT * INTO v_event FROM ems.events WHERE id = v_team.event_id FOR UPDATE;

    IF v_event.status <> 'open' THEN
        RAISE EXCEPTION 'Registration for this event is not open.';
    END IF;

    IF NOW() < v_event.registration_start OR NOW() > v_event.registration_end THEN
        RAISE EXCEPTION 'Registration has closed.';
    END IF;

    SELECT COUNT(*) INTO v_accepted_count
    FROM ems.team_members
    WHERE team_id = p_team_id AND status = 'accepted';

    IF v_accepted_count < v_event.min_team_size THEN
        RAISE EXCEPTION 'This event needs at least % people. Accepted so far: %.',
            v_event.min_team_size, v_accepted_count;
    END IF;

    IF v_accepted_count > v_event.max_team_size THEN
        RAISE EXCEPTION 'The team is over the size limit for this event.';
    END IF;

    -- NOTE: the original counted only 'registered' rows here, which meant
    -- a paid event with every seat sitting in payment_pending still looked
    -- empty and kept selling. A seat is taken the moment it is claimed.
    SELECT COUNT(*) INTO v_taken_count
    FROM ems.event_registrations
    WHERE event_id = v_event.id
      AND status IN ('registered', 'payment_pending');

    IF v_taken_count >= v_event.max_teams THEN
        RAISE EXCEPTION 'This event is full.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM ems.event_registrations
        WHERE team_id = p_team_id
          AND status IN ('registered', 'payment_pending')
    ) THEN
        RAISE EXCEPTION 'This team is already registered, or waiting on payment.';
    END IF;

    INSERT INTO ems.event_registrations (
        event_id, team_id, leader_id, status, amount_inr, registered_at
    )
    VALUES (
        v_event.id,
        v_team.id,
        auth.uid(),
        CASE WHEN v_event.price_inr = 0 THEN 'registered' ELSE 'payment_pending' END,
        v_event.price_inr,
        CASE WHEN v_event.price_inr = 0 THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_registration_id;

    UPDATE ems.teams
    SET status = CASE WHEN v_event.price_inr = 0 THEN 'registered' ELSE 'payment_pending' END
    WHERE id = v_team.id;

    IF v_event.price_inr = 0 THEN
        INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
        VALUES (
            auth.uid(),
            'team_registered',
            'registration',
            v_registration_id,
            jsonb_build_object('event_id', v_event.id, 'team_id', v_team.id, 'amount_inr', 0)
        );
    END IF;

    RETURN v_registration_id;
END;
$$;


-- ============================================================
-- 18. PAYMENTS
-- ============================================================

-- NOTE: the original opened with `IF auth.uid() IS NULL THEN RAISE`,
-- which the service role always trips, so the backend that the comment
-- said should call this never could. Service role is allowed through
-- now; a signed-in leader still has to own the registration.

CREATE OR REPLACE FUNCTION ems.create_payment_record(
    p_registration_id UUID,
    p_razorpay_order_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_registration ems.event_registrations%ROWTYPE;
    v_payment_id UUID;
    v_is_service BOOLEAN := (auth.role() = 'service_role');
BEGIN
    IF auth.uid() IS NULL AND NOT v_is_service THEN
        RAISE EXCEPTION 'Sign in first.';
    END IF;

    SELECT * INTO v_registration
    FROM ems.event_registrations
    WHERE id = p_registration_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That registration does not exist.';
    END IF;

    IF NOT v_is_service
       AND v_registration.leader_id <> auth.uid()
       AND NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'That registration is not yours.';
    END IF;

    IF v_registration.status <> 'payment_pending' THEN
        RAISE EXCEPTION 'That registration is not waiting on a payment.';
    END IF;

    INSERT INTO ems.payments (
        registration_id, team_id, amount_inr, provider, razorpay_order_id, status
    )
    VALUES (
        v_registration.id,
        v_registration.team_id,
        v_registration.amount_inr,
        'razorpay',
        p_razorpay_order_id,
        'created'
    )
    RETURNING id INTO v_payment_id;

    RETURN v_payment_id;
END;
$$;


-- ------------------------------------------------------------
-- Razorpay success.
--
-- Service role only, called after the backend has verified the
-- signature itself. No Razorpay secret is stored in this database.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ems.confirm_razorpay_payment(
    p_registration_id UUID,
    p_razorpay_payment_id TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_signature TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_registration ems.event_registrations%ROWTYPE;
    v_payment ems.payments%ROWTYPE;
BEGIN
    IF auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed.';
    END IF;

    SELECT * INTO v_registration
    FROM ems.event_registrations
    WHERE id = p_registration_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That registration does not exist.';
    END IF;

    SELECT * INTO v_payment
    FROM ems.payments
    WHERE registration_id = p_registration_id
      AND razorpay_order_id = p_razorpay_order_id
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No payment was opened for that order.';
    END IF;

    -- Razorpay retries its webhook. Landing twice must not double-write.
    IF v_payment.status = 'paid' THEN
        RETURN;
    END IF;

    UPDATE ems.payments
    SET razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature,
        status = 'paid',
        paid_at = NOW()
    WHERE id = v_payment.id;

    UPDATE ems.event_registrations
    SET status = 'registered', registered_at = NOW()
    WHERE id = p_registration_id;

    UPDATE ems.teams
    SET status = 'registered'
    WHERE id = v_registration.team_id;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_registration.leader_id,
        'payment_confirmed',
        'registration',
        p_registration_id,
        jsonb_build_object(
            'razorpay_order_id', p_razorpay_order_id,
            'razorpay_payment_id', p_razorpay_payment_id,
            'amount_inr', v_registration.amount_inr
        )
    );
END;
$$;


-- ============================================================
-- 19. ADMIN MANAGEMENT
-- ============================================================

CREATE OR REPLACE FUNCTION ems.add_committee_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can add admins.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'No such account.';
    END IF;

    INSERT INTO ems.admin_users (user_id, admin_type, added_by)
    VALUES (p_user_id, 'committee', auth.uid())
    ON CONFLICT (user_id)
    DO UPDATE SET admin_type = 'committee', added_by = auth.uid();

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'committee_admin_added', 'profile', p_user_id);
END;
$$;


CREATE OR REPLACE FUNCTION ems.add_teacher_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can add teacher admins.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'No such account.';
    END IF;

    INSERT INTO ems.admin_users (user_id, admin_type, added_by)
    VALUES (p_user_id, 'teacher', auth.uid())
    ON CONFLICT (user_id)
    DO UPDATE SET admin_type = 'teacher', added_by = auth.uid();

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'teacher_admin_added', 'profile', p_user_id);
END;
$$;


CREATE OR REPLACE FUNCTION ems.remove_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can remove admins.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id
          AND LOWER(email) = 'om.kharate241@vit.edu'
    ) THEN
        RAISE EXCEPTION 'The bootstrap administrator cannot be removed.';
    END IF;

    DELETE FROM ems.admin_users WHERE user_id = p_user_id;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'admin_removed', 'profile', p_user_id);
END;
$$;


-- ============================================================
-- 20. ORGANISERS
-- ============================================================

CREATE OR REPLACE FUNCTION ems.assign_event_organiser(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can assign organisers.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ems.events WHERE id = p_event_id) THEN
        RAISE EXCEPTION 'That event does not exist.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'No such account.';
    END IF;

    IF EXISTS (SELECT 1 FROM ems.admin_users WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Admin accounts already reach every event.';
    END IF;

    INSERT INTO ems.event_organisers (event_id, user_id, assigned_by)
    VALUES (p_event_id, p_user_id, auth.uid())
    ON CONFLICT (event_id, user_id) DO NOTHING;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(), 'organiser_assigned', 'event', p_event_id,
        jsonb_build_object('user_id', p_user_id)
    );
END;
$$;


CREATE OR REPLACE FUNCTION ems.remove_event_organiser(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can remove organisers.';
    END IF;

    DELETE FROM ems.event_organisers
    WHERE event_id = p_event_id AND user_id = p_user_id;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(), 'organiser_removed', 'event', p_event_id,
        jsonb_build_object('user_id', p_user_id)
    );
END;
$$;


-- ============================================================
-- 21. EVENTS
-- ============================================================

CREATE OR REPLACE FUNCTION ems.create_event(
    p_name TEXT,
    p_description TEXT,
    p_min_team_size INTEGER,
    p_max_team_size INTEGER,
    p_max_teams INTEGER,
    p_price_inr NUMERIC,
    p_registration_start TIMESTAMPTZ,
    p_registration_end TIMESTAMPTZ,
    p_event_start TIMESTAMPTZ,
    p_event_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can create events.';
    END IF;

    IF LENGTH(TRIM(COALESCE(p_name, ''))) < 2 THEN
        RAISE EXCEPTION 'Give the event a name.';
    END IF;

    INSERT INTO ems.events (
        name, description, min_team_size, max_team_size, max_teams, price_inr,
        registration_start, registration_end, event_start, event_end, created_by
    )
    VALUES (
        TRIM(p_name), p_description, p_min_team_size, p_max_team_size, p_max_teams,
        p_price_inr, p_registration_start, p_registration_end,
        p_event_start, p_event_end, auth.uid()
    )
    RETURNING id INTO v_event_id;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(), 'event_created', 'event', v_event_id,
        jsonb_build_object(
            'name', TRIM(p_name),
            'min_team_size', p_min_team_size,
            'max_team_size', p_max_team_size,
            'max_teams', p_max_teams,
            'price_inr', p_price_inr
        )
    );

    RETURN v_event_id;
END;
$$;


CREATE OR REPLACE FUNCTION ems.update_event(
    p_event_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_min_team_size INTEGER,
    p_max_team_size INTEGER,
    p_max_teams INTEGER,
    p_price_inr NUMERIC,
    p_registration_start TIMESTAMPTZ,
    p_registration_end TIMESTAMPTZ,
    p_event_start TIMESTAMPTZ,
    p_event_end TIMESTAMPTZ,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ems, public
AS $$
BEGIN
    IF NOT ems.is_committee_admin() THEN
        RAISE EXCEPTION 'Only committee admins can change events.';
    END IF;

    UPDATE ems.events
    SET name = TRIM(p_name),
        description = p_description,
        min_team_size = p_min_team_size,
        max_team_size = p_max_team_size,
        max_teams = p_max_teams,
        price_inr = p_price_inr,
        registration_start = p_registration_start,
        registration_end = p_registration_end,
        event_start = p_event_start,
        event_end = p_event_end,
        status = p_status
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'That event does not exist.';
    END IF;

    INSERT INTO ems.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(), 'event_updated', 'event', p_event_id,
        jsonb_build_object('status', p_status)
    );
END;
$$;


-- ============================================================
-- 22. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ems.approved_students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.event_organisers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems.audit_log           ENABLE ROW LEVEL SECURITY;


-- ---------- approved students ----------

DROP POLICY IF EXISTS approved_students_admin_all ON ems.approved_students;
CREATE POLICY approved_students_admin_all
ON ems.approved_students FOR ALL TO authenticated
USING (ems.is_committee_admin())
WITH CHECK (ems.is_committee_admin());


-- ---------- admin users ----------

DROP POLICY IF EXISTS admin_users_select_admin ON ems.admin_users;
CREATE POLICY admin_users_select_admin
ON ems.admin_users FOR SELECT TO authenticated
USING (ems.is_admin());

DROP POLICY IF EXISTS admin_users_modify_committee ON ems.admin_users;
CREATE POLICY admin_users_modify_committee
ON ems.admin_users FOR ALL TO authenticated
USING (ems.is_committee_admin())
WITH CHECK (ems.is_committee_admin());


-- ---------- events ----------

DROP POLICY IF EXISTS events_select_authenticated ON ems.events;
CREATE POLICY events_select_authenticated
ON ems.events FOR SELECT TO authenticated
USING (status <> 'draft' OR ems.is_admin());

DROP POLICY IF EXISTS events_insert_admin ON ems.events;
CREATE POLICY events_insert_admin
ON ems.events FOR INSERT TO authenticated
WITH CHECK (ems.is_committee_admin());

DROP POLICY IF EXISTS events_update_admin ON ems.events;
CREATE POLICY events_update_admin
ON ems.events FOR UPDATE TO authenticated
USING (ems.is_committee_admin())
WITH CHECK (ems.is_committee_admin());

DROP POLICY IF EXISTS events_delete_admin ON ems.events;
CREATE POLICY events_delete_admin
ON ems.events FOR DELETE TO authenticated
USING (ems.is_committee_admin());


-- ---------- event organisers ----------

DROP POLICY IF EXISTS event_organisers_select ON ems.event_organisers;
CREATE POLICY event_organisers_select
ON ems.event_organisers FOR SELECT TO authenticated
USING (ems.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS event_organisers_modify ON ems.event_organisers;
CREATE POLICY event_organisers_modify
ON ems.event_organisers FOR ALL TO authenticated
USING (ems.is_committee_admin())
WITH CHECK (ems.is_committee_admin());


-- ---------- teams ----------

DROP POLICY IF EXISTS teams_select ON ems.teams;
CREATE POLICY teams_select
ON ems.teams FOR SELECT TO authenticated
USING (
    ems.is_admin()
    OR ems.is_team_member(id)
    OR ems.is_event_organiser(event_id)
);

DROP POLICY IF EXISTS teams_insert ON ems.teams;
CREATE POLICY teams_insert
ON ems.teams FOR INSERT TO authenticated
WITH CHECK (leader_id = auth.uid() AND ems.can_participate_in_event(event_id));

DROP POLICY IF EXISTS teams_update ON ems.teams;
CREATE POLICY teams_update
ON ems.teams FOR UPDATE TO authenticated
USING (ems.is_admin() OR leader_id = auth.uid() OR ems.is_event_organiser(event_id))
WITH CHECK (ems.is_admin() OR leader_id = auth.uid() OR ems.is_event_organiser(event_id));

DROP POLICY IF EXISTS teams_delete ON ems.teams;
CREATE POLICY teams_delete
ON ems.teams FOR DELETE TO authenticated
USING (ems.is_committee_admin() OR leader_id = auth.uid());


-- ---------- team members ----------

DROP POLICY IF EXISTS team_members_select ON ems.team_members;
CREATE POLICY team_members_select
ON ems.team_members FOR SELECT TO authenticated
USING (
    student_id = auth.uid()
    OR ems.is_team_leader(team_id)
    OR ems.is_admin()
    OR EXISTS (
        SELECT 1 FROM ems.teams t
        WHERE t.id = team_members.team_id
          AND ems.is_event_organiser(t.event_id)
    )
);

DROP POLICY IF EXISTS team_members_insert ON ems.team_members;
CREATE POLICY team_members_insert
ON ems.team_members FOR INSERT TO authenticated
WITH CHECK (ems.is_team_leader(team_id));

DROP POLICY IF EXISTS team_members_update ON ems.team_members;
CREATE POLICY team_members_update
ON ems.team_members FOR UPDATE TO authenticated
USING (student_id = auth.uid() OR ems.is_team_leader(team_id) OR ems.is_admin())
WITH CHECK (student_id = auth.uid() OR ems.is_team_leader(team_id) OR ems.is_admin());

DROP POLICY IF EXISTS team_members_delete ON ems.team_members;
CREATE POLICY team_members_delete
ON ems.team_members FOR DELETE TO authenticated
USING (ems.is_team_leader(team_id) OR ems.is_admin());


-- ---------- registrations ----------

DROP POLICY IF EXISTS registrations_select ON ems.event_registrations;
CREATE POLICY registrations_select
ON ems.event_registrations FOR SELECT TO authenticated
USING (
    leader_id = auth.uid()
    OR ems.is_team_member(team_id)
    OR ems.is_admin()
    OR ems.is_event_organiser(event_id)
);

DROP POLICY IF EXISTS registrations_insert ON ems.event_registrations;
CREATE POLICY registrations_insert
ON ems.event_registrations FOR INSERT TO authenticated
WITH CHECK (leader_id = auth.uid() AND ems.can_participate_in_event(event_id));

DROP POLICY IF EXISTS registrations_update ON ems.event_registrations;
CREATE POLICY registrations_update
ON ems.event_registrations FOR UPDATE TO authenticated
USING (ems.is_admin() OR ems.is_event_organiser(event_id))
WITH CHECK (ems.is_admin() OR ems.is_event_organiser(event_id));


-- ---------- payments ----------
--
-- Read only, for everyone. Rows are written by the two functions
-- above and by nothing else, so there is no INSERT or UPDATE policy
-- here on purpose: a leader who could update their own payment row
-- could mark it paid.

DROP POLICY IF EXISTS payments_select ON ems.payments;
CREATE POLICY payments_select
ON ems.payments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM ems.event_registrations er
        WHERE er.id = payments.registration_id
          AND (
              er.leader_id = auth.uid()
              OR ems.is_admin()
              OR ems.is_event_organiser(er.event_id)
          )
    )
);


-- ---------- audit log ----------

DROP POLICY IF EXISTS audit_log_select_admin ON ems.audit_log;
CREATE POLICY audit_log_select_admin
ON ems.audit_log FOR SELECT TO authenticated
USING (ems.is_committee_admin());


-- ============================================================
-- 23. ANALYTICS
--
-- These read public.certificates, the one certificate store. The
-- live table carries a `contribution` enum rather than the new
-- `result` labels, so it is translated here and nowhere else.
--
-- security_invoker: the reader's own RLS on public.certificates
-- applies, so a student sees their own rows and an organiser sees
-- the department's. The view grants nothing extra.
-- ============================================================

CREATE OR REPLACE VIEW ems.student_achievement_summary
WITH (security_invoker = true)
AS
SELECT
    p.id AS student_id,
    p.full_name,
    p.email,
    p.prn,
    p.phone,
    p.college,
    p.year,
    p.student_class,

    COUNT(c.id) AS certificates,

    COUNT(c.id) FILTER (WHERE c.contribution = 'participation') AS participated,
    COUNT(c.id) FILTER (WHERE c.contribution = 'first')  AS first_place,
    COUNT(c.id) FILTER (WHERE c.contribution = 'second') AS second_place,
    COUNT(c.id) FILTER (WHERE c.contribution = 'third')  AS third_place,

    COUNT(c.id) FILTER (WHERE c.verified) AS verified_certificates,

    COALESCE(SUM(c.prize_amount_inr), 0) AS prize_money_inr

FROM public.profiles p
LEFT JOIN public.certificates c ON c.owner_id = p.id
GROUP BY
    p.id, p.full_name, p.email, p.prn, p.phone, p.college, p.year, p.student_class;


-- NOTE: public.certificates records when a certificate was uploaded,
-- not when the event was held, so this is grouped by upload month.
-- The column is named for what it is.

CREATE OR REPLACE VIEW ems.monthly_certificate_analytics
WITH (security_invoker = true)
AS
SELECT
    DATE_TRUNC('month', created_at)::DATE AS upload_month,

    COUNT(*) AS total_certificates,
    COUNT(DISTINCT owner_id) AS unique_students,

    COUNT(*) FILTER (WHERE contribution = 'participation') AS participation_count,
    COUNT(*) FILTER (WHERE contribution = 'first')  AS first_place_count,
    COUNT(*) FILTER (WHERE contribution = 'second') AS second_place_count,
    COUNT(*) FILTER (WHERE contribution = 'third')  AS third_place_count,

    COUNT(*) FILTER (WHERE verified) AS verified_count,
    COALESCE(SUM(prize_amount_inr), 0) AS prize_money_inr

FROM public.certificates
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY upload_month DESC;


CREATE OR REPLACE VIEW ems.event_participation_analytics
WITH (security_invoker = true)
AS
SELECT
    e.id AS event_id,
    e.name AS event_name,
    e.status,
    e.min_team_size,
    e.max_team_size,
    e.max_teams,
    e.price_inr,

    COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'registered') AS registered_teams,
    COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'payment_pending') AS teams_awaiting_payment,

    COUNT(DISTINCT tm.student_id) FILTER (WHERE er.status = 'registered') AS registered_students,

    COALESCE(SUM(er.amount_inr) FILTER (WHERE er.status = 'registered'), 0) AS collected_inr

FROM ems.events e
LEFT JOIN ems.event_registrations er ON er.event_id = e.id
LEFT JOIN ems.team_members tm ON tm.team_id = er.team_id AND tm.status = 'accepted'
GROUP BY
    e.id, e.name, e.status, e.min_team_size, e.max_team_size, e.max_teams, e.price_inr;


CREATE OR REPLACE VIEW ems.recent_achievement_highlights
WITH (security_invoker = true)
AS
SELECT
    c.id,
    c.owner_id,
    p.full_name,
    p.email,
    p.prn,
    p.college,
    p.year,
    c.event_name,
    c.contribution,
    c.prize_amount_inr,
    c.verified,
    c.drive_link,
    c.created_at
FROM public.certificates c
JOIN public.profiles p ON p.id = c.owner_id
ORDER BY c.created_at DESC;


-- ============================================================
-- 23b. READ VIEWS
--
-- Two problems these solve, both created by keeping ems and public
-- apart:
--
--   PostgREST cannot embed a resource across schemas, so the app
--   cannot ask for ems.teams with public.profiles attached in one
--   query.
--
--   public.profiles RLS says "your own row, or an admin", which is
--   correct and is not being changed. But a team leader has to be
--   able to see the name of the person they just invited.
--
-- So these views are SECURITY DEFINER (the default, security_invoker
-- off): they run as the owner and bypass RLS, and each one carries
-- its own WHERE clause as the gate. security_barrier stops a caller's
-- own WHERE clause from being evaluated before that gate.
--
-- Nothing here widens public.profiles for any other query in the app:
-- a row is reachable only through a team the viewer is actually in,
-- or an event they run. Verified: a leader reads their teammate from
-- ems.team_roster and still gets zero rows selecting that person
-- directly from public.profiles.
-- ============================================================

CREATE OR REPLACE VIEW ems.team_roster
WITH (security_barrier = true) AS
SELECT
    tm.id AS member_id,
    tm.team_id,
    tm.student_id,
    tm.status,
    tm.invited_at,
    tm.responded_at,
    t.event_id,
    t.name AS team_name,
    t.leader_id,
    (tm.student_id = t.leader_id) AS is_leader,
    p.full_name,
    p.email,
    p.prn,
    p.student_class,
    p.college,
    p.year,
    p.avatar_url
FROM ems.team_members tm
JOIN ems.teams t       ON t.id = tm.team_id
JOIN public.profiles p ON p.id = tm.student_id
WHERE tm.student_id = auth.uid()
   OR ems.is_team_member(tm.team_id)
   OR ems.is_team_leader(tm.team_id)
   OR ems.is_admin()
   OR ems.is_event_organiser(t.event_id);


-- Every event the viewer may see, with seat counts that are true
-- rather than RLS-filtered, plus where the viewer personally stands.
CREATE OR REPLACE VIEW ems.event_board
WITH (security_barrier = true) AS
SELECT
    e.id,
    e.name,
    e.description,
    e.min_team_size,
    e.max_team_size,
    e.max_teams,
    e.price_inr,
    e.registration_start,
    e.registration_end,
    e.event_start,
    e.event_end,
    e.status,
    e.created_at,

    seats.taken AS seats_taken,
    GREATEST(e.max_teams - seats.taken, 0) AS seats_left,

    (
        e.status = 'open'
        AND NOW() >= e.registration_start
        AND NOW() <= e.registration_end
        AND seats.taken < e.max_teams
    ) AS registration_open,

    ems.can_participate_in_event(e.id) AS can_participate,
    ems.is_event_organiser(e.id) AS is_organiser,

    mine.team_id AS my_team_id,
    mine.team_name AS my_team_name,
    mine.team_status AS my_team_status,
    mine.member_status AS my_member_status,
    mine.is_leader AS my_is_leader

FROM ems.events e

CROSS JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS taken
    FROM ems.event_registrations er
    WHERE er.event_id = e.id
      AND er.status IN ('registered', 'payment_pending')
) seats

LEFT JOIN LATERAL (
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.status AS team_status,
        tm.status AS member_status,
        (t.leader_id = auth.uid()) AS is_leader
    FROM ems.team_members tm
    JOIN ems.teams t ON t.id = tm.team_id
    WHERE t.event_id = e.id
      AND tm.student_id = auth.uid()
      AND tm.status IN ('accepted', 'invited')
    LIMIT 1
) mine ON TRUE

WHERE e.status <> 'draft' OR ems.is_admin();


-- Invitations waiting on the signed-in student, with enough context
-- to answer them without a second round trip.
CREATE OR REPLACE VIEW ems.my_invitations
WITH (security_barrier = true) AS
SELECT
    tm.id AS member_id,
    tm.invited_at,
    t.id AS team_id,
    t.name AS team_name,
    e.id AS event_id,
    e.name AS event_name,
    e.min_team_size,
    e.max_team_size,
    e.price_inr,
    e.registration_end,
    leader.full_name AS leader_name,
    leader.email AS leader_email
FROM ems.team_members tm
JOIN ems.teams t  ON t.id = tm.team_id
JOIN ems.events e ON e.id = t.event_id
JOIN public.profiles leader ON leader.id = t.leader_id
WHERE tm.student_id = auth.uid()
  AND tm.status = 'invited';


-- Who holds admin powers in this schema, and how they got them.
-- Committee admins only, because it names people.
CREATE OR REPLACE VIEW ems.admin_directory
WITH (security_barrier = true) AS
SELECT
    a.user_id,
    a.admin_type,
    a.created_at,
    p.full_name,
    p.email,
    p.avatar_url,
    added.full_name AS added_by_name
FROM ems.admin_users a
JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.profiles added ON added.id = a.added_by
WHERE ems.is_committee_admin();


CREATE OR REPLACE VIEW ems.organiser_directory
WITH (security_barrier = true) AS
SELECT
    eo.event_id,
    eo.user_id,
    eo.created_at,
    e.name AS event_name,
    p.full_name,
    p.email,
    p.avatar_url,
    assigner.full_name AS assigned_by_name
FROM ems.event_organisers eo
JOIN ems.events e      ON e.id = eo.event_id
JOIN public.profiles p ON p.id = eo.user_id
LEFT JOIN public.profiles assigner ON assigner.id = eo.assigned_by
WHERE ems.is_admin() OR eo.user_id = auth.uid();


-- The organiser's table of entries for one event: team, leader, size,
-- money. Organisers of that event and admins only.
CREATE OR REPLACE VIEW ems.registration_board
WITH (security_barrier = true) AS
SELECT
    er.id AS registration_id,
    er.event_id,
    e.name AS event_name,
    er.team_id,
    t.name AS team_name,
    er.status,
    er.amount_inr,
    er.registered_at,
    er.created_at,
    leader.id AS leader_id,
    leader.full_name AS leader_name,
    leader.email AS leader_email,
    leader.prn AS leader_prn,
    (
        SELECT COUNT(*) FROM ems.team_members tm
        WHERE tm.team_id = er.team_id AND tm.status = 'accepted'
    ) AS accepted_members,
    pay.status AS payment_status,
    pay.razorpay_order_id,
    pay.razorpay_payment_id,
    pay.paid_at
FROM ems.event_registrations er
JOIN ems.events e           ON e.id = er.event_id
JOIN ems.teams t            ON t.id = er.team_id
JOIN public.profiles leader ON leader.id = er.leader_id
LEFT JOIN LATERAL (
    SELECT p.status, p.razorpay_order_id, p.razorpay_payment_id, p.paid_at
    FROM ems.payments p
    WHERE p.registration_id = er.id
    ORDER BY p.created_at DESC
    LIMIT 1
) pay ON TRUE
WHERE ems.is_admin() OR ems.is_event_organiser(er.event_id);


-- The committee's audit trail, with the actor named.
CREATE OR REPLACE VIEW ems.audit_feed
WITH (security_barrier = true) AS
SELECT
    a.id,
    a.action,
    a.entity_type,
    a.entity_id,
    a.metadata,
    a.created_at,
    a.actor_id,
    p.full_name AS actor_name,
    p.email AS actor_email
FROM ems.audit_log a
LEFT JOIN public.profiles p ON p.id = a.actor_id
WHERE ems.is_committee_admin();


-- ============================================================
-- 24. GRANTS
--
-- RLS does the filtering. These only open the door far enough for
-- a policy to be consulted at all.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ems.approved_students   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ems.admin_users         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ems.events              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ems.event_organisers    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ems.teams               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ems.team_members        TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON ems.event_registrations TO authenticated;
GRANT SELECT                         ON ems.payments            TO authenticated;
GRANT SELECT                         ON ems.audit_log           TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA ems TO service_role;

GRANT SELECT ON ems.student_achievement_summary    TO authenticated;
GRANT SELECT ON ems.monthly_certificate_analytics  TO authenticated;
GRANT SELECT ON ems.event_participation_analytics  TO authenticated;
GRANT SELECT ON ems.recent_achievement_highlights  TO authenticated;

-- The read views bypass RLS by design, so anon must never reach one.
GRANT SELECT ON ems.team_roster         TO authenticated;
GRANT SELECT ON ems.event_board         TO authenticated;
GRANT SELECT ON ems.my_invitations      TO authenticated;
GRANT SELECT ON ems.admin_directory     TO authenticated;
GRANT SELECT ON ems.organiser_directory TO authenticated;
GRANT SELECT ON ems.registration_board  TO authenticated;
GRANT SELECT ON ems.audit_feed          TO authenticated;

REVOKE ALL ON ems.team_roster         FROM anon;
REVOKE ALL ON ems.event_board         FROM anon;
REVOKE ALL ON ems.my_invitations      FROM anon;
REVOKE ALL ON ems.admin_directory     FROM anon;
REVOKE ALL ON ems.organiser_directory FROM anon;
REVOKE ALL ON ems.registration_board  FROM anon;
REVOKE ALL ON ems.audit_feed          FROM anon;


-- ============================================================
-- 25. FUNCTION EXECUTION
-- ============================================================

GRANT EXECUTE ON FUNCTION ems.is_admin()                    TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_committee_admin()          TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_teacher_admin()            TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_event_organiser(UUID)      TO authenticated;
GRANT EXECUTE ON FUNCTION ems.can_participate_in_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_team_leader(UUID)          TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_team_member(UUID)          TO authenticated;
GRANT EXECUTE ON FUNCTION ems.is_approved_student_email(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION ems.create_team(UUID, TEXT)       TO authenticated;
GRANT EXECUTE ON FUNCTION ems.invite_team_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION ems.accept_team_invitation(UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION ems.reject_team_invitation(UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION ems.remove_team_member(UUID)      TO authenticated;
GRANT EXECUTE ON FUNCTION ems.team_is_ready(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION ems.register_team(UUID)           TO authenticated;

GRANT EXECUTE ON FUNCTION ems.create_payment_record(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION ems.add_committee_admin(UUID)     TO authenticated;
GRANT EXECUTE ON FUNCTION ems.add_teacher_admin(UUID)       TO authenticated;
GRANT EXECUTE ON FUNCTION ems.remove_admin(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION ems.assign_event_organiser(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ems.remove_event_organiser(UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION ems.create_event(
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, NUMERIC,
    TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ
) TO authenticated;

GRANT EXECUTE ON FUNCTION ems.update_event(
    UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, NUMERIC,
    TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) TO authenticated;


-- Confirming a payment is the one thing a signed-in person must never
-- be able to call. Only the backend, holding the service role key and
-- having checked the Razorpay signature itself.
REVOKE ALL ON FUNCTION ems.confirm_razorpay_payment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION ems.confirm_razorpay_payment(UUID, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION ems.confirm_razorpay_payment(UUID, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION ems.confirm_razorpay_payment(UUID, TEXT, TEXT, TEXT) TO service_role;


-- ============================================================
-- 26. BOOTSTRAP
--
-- Gives the initial super admin an explicit committee row if that
-- account already exists. If it does not, nothing happens and the
-- email check in is_committee_admin() covers them the moment they
-- first sign in.
-- ============================================================

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id
    FROM public.profiles
    WHERE LOWER(email) = 'om.kharate241@vit.edu'
    LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
        INSERT INTO ems.admin_users (user_id, admin_type, added_by)
        VALUES (v_admin_id, 'committee', NULL)
        ON CONFLICT (user_id) DO UPDATE SET admin_type = 'committee';
    END IF;
END $$;


-- ============================================================
-- END
-- ============================================================
