-- Apply once AFTER 20261102_signed_negotiation.sql. No existing request is deleted.
BEGIN;
alter table public.pp_requests drop constraint pp_requests_phase_check;
alter table public.pp_requests add constraint pp_requests_phase_check
 check(phase in ('legacy','negotiating','approved','proposed','agreed','cancelled'));

alter function public.pp_signed_request_action(uuid,integer,text,jsonb) rename to pp_signed_request_action_v1;
revoke all on function public.pp_signed_request_action_v1(uuid,integer,text,jsonb) from public,anon,authenticated;
create function public.pp_signed_request_action(p_id uuid,p_version integer,p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pp_requests; result jsonb; was_approved boolean;
begin
 if auth.uid() is null or public.pp_verified_wallet(auth.uid()) is null then raise exception 'Wallet sign-in required'; end if;
 select * into r from public.pp_requests where id=p_id and client_user_id is not null
 and (owner_id=auth.uid() or client_user_id=auth.uid()) for update;
 if not found then raise exception 'Not authorized'; end if;
 if p_version is null or p_version<>r.version then raise exception 'Conflict: refresh before acting'; end if;
 if r.phase='cancelled' or coalesce(r.data->>'paymentRecordTxHash','')<>'' then raise exception 'Request is closed'; end if;
 if p_action in ('accept','propose') and r.owner_id<>auth.uid() then raise exception 'Only creator can confirm or propose terms'; end if;
 if p_action='start_negotiation' then
  if r.owner_id<>auth.uid() or r.phase<>'negotiating' then raise exception 'Only creator can start negotiation on an unprocessed request'; end if;
  if r.data->'cancellationRequest' is not null and r.data->'cancellationRequest'<>'null'::jsonb then raise exception 'Resolve pending cancellation first'; end if;
  update public.pp_requests set phase='approved',version=version+1,
   data=data||jsonb_build_object('workflowPhase','approved','status','approved','negotiationStartedAt',now())
   where id=p_id returning * into r;
  insert into public.pp_request_history(request_id,actor_id,action,details) values(p_id,auth.uid(),p_action,'{}');
  return r.data||jsonb_build_object('version',r.version);
 end if;
 if p_action='accept' and r.phase<>'approved' then raise exception 'Start negotiation before confirming original terms'; end if;
 if p_action='propose' and r.phase not in ('approved','proposed') then raise exception 'Start negotiation before proposing terms'; end if;
 -- Reuse the tested consent/cancellation logic. The temporary translation is inside this locked transaction.
 was_approved:=r.phase='approved';
 if was_approved then update public.pp_requests set phase='negotiating' where id=p_id; end if;
 result:=public.pp_signed_request_action_v1(p_id,p_version,p_action,p_payload);
 if was_approved and result->>'workflowPhase'='negotiating' then
  update public.pp_requests set phase='approved',data=data||jsonb_build_object('workflowPhase','approved','status','approved') where id=p_id returning * into r;
  result:=r.data||jsonb_build_object('version',r.version);
 end if;
 return result;
end;
$$;
revoke all on function public.pp_signed_request_action(uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.pp_signed_request_action(uuid,integer,text,jsonb) to authenticated;

-- Archiving is a creator's display preference, never a cancellation or change to the client's record.
create table public.pp_request_archives (
 request_id uuid not null references public.pp_requests(id),
 user_id uuid not null references auth.users(id), archived_at timestamptz not null default now(),
 primary key(request_id,user_id)
);
alter table public.pp_request_archives enable row level security;
revoke all on public.pp_request_archives from public,anon,authenticated;
grant select on public.pp_request_archives to authenticated;
create policy archive_owner_read on public.pp_request_archives for select to authenticated using(user_id=auth.uid());
create function public.pp_set_request_archive(p_id uuid,p_archived boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare stamp timestamptz;
begin
 if auth.uid() is null or p_archived is null then raise exception 'Sign-in required'; end if;
 perform 1 from public.pp_requests where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized'; end if;
 if p_archived then
  insert into public.pp_request_archives(request_id,user_id) values(p_id,auth.uid()) on conflict do nothing;
  select archived_at into stamp from public.pp_request_archives where request_id=p_id and user_id=auth.uid();
 else delete from public.pp_request_archives where request_id=p_id and user_id=auth.uid();
 end if;
 return jsonb_build_object('id',p_id,'archivedAt',stamp);
end;
$$;
revoke all on function public.pp_set_request_archive(uuid,boolean) from public,anon,authenticated;
grant execute on function public.pp_set_request_archive(uuid,boolean) to authenticated;
create or replace function public.pp_signed_workflow_version() returns integer language sql as $$ select 2 $$;
COMMIT;
