-- =====================================================================
-- Fin-Hub — Avante — Migração inicial
-- Tabelas, enums, sequence de numeração, triggers de histórico e RLS.
-- Rode este arquivo inteiro no SQL Editor do Supabase, ou via
-- `supabase db push` (ver supabase/README.md).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('solicitante', 'analista_financeiro', 'administrador');

create type request_status as enum (
  'nova',
  'em_analise',
  'em_validacao',
  'aguardando_informacoes',
  'aguardando_responsavel',
  'aprovada',
  'reprovada',
  'cancelada',
  'concluida'
);

create type request_priority as enum ('baixa', 'normal', 'alta', 'urgente');

create type request_type as enum (
  'cancelamento',
  'renegociacao',
  'parcial',
  'geracao_boletos',
  'desconto'
);

create type client_type as enum ('pessoa_fisica', 'pessoa_juridica');

create type payment_method as enum ('boleto', 'pix', 'cartao', 'transferencia', 'outro');

create type notification_type as enum (
  'nova_solicitacao',
  'mencao',
  'responsavel_alterado',
  'novo_retorno',
  'status_alterado'
);

-- ---------------------------------------------------------------------
-- users — espelha auth.users com perfil + role da aplicação
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'solicitante',
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Perfil de aplicação para cada usuário autenticado (espelha auth.users).';

-- Cria automaticamente uma linha em public.users quando um usuário se cadastra no Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'solicitante')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- companies — empresas solicitantes
-- ---------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- financial_requests — a tabela central
-- ---------------------------------------------------------------------
create sequence public.financial_request_number_seq start 1;

create table public.financial_requests (
  id uuid primary key default gen_random_uuid(),
  request_number_seq bigint not null default nextval('public.financial_request_number_seq'),
  request_number text generated always as ('FIN-' || lpad(request_number_seq::text, 6, '0')) stored,

  title text not null,
  company_id uuid not null references public.companies (id),
  requester_id uuid not null references public.users (id),

  client_type client_type not null,
  document text not null,
  client_name text not null,

  request_type request_type not null,
  authorization_responsible_id uuid references public.users (id),

  total_amount numeric(14, 2),
  discount_amount numeric(14, 2),
  payment_method payment_method,
  invoice_numbers text,

  reason text not null,
  details text,

  type_specific_data jsonb not null default '{}'::jsonb,

  status request_status not null default 'nova',
  priority request_priority not null default 'normal',
  assignee_id uuid references public.users (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financial_requests_status on public.financial_requests (status);
create index idx_financial_requests_requester on public.financial_requests (requester_id);
create index idx_financial_requests_assignee on public.financial_requests (assignee_id);
create index idx_financial_requests_company on public.financial_requests (company_id);
create index idx_financial_requests_created_at on public.financial_requests (created_at desc);
create unique index idx_financial_requests_request_number on public.financial_requests (request_number);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_financial_requests_updated_at
  before update on public.financial_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- request_assignees — múltiplos envolvidos (responsável primário + watchers)
-- ---------------------------------------------------------------------
create table public.request_assignees (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.financial_requests (id) on delete cascade,
  user_id uuid not null references public.users (id),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

-- ---------------------------------------------------------------------
-- request_attachments
-- ---------------------------------------------------------------------
create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  -- nullable: um anexo pode ser enviado para o storage ANTES da solicitação
  -- existir (fluxo do formulário "Nova solicitação"), sendo vinculado ao
  -- request_id logo em seguida, no POST /api/requests.
  request_id uuid references public.financial_requests (id) on delete cascade,
  file_name text not null,
  file_path text not null, -- caminho no bucket do Supabase Storage
  file_size bigint,
  content_type text,
  uploaded_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

create index idx_request_attachments_request on public.request_attachments (request_id);

-- ---------------------------------------------------------------------
-- request_comments
-- ---------------------------------------------------------------------
create table public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.financial_requests (id) on delete cascade,
  author_id uuid not null references public.users (id),
  body text not null,
  mentioned_user_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

create index idx_request_comments_request on public.request_comments (request_id);

-- ---------------------------------------------------------------------
-- request_history — log imutável (nunca update/delete pela aplicação)
-- ---------------------------------------------------------------------
create table public.request_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.financial_requests (id) on delete cascade,
  actor_id uuid references public.users (id),
  action text not null,
  created_at timestamptz not null default now()
);

create index idx_request_history_request on public.request_history (request_id, created_at);

-- ---------------------------------------------------------------------
-- notifications — central de notificações in-app
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  request_id uuid references public.financial_requests (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, read, created_at desc);

-- =====================================================================
-- Triggers de histórico automático (status e responsável)
-- A criação e os comentários são logados pela aplicação (via API), pois
-- ali já temos o nome legível de quem realizou a ação e o texto formatado
-- em português; mudanças de status/responsável são garantidas aqui via
-- trigger de banco para nunca ficarem de fora do log, mesmo se alguém
-- alterar a linha por outro caminho.
-- =====================================================================

create or replace function public.log_request_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor uuid;
  actor_name text;
  old_label text;
  new_label text;
begin
  actor := nullif(current_setting('request.actor_id', true), '')::uuid;
  select full_name into actor_name from public.users where id = actor;

  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    old_label := old.status::text;
    new_label := new.status::text;
    insert into public.request_history (request_id, actor_id, action)
    values (
      new.id,
      actor,
      coalesce(actor_name, 'Sistema') || ' alterou o status de ' || old_label || ' para ' || new_label || '.'
    );
  end if;

  if (tg_op = 'UPDATE' and old.assignee_id is distinct from new.assignee_id) then
    insert into public.request_history (request_id, actor_id, action)
    values (
      new.id,
      actor,
      coalesce(actor_name, 'Sistema') || ' alterou o responsável da solicitação.'
    );
  end if;

  if (tg_op = 'UPDATE' and old.priority is distinct from new.priority) then
    insert into public.request_history (request_id, actor_id, action)
    values (
      new.id,
      actor,
      coalesce(actor_name, 'Sistema') || ' alterou a prioridade de ' || old.priority::text || ' para ' || new.priority::text || '.'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_request_changes on public.financial_requests;
create trigger trg_log_request_changes
  after update on public.financial_requests
  for each row execute function public.log_request_status_change();

-- Log de criação
create or replace function public.log_request_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor_name text;
begin
  select full_name into actor_name from public.users where id = new.requester_id;
  insert into public.request_history (request_id, actor_id, action)
  values (new.id, new.requester_id, coalesce(actor_name, 'Sistema') || ' criou a solicitação.');
  return new;
end;
$$;

drop trigger if exists trg_log_request_created on public.financial_requests;
create trigger trg_log_request_created
  after insert on public.financial_requests
  for each row execute function public.log_request_created();

-- Permite à aplicação informar quem está executando a alteração, para que
-- o trigger de histórico grave o nome correto do autor da ação.
create or replace function public.set_config_actor(actor_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('request.actor_id', actor_id::text, true);
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.financial_requests enable row level security;
alter table public.request_assignees enable row level security;
alter table public.request_attachments enable row level security;
alter table public.request_comments enable row level security;
alter table public.request_history enable row level security;
alter table public.notifications enable row level security;

-- Helper: role do usuário logado
create or replace function public.current_user_role()
returns user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.current_user_role() in ('analista_financeiro', 'administrador'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.current_user_role() = 'administrador', false);
$$;

-- users: todo usuário autenticado pode ler a lista (para @mentions, seletor de responsável etc.);
-- só admin pode inserir/alterar role de outros; o próprio usuário pode atualizar seu perfil básico.
create policy users_select_authenticated on public.users
  for select using (auth.uid() is not null);

create policy users_update_self on public.users
  for update using (auth.uid() = id);

create policy users_admin_all on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- companies: leitura para todos autenticados; escrita só admin
create policy companies_select_authenticated on public.companies
  for select using (auth.uid() is not null);

create policy companies_admin_write on public.companies
  for all using (public.is_admin()) with check (public.is_admin());

-- financial_requests: solicitante vê as próprias; staff vê todas
create policy requests_select on public.financial_requests
  for select using (
    requester_id = auth.uid() or public.is_staff()
  );

create policy requests_insert on public.financial_requests
  for insert with check (requester_id = auth.uid());

-- update: solicitante pode editar a própria enquanto 'nova'; staff pode sempre
create policy requests_update on public.financial_requests
  for update using (
    public.is_staff() or (requester_id = auth.uid() and status = 'nova')
  );

-- request_assignees
create policy assignees_select on public.request_assignees
  for select using (
    exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

create policy assignees_write on public.request_assignees
  for all using (public.is_staff()) with check (public.is_staff());

-- request_attachments: quem vê a solicitação pode ver os anexos; qualquer um com acesso pode enviar
create policy attachments_select on public.request_attachments
  for select using (
    (request_id is null and uploaded_by = auth.uid())
    or exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

create policy attachments_insert on public.request_attachments
  for insert with check (
    uploaded_by = auth.uid() and (
      request_id is null
      or exists (
        select 1 from public.financial_requests r
        where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
      )
    )
  );

create policy attachments_update on public.request_attachments
  for update using (uploaded_by = auth.uid())
  with check (request_id is not null);

-- request_comments: mesmo critério de acesso da solicitação
create policy comments_select on public.request_comments
  for select using (
    exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

create policy comments_insert on public.request_comments
  for insert with check (
    author_id = auth.uid() and exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

-- request_history: somente leitura pela aplicação; nunca update/delete (sem policies para isso = negado por padrão)
create policy history_select on public.request_history
  for select using (
    exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

create policy history_insert on public.request_history
  for insert with check (
    exists (
      select 1 from public.financial_requests r
      where r.id = request_id and (r.requester_id = auth.uid() or public.is_staff())
    )
  );

-- notifications: cada usuário só vê/atualiza as próprias
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update on public.notifications
  for update using (user_id = auth.uid());

create policy notifications_insert on public.notifications
  for insert with check (true); -- inseridas pela API com service role ou por staff em nome de outro usuário

-- ---------------------------------------------------------------------
-- Supabase Storage — bucket de anexos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

create policy storage_attachments_read on storage.objects
  for select using (bucket_id = 'request-attachments' and auth.uid() is not null);

create policy storage_attachments_insert on storage.objects
  for insert with check (bucket_id = 'request-attachments' and auth.uid() is not null);
