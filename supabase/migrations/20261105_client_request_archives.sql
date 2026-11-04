-- Provider and client may independently organize the same request in their own list.
-- This never changes request state, history, or the other participant's preference.
BEGIN;

create or replace function public.pp_set_request_archive(p_id uuid,p_archived boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare stamp timestamptz;
begin
 if auth.uid() is null or p_archived is null then raise exception 'Sign-in required'; end if;
 perform 1 from public.pp_requests
  where id=p_id and (owner_id=auth.uid() or client_user_id=auth.uid())
  for update;
 if not found then raise exception 'Not authorized'; end if;
 if p_archived then
  insert into public.pp_request_archives(request_id,user_id) values(p_id,auth.uid()) on conflict do nothing;
  select archived_at into stamp from public.pp_request_archives where request_id=p_id and user_id=auth.uid();
 else
  delete from public.pp_request_archives where request_id=p_id and user_id=auth.uid();
 end if;
 return jsonb_build_object('id',p_id,'archivedAt',stamp);
end;
$$;
revoke all on function public.pp_set_request_archive(uuid,boolean) from public,anon,authenticated;
grant execute on function public.pp_set_request_archive(uuid,boolean) to authenticated;

create or replace function public.pp_signed_workflow_version() returns integer language sql as $$ select 4 $$;

COMMIT;
