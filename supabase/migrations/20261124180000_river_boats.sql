-- The Relational River: each collaborator's Boat, kept with their IRB account.
-- Applied to the Institute's shared account home (Supabase project "IRB", eu-west-1, Ireland),
-- which ReBe also uses. One row per account. Only the owner can read or change their Boat.
-- The Boat holds only what the collaborator puts in it: Source answers, practices and notes,
-- constellation, things brought aboard, a name and dates. Nothing is shared with anyone.
create table if not exists public.river_boats (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  boat jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (jsonb_typeof(boat) = 'object'),
  check (pg_column_size(boat) <= 524288)
);
alter table public.river_boats enable row level security;

drop policy if exists "Collaborators see their own Boat" on public.river_boats;
create policy "Collaborators see their own Boat" on public.river_boats
  for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "Collaborators launch their own Boat" on public.river_boats;
create policy "Collaborators launch their own Boat" on public.river_boats
  for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "Collaborators tend their own Boat" on public.river_boats;
create policy "Collaborators tend their own Boat" on public.river_boats
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "Collaborators sink their own Boat" on public.river_boats;
create policy "Collaborators sink their own Boat" on public.river_boats
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- touch_updated_at() comes from ReBe's profiles migration in the same project.
drop trigger if exists river_boats_touch on public.river_boats;
create trigger river_boats_touch before update on public.river_boats
  for each row execute function public.touch_updated_at();

revoke all on public.river_boats from anon;
grant select, insert, update, delete on public.river_boats to authenticated;

-- Deleting an account (public.delete_own_account(), from ReBe) removes the Boat too (on delete cascade).
