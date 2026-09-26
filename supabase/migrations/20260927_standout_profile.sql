-- A public profile for everybody on the standouts board, 27 September 2026.
--
-- The committee asked that a student opening the standouts can see what the
-- people on it have actually done, "but not his certificates, just info". So
-- this hands back what each record says it is (the kind, the title, the
-- level, the place, when, who ran it and a few facts particular to its kind)
-- and never a file, a Drive link, a credential link, an application number,
-- a prize amount, a stipend, an address, a PRN or a phone number.
--
-- Security definer because certificates and profiles are both closed to a
-- signed-out visitor, and should stay closed: the function is the one narrow
-- window, and it opens only onto somebody standouts_board() already names in
-- public. Anybody else gets null, exactly as if the id did not exist.

create or replace function public.standout_profile(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with board as (
    select b.category_title, b.category_position, b.metric, b.seq, b.value, b.name, b.year, b.photo
      from public.standouts_board() b
     where b.student_id = p_id
  ),
  tally as (
    select t.points, t.records, t.verified_records, t.wins, t.firsts, t.seconds, t.thirds,
           t.publications
      from public.merit_tally() t
     where t.id = p_id
  )
  select case when not exists (select 1 from board) then null else
    jsonb_build_object(
      'id', p_id,
      'name', (select name from board limit 1),
      'year', (select year from board limit 1),
      'photo', (select photo from board limit 1),
      'points', (select points from tally),
      'records', (select records from tally),
      'verified', (select verified_records from tally),
      'wins', (select wins from tally),
      'firsts', (select firsts from tally),
      'seconds', (select seconds from tally),
      'thirds', (select thirds from tally),
      'publications', (select publications from tally),
      'places', coalesce((
        select jsonb_agg(jsonb_build_object('category', category_title, 'place', seq,
                                            'metric', metric, 'value', value)
                         order by category_position, category_title)
          from board
      ), '[]'::jsonb),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'kind', c.kind,
                 'title', c.event_name,
                 'level', c.level,
                 'contribution', c.contribution,
                 'happened_on', c.happened_on,
                 'ended_on', c.ended_on,
                 'publication_year', c.publication_year,
                 'venue', c.venue_name,
                 'location', c.location,
                 'specialization', c.specialization,
                 'role', c.role_title,
                 'mode', c.mode,
                 'team_name', c.team_name,
                 'team_size', c.team_size,
                 'theme', c.theme,
                 'project', c.project_title,
                 'rank', c.rank_detail,
                 'duration', c.duration,
                 'skills', c.skills,
                 'score', c.score,
                 'patent_status', c.patent_status,
                 'chapter', c.chapter_name,
                 'authors', nullif(concat_ws(', ', nullif(btrim(c.primary_author), ''),
                                   nullif(nullif(btrim(c.secondary_authors), ''), 'NIL')), ''),
                 'indexing', c.indexing,
                 'quartile', c.quartile,
                 'publisher', c.publisher,
                 'verified', c.verified
               ) order by coalesce(c.happened_on, make_date(c.publication_year, 1, 1),
                                   c.created_at::date) desc, c.created_at desc)
          from public.certificates c
         where c.owner_id = p_id
      ), '[]'::jsonb)
    )
  end;
$function$;

revoke all on function public.standout_profile(uuid) from public;
grant execute on function public.standout_profile(uuid) to anon, authenticated;
