# Fin-Hub — Avante

Central de solicitações financeiras da Avante: um "ClickUp interno" para
substituir o formulário atual, construído com Next.js 14, Supabase e Resend.

Este guia foi escrito para quem **não é desenvolvedor** (ex.: Danielle) mas
precisa colocar o sistema no ar e mantê-lo. Siga os passos na ordem.

---

## 1. O que você vai precisar

- Uma conta no [Supabase](https://supabase.com) (banco de dados, login e
  armazenamento de arquivos) — plano gratuito serve para começar.
- Uma conta no [Resend](https://resend.com) (envio de e-mails) — plano
  gratuito serve para começar.
- Uma conta no [Vercel](https://vercel.com) (hospedagem do site).
- Node.js 18 ou superior instalado (apenas se for rodar localmente).

---

## 2. Configurar o Supabase (banco de dados + login)

1. Crie um projeto novo em https://supabase.com/dashboard.
2. Siga as instruções em `supabase/README.md` deste repositório para rodar a
   migração (`supabase/migrations/0001_init.sql`) e criar seus primeiros
   usuários (administrador, analista financeiro, solicitantes).
3. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → vai virar `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca
     exponha essa chave publicamente — ela ignora as regras de segurança do
     banco)

---

## 3. Configurar o Resend (e-mails)

1. Crie uma conta em https://resend.com e verifique um domínio de e-mail
   (ou use o domínio de testes deles enquanto configura o domínio da Avante).
2. Em **API Keys**, gere uma chave → vira `RESEND_API_KEY`.
3. Defina `RESEND_FROM_EMAIL` com um remetente do domínio verificado, ex.:
   `Fin-Hub <notificacoes@avante.com.br>`.
4. Defina `FINANCIAL_NOTIFICATION_EMAIL` com o e-mail que deve receber o
   aviso de toda solicitação nova (ex.: `financeiro@avante.com.br`).

> Se o Resend não estiver configurado, o sistema continua funcionando
> normalmente — ele apenas não envia e-mails (as notificações internas na
> "Central de notificações" continuam sendo criadas normalmente). Isso é
> proposital, para que o ambiente de testes nunca quebre por falta de
> e-mail configurado.

---

## 4. Variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha com os valores
obtidos nos passos anteriores:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de administrador do Supabase (secreta) |
| `RESEND_API_KEY` | Chave de API do Resend |
| `RESEND_FROM_EMAIL` | Remetente usado nos e-mails |
| `FINANCIAL_NOTIFICATION_EMAIL` | E-mail que recebe aviso de nova solicitação |
| `NEXT_PUBLIC_APP_URL` | URL pública do site (localhost em dev, URL do Vercel em produção) |

---

## 5. Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 — você será redirecionado para `/login`. Use
um dos usuários criados no passo 2.

---

## 6. Publicando no Vercel

1. Suba este projeto para um repositório no GitHub/GitLab.
2. Em https://vercel.com, clique em **Add New → Project** e selecione o
   repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do passo 4
   (use a URL do próprio Vercel em `NEXT_PUBLIC_APP_URL`, ex.:
   `https://fin-hub.vercel.app`).
4. Clique em **Deploy**. Pronto — o Fin-Hub estará no ar.

Depois do primeiro deploy, sempre que você (ou seu time de desenvolvimento)
enviar novas alterações para o repositório, o Vercel publica automaticamente
uma nova versão.

---

## 7. Estrutura do projeto (para quem for mexer no código)

```
app/                       Páginas (Next.js App Router)
  (app)/                   Área autenticada (sidebar + header)
    dashboard/             Dashboard com KPIs
    solicitacoes/           Lista, nova solicitação, detalhe
    notificacoes/           Central de notificações
    usuarios/               Gestão de usuários e empresas (admin)
    configuracoes/          Tipos de solicitação, notificações, permissões (admin)
  api/                     Rotas de API (backend)
  login/                   Tela de login
components/
  ui/                      Componentes de interface genéricos (botão, modal, etc.)
  features/                Componentes de negócio (tabela de solicitações, etc.)
lib/                       Supabase, máscaras, permissões, e-mails, utilitários
supabase/                  Migração SQL, seed e instruções do banco
middleware.ts              Protege rotas e atualiza a sessão do Supabase
```

---

## 8. Limitações conhecidas deste MVP

- Este ambiente de desenvolvimento não tem acesso a um projeto Supabase ou
  Resend reais, então o app não foi testado "de ponta a ponta" com dados
  reais — apenas `npx tsc --noEmit` e `npm run build` foram validados. O
  código usa `@supabase/supabase-js` e `resend` de verdade (nada mockado);
  basta configurar as variáveis de ambiente para funcionar.
- A tela **Configurações** mostra os tipos de solicitação, eventos de
  e-mail e a matriz de permissões de forma informativa; tornar esses itens
  editáveis pela interface (sem mexer no código/banco) fica como evolução
  futura.
- O upload de anexos usa o bucket `request-attachments` do Supabase
  Storage; o link de download direto (assinado) pode ser adicionado
  facilmente usando `supabase.storage.from(...).createSignedUrl(...)`.
