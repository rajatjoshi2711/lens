-- Lens: initial schema for Neon Postgres.
-- Auth tables follow Better Auth's core schema (user, session, account,
-- verification, rateLimit). Candidates sign in with Google; admins sign in
-- with email + password. The app connects as the database owner and does
-- all permission checks in server code.

-- ---------------------------------------------------------------------------
-- Better Auth
-- ---------------------------------------------------------------------------
create table "user" (
  "id"            text primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null default false,
  "image"         text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create table "session" (
  "id"        text primary key,
  "expiresAt" timestamptz not null,
  "token"     text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    text not null references "user" ("id") on delete cascade
);
create index session_user_id_idx on "session" ("userId");

create table "account" (
  "id"                    text primary key,
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                text not null references "user" ("id") on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);
create index account_user_id_idx on "account" ("userId");

create table "verification" (
  "id"         text primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);
create index verification_identifier_idx on "verification" ("identifier");

-- Shared across serverless instances, so login rate limits actually hold.
create table "rateLimit" (
  "id"          text primary key,
  "key"         text not null unique,
  "count"       integer not null,
  "lastRequest" bigint not null
);

-- ---------------------------------------------------------------------------
-- uploads: every resume uploaded, including anonymous ones (kept, not purged)
-- ---------------------------------------------------------------------------
create table uploads (
  id                  uuid primary key default gen_random_uuid(),
  claim_token_hash    text not null unique,
  user_id             text references "user" ("id") on delete set null,
  candidate_name      text,
  candidate_email     text,
  original_filename   text not null,
  mime_type           text not null,
  size_bytes          integer not null check (size_bytes > 0 and size_bytes <= 4194304),
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

create index uploads_created_at_idx on uploads (created_at desc);
create index uploads_user_id_idx on uploads (user_id);
create index uploads_candidate_email_idx on uploads (lower(candidate_email));
create index uploads_storage_status_idx on uploads (storage_status)
  where storage_status <> 'stored';

-- Original file bytes, kept only until SharePoint confirms the upload, so a
-- retry job can resend them. Deleted once storage_status = 'stored'.
create table upload_retry_buffer (
  upload_id   uuid primary key references uploads (id) on delete cascade,
  file_bytes  bytea not null,
  attempts    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- analyses: one AI review per candidate account
-- ---------------------------------------------------------------------------
create table analyses (
  id                    uuid primary key default gen_random_uuid(),
  user_id               text not null unique references "user" ("id") on delete cascade,
  upload_id             uuid not null references uploads (id) on delete cascade,
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
create unique index analyses_live_email_uidx on analyses (normalized_email)
  where status in ('processing', 'completed');
create unique index analyses_live_fingerprint_uidx on analyses (resume_fingerprint)
  where status in ('processing', 'completed');

-- Atomically reserve the caller's single analysis before calling the LLM.
-- Returns the analysis id. Raises 'already_used' (P0001) if a live review
-- exists for this account, email, or resume.
create or replace function reserve_analysis(
  p_user_id text,
  p_upload_id uuid,
  p_normalized_email text,
  p_resume_fingerprint text
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into analyses (user_id, upload_id, normalized_email, resume_fingerprint, status)
  values (p_user_id, p_upload_id, p_normalized_email, p_resume_fingerprint, 'processing')
  on conflict (user_id) do update
    set status = 'processing',
        upload_id = excluded.upload_id,
        normalized_email = excluded.normalized_email,
        resume_fingerprint = excluded.resume_fingerprint,
        error = null,
        created_at = now()
    where analyses.status = 'failed'
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

-- ---------------------------------------------------------------------------
-- admins and audit log
-- ---------------------------------------------------------------------------
create table admins (
  user_id               text primary key references "user" ("id") on delete cascade,
  email                 text not null unique,
  added_by              text references admins (user_id) on delete set null,
  is_active             boolean not null default true,
  must_change_password  boolean not null default false,
  created_at            timestamptz not null default now()
);

create table admin_audit_log (
  id             bigint generated always as identity primary key,
  admin_user_id  text references admins (user_id) on delete set null,
  action         text not null
                   check (action in ('download', 'view_report', 'add_admin', 'deactivate_admin', 'reactivate_admin')),
  target_id      text,
  created_at     timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on admin_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- upload rate limit per hashed IP per day
-- ---------------------------------------------------------------------------
create table upload_rate_limits (
  ip_hash  text not null,
  day      date not null default current_date,
  count    integer not null default 0,
  primary key (ip_hash, day)
);

-- Increments and returns today's upload count for an IP hash.
create or replace function bump_upload_count(p_ip_hash text) returns integer
language sql
as $$
  insert into upload_rate_limits (ip_hash, day, count)
  values (p_ip_hash, current_date, 1)
  on conflict (ip_hash, day) do update set count = upload_rate_limits.count + 1
  returning count;
$$;
