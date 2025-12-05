CREATE EXTENSION IF NOT EXISTS "pgcrypto";

create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid not null,
  stage text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


create index leads_tenant_idx on leads (tenant_id);
create index leads_tenant_owner_idx on leads (tenant_id, owner_id);
create index leads_tenant_stage_idx on leads (tenant_id, stage);


create table applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references leads (id) on delete cascade,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


create index applications_tenant_idx on applications (tenant_id);
create index applications_tenant_lead_idx on applications (tenant_id, lead_id);


create table tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references applications (id) on delete cascade,
  type text not null,
  due_at timestamptz not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tasks_due_after_created check (due_at >= created_at),
  constraint tasks_type_check check (type in ('call', 'email', 'review'))
);


create index tasks_tenant_idx on tasks (tenant_id);
create index tasks_tenant_due_idx on tasks (tenant_id, due_at);
create index tasks_tenant_status_idx on tasks (tenant_id, status);
