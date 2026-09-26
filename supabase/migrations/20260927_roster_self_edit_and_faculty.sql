-- Two roster changes, 27 September 2026.
--
-- 1. `roster_people.details`: the long form of a faculty member's profile,
--    transcribed from the Institute's own faculty pages (qualifications,
--    experience, responsibilities, publications, patents, funded projects,
--    training). Structured rather than one long "about", so the page can lay
--    it out as sections and a correction touches one entry, not a paragraph.
--
-- 2. An organiser edits their own roster page. Until now only somebody with
--    the Content capability could, from the Site pages, so a board member who
--    wanted to fix their own tagline had to ask. The card is found through
--    roster_private.email, the link the committee already keeps between a
--    card and an account, so nobody can reach a card that is not theirs.
--    What they can change is what they wrote in the first place: never the
--    name on the card, their rank, their block, their page address or who it
--    is linked to.

alter table public.roster_people add column if not exists details jsonb;

-- A portrait can also be a file this site serves itself, under /people/. The
-- faculty photos are: the Institute's own copies sit behind links that
-- expire within the hour, so they were saved once and are served from here.
alter table public.roster_people drop constraint if exists roster_people_profile_sane;
alter table public.roster_people add constraint roster_people_profile_sane check (
  (slug is null or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80))
  and (preferred_name is null or length(preferred_name) <= 80)
  and (year_branch is null or length(year_branch) <= 80)
  and (tagline is null or length(tagline) <= 240)
  and (about is null or length(about) <= 2000)
  and (hobbies is null or length(hobbies) <= 400)
  and (fun_fact is null or length(fun_fact) <= 500)
  and (tenure is null or length(tenure) <= 80)
  and (photo_url is null or ((photo_url ~ '^https://' or photo_url ~ '^/people/[a-z0-9-]+\.(jpg|png|webp)$')
                             and length(photo_url) <= 400))
  and (instagram is null or (instagram ~ '^https://' and length(instagram) <= 300))
  and (linkedin is null or (linkedin ~ '^https://' and length(linkedin) <= 300))
  and (github is null or (github ~ '^https://' and length(github) <= 300))
);

create or replace function public.my_roster_person()
returns setof public.roster_people
language sql
stable
security definer
set search_path to 'public'
as $function$
  select r.*
    from public.roster_people r
    join public.roster_private rp on rp.person_id = r.id
    join public.profiles p on lower(p.email) = lower(rp.email)
   where p.id = auth.uid()
     and public.is_admin()
   order by r.visible desc, r.updated_at desc
   limit 1;
$function$;

create or replace function public.save_my_roster_profile(
  p_preferred_name text default null,
  p_year_branch text default null,
  p_tagline text default null,
  p_about text default null,
  p_hobbies text default null,
  p_fun_fact text default null,
  p_instagram text default null,
  p_linkedin text default null,
  p_github text default null
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_name text;
  saved text;
  v_link text;
begin
  if not public.is_admin() then
    raise exception 'Only organisers can edit a roster page from here.' using errcode = '42501';
  end if;

  select id, name into v_id, v_name from public.my_roster_person();
  if v_id is null then
    raise exception 'Your account is not linked to a card on the roster yet.' using errcode = 'P0001';
  end if;

  foreach v_link in array array[p_instagram, p_linkedin, p_github] loop
    if nullif(btrim(coalesce(v_link, '')), '') is not null and btrim(v_link) !~ '^https://' then
      raise exception 'Links have to start with https://.' using errcode = 'P0001';
    end if;
  end loop;

  update public.roster_people
     set preferred_name = nullif(left(btrim(coalesce(p_preferred_name, '')), 80), ''),
         year_branch = nullif(left(btrim(coalesce(p_year_branch, '')), 80), ''),
         tagline = nullif(left(btrim(coalesce(p_tagline, '')), 240), ''),
         about = nullif(left(btrim(coalesce(p_about, '')), 2000), ''),
         hobbies = nullif(left(btrim(coalesce(p_hobbies, '')), 400), ''),
         fun_fact = nullif(left(btrim(coalesce(p_fun_fact, '')), 500), ''),
         instagram = nullif(left(btrim(coalesce(p_instagram, '')), 300), ''),
         linkedin = nullif(left(btrim(coalesce(p_linkedin, '')), 300), ''),
         github = nullif(left(btrim(coalesce(p_github, '')), 300), ''),
         updated_at = now()
   where id = v_id
  returning slug into saved;

  perform public.audit('roster.profile.self_saved', 'roster_person', v_id::text,
                       jsonb_build_object('name', v_name, 'slug', saved));
  return saved;
end;
$function$;

revoke all on function public.my_roster_person() from public, anon;
revoke all on function public.save_my_roster_profile(text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.my_roster_person() to authenticated;
grant execute on function public.save_my_roster_profile(text, text, text, text, text, text, text, text, text) to authenticated;
