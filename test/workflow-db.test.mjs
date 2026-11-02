// Isolated PostgreSQL-compatible test. Never connects to Supabase or uses real accounts.
// PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node test/workflow-db.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated;
 create schema auth;
 create table auth.users(id uuid primary key);
 create table auth.identities(user_id uuid,provider text,identity_data jsonb);
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table public.pp_offerings(id uuid primary key, owner_id uuid references auth.users(id),profile jsonb,active boolean default true);
 create table public.pp_requests(id uuid primary key,offering_id uuid,owner_id uuid,client_token_hash text,data jsonb,version integer default 1,created_at timestamptz default now());
 alter table public.pp_requests enable row level security;
 create policy request_owner_read on public.pp_requests for select to authenticated using(owner_id=auth.uid());
 grant select on public.pp_requests to authenticated;
 create function public.pp_update_request(uuid,integer,jsonb) returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
 create function public.pp_get_client_request(uuid,text) returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
 create function public.pp_client_report(uuid,text,text) returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
`);
await db.exec(await readFile(new URL('../supabase/migrations/20261102_signed_negotiation.sql', import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/20261103_job_stages_archives.sql', import.meta.url),'utf8'));
const creator='10000000-0000-4000-8000-000000000001', client='10000000-0000-4000-8000-000000000002', stranger='10000000-0000-4000-8000-000000000003';
const offering='20000000-0000-4000-8000-000000000001';
for (const [i,id] of [creator,client,stranger].entries()) {
  await db.query('insert into auth.users values($1)',[id]);
  await db.query('insert into auth.identities values($1,$2,$3)',[id,'web3',{custom_claims:{address:`0x${String(i+1).repeat(40)}`,chain:'ethereum'}}]);
}
await db.query('insert into public.pp_offerings values($1,$2,$3,true)',[offering,creator,{creatorWallet:`0x${'1'.repeat(40)}`,creatorName:'Artist',serviceName:'Icon'}]);
async function actor(id, role='authenticated') {
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);
 await db.exec(`set role ${role}`);
}
const payload={clientName:'Client',requestBrief:'Original brief',amount:'10',deadline:'2026-11-07'};
async function submit(nonce='30000000-0000-4000-8000-000000000001') {
 return (await db.query('select public.pp_submit_signed_request($1,$2,$3) as value',[offering,nonce,payload])).rows[0].value;
}
async function act(job,action,details={}) {
 return (await db.query('select public.pp_signed_request_action($1,$2,$3,$4) as value',[job.id,job.version,action,details])).rows[0].value;
}
await actor(null,'anon'); await assert.rejects(submit(),/permission denied/);
await actor(client); let job=await submit();
assert.equal(job.clientWallet,`0x${'2'.repeat(40)}`);
assert.equal(job.workflowPhase,'negotiating');
assert.equal((await submit()).id,job.id);
await assert.rejects(act(job,'accept'),/Only creator/);
await actor(stranger);
assert.equal((await db.query('select * from pp_requests')).rows.length,0);
assert.equal((await db.query('select * from pp_request_history')).rows.length,0);
await assert.rejects(act(job,'decline',{reason:'attack'}),/Not authorized/);
await assert.rejects(db.query('select pp_get_client_request($1,$2)',[job.id,'anything']),/Not authorized/);
await actor(creator);
assert.equal((await db.query('select * from pp_request_history')).rows.length,1);
await assert.rejects(act(job,'decline'),/reason required/);
const original=job;
await assert.rejects(act(job,'accept'),/Start negotiation/);
job=await act(job,'start_negotiation'); assert.equal(job.workflowPhase,'approved');
await assert.rejects(db.query('select pp_signed_request_action_v1($1,$2,$3,$4)',[job.id,job.version,'accept',{}]),/permission denied/);
job=await act(job,'accept'); assert.equal(job.workflowPhase,'agreed');
await assert.rejects(act(original,'decline',{reason:'stale'}),/Conflict/);
await assert.rejects(act(job,'decline',{reason:'unilateral'}),/only during negotiation/);
await assert.rejects(act(job,'propose',payload),/Start negotiation/);
await assert.rejects(db.query('select pp_update_request($1,$2,$3)',[job.id,job.version,{status:'cancelled'}]),/Use signed workflow/);
job=await act(job,'request_cancel',{reason:'Schedule problem'});
await assert.rejects(act(job,'approve_cancel'),/Only the other participant/);
await actor(client);
job=await act(job,'reject_cancel'); assert.equal(job.workflowPhase,'agreed');
job=await act(job,'request_cancel',{reason:'Mutual cancellation'});
await actor(creator); job=await act(job,'approve_cancel'); assert.equal(job.workflowPhase,'cancelled');
await assert.rejects(act(job,'accept'),/closed/);
await actor(client); let second=await submit('30000000-0000-4000-8000-000000000002');
await actor(creator); second=await act(second,'start_negotiation'); second=await act(second,'propose',{...payload,amount:'15'});
await assert.rejects(act(second,'approve_terms'),/Only client/);
await actor(client); second=await act(second,'approve_terms');
assert.equal(second.amount,'15'); assert.equal(second.workflowPhase,'agreed');
await actor(client); let third=await submit('30000000-0000-4000-8000-000000000003');
await assert.rejects(act(third,'decline',{reason:'Client unilateral'}),/Creator can decline/);
await actor(creator); third=await act(third,'decline',{reason:'Cannot accept this work'});
assert.equal(third.cancellationReason,'Cannot accept this work');
await actor(client);
const events=(await db.query('select action,details from pp_request_history where request_id=$1 order by sequence',[third.id])).rows;
assert.equal(events[0].action,'submitted'); assert.equal(events[0].details.requestBrief,'Original brief');
assert.equal(events[1].details.reason,'Cannot accept this work');
await assert.rejects(db.query('delete from pp_request_history'),/permission denied/);
await assert.rejects(db.query('update pp_requests set data=$1',[{}]),/permission denied/);
await assert.rejects(db.query('select pp_set_request_archive($1,true)',[second.id]),/Not authorized/);
await actor(creator);
const before=(await db.query('select data,version,phase from pp_requests where id=$1',[second.id])).rows[0];
await db.query('select pp_set_request_archive($1,true)',[second.id]);
assert.equal((await db.query('select * from pp_request_archives')).rows.length,1);
const after=(await db.query('select data,version,phase from pp_requests where id=$1',[second.id])).rows[0];
assert.deepEqual(after,before);
await actor(client); assert.equal((await db.query('select * from pp_request_archives')).rows.length,0);
await actor(creator); await db.query('select pp_set_request_archive($1,false)',[second.id]);
assert.equal((await db.query('select * from pp_request_archives')).rows.length,0);
await actor(client); let fourth=await submit('30000000-0000-4000-8000-000000000004');
await actor(creator); fourth=await act(fourth,'start_negotiation');
await actor(client); fourth=await act(fourth,'request_cancel',{reason:'Before final terms'});
await actor(creator); fourth=await act(fourth,'reject_cancel'); assert.equal(fourth.workflowPhase,'approved');
fourth=await act(fourth,'decline',{reason:'Artist declines before final terms'});
assert.equal(fourth.workflowPhase,'cancelled');
await actor(null,'anon'); await assert.rejects(db.query('select pp_set_request_archive($1,true)',[second.id]),/permission denied/);
await db.close();
console.log('Signed workflow DB tests passed: wallet identity, retry, RLS, immutable journal, acceptance, counterproposal, unilateral decline before agreement, bilateral cancellation after agreement, stale versions and legacy bypass rejection.');
