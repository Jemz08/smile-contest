create extension if not exists pgcrypto;

create table if not exists public.smile_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 20),
  normalized_name text generated always as (lower(btrim(name))) stored unique,
  score integer not null check (score between 0 and 100),
  photo text not null check (
    left(photo, 23) = 'data:image/jpeg;base64,'
    and char_length(photo) <= 240000
  ),
  created_at timestamptz not null default now()
);

alter table public.smile_scores enable row level security;
revoke all on table public.smile_scores from anon, authenticated;
grant select, delete on table public.smile_scores to service_role;
grant usage on schema public to anon, authenticated;

drop function if exists public.submit_smile_score(text, integer, text);
create function public.submit_smile_score(p_name text, p_score integer, p_photo text)
returns table(name text, score integer, photo text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if char_length(clean_name) not between 1 and 20
    or p_score is null
    or p_score not between 0 and 100
    or p_photo is null
    or left(p_photo, 23) <> 'data:image/jpeg;base64,'
    or char_length(p_photo) > 240000 then
    raise exception 'Invalid smile score submission' using errcode = '22023';
  end if;

  return query
  insert into public.smile_scores as current_score (name, score, photo)
  values (clean_name, p_score, p_photo)
  on conflict (normalized_name) do update
  set score = greatest(current_score.score, excluded.score),
      photo = case when excluded.score > current_score.score then excluded.photo else current_score.photo end
  returning current_score.name, current_score.score, current_score.photo, current_score.created_at;
end;
$$;

revoke all on function public.submit_smile_score(text, integer, text) from public;
grant execute on function public.submit_smile_score(text, integer, text) to anon, authenticated;
grant execute on function public.submit_smile_score(text, integer, text) to service_role;
