-- ---------------------------------------------------------------------
-- 0003_add_distributor.sql
--
-- Adiciona o campo opcional "Distribuidor" à solicitação financeira —
-- texto livre preenchido pelo solicitante, sem relação com nenhuma
-- tabela existente.
-- ---------------------------------------------------------------------

alter table public.financial_requests
  add column if not exists distributor text;

comment on column public.financial_requests.distributor is
  'Nome do distribuidor informado pelo solicitante (campo livre, opcional).';
