-- 0001_init.sql — schéma initial Nomad (spec §3.3). GROUNDWORK Phase 3.
-- Local (AsyncStorage) = source de vérité ; ces tables = backup/sync + social.
-- RLS OBLIGATOIRE sur toutes les tables.

-- profiles : 1 ligne / joueur
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

-- game_saves : état sérialisé (source locale = vérité, ceci = backup/sync)
create table if not exists game_saves (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null,  -- { money, gems, miles, jobs:{}, currentCountryId, collection:[] }
  updated_at timestamptz default now()
);

-- leaderboard_entries : dérivé, pour le classement global
create table if not exists leaderboard_entries (
  user_id uuid primary key references auth.users on delete cascade,
  total_miles bigint default 0,
  countries_unlocked int default 0,
  updated_at timestamptz default now()
);

-- ————— RLS —————
alter table profiles enable row level security;
alter table game_saves enable row level security;
alter table leaderboard_entries enable row level security;

-- profiles : le joueur gère sa propre ligne ; lecture publique du pseudo.
create policy "profiles public read" on profiles for select using (true);
create policy "profiles own insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles own update" on profiles for update using (auth.uid() = id);

-- game_saves : strictement privé.
create policy "save own select" on game_saves for select using (auth.uid() = user_id);
create policy "save own insert" on game_saves for insert with check (auth.uid() = user_id);
create policy "save own update" on game_saves for update using (auth.uid() = user_id);

-- leaderboard : lecture publique, écriture via RPC atomique uniquement (pas d'INSERT/UPDATE direct).
create policy "leaderboard public read" on leaderboard_entries for select using (true);

-- ————— RPC atomique : upsert save + recalcul leaderboard en une transaction —————
create or replace function sync_game_state(
  p_state jsonb,
  p_total_miles bigint,
  p_countries_unlocked int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into game_saves (user_id, state, updated_at)
    values (auth.uid(), p_state, now())
    on conflict (user_id) do update set state = excluded.state, updated_at = now();

  insert into leaderboard_entries (user_id, total_miles, countries_unlocked, updated_at)
    values (auth.uid(), p_total_miles, p_countries_unlocked, now())
    on conflict (user_id) do update
      set total_miles = excluded.total_miles,
          countries_unlocked = excluded.countries_unlocked,
          updated_at = now();
end;
$$;
