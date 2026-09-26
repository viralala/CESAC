-- ---------------------------------------------------------------------------
-- An organiser can now file a record of their own, since most organisers on
-- this committee are students in the department too. 26 September 2026.
--
-- The row level security side of this needed nothing: certificates_insert_own
-- already reads "with check (owner_id = auth.uid())", with no role in it, so
-- an admin account was always free to insert a row naming itself as owner.
-- What actually kept organisers out was the application guard on the "My
-- record" pages and actions (requireParticipant, in src/lib/auth/guard.ts),
-- which this migration's application-side counterpart widens to
-- requireRecordOwner: participant, or an organiser filing their own. See
-- src/app/admin/certificates/mine/page.tsx, the organiser-side equivalent of
-- src/app/dashboard/certificates.
--
-- That widening opens exactly one gap in the database, and this migration is
-- only that: verify_record (added 22 September 2026, for the verifier role)
-- never had to consider the record's owner and the reviewer being the same
-- account, because an organiser could not own a row. Now they can, so without
-- this an organiser could file a record and then verify it themselves from
-- the same queue they review everyone else's from.
-- ---------------------------------------------------------------------------

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

  if owner_id = auth.uid() then
    raise exception 'You cannot decide on your own record. Ask another organiser or the verifier to look at it.'
      using errcode = '42501';
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
