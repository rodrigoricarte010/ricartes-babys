-- ─────────────────────────────────────────────────────────────────────────
-- Ricartes Babys — endurecimento de RLS
--
-- APLICAR MANUALMENTE no SQL Editor do Supabase. Este arquivo não é executado
-- pelo build nem pelo deploy: mergear o código não altera o banco.
--
-- Para bancos já criados com a versão anterior do schema. Bancos novos já
-- nascem seguros — `schema.sql` contém tudo isto.
--
-- Idempotente: pode rodar mais de uma vez. Não apaga dados.
--
-- ── O que estava errado ──────────────────────────────────────────────────
--
-- Dentro de um EXISTS sobre `household_members`, o `household_id` não
-- qualificado NÃO se refere à linha alvo da policy — o Postgres resolve para
-- a própria tabela interna. As quatro policies abaixo ficaram registradas
-- como `m.household_id = m.household_id`, que é sempre verdadeiro:
--
--   members_insert, members_update, members_delete, children_delete
--
-- Com isso, "sou admin de ALGUMA família" passava a valer como "sou admin
-- DESTA família". Não há como um estranho atingir uma família que ele não
-- enxerga (a policy de SELECT barra UPDATE/DELETE), mas quem participa de
-- duas famílias podia apagar criança e rebaixar admin na família em que só
-- é cuidador.
--
-- A correção é nunca escrever o vínculo inline: toda checagem passa por
-- funções que recebem o id como parâmetro (h_id / c_id), o que elimina a
-- ambiguidade na origem.
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- ── 1. Funções de papel, com o id sempre explícito ───────────────────────
create or replace function public.has_household_role(h_id uuid, roles text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h_id
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

-- Escrever registros: admin, responsável e cuidador.
create or replace function public.can_write_child(c_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.children c
    join public.household_members m on m.household_id = c.household_id
    where c.id = c_id
      and m.user_id = auth.uid()
      and m.role in ('admin','responsavel','cuidador')
  );
$$;

-- Apagar registros: só admin e responsável.
create or replace function public.can_manage_child(c_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.children c
    join public.household_members m on m.household_id = c.household_id
    where c.id = c_id
      and m.user_id = auth.uid()
      and m.role in ('admin','responsavel')
  );
$$;

revoke all on function public.has_household_role(uuid, text[]) from public;
revoke all on function public.can_write_child(text) from public;
revoke all on function public.can_manage_child(text) from public;
grant execute on function public.has_household_role(uuid, text[]) to anon, authenticated;
grant execute on function public.can_write_child(text) to anon, authenticated;
grant execute on function public.can_manage_child(text) to anon, authenticated;

-- ── 2. household_members ─────────────────────────────────────────────────
-- Sem autoassociação: só um admin da própria família adiciona alguém. Antes
-- bastava conhecer o UUID da família para se inserir como admin em qualquer
-- uma — e INSERT não é limitado pela policy de SELECT, então era explorável
-- direto.
-- (ensure_household é security definer e não depende destas policies.)
drop policy if exists members_insert on public.household_members;
create policy members_insert on public.household_members
  for insert with check (
    public.has_household_role(household_id, array['admin'])
  );

drop policy if exists members_update on public.household_members;
create policy members_update on public.household_members
  for update using (public.has_household_role(household_id, array['admin']))
  with check (public.has_household_role(household_id, array['admin']));

drop policy if exists members_delete on public.household_members;
create policy members_delete on public.household_members
  for delete using (
    user_id = auth.uid()                                        -- sair da família
    or public.has_household_role(household_id, array['admin'])  -- admin remove alguém
  );

-- ── 3. households ────────────────────────────────────────────────────────
-- `created_by` não pode apontar para outra pessoa: a policy de SELECT expõe
-- a família a quem consta como criador, então um terceiro conseguia inserir
-- uma família com o id da vítima e fazê-la aparecer na lista dela.
drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update using (public.has_household_role(id, array['admin']))
  with check (public.has_household_role(id, array['admin']));

-- ── 4. children ──────────────────────────────────────────────────────────
drop policy if exists children_insert on public.children;
create policy children_insert on public.children
  for insert with check (public.has_household_role(household_id, array['admin','responsavel']));

drop policy if exists children_update on public.children;
create policy children_update on public.children
  for update using (public.has_household_role(household_id, array['admin','responsavel','cuidador']))
  with check (public.has_household_role(household_id, array['admin','responsavel','cuidador']));

drop policy if exists children_delete on public.children;
create policy children_delete on public.children
  for delete using (public.has_household_role(household_id, array['admin','responsavel']));

-- ── 5. measurements / events / diary_entries ─────────────────────────────
-- Substitui a dupla `events_write` + `events_readonly_role`. As duas eram
-- permissivas e se somavam por OR, e a segunda tentava bloquear o
-- visualizador por negação:
--
--   not exists (... m.role = 'visualizador')
--
-- Essa condição é VERDADEIRA para quem não tem vínculo nenhum, então um
-- estranho conseguia inserir eventos em criança de outra família. Papel agora
-- é checado positivamente, por presença.
--
-- A leitura continua em `can_access_child` — visualizador e visitante leem.

drop policy if exists events_write on public.events;
create policy events_write on public.events
  for insert with check (public.can_write_child(child_id));
drop policy if exists events_readonly_role on public.events;
drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update using (public.can_write_child(child_id))
  with check (public.can_write_child(child_id));
drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete using (public.can_manage_child(child_id));

drop policy if exists measurements_write on public.measurements;
create policy measurements_write on public.measurements
  for insert with check (public.can_write_child(child_id));
drop policy if exists measurements_update on public.measurements;
create policy measurements_update on public.measurements
  for update using (public.can_write_child(child_id))
  with check (public.can_write_child(child_id));
drop policy if exists measurements_delete on public.measurements;
create policy measurements_delete on public.measurements
  for delete using (public.can_manage_child(child_id));

drop policy if exists diary_write on public.diary_entries;
create policy diary_write on public.diary_entries
  for insert with check (public.can_write_child(child_id));
drop policy if exists diary_update on public.diary_entries;
create policy diary_update on public.diary_entries
  for update using (public.can_write_child(child_id))
  with check (public.can_write_child(child_id));
drop policy if exists diary_delete on public.diary_entries;
create policy diary_delete on public.diary_entries
  for delete using (public.can_manage_child(child_id));

-- ── 6. Privilégios de tabela ─────────────────────────────────────────────
-- RLS não governa TRUNCATE: a tabela é esvaziada sem passar por policy
-- nenhuma. REFERENCES e TRIGGER também não são usados pelo cliente.
-- SELECT/INSERT/UPDATE/DELETE continuam — é o RLS que decide as linhas.
--
-- Ressalva: TRUNCATE não é alcançável pelo PostgREST, então isto é correção
-- de menor privilégio, não de exploração observada.
revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated;

-- As funções de autorização deixam de estar expostas por herança de PUBLIC.
revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.can_access_child(text) from public;
grant execute on function public.is_household_member(uuid) to anon, authenticated;
grant execute on function public.can_access_child(text) to anon, authenticated;

commit;
