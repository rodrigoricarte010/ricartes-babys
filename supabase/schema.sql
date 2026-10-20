-- ─────────────────────────────────────────────────────────────────────────
-- Ricartes Babys — schema Supabase (Postgres)
--
-- Como aplicar:
--   1. Crie um projeto em https://supabase.com
--   2. SQL Editor → cole este arquivo → Run
--   3. Copie URL + anon key para .env.local
--
-- Segurança: toda a autorização fica AQUI, via Row Level Security. O código
-- do navegador nunca decide quem pode ler o quê — o Postgres decide. Uma
-- pessoa só enxerga dados de crianças das famílias (households) às quais
-- pertence.
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Perfis ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ── Famílias (households) ────────────────────────────────────────────────
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Família Ricartes',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'responsavel' check (role in ('admin','responsavel','cuidador','visualizador')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ── Crianças ─────────────────────────────────────────────────────────────
create table if not exists public.children (
  id text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text,
  nickname text,
  sex text not null check (sex in ('female','male')),
  birth_date date not null,
  birth_time text,
  birth_weight_kg numeric(6,3),
  birth_length_cm numeric(5,2),
  birth_head_cm numeric(5,2),
  gestational_weeks integer,
  blood_type text,
  color text,
  photo_data_url text,
  notes text,
  father_height_cm numeric(5,2),
  mother_height_cm numeric(5,2),
  pediatrician_name text,
  pediatrician_phone text,
  health_plan text,
  emergency_contacts jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists children_household_idx on public.children (household_id);

-- Para bancos criados com versões anteriores do schema (atualização idempotente)
alter table public.children add column if not exists father_height_cm numeric(5,2);
alter table public.children add column if not exists mother_height_cm numeric(5,2);
alter table public.children add column if not exists pediatrician_name text;
alter table public.children add column if not exists pediatrician_phone text;
alter table public.children add column if not exists health_plan text;
alter table public.children add column if not exists emergency_contacts jsonb not null default '[]'::jsonb;

-- ── Medições de crescimento ──────────────────────────────────────────────
create table if not exists public.measurements (
  id text primary key,
  child_id text not null references public.children (id) on delete cascade,
  taken_at timestamptz not null,
  weight_kg numeric(6,3),
  length_cm numeric(5,2),
  head_cm numeric(5,2),
  source text not null default 'casa' check (source in ('nascimento','casa','consulta')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measurements_child_idx on public.measurements (child_id, taken_at);

-- ── Eventos de rotina (mamada, sono, fralda, vacina, marco…) ─────────────
create table if not exists public.events (
  id text primary key,
  child_id text not null references public.children (id) on delete cascade,
  kind text not null check (kind in ('feeding','sleep','diaper','medicine','symptom','milestone','vaccine','appointment','note')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_min numeric(7,2),
  payload jsonb not null default '{}'::jsonb,
  note text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists events_child_idx on public.events (child_id, started_at);
create index if not exists events_kind_idx on public.events (child_id, kind);

-- ── Diário de memórias ───────────────────────────────────────────────────
create table if not exists public.diary_entries (
  id text primary key,
  child_id text not null references public.children (id) on delete cascade,
  date date not null,
  title text,
  text text not null,
  mood text check (mood in ('otimo','bem','neutro','dificil','ruim')),
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists diary_child_idx on public.diary_entries (child_id, date);

-- ─────────────────────────────────────────────────────────────────────────
-- Funções de autorização
-- ─────────────────────────────────────────────────────────────────────────

-- True se o usuário autenticado pertence à família informada.
create or replace function public.is_household_member(h_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

-- True se o usuário pertence à família da criança informada.
create or replace function public.can_access_child(c_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.children c
    where c.id = c_id and public.is_household_member(c.household_id)
  );
$$;

-- Perfil automático quando alguém cria conta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria a família do usuário e o vínculo de admin numa única transação.
--
-- Por que uma função: o cliente fazia dois inserts separados e lia de volta a
-- família recém-criada. Como o `RETURNING` passa pela policy de SELECT, e o
-- usuário ainda não era membro naquele instante, o insert "funcionava" mas a
-- linha não voltava — deixando famílias órfãs a cada tentativa. Aqui o corpo
-- roda como um único statement: ou os dois inserts acontecem, ou nenhum.
--
-- `security definer` é necessário para o SELECT em household_members não ser
-- filtrado pela RLS antes de existir o vínculo. A função não recebe id de
-- usuário como parâmetro: ela sempre usa auth.uid(), então não há como um
-- usuário agir em nome de outro.
create or replace function public.ensure_household(p_name text default 'Família Ricartes')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  h_id uuid;
begin
  if uid is null then
    raise exception 'ensure_household: usuario nao autenticado';
  end if;

  select m.household_id into h_id
  from public.household_members m
  where m.user_id = uid
  order by m.created_at
  limit 1;

  if h_id is not null then
    return h_id;
  end if;

  insert into public.households (name, created_by)
  values (coalesce(nullif(btrim(p_name), ''), 'Família Ricartes'), uid)
  returning id into h_id;

  insert into public.household_members (household_id, user_id, role)
  values (h_id, uid, 'admin');

  return h_id;
end;
$$;

revoke all on function public.ensure_household(text) from public;
revoke all on function public.ensure_household(text) from anon;
grant execute on function public.ensure_household(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.children enable row level security;
alter table public.measurements enable row level security;
alter table public.events enable row level security;
alter table public.diary_entries enable row level security;

-- profiles: cada um vê e edita o próprio; membros da mesma família se veem.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for select using (id = auth.uid());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- households: membros leem; qualquer autenticado cria; admin edita.
-- `created_by = auth.uid()` cobre a janela entre criar a família e virar
-- membro dela: sem isso o INSERT funciona mas o RETURNING volta vazio.
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select using (
    public.is_household_member(id) or created_by = auth.uid()
  );
drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert with check (auth.uid() is not null);
drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update using (
    exists (select 1 from public.household_members m
            where m.household_id = id and m.user_id = auth.uid() and m.role = 'admin')
  );

-- members: membros leem a própria família; o dono entra como admin; admin gerencia.
drop policy if exists members_select on public.household_members;
create policy members_select on public.household_members
  for select using (public.is_household_member(household_id));
drop policy if exists members_insert on public.household_members;
create policy members_insert on public.household_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from public.household_members m
               where m.household_id = household_id and m.user_id = auth.uid() and m.role = 'admin')
  );
drop policy if exists members_update on public.household_members;
create policy members_update on public.household_members
  for update using (
    exists (select 1 from public.household_members m
            where m.household_id = household_id and m.user_id = auth.uid() and m.role = 'admin')
  );
drop policy if exists members_delete on public.household_members;
create policy members_delete on public.household_members
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.household_members m
               where m.household_id = household_id and m.user_id = auth.uid() and m.role = 'admin')
  );

-- children: só a família.
drop policy if exists children_select on public.children;
create policy children_select on public.children
  for select using (public.is_household_member(household_id));
drop policy if exists children_insert on public.children;
create policy children_insert on public.children
  for insert with check (public.is_household_member(household_id));
drop policy if exists children_update on public.children;
create policy children_update on public.children
  for update using (public.is_household_member(household_id));
drop policy if exists children_delete on public.children;
create policy children_delete on public.children
  for delete using (
    exists (select 1 from public.household_members m
            where m.household_id = household_id and m.user_id = auth.uid() and m.role in ('admin','responsavel'))
  );

-- measurements / events / diary: herdam a permissão da criança.
drop policy if exists measurements_select on public.measurements;
create policy measurements_select on public.measurements
  for select using (public.can_access_child(child_id));
drop policy if exists measurements_write on public.measurements;
create policy measurements_write on public.measurements
  for insert with check (public.can_access_child(child_id));
drop policy if exists measurements_update on public.measurements;
create policy measurements_update on public.measurements
  for update using (public.can_access_child(child_id));
drop policy if exists measurements_delete on public.measurements;
create policy measurements_delete on public.measurements
  for delete using (public.can_access_child(child_id));

drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select using (public.can_access_child(child_id));
drop policy if exists events_write on public.events;
create policy events_write on public.events
  for insert with check (public.can_access_child(child_id));
drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update using (public.can_access_child(child_id));
drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete using (public.can_access_child(child_id));

drop policy if exists diary_select on public.diary_entries;
create policy diary_select on public.diary_entries
  for select using (public.can_access_child(child_id));
drop policy if exists diary_write on public.diary_entries;
create policy diary_write on public.diary_entries
  for insert with check (public.can_access_child(child_id));
drop policy if exists diary_update on public.diary_entries;
create policy diary_update on public.diary_entries
  for update using (public.can_access_child(child_id));
drop policy if exists diary_delete on public.diary_entries;
create policy diary_delete on public.diary_entries
  for delete using (public.can_access_child(child_id));

-- "Visualizador" não escreve: reforçado aqui para os papéis de leitura.
drop policy if exists events_readonly_role on public.events;
create policy events_readonly_role on public.events
  for insert with check (
    not exists (select 1 from public.children c
                join public.household_members m on m.household_id = c.household_id
                where c.id = child_id and m.user_id = auth.uid() and m.role = 'visualizador')
  );

-- ── Atualização automática de updated_at ─────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_children on public.children;
create trigger touch_children before update on public.children
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_measurements on public.measurements;
create trigger touch_measurements before update on public.measurements
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_events on public.events;
create trigger touch_events before update on public.events
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_diary on public.diary_entries;
create trigger touch_diary before update on public.diary_entries
  for each row execute function public.touch_updated_at();
