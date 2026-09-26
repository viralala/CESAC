-- What the running events' pages say, editable from the console, 27 September 2026.
--
-- Attack on Token and HR Final Boss were written into the source, so changing
-- a prize, a chapter's task or the speaker tease took a commit and a deploy.
-- The committee asked to change the details of events that are already
-- running. The source keeps the text as it stands today; a row here overrides
-- it section by section (the hero, the vitals, the chapters, the awards and
-- so on), so a section nobody has touched still reads from the source and
-- clearing a row puts the page back exactly as it was.
--
-- Readable by anybody, because it is the text of a public page. Written only
-- through admin_save_event_content(), by an organiser with the Events
-- capability, and every save is audited.

create table if not exists public.event_content (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.event_content enable row level security;

drop policy if exists event_content_read on public.event_content;
create policy event_content_read on public.event_content for select to anon, authenticated using (true);

revoke insert, update, delete on public.event_content from anon, authenticated;

create or replace function public.admin_save_event_content(p_slug text, p_content jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.admin_can('events') then
    raise exception 'You do not have access to the events.' using errcode = '42501';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'That is not a page to save.' using errcode = 'P0001';
  end if;
  if length(p_content::text) > 200000 then
    raise exception 'That is too much text for one event page.' using errcode = 'P0001';
  end if;

  insert into public.event_content (slug, content, updated_by, updated_at)
  values (p_slug, p_content, auth.uid(), now())
  on conflict (slug) do update
    set content = excluded.content, updated_by = excluded.updated_by, updated_at = now();

  perform public.audit('event.content.saved', 'event', p_slug,
                       jsonb_build_object('sections', (select jsonb_agg(k) from jsonb_object_keys(p_content) k)));
end;
$function$;

create or replace function public.admin_reset_event_section(p_slug text, p_section text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.admin_can('events') then
    raise exception 'You do not have access to the events.' using errcode = '42501';
  end if;
  update public.event_content
     set content = content - p_section, updated_by = auth.uid(), updated_at = now()
   where slug = p_slug;
  perform public.audit('event.content.reset', 'event', p_slug, jsonb_build_object('section', p_section));
end;
$function$;

revoke all on function public.admin_save_event_content(text, jsonb) from public, anon;
revoke all on function public.admin_reset_event_section(text, text) from public, anon;
grant execute on function public.admin_save_event_content(text, jsonb) to authenticated;
grant execute on function public.admin_reset_event_section(text, text) to authenticated;
