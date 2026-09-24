-- Resume review app: initial schema.
-- Candidates sign in with Google; admins sign in with email + password.
-- All writes go through server routes using the secret key, so RLS only
-- grants candidates read access to their own rows.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- uploads: every resume uploaded, including anonymous ones (kept, not purged)
-- ---------------------------------------------------------------------------
create table public.uploads (
  id                  uuid primary key default gen_random_uuid(),
  claim_token_hash    text not null unique,
  user_id             uuid references auth.users (id) on delete set null,
  candidate_name      text,
  candidate_email     text,
  original_filename   text not null,
  mime_type           text not null,
  size_bytes          integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  sharepoint_item_id  text,
  sharepoint_path     text,
  storage_status      text not null default 'pending'
                        check (storage_status in ('pending', 'stored', 'failed')),
  resume_text         text,
  resume_fingerprint  text,
  teaser_json         jsonb,
  target_role         text check (char_length(target_role) <= 120),
  ip_hash             text,
  created_at          timestamptz not null default now(),
  claimed_at          timestamptz
);

create index uploads_created_at_idx on public.uploads (created_at desc);
create index uploads_user_id_idx on public.uploads (user_id);
create index uploads_candidate_email_idx on public.uploads (lower(candidate_email));
create index uploads_storage_status_idx on public.uploads (storage_status)
  where storage_status <> 'stored';

-- ---------------------------------------------------------------------------
-- analyses: one AI review per candidate account
-- ---------------------------------------------------------------------------
create table public.analyses (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users (id) on delete cascade,
  upload_id             uuid not null references public.uploads (id) on delete cascade,
  normalized_email      text not null,
  resume_fingerprint    text not null,
  status                text not null default 'processing'
                          check (status in ('processing', 'completed', 'failed')),
  recommendations_json  jsonb,
  model                 text,
  tokens_used           integer,
  error                 text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

-- Secondary guards: the same email or resume cannot hold a second live review.
-- Failed rows do not block, so a failed attempt never burns the chance.
create unique index analyses_live_email_uidx on public.analyses (normalized_email)
  where status in ('processing', 'completed');
create unique index analyses_live_fingerprint_uidx on public.analyses (resume_fingerprint)
  where status in ('processing', 'completed');

-- Atomically reserve the caller's single analysis before calling the LLM.
-- Returns the analysis id. Raises 'already_used' (P0001) if a live review
-- exists for this account, email, or resume.
create or replace function public.reserve_analysis(
  p_user_id uuid,
  p_upload_id uuid,
  p_normalized_email text,
  p_resume_fingerprint text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.analyses (user_id, upload_id, normalized_email, resume_fingerprint, status)
  values (p_user_id, p_upload_id, p_normalized_email, p_resume_fingerprint, 'processing')
  on conflict (user_id) do update
    set status = 'processing',
        upload_id = excluded.upload_id,
        normalized_email = excluded.normalized_email,
        resume_fingerprint = excluded.resume_fingerprint,
        error = null,
        created_at = now()
    where public.analyses.status = 'failed'
  returning id into v_id;

  if v_id is null then
    raise exception 'already_used' using errcode = 'P0001';
  end if;
  return v_id;
exception
  when unique_violation then
    raise exception 'already_used' using errcode = 'P0001';
end;
$$;

revoke all on function public.reserve_analysis(uuid, uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- admins and audit log (service role only, no RLS policies)
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  email                 text not null unique,
  added_by              uuid references public.admins (user_id) on delete set null,
  is_active             boolean not null default true,
  must_change_password  boolean not null default false,
  created_at            timestamptz not null default now()
);

create table public.admin_audit_log (
  id             bigint generated always as identity primary key,
  admin_user_id  uuid references public.admins (user_id) on delete set null,
  action         text not null
                   check (action in ('download', 'view_report', 'add_admin', 'deactivate_admin', 'reactivate_admin')),
  target_id      text,
  created_at     timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

create or replace function public.is_admin(p_user_id uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = p_user_id and is_active);
$$;

revoke all on function public.is_admin(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- upload rate limit per hashed IP per day
-- ---------------------------------------------------------------------------
create table public.upload_rate_limits (
  ip_hash  text not null,
  day      date not null default current_date,
  count    integer not null default 0,
  primary key (ip_hash, day)
);

-- Increments and returns today's upload count for an IP hash.
create or replace function public.bump_upload_count(p_ip_hash text) returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.upload_rate_limits (ip_hash, day, count)
  values (p_ip_hash, current_date, 1)
  on conflict (ip_hash, day) do update set count = public.upload_rate_limits.count + 1
  returning count;
$$;

revoke all on function public.bump_upload_count(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.uploads            enable row level security;
alter table public.analyses           enable row level security;
alter table public.admins             enable row level security;
alter table public.admin_audit_log    enable row level security;
alter table public.upload_rate_limits enable row level security;

create policy "Candidates read their own uploads"
  on public.uploads for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Candidates read their own analysis"
  on public.analyses for select to authenticated
  using (user_id = (select auth.uid()));
