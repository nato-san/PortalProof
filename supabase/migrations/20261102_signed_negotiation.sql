-- Additive preparation. Apply AFTER 20261101_shared_requests.sql.
-- Do not release the new workflow UI until this migration and auth tests pass.
BEGIN;
alter table public.pp_requests add column client_user_id uuid references auth.users(id);
alter table public.pp_requests add column submission_nonce uuid;
alter table public.pp_requests add column phase text not null default 'legacy'
 check (phase in ('legacy','negotiating','proposed','agreed','cancelled'));
create unique index pp_signed_request_retry on public.pp_requests(client_user_id,submission_nonce);
create policy request_client_read on public.pp_requests for select to authenticated
 using(client_user_id=auth.uid());

create table public.pp_request_history (
 sequence bigint generated always as identity primary key,
 request_id uuid not null references public.pp_requests(id),
 actor_id uuid not null references auth.users(id), action text not null,
 details jsonb not null, created_at timestamptz not null default now()
);
alter table public.pp_request_history enable row level security;
revoke all on public.pp_request_history from public, anon, authenticated;
grant select on public.pp_request_history to authenticated;
create policy request_history_participant on public.pp_request_history for select to authenticated
 using(exists(select 1 from public.pp_requests r where r.id=request_id and (r.owner_id=auth.uid() or r.client_user_id=auth.uid())));

-- Identity claims come from Supabase's verified Web3 provider, not editable user metadata.
create function public.pp_verified_wallet(p_user uuid) returns text
language sql security definer set search_path='' as $$
 select lower(identity_data->'custom_claims'->>'address') from auth.identities
 where user_id=p_user and provider='web3'
 and identity_data->'custom_claims'->>'chain'='ethereum'
 and identity_data->'custom_claims'->>'address' ~ '^0x[0-9a-fA-F]{40}$'
 limit 1;
$$;
revoke all on function public.pp_verified_wallet(uuid) from public, anon, authenticated;

create function public.pp_validate_terms(p_terms jsonb) returns void
language plpgsql set search_path='' as $$
begin
 if p_terms is null or jsonb_typeof(p_terms)<>'object'
 or length(p_terms::text)>12000
 or length(trim(coalesce(p_terms->>'requestBrief','')))=0
 or length(coalesce(p_terms->>'requestBrief',''))>4000
 or coalesce(p_terms->>'amount','') !~ '^[0-9]{1,30}(\.[0-9]{1,18})?$'
 or coalesce(p_terms->>'deadline','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 then raise exception 'Invalid terms'; end if;
 if (p_terms->>'amount')::numeric<=0 then raise exception 'Invalid amount'; end if;
 perform (p_terms->>'deadline')::date;
end;
$$;
revoke all on function public.pp_validate_terms(jsonb) from public, anon, authenticated;

create function public.pp_submit_signed_request(p_offering uuid,p_nonce uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.pp_offerings; r public.pp_requests; wallet text; creator_wallet text; result jsonb;
begin
 wallet:=public.pp_verified_wallet(auth.uid());
 if auth.uid() is null or wallet is null then raise exception 'Wallet sign-in required'; end if;
 if p_nonce is null then raise exception 'Missing retry key'; end if;
 -- Same authenticated client + nonce returns the original request, never duplicates it.
 select * into r from public.pp_requests where client_user_id=auth.uid() and submission_nonce=p_nonce;
 if found then
  if r.offering_id<>p_offering then raise exception 'Retry key belongs to another offering'; end if;
  return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase);
 end if;
 perform public.pp_validate_terms(p_payload);
 if length(trim(coalesce(p_payload->>'clientName','')))=0 or length(p_payload->>'clientName')>200 then raise exception 'Invalid name'; end if;
 select * into o from public.pp_offerings where id=p_offering and active=true for share;
 if not found then raise exception 'Offering unavailable'; end if;
 if o.owner_id=auth.uid() then raise exception 'Use a different client wallet'; end if;
 creator_wallet:=public.pp_verified_wallet(o.owner_id);
 if creator_wallet is null or creator_wallet<>lower(coalesce(o.profile->>'creatorWallet','')) then raise exception 'Creator must verify the receiving wallet'; end if;
 result:=jsonb_build_object('id',gen_random_uuid(),'cloud',true,'requestVersion',3,'status','negotiating',
 'workflowPhase','negotiating','creatorName',o.profile->>'creatorName','creatorWallet',creator_wallet,
 'serviceName',o.profile->>'serviceName','serviceDescription',o.profile->>'serviceDescription',
 'clientName',p_payload->>'clientName','clientWallet',wallet,'requestBrief',p_payload->>'requestBrief',
 'amount',p_payload->>'amount','deadline',p_payload->>'deadline','createdAt',now(),'agreementMethod','pending-creator-acceptance');
 insert into public.pp_requests(id,offering_id,owner_id,client_user_id,submission_nonce,client_token_hash,data,phase)
 values((result->>'id')::uuid,p_offering,o.owner_id,auth.uid(),p_nonce,gen_random_uuid()::text,result,'negotiating')
 on conflict(client_user_id,submission_nonce) do nothing returning * into r;
 if not found then
  select * into r from public.pp_requests where client_user_id=auth.uid() and submission_nonce=p_nonce;
  if r.offering_id<>p_offering then raise exception 'Retry key belongs to another offering'; end if;
 else
  insert into public.pp_request_history(request_id,actor_id,action,details) values(r.id,auth.uid(),'submitted',r.data);
 end if;
 return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase);
end;
$$;

create function public.pp_signed_request_action(p_id uuid,p_version integer,p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pp_requests; patch jsonb:='{}'; next_phase text; reason text; proposal jsonb; pending jsonb;
begin
 if auth.uid() is null or public.pp_verified_wallet(auth.uid()) is null then raise exception 'Wallet sign-in required'; end if;
 select * into r from public.pp_requests where id=p_id and client_user_id is not null
 and (owner_id=auth.uid() or client_user_id=auth.uid()) for update;
 if not found then raise exception 'Not authorized'; end if;
 if p_version is null or p_version<>r.version then raise exception 'Conflict: refresh before acting'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>12000 then raise exception 'Invalid action payload'; end if;
 if r.phase='cancelled' or coalesce(r.data->>'paymentRecordTxHash','')<>'' then raise exception 'Request is closed'; end if;
 next_phase:=r.phase;
 reason:=trim(coalesce(p_payload->>'reason',''));
 pending:=r.data->'cancellationRequest';
 if pending is not null and pending<>'null'::jsonb and p_action not in ('approve_cancel','reject_cancel') then
  raise exception 'Resolve pending cancellation first';
 end if;
 case p_action
 when 'accept' then
  if r.owner_id<>auth.uid() or r.phase<>'negotiating' then raise exception 'Only creator can accept the original request'; end if;
  next_phase:='agreed'; patch:=jsonb_build_object('agreedAt',now(),'agreementMethod','creator-accepted-client-request','agreedTerms',r.data);
 when 'propose' then
  if r.owner_id<>auth.uid() or r.phase not in ('negotiating','proposed') then raise exception 'Only creator can propose during negotiation'; end if;
  perform public.pp_validate_terms(p_payload);
  proposal:=jsonb_build_object('amount',p_payload->>'amount','deadline',p_payload->>'deadline','requestBrief',p_payload->>'requestBrief');
  next_phase:='proposed'; patch:=jsonb_build_object('termsProposal',proposal);
 when 'approve_terms' then
  if r.client_user_id<>auth.uid() or r.phase<>'proposed' then raise exception 'Only client can approve changed terms'; end if;
  proposal:=r.data->'termsProposal'; perform public.pp_validate_terms(proposal);
  next_phase:='agreed'; patch:=proposal||jsonb_build_object('agreedAt',now(),'agreementMethod','client-approved-creator-proposal','agreedTerms',proposal,'termsProposal',null);
 when 'decline' then
  if r.owner_id<>auth.uid() or r.phase not in ('negotiating','proposed') then raise exception 'Creator can decline only during negotiation'; end if;
  if reason='' or length(reason)>1000 then raise exception 'Cancellation reason required (max 1000 characters)'; end if;
  next_phase:='cancelled'; patch:=jsonb_build_object('cancelledAt',now(),'cancellationReason',reason,'cancelledBy',auth.uid(),'status','cancelled');
 when 'request_cancel' then
  if r.phase not in ('negotiating','proposed','agreed') then raise exception 'Invalid phase'; end if;
  if reason='' or length(reason)>1000 then raise exception 'Cancellation reason required (max 1000 characters)'; end if;
  patch:=jsonb_build_object('cancellationRequest',jsonb_build_object('by',auth.uid(),'reason',reason,'at',now()));
 when 'approve_cancel','reject_cancel' then
  if pending is null or pending='null'::jsonb or pending->>'by'=auth.uid()::text then raise exception 'Only the other participant can respond'; end if;
  if p_action='approve_cancel' then
   next_phase:='cancelled'; patch:=jsonb_build_object('status','cancelled','cancelledAt',now(),'cancellationReason',pending->>'reason','cancellationApprovedBy',auth.uid(),'cancellationRequest',null);
  else patch:=jsonb_build_object('cancellationRequest',null); end if;
 else raise exception 'Unknown action';
 end case;
 update public.pp_requests set data=data||patch||jsonb_build_object('workflowPhase',next_phase,'status',next_phase),phase=next_phase,version=version+1
 where id=r.id returning * into r;
 insert into public.pp_request_history(request_id,actor_id,action,details) values(r.id,auth.uid(),p_action,p_payload);
 return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase);
end;
$$;

-- Legacy free-form updates must never bypass negotiated terms or mutual cancellation.
alter function public.pp_update_request(uuid,integer,jsonb) rename to pp_legacy_update_request;
revoke all on function public.pp_legacy_update_request(uuid,integer,jsonb) from public, anon, authenticated;
create function public.pp_update_request(p_id uuid,p_version integer,p_patch jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.pp_requests where id=p_id and client_user_id is not null) then
  raise exception 'Use signed workflow actions';
 end if;
 return public.pp_legacy_update_request(p_id,p_version,p_patch);
end;
$$;
-- Capability links stay valid for old test requests only. New requests require participant login.
alter function public.pp_get_client_request(uuid,text) rename to pp_legacy_get_client_request;
revoke all on function public.pp_legacy_get_client_request(uuid,text) from public, anon, authenticated;
create function public.pp_get_client_request(p_id uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.pp_requests;
begin
 select * into r from public.pp_requests where id=p_id;
 if r.client_user_id is not null then
  if auth.uid() is null or (auth.uid()<>r.client_user_id and auth.uid()<>r.owner_id) then raise exception 'Not authorized'; end if;
  return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase);
 end if;
 return public.pp_legacy_get_client_request(p_id,p_token);
end;
$$;
alter function public.pp_client_report(uuid,text,text) rename to pp_legacy_client_report;
revoke all on function public.pp_legacy_client_report(uuid,text,text) from public, anon, authenticated;
create function public.pp_client_report(p_id uuid,p_token text,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.pp_requests where id=p_id and client_user_id is not null) then
  -- The signed payment flow must be integrated and independently verified before enabling it.
  raise exception 'Signed payment integration pending';
 end if;
 return public.pp_legacy_client_report(p_id,p_token,p_hash);
end;
$$;
revoke all on function public.pp_submit_signed_request(uuid,uuid,jsonb),public.pp_signed_request_action(uuid,integer,text,jsonb),public.pp_update_request(uuid,integer,jsonb),public.pp_get_client_request(uuid,text),public.pp_client_report(uuid,text,text) from public,anon,authenticated;
grant execute on function public.pp_submit_signed_request(uuid,uuid,jsonb),public.pp_signed_request_action(uuid,integer,text,jsonb),public.pp_update_request(uuid,integer,jsonb) to authenticated;
grant execute on function public.pp_get_client_request(uuid,text),public.pp_client_report(uuid,text,text) to anon,authenticated;
create function public.pp_signed_workflow_version() returns integer language sql as $$ select 1 $$;
revoke all on function public.pp_signed_workflow_version() from public;
grant execute on function public.pp_signed_workflow_version() to anon,authenticated;
COMMIT;
