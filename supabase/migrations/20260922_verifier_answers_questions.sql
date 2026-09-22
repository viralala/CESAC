-- ===========================================================================
-- The questions desk opens to verifiers.
--
-- Applied to the live project on 22 September 2026, after
-- 20260922_verifier_role.sql. Idempotent.
--
-- The people checking records are the people best placed to answer what
-- students ask about them, and most of what arrives on that desk is "is my
-- certificate counted yet".
--
-- Same shape as the records queue. A select policy of their own, and one
-- function that both roles write through, so the two consoles cannot drift
-- apart and the audit entry cannot be skipped by using whichever screen
-- forgot to write it. Answering used to be a plain update from the organiser
-- console and wrote nothing to the audit log at all.
-- ===========================================================================

drop policy if exists queries_read_verifier on public.queries;
create policy queries_read_verifier
  on public.queries for select
  using (public.is_verifier());

-- Deliberately no update policy for them. Answering goes through the function
-- below, which is also what an organiser now uses.

create or replace function public.answer_question(p_query_id uuid, p_answer text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  by_verifier boolean := public.is_verifier();
  clean text := btrim(coalesce(p_answer, ''));
  asker uuid;
  subj text;
begin
  if not (by_verifier or public.admin_can('queries')) then
    raise exception 'Only a verifier or an organiser who holds Questions can answer.'
      using errcode = '42501';
  end if;

  if length(clean) < 2 then
    raise exception 'Write the answer first.' using errcode = 'P0001';
  end if;

  clean := left(clean, 4000);

  select q.author_id, q.subject into asker, subj
    from public.queries q where q.id = p_query_id;

  if asker is null then
    raise exception 'That question is not there any more. Reload the desk.'
      using errcode = 'P0001';
  end if;

  -- Sending the same question again simply overwrites. That is the only way
  -- to correct an answer that was wrong: a student cannot edit their side of
  -- a thread and neither can we, so the replacement has to go in place rather
  -- than arrive as a second message contradicting the first.
  update public.queries
     set answer      = clean,
         answered_by = auth.uid(),
         answered_at = now(),
         status      = 'answered'
   where id = p_query_id;

  perform public.audit('question.answer', 'query', p_query_id::text,
    jsonb_build_object(
      'as', case when by_verifier then 'verifier' else 'organiser' end,
      'subject', subj,
      'asker', asker));
end;
$$;

-- Granting to `authenticated` does not remove Postgres's default grant to
-- PUBLIC, so this is anon-callable until it is revoked by name.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure::text as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'answer_question'
  loop
    execute format('revoke all on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end $$;
