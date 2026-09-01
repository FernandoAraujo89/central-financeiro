# Banco de dados — Supabase

Este diretório contém as migrações do banco, em ordem:
- `migrations/0001_init.sql` — schema completo (tabelas, tipos, RLS, bucket de anexos).
- `migrations/0002_authorization_responsible.sql` — ajusta o campo "Responsável
  pela autorização" para usar a lista fixa de nomes (Mariana Luiza, Thiago,
  Luis Guilherme, Raul, Drielli, Juliana) em vez de referenciar um usuário do
  sistema.

E um `seed.sql` opcional para dados de teste.

## Como aplicar as migrações

### Opção A — SQL Editor (mais simples, recomendado para quem não usa terminal)
1. Acesse o painel do seu projeto em https://supabase.com/dashboard
2. Vá em **SQL Editor** → **New query**
3. Abra o arquivo `migrations/0001_init.sql`, copie todo o conteúdo e cole no editor
4. Clique em **Run**. Isso cria todos os tipos, tabelas, triggers, políticas de RLS e o bucket de anexos.
5. Repita o processo com `migrations/0002_authorization_responsible.sql` (nessa ordem, depois do 0001).
6. (Opcional) Repita o processo com `seed.sql` para inserir empresas de exemplo.

### Opção B — Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Criando os primeiros usuários

O Fin-Hub usa o Supabase Auth (e-mail/senha). A tabela `public.users` é
preenchida **automaticamente** por um trigger quando um usuário é criado no
Supabase Auth — não é preciso inserir manualmente.

1. No painel do Supabase, vá em **Authentication → Users → Add user** e
   crie um usuário com e-mail e senha (ex.: `admin@avante.com.br`).
2. No **SQL Editor**, promova esse usuário a administrador:
   ```sql
   update public.users set role = 'administrador' where email = 'admin@avante.com.br';
   ```
3. Repita para criar um usuário `analista_financeiro` (quem vai analisar as
   solicitações) e quantos `solicitante` forem necessários (esse é o papel
   padrão — não precisa de update).

Depois de logado como administrador, a tela **Usuários** do próprio Fin-Hub
pode ser usada para gerenciar papéis dos próximos usuários (uma vez que
eles já tenham se cadastrado/sido criados no Auth).

## Storage

A migração já cria o bucket privado `request-attachments` usado para os
anexos das solicitações, com políticas que liberam leitura/escrita a
qualquer usuário autenticado (o controle fino de "quem pode ver qual
anexo" é feito pela tabela `request_attachments` + RLS de
`financial_requests`).

## Seed de empresas

`seed.sql` insere algumas empresas solicitantes de exemplo
("Avante Matriz", "Avante Filial SP" etc.). Rode-o pelo SQL Editor da
mesma forma que a migração, depois de criar seus usuários de teste.

## Resetar tudo (ambiente de desenvolvimento)

Caso precise recomeçar do zero em um projeto de teste, apague as tabelas
manualmente (`drop schema public cascade; create schema public;`) e rode a
migração novamente — **nunca faça isso em produção**.
