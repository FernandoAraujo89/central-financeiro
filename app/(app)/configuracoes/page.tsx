"use client";

import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { REQUEST_TYPE_LABELS } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Mail, ListChecks, Lock } from "lucide-react";

const NOTIFICATION_EVENTS = [
  { title: "Nova solicitação", description: "Enviado ao responsável financeiro sempre que uma nova solicitação é registrada." },
  { title: "Usuário mencionado", description: 'Enviado quando alguém é citado com "@" em um comentário.' },
  { title: "Responsável alterado", description: "Enviado ao novo responsável quando ele é atribuído a uma solicitação." },
  { title: "Novo retorno", description: "Enviado ao solicitante quando o analista responde à solicitação." },
];

const PERMISSION_MATRIX: { action: string; solicitante: boolean; analista: boolean; admin: boolean }[] = [
  { action: "Criar solicitações", solicitante: true, analista: true, admin: true },
  { action: "Ver apenas as próprias solicitações", solicitante: true, analista: false, admin: false },
  { action: "Ver todas as solicitações", solicitante: false, analista: true, admin: true },
  { action: "Alterar status", solicitante: false, analista: true, admin: true },
  { action: "Alterar responsável", solicitante: false, analista: true, admin: true },
  { action: "Comentar e mencionar", solicitante: true, analista: true, admin: true },
  { action: "Gerenciar usuários e empresas", solicitante: false, analista: false, admin: true },
  { action: "Configurar sistema", solicitante: false, analista: false, admin: true },
];

export default function ConfiguracoesPage() {
  const { user, loading } = useCurrentUser();

  if (loading) return <div className="p-6 text-sm text-neutral-400">Carregando…</div>;

  if (user && user.role !== "administrador") {
    return (
      <div className="p-8 flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-neutral-600">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-1">Tipos de solicitação, notificações e permissões do sistema.</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-neutral-400" />
          <h2 className="text-base font-semibold text-neutral-800">Tipos de solicitação financeira</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
            <Badge key={k} color="indigo">
              {v}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Os tipos de solicitação e seus campos condicionais são definidos no schema do banco de dados
          (enum <code className="bg-neutral-100 px-1 rounded">request_type</code>) e no formulário de nova solicitação.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-neutral-400" />
          <h2 className="text-base font-semibold text-neutral-800">Notificações por e-mail</h2>
        </div>
        <ul className="divide-y divide-neutral-100">
          {NOTIFICATION_EVENTS.map((n) => (
            <li key={n.title} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{n.description}</p>
              </div>
              <Badge color="green">Ativo</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-400">
          Envio via Resend, configurado pela variável de ambiente <code className="bg-neutral-100 px-1 rounded">RESEND_API_KEY</code>. O
          destinatário padrão de novas solicitações é definido em{" "}
          <code className="bg-neutral-100 px-1 rounded">FINANCIAL_NOTIFICATION_EMAIL</code>.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-neutral-400" />
          <h2 className="text-base font-semibold text-neutral-800">Permissões por papel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-neutral-400">
                <th className="py-2">Ação</th>
                <th className="py-2 text-center">{ROLE_LABELS.solicitante}</th>
                <th className="py-2 text-center">{ROLE_LABELS.analista_financeiro}</th>
                <th className="py-2 text-center">{ROLE_LABELS.administrador}</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.action} className="border-t border-neutral-100">
                  <td className="py-2.5 text-neutral-700">{row.action}</td>
                  <td className="py-2.5 text-center">{row.solicitante ? "✅" : "—"}</td>
                  <td className="py-2.5 text-center">{row.analista ? "✅" : "—"}</td>
                  <td className="py-2.5 text-center">{row.admin ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          As permissões são aplicadas tanto na interface quanto nas rotas de API e reforçadas por Row Level Security no banco de dados.
        </p>
      </section>
    </div>
  );
}
