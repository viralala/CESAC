-- Profile photos move to Google Drive.
--
-- A profile's photo_path used to be a path in the public `avatars` bucket and
-- nothing else, always inside a folder named by the account id so one
-- student could not point at another's file. Since 26 September 2026 a new
-- photo is uploaded to Drive instead (Supabase Storage has a hard quota on
-- this plan), and the profile stores `drive:<file id>`. The bucket form is
-- still allowed: it is the fallback when Drive is unreachable, and it is what
-- every photo was until the move.
--
-- A student can write this column on their own row, so either form is
-- checked for shape. A Drive id is letters, digits, dash and underscore.

alter table public.profiles drop constraint if exists profiles_photo_path_own;
alter table public.profiles add constraint profiles_photo_path_own check (
  photo_path is null
  or (photo_path like id::text || '/%' and length(photo_path) <= 200)
  or photo_path ~ '^drive:[A-Za-z0-9_-]{10,200}$'
);

comment on column public.profiles.photo_path is
  'This account''s photo: drive:<file id> for a photo in the Drive "Profile photos" folder, or a path inside the account''s own folder in the public avatars bucket. Null until the student adds one, and the student console does not open until they have.';
