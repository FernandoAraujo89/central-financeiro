-- ---------------------------------------------------------------------
-- 0002_authorization_responsible.sql
--
-- "Responsável pela autorização" deixa de ser uma referência a um usuário
-- do sistema (users.id) e passa a ser um nome fixo de uma lista pré-
-- definida (Mariana Luiza, Thiago, Luis Guilherme, Raul, Drielli, Juliana).
-- Esses nomes representam aprovadores do negócio, não necessariamente
-- contas com login no sistema.
-- ---------------------------------------------------------------------

alter table public.financial_requests
  drop constraint if exists financial_requests_authorization_responsible_id_fkey;

alter table public.financial_requests
  rename column authorization_responsible_id to authorization_responsible;

alter table public.financial_requests
  alter column authorization_responsible type text using authorization_responsible::text;

alter table public.financial_requests
  add constraint financial_requests_authorization_responsible_check
  check (
    authorization_responsible is null or authorization_responsible in (
      'Mariana Luiza', 'Thiago', 'Luis Guilherme', 'Raul', 'Drielli', 'Juliana'
    )
  );

comment on column public.financial_requests.authorization_responsible is
  'Nome fixo do responsável pela autorização (lista pré-definida), não é um FK para users.';
