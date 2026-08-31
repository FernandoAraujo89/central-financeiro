-- =====================================================================
-- Seed de dados para testes locais.
-- IMPORTANTE: crie primeiro os usuários pelo Supabase Auth (painel ou
-- `supabase.auth.admin.createUser`) — a tabela public.users é populada
-- automaticamente pelo trigger on_auth_user_created quando o usuário é
-- criado no auth.users. Depois de criados, ajuste as roles com os
-- comandos abaixo (troque os e-mails pelos que você usou).
-- =====================================================================

-- Exemplo: promover usuários já cadastrados a analista/administrador.
-- update public.users set role = 'administrador' where email = 'admin@avante.com.br';
-- update public.users set role = 'analista_financeiro' where email = 'financeiro@avante.com.br';
-- (usuários que não forem alterados permanecem como 'solicitante', o padrão)

-- Empresas solicitantes de exemplo
insert into public.companies (name) values
  ('Avante Matriz'),
  ('Avante Filial SP'),
  ('Avante Filial RJ'),
  ('Avante Educação Digital')
on conflict (name) do nothing;
