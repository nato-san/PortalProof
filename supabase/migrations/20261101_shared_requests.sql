-- Apply once in a NEW Supabase project's SQL Editor.
create extension if not exists pgcrypto with schema extensions;
create table public.pp_offerings (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 profile jsonb not null, active boolean not null default true
);
create table public.pp_requests (
 id uuid primary key default gen_random_uuid(), offering_id uuid not null references public.pp_offerings(id),
 owner_id uuid not null references auth.users(id), client_token_hash text not null,
 data jsonb not null, version integer not null default 1, created_at timestamptz not null default now()
);
alter table public.pp_offerings enable row level security;
alter table public.pp_requests enable row level security;
create index on public.pp_requests(owner_id, created_at desc);
create policy offering_owner on public.pp_offerings for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy request_owner_read on public.pp_requests for select to authenticated using(owner_id=auth.uid());
revoke all on public.pp_offerings, public.pp_requests from anon, authenticated;
grant select, insert, update on public.pp_offerings to authenticated;
grant select on public.pp_requests to authenticated;

create function public.pp_get_offering(p_id uuid) returns jsonb language sql security definer set search_path='' as $$
 select profile from public.pp_offerings where id=p_id and active=true;
$$;

create function public.pp_submit_request(p_offering uuid, p_payload jsonb, p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare offering public.pp_offerings; rid uuid; result jsonb;
begin
 if p_token !~ '^[a-f0-9]{64}$' or length(p_payload::text)>12000
 or length(trim(coalesce(p_payload->>'clientName','')))=0
 or length(trim(coalesce(p_payload->>'requestBrief','')))=0
 or coalesce(p_payload->>'amount','') !~ '^[0-9]+(\.[0-9]{1,18})?$'
 then raise exception 'Invalid request'; end if;
 if (p_payload->>'amount')::numeric<=0 then raise exception 'Invalid amount'; end if;
 select * into offering from public.pp_offerings where id=p_offering and active=true;
 if not found then raise exception 'Offering unavailable'; end if;
 -- Token also acts as an idempotency key. Client keeps it across retries.
 select id,data into rid,result from public.pp_requests where offering_id=p_offering and client_token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if found then return result || jsonb_build_object('id',rid,'cloud',true,'clientToken',p_token); end if;
 rid:=gen_random_uuid();
 result:=jsonb_build_object('id',rid,'cloud',true,'requestVersion',2,'status','new',
 'creatorName',offering.profile->>'creatorName','creatorWallet',offering.profile->>'creatorWallet',
 'serviceName',offering.profile->>'serviceName','serviceDescription',offering.profile->>'serviceDescription',
 'clientName',p_payload->>'clientName','requestBrief',p_payload->>'requestBrief',
 'amount',p_payload->>'amount','deadline',p_payload->>'deadline','clientWallet','',
 'createdAt',now(),'agreementMethod','not-yet-confirmed');
 insert into public.pp_requests(id,offering_id,owner_id,client_token_hash,data) values(rid,p_offering,offering.owner_id,encode(extensions.digest(p_token,'sha256'),'hex'),result)
 on conflict(offering_id,client_token_hash) do nothing;
 select id,data into rid,result from public.pp_requests where offering_id=p_offering and client_token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 return result || jsonb_build_object('id',rid,'clientToken',p_token);
end; $$;
create unique index pp_request_idempotency on public.pp_requests(offering_id,client_token_hash);

create function public.pp_get_client_request(p_id uuid,p_token text) returns jsonb
language sql security definer set search_path='' as $$
 select data || jsonb_build_object('id',id,'version',version) from public.pp_requests
 where id=p_id and client_token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
$$;

create function public.pp_update_request(p_id uuid,p_version integer,p_patch jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row public.pp_requests; clean jsonb;
begin
 select * into row from public.pp_requests where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized'; end if;
 if row.version<>p_version then raise exception 'Conflict: refresh the job before saving'; end if;
 if length(p_patch::text)>16000 then raise exception 'Update too large'; end if;
 -- Ownership, terms, amount and client report cannot be overwritten by a stale client.
 select coalesce(jsonb_object_agg(key,value),'{}') into clean from jsonb_each(p_patch)
 where key in ('status','archivedAt','cancelledAt','cancellationReason','statusBeforeCancellation','deliveryUrl','orderId','orderTxHash','deliveryTxHash','paymentRecordTxHash','paidAt','paidAmount');
 update public.pp_requests set data=data||clean,version=version+1 where id=p_id returning * into row;
 return row.data||jsonb_build_object('version',row.version);
end; $$;

create function public.pp_client_report(p_id uuid,p_token text,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row public.pp_requests;
begin
 if p_hash !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'Invalid transaction hash'; end if;
 select * into row from public.pp_requests where id=p_id and client_token_hash=encode(extensions.digest(p_token,'sha256'),'hex') for update;
 if not found then raise exception 'Link unavailable'; end if;
 if coalesce(row.data->>'orderId','')='' then raise exception 'Awaiting order record'; end if;
 if coalesce(row.data->>'paymentTxHash','')<>'' then
   if lower(row.data->>'paymentTxHash')=lower(p_hash) then return row.data; end if;
   raise exception 'Payment already reported';
 end if;
 update public.pp_requests set data=data||jsonb_build_object('paymentTxHash',p_hash,'report',jsonb_build_object('paymentTxHash',p_hash),'reported',true,'paymentVerification','pending'),version=version+1 where id=p_id returning * into row;
 return row.data||jsonb_build_object('version',row.version);
end; $$;

revoke all on function public.pp_get_offering(uuid), public.pp_submit_request(uuid,jsonb,text), public.pp_get_client_request(uuid,text), public.pp_client_report(uuid,text,text), public.pp_update_request(uuid,integer,jsonb) from public;
grant execute on function public.pp_get_offering(uuid), public.pp_submit_request(uuid,jsonb,text), public.pp_get_client_request(uuid,text), public.pp_client_report(uuid,text,text) to anon,authenticated;
grant execute on function public.pp_update_request(uuid,integer,jsonb) to authenticated;
