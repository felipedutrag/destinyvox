// Runs actual PostgreSQL SQL in memory. No remote database, payment or email.
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const user = uid(1), other = uid(2), map = uid(10), otherMap = uid(11);
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    create table public.profiles(id uuid primary key);
    create table public.numerology_maps(id uuid primary key, user_id uuid, status text, full_interpretation jsonb);
    create table public.payments(id uuid primary key, user_id uuid, map_id uuid, status text, metadata jsonb, created_at timestamptz default now());
    grant all on public.profiles, public.numerology_maps, public.payments to service_role;
    insert into profiles values ('${user}'), ('${other}');
    insert into numerology_maps values ('${map}', '${user}', 'completed', '{"purchase":{"product":"map"}}'), ('${otherMap}', '${other}', 'completed', '{}');
  `);
  const sql = fs.readFileSync("scripts/sinastria-schema.sql", "utf8");
  await db.exec(sql);
  await db.exec(sql); // Installation is safe to repeat.
  await db.exec(`set role service_role;
    insert into relationship_people(id,user_id,name,birth_date) values
    ('${uid(20)}','${user}','Rafael Almeida','1992-09-23'),
    ('${uid(21)}','${user}','Ana Silva','1990-01-01'),
    ('${uid(22)}','${other}','Pessoa Privada','1990-01-01');`);
  const call = (person, owner = user, source = map, report = { version: 1 }) => db.query("select * from public.create_synastry($1,$2,$3,$4)", [owner, source, person, report]);
  await assert.rejects(() => call(uid(20)), /NO_CREDIT/);
  await db.query("insert into payments values ($1,$2,$3,'PENDING',$4,now())", [uid(30), user, map, { product: "map", bumps: ["synastry"] }]);
  await assert.rejects(() => call(uid(20)), /NO_CREDIT/);
  await db.query("update payments set status = 'PAID' where id = $1", [uid(30)]);
  await assert.rejects(() => call(uid(22)), /PERSON_NOT_FOUND/);
  await assert.rejects(() => call(uid(20), other, map), /MAP_NOT_FOUND/);
  await assert.rejects(() => call(uid(20), user, otherMap), /MAP_NOT_FOUND/);
  await assert.rejects(() => call(uid(20), user, map, null), /not-null/);
  assert.equal((await db.query("select count(*)::int n from synastry_reports")).rows[0].n, 0, "failed report does not spend credit");
  const first = (await call(uid(20))).rows[0];
  assert.equal(first.payment_id, uid(30));
  const again = (await call(uid(20), user, map, { replaced: true })).rows[0];
  assert.equal(again.id, first.id);
  assert.deepEqual(again.report, { version: 1 }, "reread preserves original snapshot");
  await assert.rejects(() => call(uid(21)), /NO_CREDIT/);
  await db.query("insert into payments values ($1,$2,null,'PAID',$3,now())", [uid(31), user, { product: "synastry_credit", sourceMapId: otherMap }]);
  await assert.rejects(() => call(uid(21)), /NO_CREDIT/, "credit for another map is not transferable");
  await db.query("insert into payments values ($1,$2,null,'PAID',$3,now())", [uid(32), user, { product: "synastry_credit", sourceMapId: map }]);
  const repeated = await Promise.all([call(uid(21)), call(uid(21)), call(uid(21))]);
  assert.equal(new Set(repeated.map(r => r.rows[0].id)).size, 1, "overlapping calls are idempotent");
  assert.equal((await db.query("select count(*)::int n from synastry_reports")).rows[0].n, 2);
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  assert.equal((await db.query("select * from relationship_people")).rows.length, 2);
  assert.equal((await db.query("select * from synastry_reports")).rows.length, 2);
  await assert.rejects(() => call(uid(21)), /permission denied/);
  for (const table of ["relationship_people", "synastry_reports"]) {
    await assert.rejects(() => db.exec(`delete from ${table}`), /permission denied/);
    await assert.rejects(() => db.exec(`update ${table} set user_id='${other}'`), /permission denied/);
    await assert.rejects(() => db.exec(`insert into ${table}(id) values ('${uid(90)}')`), /permission denied/);
  }
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
  assert.equal((await db.query("select * from relationship_people")).rows.length, 1);
  assert.equal((await db.query("select * from synastry_reports")).rows.length, 0);
  await db.exec("reset role; set role anon;");
  for (const table of ["relationship_people", "synastry_reports"]) await assert.rejects(() => db.exec(`select * from ${table}`), /permission denied/);
  await assert.rejects(() => call(uid(20)), /permission denied/);
  console.log("PASS PostgreSQL: repeatable SQL, paid-only credits, atomic rollback, duplicate requests, saved snapshot, owner/map isolation, RLS reads and denied client writes/RPC.");
} finally { await db.close(); }
