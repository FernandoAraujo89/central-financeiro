# Guia: configurando o domínio da Central Financeira

Este guia mostra o passo a passo para colocar o sistema no ar com o endereço da Avante, em vez do endereço temporário que a Vercel gera automaticamente. Ele pressupõe que o projeto já foi publicado na Vercel (passo coberto no README do código-fonte).

Vamos configurar **dois endereços separados**, de propósito:

| Endereço | Para quem | O que é |
|---|---|---|
| `financeiro.avantejuntos.com.br` | Equipe financeira (você, analistas) | Portal interno — exige login |
| `formulario.avantejuntos.com.br` | Qualquer colaborador | Formulário público — sem login |

Manter os dois separados é o que garante que quem só precisa enviar uma solicitação nunca tenha acesso ao portal interno.

---

## 1. Confirme quem administra o domínio `avantejuntos.com.br`

Antes de começar, você precisa saber onde o domínio da Avante está registrado (Registro.br, GoDaddy, Cloudflare, Hostgator etc.) e ter acesso de administrador ao painel de DNS dele. Se você não sabe, é só verificar com quem cuidou da compra do domínio ou do site institucional — normalmente é o mesmo painel usado para configurar o e-mail da empresa.

## 2. Adicione os domínios no projeto da Vercel

1. Acesse [vercel.com](https://vercel.com) e entre no projeto do sistema.
2. Vá em **Settings → Domains**.
3. Adicione `financeiro.avantejuntos.com.br` e clique em **Add**.
4. Repita para `formulario.avantejuntos.com.br`.
5. A Vercel vai mostrar, para cada um, o registro DNS que falta configurar (normalmente um `CNAME`).

## 3. Configure os registros DNS

No painel onde o domínio está registrado, crie os registros que a Vercel indicou. Em geral, são deste formato:

| Tipo | Nome / Host | Valor / Aponta para |
|---|---|---|
| CNAME | `financeiro` | `cname.vercel-dns.com` |
| CNAME | `formulario` | `cname.vercel-dns.com` |

> Alguns painéis pedem o nome completo (`financeiro.avantejuntos.com.br`) em vez de só `financeiro` — siga exatamente o que a Vercel exibiu na tela de Domains, pois o valor pode variar.

A propagação do DNS pode levar de alguns minutos até 24 horas. A tela de Domains na Vercel mostra quando cada domínio fica "Valid" (com um certificado HTTPS emitido automaticamente).

## 4. Configure o envio de e-mail (Resend)

Os quatro avisos por e-mail do sistema (nova solicitação, menção, responsável alterado, novo retorno) são enviados pelo Resend. Para que eles saiam do domínio da Avante (e não caiam em spam), é preciso verificar o domínio lá também:

1. Acesse [resend.com](https://resend.com) e entre na sua conta.
2. Vá em **Domains → Add Domain** e informe `avantejuntos.com.br`.
3. O Resend vai gerar registros **SPF**, **DKIM** e (opcionalmente) **DMARC**.
4. Adicione cada um desses registros no mesmo painel de DNS do passo 3.
5. Volte ao Resend e clique em **Verify** — pode levar alguns minutos até o status mudar para "Verified".

> Sem esse passo, os e-mails ainda funcionam, mas saem de um endereço genérico do Resend e têm mais chance de cair em spam ou serem bloqueados por antivírus corporativos.

## 5. Atualize as variáveis de ambiente

No projeto da Vercel, em **Settings → Environment Variables**, confirme (ou ajuste) estas variáveis para usar os domínios finais:

```
NEXT_PUBLIC_APP_URL=https://financeiro.avantejuntos.com.br
FINANCIAL_NOTIFICATION_EMAIL=financeiro@avantejuntos.com.br
```

O `NEXT_PUBLIC_APP_URL` é usado para montar o link "ABRIR SOLICITAÇÃO" que vai nos e-mails — se ele apontar para o endereço errado, os botões dos e-mails levam ao lugar errado.

Depois de alterar variáveis de ambiente, é necessário fazer um novo deploy (Vercel → Deployments → **Redeploy**) para que elas entrem em vigor.

## 6. Teste tudo

Antes de divulgar o link para a equipe, faça este checklist:

- [ ] `https://financeiro.avantejuntos.com.br` abre a tela de login do portal
- [ ] `https://formulario.avantejuntos.com.br` abre o formulário público, sem pedir login
- [ ] Enviar uma solicitação de teste pelo formulário público gera uma tarefa no portal
- [ ] O e-mail de "Nova solicitação" chega na caixa do financeiro (confira também a pasta de spam na primeira vez)
- [ ] Mencionar alguém com `@` em um comentário gera e-mail para essa pessoa
- [ ] Trocar o responsável de uma tarefa gera e-mail para o novo responsável
- [ ] O certificado HTTPS está ativo nos dois domínios (cadeado no navegador, sem aviso de "não seguro")

## 7. Divulgando o formulário

Depois que tudo estiver validado, o link `https://formulario.avantejuntos.com.br` é o que deve ser compartilhado com a equipe — por e-mail, no grupo interno, ou fixado na intranet. Ele substitui o formulário do ClickUp usado hoje.

---

### Dúvidas comuns

**"A Vercel mostra o domínio como 'Invalid Configuration'."**
Normalmente é um registro DNS ainda não propagado ou digitado errado. Confira se o tipo (CNAME) e o valor batem exatamente com o que a Vercel pediu, e aguarde — a propagação pode demorar.

**"O e-mail não chega."**
Confirme primeiro se `RESEND_API_KEY` está configurada na Vercel e se o domínio está com status "Verified" no Resend. Sem isso, o sistema é projetado para não travar — ele apenas registra um aviso e segue funcionando, mas o e-mail não sai.

**"Posso usar um subdomínio diferente?"**
Sim — os nomes `financeiro` e `formulario` são só uma sugestão. O importante é manter os dois separados, com o formulário público em um endereço próprio, fora do portal.
