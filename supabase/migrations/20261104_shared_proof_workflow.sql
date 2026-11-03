-- Apply once AFTER 20261103_job_stages_archives.sql. No existing request is deleted.
-- Blockchain receipts are verified by the public client before these references are stored.
BEGIN;

create function public.pp_signed_proof_action(p_id uuid,p_version integer,p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pp_requests; patch jsonb:='{}'; value text;
begin
 if auth.uid() is null or public.pp_verified_wallet(auth.uid()) is null then raise exception 'Wallet sign-in required'; end if;
 select * into r from public.pp_requests where id=p_id and client_user_id is not null
 and (owner_id=auth.uid() or client_user_id=auth.uid()) for update;
 if not found then raise exception 'Not authorized'; end if;
 if p_version is null or p_version<>r.version then raise exception 'Conflict: refresh before acting'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>16000 then raise exception 'Invalid proof payload'; end if;
 if r.phase<>'agreed' then raise exception 'Terms must be agreed first'; end if;
 if r.data->'cancellationRequest' is not null and r.data->'cancellationRequest'<>'null'::jsonb then raise exception 'Resolve pending cancellation first'; end if;

 case p_action
 when 'record_order' then
  if r.owner_id<>auth.uid() then raise exception 'Only creator can record order proof'; end if;
  if coalesce(r.data->>'orderTxHash','')<>'' then
   if lower(r.data->>'orderTxHash')=lower(coalesce(p_payload->>'orderTxHash','')) then return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase); end if;
   raise exception 'Order proof already recorded';
  end if;
  if coalesce(p_payload->>'proofId','') !~ '^0x[0-9a-fA-F]{64}$'
   or coalesce(p_payload->>'termsHash','') !~ '^0x[0-9a-fA-F]{64}$'
   or coalesce(p_payload->>'orderTxHash','') !~ '^0x[0-9a-fA-F]{64}$'
   or lower(p_payload->>'proofId')<>lower(p_payload->>'termsHash') then raise exception 'Invalid order proof'; end if;
  patch:=jsonb_build_object('orderId',lower(p_payload->>'proofId'),'termsHash',lower(p_payload->>'termsHash'),
   'orderTxHash',lower(p_payload->>'orderTxHash'),'orderRecordedAt',now(),'status','active');

 when 'record_delivery' then
  if r.owner_id<>auth.uid() then raise exception 'Only creator can record delivery'; end if;
  if coalesce(r.data->>'orderTxHash','')='' then raise exception 'Order proof required'; end if;
  if coalesce(r.data->>'deliveryTxHash','')<>'' then
   if lower(r.data->>'deliveryTxHash')=lower(coalesce(p_payload->>'deliveryTxHash','')) then return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase); end if;
   raise exception 'Delivery already recorded';
  end if;
  value:=trim(coalesce(p_payload->>'deliveryUrl',''));
  if length(value)=0 or length(value)>4000 or value !~ '^(https?://|ipfs://)'
   or coalesce(p_payload->>'deliveryHash','') !~ '^0x[0-9a-fA-F]{64}$'
   or coalesce(p_payload->>'deliveryTxHash','') !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'Invalid delivery proof'; end if;
  patch:=jsonb_build_object('deliveryUrl',value,'deliveryHash',lower(p_payload->>'deliveryHash'),
   'deliveryTxHash',lower(p_payload->>'deliveryTxHash'),'deliveredAt',now(),'status','delivered');

 when 'report_payment' then
  if r.client_user_id<>auth.uid() then raise exception 'Only client can report payment'; end if;
  if coalesce(r.data->>'deliveryTxHash','')='' then raise exception 'Delivery proof required'; end if;
  if coalesce(r.data->>'paymentRecordTxHash','')<>'' then raise exception 'Payment already recorded'; end if;
  value:=lower(trim(coalesce(p_payload->>'paymentTxHash','')));
  if value !~ '^0x[0-9a-f]{64}$' then raise exception 'Invalid payment transaction hash'; end if;
  if lower(coalesce(r.data->>'paymentTxHash',''))=value then return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase); end if;
  patch:=jsonb_build_object('paymentTxHash',value,'paymentReportedAt',now(),'status','delivered');

 when 'record_payment' then
  if r.owner_id<>auth.uid() then raise exception 'Only creator can record payment proof'; end if;
  if coalesce(r.data->>'deliveryTxHash','')='' then raise exception 'Delivery proof required'; end if;
  if coalesce(r.data->>'paymentRecordTxHash','')<>'' then
   if lower(r.data->>'paymentRecordTxHash')=lower(coalesce(p_payload->>'paymentRecordTxHash','')) then return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase); end if;
   raise exception 'Payment proof already recorded';
  end if;
  if coalesce(r.data->>'paymentTxHash','')='' or lower(r.data->>'paymentTxHash')<>lower(coalesce(p_payload->>'paymentTxHash',''))
   or coalesce(p_payload->>'paymentRecordTxHash','') !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'Reported payment does not match'; end if;
  patch:=jsonb_build_object('paymentRecordTxHash',lower(p_payload->>'paymentRecordTxHash'),
   'paidAt',now(),'paidAmount',r.data->>'amount','status','paid');

 else raise exception 'Unknown proof action';
 end case;

 update public.pp_requests set data=data||patch,version=version+1 where id=r.id returning * into r;
 insert into public.pp_request_history(request_id,actor_id,action,details) values(r.id,auth.uid(),p_action,p_payload);
 return r.data||jsonb_build_object('version',r.version,'workflowPhase',r.phase);
end;
$$;
revoke all on function public.pp_signed_proof_action(uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.pp_signed_proof_action(uuid,integer,text,jsonb) to authenticated;
create or replace function public.pp_signed_workflow_version() returns integer language sql as $$ select 3 $$;
COMMIT;
