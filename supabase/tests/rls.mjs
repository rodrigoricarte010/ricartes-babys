#!/usr/bin/env node
/**
 * Testes de RLS do Ricartes Babys.
 *
 * Roda o schema num Postgres real (PGlite, em memória — não toca em nada
 * remoto), cria dados fictícios e ataca as policies como cada perfil faria.
 *
 *   npm run test:rls
 *
 * Cada sonda roda numa transação com ROLLBACK: uma não contamina a seguinte.
 * Sai com código 1 se alguma asserção falhar.
 *
 * Por que medir `affectedRows` e não "deu erro": no RLS, UPDATE e DELETE não
 * lançam exceção quando barram um registro — apenas deixam de afetar linhas.
 * E `RETURNING` não serve de medida, porque passa pela policy de SELECT.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const schemaSql = readFileSync(join(ROOT, "supabase/schema.sql"), "utf8")
  // PGlite já é PG16 (gen_random_uuid é nativo) e não tem a extensão.
  .replace(/create extension[^;]+;/i, "");

// Espelha o ambiente do Supabase: schema auth, roles anon/authenticated e
// `auth.uid()` lendo o claim do JWT.
const SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $$;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
`;

// Perfis fictícios.
const A = "11111111-1111-1111-1111-111111111111"; // admin da família A
const V = "22222222-2222-2222-2222-222222222222"; // visualizador na família A
const B = "33333333-3333-3333-3333-333333333333"; // admin da família B
const C = "44444444-4444-4444-4444-444444444444"; // sem vínculo nenhum
const E = "55555555-5555-5555-5555-555555555555"; // admin da E, cuidador na A
const FA = "aaaaaaaa-0000-0000-0000-000000000001";
const FB = "bbbbbbbb-0000-0000-0000-000000000002";
const FE = "eeeeeeee-0000-0000-0000-000000000003";

const db = new PGlite();
await db.exec(SHIM);
// No Supabase, anon/authenticated nascem com privilégios amplos porque o
// `grant all` é aplicado na criação da tabela. Reproduzimos isso com default
// privileges ANTES de carregar o schema — assim o revoke de schema.sql, que
// roda depois, é o que vale. (Conceder depois mascararia a correção.)
await db.exec(`
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`);
await db.exec(schemaSql);

async function seed() {
  await db.exec(`
    delete from public.diary_entries; delete from public.events;
    delete from public.measurements; delete from public.children;
    delete from public.household_members; delete from public.households;
    delete from public.profiles; delete from auth.users;
    insert into auth.users (id, email) values
      ('${A}','a@teste'),('${V}','v@teste'),('${B}','b@teste'),
      ('${C}','c@teste'),('${E}','e@teste');
    insert into public.households (id, name, created_by) values
      ('${FA}','Família A','${A}'),('${FB}','Família B','${B}'),('${FE}','Família E','${E}');
    insert into public.household_members (household_id, user_id, role) values
      ('${FA}','${A}','admin'),('${FA}','${V}','visualizador'),('${FA}','${E}','cuidador'),
      ('${FB}','${B}','admin'),('${FE}','${E}','admin');
    insert into public.children (id, household_id, first_name, sex, birth_date) values
      ('childA1','${FA}','Rosie','female','2025-01-10');
    insert into public.events (id, child_id, kind, started_at) values
      ('evA1','childA1','feeding', now());
    insert into public.measurements (id, child_id, taken_at) values
      ('msA1','childA1', now());
    insert into public.diary_entries (id, child_id, date, text) values
      ('drA1','childA1', current_date, 'primeiro registro');
  `);
}

/** Executa o SQL como o usuário e devolve affectedRows / linhas vistas. */
async function as(uid, sql, role = "authenticated") {
  await seed();
  await db.exec("begin");
  try {
    await db.exec(`select set_config('request.jwt.claim.sub','${uid}', true); set local role ${role};`);
    const r = await db.query(sql);
    return { err: null, n: r.affectedRows ?? 0, seen: r.rows?.length ?? 0 };
  } catch (e) {
    return { err: (e.message || "").split("\n")[0].replace(/^error:\s*/, "").slice(0, 60), n: 0, seen: 0 };
  } finally {
    await db.exec("rollback");
  }
}

const T = [];
/** esperado: "BLOQUEADO" (não pode alterar nada) | "PERMITIDO" (deve alterar) */
const write = (id, desc, esperado, uid, sql) =>
  T.push({ id, desc, esperado, run: () => as(uid, sql) });
const read = (id, desc, esperado, uid, sql, role) =>
  T.push({ id, desc, esperado, read: true, run: () => as(uid, sql, role) });

// ── Escalada de privilégio em household_members ──────────────────────────
write("1a", "usuário sem vínculo se insere como admin na família A", "BLOQUEADO", C,
  `insert into public.household_members (household_id,user_id,role) values ('${FA}','${C}','admin')`);
write("1b", "admin da B se insere na família A", "BLOQUEADO", B,
  `insert into public.household_members (household_id,user_id,role) values ('${FA}','${B}','admin')`);
write("1c", "usuário se insere em família cujo id adivinhou", "BLOQUEADO", C,
  `insert into public.household_members (household_id,user_id,role) values ('${FB}','${C}','visualizador')`);

// ── Vínculo entre famílias (a comparação degenerada) ─────────────────────
write("2a", "cuidador na A + admin na E apaga a criança da A", "BLOQUEADO", E,
  `delete from public.children where id='childA1'`);
write("2b", "cuidador na A + admin na E rebaixa o admin da A", "BLOQUEADO", E,
  `update public.household_members set role='visualizador' where household_id='${FA}' and user_id='${A}'`);
write("2c", "cuidador na A + admin na E apaga membro da A", "BLOQUEADO", E,
  `delete from public.household_members where household_id='${FA}' and user_id='${V}'`);
write("2d", "admin da B apaga criança da família A", "BLOQUEADO", B,
  `delete from public.children where id='childA1'`);

// ── events_readonly_role: bloqueio por negação ───────────────────────────
write("3a", "usuário sem vínculo insere evento em criança alheia", "BLOQUEADO", C,
  `insert into public.events (id,child_id,kind,started_at) values ('x2','childA1','sleep',now())`);
write("3b", "visualizador insere evento", "BLOQUEADO", V,
  `insert into public.events (id,child_id,kind,started_at) values ('x1','childA1','sleep',now())`);

// ── Papel de visualizador ────────────────────────────────────────────────
write("4a", "visualizador atualiza criança", "BLOQUEADO", V,
  `update public.children set first_name='x' where id='childA1'`);
write("4b", "visualizador insere medição", "BLOQUEADO", V,
  `insert into public.measurements (id,child_id,taken_at) values ('m2','childA1',now())`);
write("4c", "visualizador apaga evento", "BLOQUEADO", V,
  `delete from public.events where id='evA1'`);
write("4d", "visualizador insere criança", "BLOQUEADO", V,
  `insert into public.children (id,household_id,first_name,sex,birth_date) values ('c2','${FA}','V','male','2025-02-02')`);
write("4e", "visualizador apaga criança", "BLOQUEADO", V,
  `delete from public.children where id='childA1'`);
write("4f", "visualizador escreve no diário", "BLOQUEADO", V,
  `insert into public.diary_entries (id,child_id,date,text) values ('d2','childA1',current_date,'x')`);
write("4g", "visualizador apaga medição", "BLOQUEADO", V,
  `delete from public.measurements where id='msA1'`);

// ── created_by apontando para outra pessoa ───────────────────────────────
write("5a", "cria família com created_by = vítima", "BLOQUEADO", B,
  `insert into public.households (name,created_by) values ('Falsa','${A}')`);

// ── Privilégios de tabela ────────────────────────────────────────────────
const priv = (id, desc, esperado, role, tbl, action) => T.push({
  id, desc, esperado,
  run: async () => {
    const r = await db.query(`select has_table_privilege('${role}','public.${tbl}','${action}') p`);
    return { err: null, n: r.rows[0].p ? 1 : 0, seen: 0 };
  },
});
priv("6a", "authenticated sem TRUNCATE em events", "BLOQUEADO", "authenticated", "events", "TRUNCATE");
priv("6b", "anon sem TRUNCATE em children", "BLOQUEADO", "anon", "children", "TRUNCATE");
priv("6c", "anon sem REFERENCES em children", "BLOQUEADO", "anon", "children", "REFERENCES");
priv("6d", "authenticated sem TRIGGER em events", "BLOQUEADO", "authenticated", "events", "TRIGGER");
priv("6e", "authenticated mantém UPDATE em events", "PERMITIDO", "authenticated", "events", "UPDATE");
priv("6f", "authenticated mantém DELETE em events", "PERMITIDO", "authenticated", "events", "DELETE");
priv("6g", "anon mantém SELECT em children", "PERMITIDO", "anon", "children", "SELECT");

// ── O app precisa continuar funcionando ──────────────────────────────────
write("c1", "admin da A insere evento na própria família", "PERMITIDO", A,
  `insert into public.events (id,child_id,kind,started_at) values ('x3','childA1','sleep',now())`);
write("c2", "admin da A apaga evento", "PERMITIDO", A, `delete from public.events where id='evA1'`);
write("c3", "admin da A atualiza a criança", "PERMITIDO", A,
  `update public.children set first_name='Ana' where id='childA1'`);
write("c4", "admin da A apaga criança", "PERMITIDO", A, `delete from public.children where id='childA1'`);
write("c5", "cuidador da A registra evento", "PERMITIDO", E,
  `insert into public.events (id,child_id,kind,started_at) values ('x5','childA1','sleep',now())`);
write("c6", "admin da A promove membro a admin", "PERMITIDO", A,
  `update public.household_members set role='admin' where household_id='${FA}' and user_id='${E}'`);
write("c7", "membro sai da própria família", "PERMITIDO", E,
  `delete from public.household_members where household_id='${FA}' and user_id='${E}'`);
write("c8", "admin da A insere medição", "PERMITIDO", A,
  `insert into public.measurements (id,child_id,taken_at) values ('m3','childA1',now())`);
write("c9", "admin da A escreve no diário", "PERMITIDO", A,
  `insert into public.diary_entries (id,child_id,date,text) values ('d3','childA1',current_date,'y')`);
read("c10", "admin da A lê a própria criança", "PERMITIDO", A,
  `select 1 from public.children where id='childA1'`);
read("c11", "visualizador lê a criança (só leitura funciona)", "PERMITIDO", V,
  `select 1 from public.children where id='childA1'`);
read("c12", "usuário sem vínculo cria a própria família", "PERMITIDO", C,
  `select public.ensure_household('Família C')`);

// ── Isolamento entre famílias ────────────────────────────────────────────
read("r1", "admin da B lê criança da família A", "BLOQUEADO", B,
  `select 1 from public.children where id='childA1'`);
read("r2", "anon lê crianças", "BLOQUEADO", "", `select 1 from public.children`, "anon");

// ── Execução ─────────────────────────────────────────────────────────────
const results = [];
for (const x of T) {
  const r = await x.run();
  const mudou = !r.err && (x.read ? r.seen > 0 : r.n > 0);
  const pass = x.esperado === "PERMITIDO" ? mudou : !mudou;
  results.push({
    ...x,
    pass,
    obtido: r.err ? `ERRO: ${r.err}` : mudou ? `afetou ${x.read ? r.seen : r.n}` : "nenhuma linha",
  });
}

const bad = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "ok   " : "FALHA"} ${r.id.padEnd(4)} ${r.esperado.padEnd(9)} ${String(r.obtido).padEnd(28)} ${r.desc}`);
}
console.log(`\n${results.length - bad.length}/${results.length} conformes`);
if (bad.length) {
  console.log(`Falhas: ${bad.map((b) => b.id).join(", ")}`);
  process.exitCode = 1;
}
await db.close();
