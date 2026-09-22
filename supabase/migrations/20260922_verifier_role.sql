-- ===========================================================================
-- The verifier, and one signature correction.
--
-- Applied to the live project on 22 September 2026 as three migrations, in
-- this order, and kept here as one file for reading. It is NOT replayable as
-- a single transaction: the first statement adds a value to an enum and
-- Postgres refuses to use a new label in the transaction that added it. Run
-- part one, commit, then the rest.
--
-- Everything below is idempotent on a second run.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- PART ONE: on its own, and committed before part two.
-- ---------------------------------------------------------------------------

-- A fourth role: somebody who checks student records and does nothing else.
alter type public.app_role add value if not exists 'verifier';


-- ---------------------------------------------------------------------------
-- PART TWO
--
-- Not a narrowed organiser. An organiser with only the `records` capability
-- could still be widened by another organiser with one tick, and `is_admin()`
-- would still be true for them, which is the key 26 policies turn on. A
-- verifier is a different role, so nothing an organiser can reach opens to
-- them by accident: they cannot read the audit log, the payments, the
-- showcase picks or another organiser's access, because every one of those is
-- gated on `is_admin()` and `is_admin()` is false for a verifier.
--
-- `public.is_admin()` is untouched. See the note in the capability migration.
-- ---------------------------------------------------------------------------

create or replace function public.is_verifier()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'verifier'
  );
$$;

comment on function public.is_verifier() is
  'True for an account whose role is verifier. Deliberately false for an organiser: the two roles are read separately everywhere.';

-- --------------------------------------------------------------- what they see
--
-- Added alongside the existing policies rather than folded into them. Postgres
-- ORs the policies for a command together, so this widens the read without
-- rewriting a rule that students and organisers already depend on.

drop policy if exists certificates_read_verifier on public.certificates;
create policy certificates_read_verifier
  on public.certificates for select
  using (public.is_verifier());

drop policy if exists certificate_files_read_verifier on public.certificate_files;
create policy certificate_files_read_verifier
  on public.certificate_files for select
  using (public.is_verifier());

-- Students only. A verifier needs the name, the class and the PRN against the
-- record they are checking, which is exactly what tells two students with the
-- same name apart. They have no reason to read the committee's rows, and
-- profiles_read_self already gives them their own.
drop policy if exists profiles_read_verifier on public.profiles;
create policy profiles_read_verifier
  on public.profiles for select
  using (public.is_verifier() and role = 'participant');

-- Deliberately no UPDATE policy. A verification goes through verify_record()
-- below, which writes the audit entry in the same statement as the decision.

-- ------------------------------------------------------- what they may change
create or replace function public.guard_certificate_verification()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  -- A verifier exists to do one thing. Checked by comparing the two rows with
  -- the three verification columns taken out, rather than by listing the other
  -- thirty-four: a column added to this table later is covered without anybody
  -- remembering to come back here.
  if public.is_verifier() then
    if (to_jsonb(new) - 'verified' - 'verified_by' - 'verified_at')
       is distinct from
       (to_jsonb(old) - 'verified' - 'verified_by' - 'verified_at') then
      raise exception 'A verifier can verify a record, and nothing else about it.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.verified is distinct from old.verified
     or new.verified_by is distinct from old.verified_by
     or new.verified_at is distinct from old.verified_at then
    raise exception 'Only an organiser or a verifier can verify a record.'
      using errcode = '42501';
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'A record cannot change hands.' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------ the one decision
--
-- One function for both roles, so the queue behaves identically whoever is
-- working it and the audit entry cannot be skipped by using the other screen.
create or replace function public.verify_record(p_certificate_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  by_verifier boolean := public.is_verifier();
  owner_id uuid;
  record_name text;
begin
  if not (by_verifier or public.admin_can('records')) then
    raise exception 'Only a verifier or an organiser who holds Student records can review a record.'
      using errcode = '42501';
  end if;

  if p_decision not in ('verify', 'reject', 'reopen') then
    raise exception 'A record is verified, turned down, or put back in the queue.'
      using errcode = 'P0001';
  end if;

  select c.owner_id, c.event_name into owner_id, record_name
    from public.certificates c where c.id = p_certificate_id;

  if owner_id is null then
    raise exception 'That record is not there any more. Reload the queue.'
      using errcode = 'P0001';
  end if;

  update public.certificates
     set verified    = (p_decision = 'verify'),
         verified_by = case when p_decision = 'reopen' then null else auth.uid() end,
         verified_at = case when p_decision = 'reopen' then null else now() end
   where id = p_certificate_id;

  perform public.audit('record.' || p_decision, 'certificate', p_certificate_id::text,
    jsonb_build_object(
      'as', case when by_verifier then 'verifier' else 'organiser' end,
      'record', record_name,
      'owner', owner_id));
end;
$$;

-- =========================================================== making a verifier
--
-- An organiser types an email and a password and the account exists. There is
-- no service role key in this deployment and there is not going to be one, so
-- the account is made here, in the database, by a function that checks the
-- caller first. It is the same insert the admin API performs: the row in
-- auth.users, the matching identity, and the profile that handle_new_user
-- builds off the back of it.
--
-- The eight token columns are '' and not NULL on purpose. GoTrue reads them
-- into Go strings and errors on NULL, and the sign-in screen turns every
-- failure into the same sentence, so a NULL there looks exactly like a wrong
-- password and there is nothing on screen to go on.

create or replace function public.admin_create_verifier(
  p_email text,
  p_password text,
  p_name text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  clean_email text := lower(btrim(p_email));
  clean_name  text := nullif(btrim(coalesce(p_name, '')), '');
  new_id uuid;
begin
  if not public.admin_can('people') then
    raise exception 'Only an organiser who holds People and access can add a verifier.'
      using errcode = '42501';
  end if;

  if clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'That does not look like an email address.' using errcode = 'P0001';
  end if;

  if p_password is null or length(p_password) < 8 then
    raise exception 'A verifier password has to be at least 8 characters.'
      using errcode = 'P0001';
  end if;

  if exists (select 1 from auth.users u where lower(u.email) = clean_email) then
    raise exception 'There is already an account on %.', clean_email using errcode = 'P0001';
  end if;

  new_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token,
    reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', new_id,
    'authenticated', 'authenticated',
    clean_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', coalesce(clean_name, split_part(clean_email, '@', 1)),
      'must_change_password', false),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    new_id::text, new_id,
    jsonb_build_object(
      'sub', new_id::text, 'email', clean_email,
      'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now()
  );

  -- handle_new_user has already made the profile, as a participant. This is
  -- the line that makes it a verifier, and guard_profile_role lets it through
  -- because the organiser who called this is the one holding the session.
  update public.profiles
     set role = 'verifier', full_name = coalesce(clean_name, full_name)
   where id = new_id;

  perform public.audit('verifier.create', 'profile', new_id::text,
    jsonb_build_object('email', clean_email));

  return new_id;
end;
$$;

create or replace function public.admin_set_verifier_password(
  p_profile_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_can('people') then
    raise exception 'Only an organiser who holds People and access can do that.'
      using errcode = '42501';
  end if;

  if p_password is null or length(p_password) < 8 then
    raise exception 'A verifier password has to be at least 8 characters.'
      using errcode = 'P0001';
  end if;

  -- Verifiers only. A function that could set any account's password would be
  -- a way for one organiser to take another's, and a way to take a student's.
  if not exists (
    select 1 from public.profiles p where p.id = p_profile_id and p.role = 'verifier'
  ) then
    raise exception 'That account is not a verifier.' using errcode = '42501';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = p_profile_id;

  perform public.audit('verifier.password', 'profile', p_profile_id::text, '{}'::jsonb);
end;
$$;

create or replace function public.admin_remove_verifier(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  gone text;
begin
  if not public.admin_can('people') then
    raise exception 'Only an organiser who holds People and access can do that.'
      using errcode = '42501';
  end if;

  select p.email into gone
    from public.profiles p
   where p.id = p_profile_id and p.role = 'verifier';

  if gone is null then
    raise exception 'That account is not a verifier.' using errcode = '42501';
  end if;

  -- The profile goes with it, on the cascade from auth.users. Records they
  -- verified keep their stamp: verified_by is on delete set null, so the
  -- record stays verified and simply stops naming who did it.
  delete from auth.users where id = p_profile_id;

  perform public.audit('verifier.remove', 'profile', p_profile_id::text,
    jsonb_build_object('email', gone));
end;
$$;

/**
 * Who the verifiers are, for the organiser console's list.
 *
 * A function rather than a select because profiles_read_self hands an
 * organiser every row already; what this adds is the count of what each one
 * has actually checked, which is the only thing that makes the list worth
 * looking at.
 */
create or replace function public.admin_verifiers()
returns table (id uuid, email text, full_name text, created_at timestamptz, checked bigint)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, p.email, p.full_name, p.created_at,
         (select count(*) from public.certificates c where c.verified_by = p.id)::bigint
    from public.profiles p
   where p.role = 'verifier'
     and public.admin_can('people')
   order by p.created_at;
$$;

-- --------------------------------------------------------------------- grants
--
-- Granting to `authenticated` does not remove Postgres's default grant to
-- PUBLIC, so every one of these is anon-callable until it is revoked by name.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure::text as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'is_verifier', 'verify_record', 'admin_create_verifier',
         'admin_set_verifier_password', 'admin_remove_verifier', 'admin_verifiers')
  loop
    execute format('revoke all on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- PART THREE: one signature correction, nothing to do with the verifier.
--
-- A new person on the roster has no id yet, which the function has always
-- known: `if p_id is null then insert`. The parameter simply never said so, so
-- the generated TypeScript typed it as a required string and the console had
-- to pass a null the type refused. Giving it the default it was always being
-- called with makes the signature say what the body does, and the call site
-- omits the argument for somebody new instead of casting around it.
--
-- Body unchanged, character for character.
-- ---------------------------------------------------------------------------

create or replace function public.admin_upsert_roster_person(
  p_id uuid default null,
  p_group_id text default null,
  p_name text default null,
  p_role text default null,
  p_rank text default null,
  p_position integer default 0,
  p_visible boolean default true
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'A person needs a name.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.roster_groups where id = p_group_id) then
    raise exception 'There is no % block on the roster.', p_group_id using errcode = 'P0001';
  end if;
  if coalesce(p_rank, '') not in ('', 'lead', 'head') then
    raise exception 'Somebody is a lead, a head, or neither.' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.roster_people (group_id, name, role, rank, position, visible)
    values (p_group_id, btrim(p_name), nullif(btrim(coalesce(p_role, '')), ''),
            nullif(p_rank, ''), coalesce(p_position, 0), coalesce(p_visible, true))
    returning id into v_id;
  else
    update public.roster_people
       set group_id = p_group_id, name = btrim(p_name),
           role = nullif(btrim(coalesce(p_role, '')), ''),
           rank = nullif(p_rank, ''), position = coalesce(p_position, 0),
           visible = coalesce(p_visible, true), updated_at = now()
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'That person is not on the roster any more.' using errcode = 'P0001';
    end if;
  end if;

  perform public.audit('roster.person.saved', 'roster_person', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'group', p_group_id));
  return v_id;
end;
$function$;

revoke all on function public.admin_upsert_roster_person(uuid, text, text, text, text, integer, boolean) from public, anon;
grant execute on function public.admin_upsert_roster_person(uuid, text, text, text, text, integer, boolean) to authenticated;
