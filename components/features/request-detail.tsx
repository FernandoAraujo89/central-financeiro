"use client";

import * as React from "react";
import { StatusBadge, PriorityBadge } from "@/components/features/status-badge";
import { UserSelect } from "@/components/features/user-select";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatBRL } from "@/lib/masks";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  CLIENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type FinancialRequest,
  type AppUser,
  type RequestStatus,
  type RequestPriority,
  type RequestAttachment,
} from "@/lib/types";
import { permissions } from "@/lib/permissions";
import { FileText, Download, AlertTriangle } from "lucide-react";

const CONFIRM_STATUSES: RequestStatus[] = ["reprovada", "cancelada"];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-800 break-words">{value}</dd>
    </div>
  );
}

export function RequestDetail({
  request,
  attachments,
  users,
  currentUser,
  onUpdated,
}: {
  request: FinancialRequest;
  attachments: RequestAttachment[];
  users: AppUser[];
  currentUser: AppUser;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [pendingStatus, setPendingStatus] = React.useState<RequestStatus | null>(null);
  const [saving, setSaving] = React.useState(false);

  const canManage = permissions.canChangeStatus(currentUser.role);
  const typeData = request.type_specific_data || {};

  async function applyStatus(status: RequestStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast({ title: "Não foi possível alterar o status", description: json.error, variant: "error" });
        return;
      }
      toast({ title: "Status atualizado", variant: "success" });
      onUpdated();
    } finally {
      setSaving(false);
      setPendingStatus(null);
    }
  }

  function handleStatusChange(status: string) {
    const s = status as RequestStatus;
    if (CONFIRM_STATUSES.includes(s)) {
      setPendingStatus(s);
    } else {
      applyStatus(s);
    }
  }

  async function handleAssigneeChange(userId: string | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/assignee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_id: userId }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast({ title: "Não foi possível alterar o responsável", description: json.error, variant: "error" });
        return;
      }
      toast({ title: "Responsável atualizado", variant: "success" });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function handlePriorityChange(priority: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast({ title: "Não foi possível alterar a prioridade", description: json.error, variant: "error" });
        return;
      }
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-primary-700">{request.request_number}</span>
          {canManage ? (
            <Select value={request.status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="w-auto h-7 px-2 py-0 border-0 bg-transparent shadow-none">
                <StatusBadge status={request.status} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge status={request.status} />
          )}

          {canManage ? (
            <Select value={request.priority} onValueChange={handlePriorityChange} disabled={saving}>
              <SelectTrigger className="w-auto h-7 px-2 py-0 border-0 bg-transparent shadow-none">
                <PriorityBadge priority={request.priority} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REQUEST_PRIORITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <PriorityBadge priority={request.priority} />
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{request.title}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium text-neutral-400">Solicitante</p>
          <div className="mt-1 flex items-center gap-2">
            <Avatar name={request.requester?.full_name || "?"} size="xs" />
            <span className="text-sm text-neutral-700 truncate">{request.requester?.full_name}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-400 mb-1">Responsável</p>
          {canManage ? (
            <UserSelect users={users} value={request.assignee_id} onChange={handleAssigneeChange} filterRole={["analista_financeiro", "administrador"]} />
          ) : request.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar name={request.assignee.full_name} size="xs" />
              <span className="text-sm text-neutral-700 truncate">{request.assignee.full_name}</span>
            </div>
          ) : (
            <span className="text-sm text-neutral-400">Não atribuído</span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-400">Criada em</p>
          <p className="mt-1 text-sm text-neutral-700">{formatDate(request.created_at)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-400">Última atualização</p>
          <p className="mt-1 text-sm text-neutral-700">{formatDateTime(request.updated_at)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Dados da solicitação</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Empresa solicitante" value={request.company?.name} />
          <Field label="Tipo de solicitação" value={REQUEST_TYPE_LABELS[request.request_type]} />
          <Field label="Tipo de cliente" value={CLIENT_TYPE_LABELS[request.client_type]} />
          <Field label="Cliente" value={request.client_name} />
          <Field label="CNPJ/CPF" value={request.document} />
          <Field label="Responsável pela autorização" value={request.authorization_responsible?.full_name} />
          <Field label="Valor total" value={request.total_amount !== null ? formatBRL(request.total_amount) : null} />
          <Field label="Valor a abater" value={request.discount_amount !== null ? formatBRL(request.discount_amount) : null} />
          <Field label="Forma de pagamento" value={request.payment_method ? PAYMENT_METHOD_LABELS[request.payment_method] : null} />
          <Field label="Número dos boletos" value={request.invoice_numbers} />

          {typeData.valor_original !== undefined && <Field label="Valor original" value={formatBRL(typeData.valor_original)} />}
          {typeData.valor_renegociado !== undefined && <Field label="Valor renegociado" value={formatBRL(typeData.valor_renegociado)} />}
          {typeData.quantidade_parcelas !== undefined && <Field label="Quantidade de parcelas" value={typeData.quantidade_parcelas} />}
          {typeData.nova_data_vencimento && <Field label="Nova data de vencimento" value={formatDate(typeData.nova_data_vencimento)} />}
          {typeData.valor_restante !== undefined && <Field label="Valor restante" value={formatBRL(typeData.valor_restante)} />}
          {typeData.quantidade_boletos !== undefined && <Field label="Quantidade de boletos" value={typeData.quantidade_boletos} />}
          {typeData.primeiro_vencimento && <Field label="Primeiro vencimento" value={formatDate(typeData.primeiro_vencimento)} />}
          {typeData.intervalo_vencimentos !== undefined && <Field label="Intervalo entre vencimentos" value={`${typeData.intervalo_vencimentos} dias`} />}
          {typeData.valor_desconto !== undefined && <Field label="Valor do desconto" value={formatBRL(typeData.valor_desconto)} />}
          {typeData.valor_final !== undefined && <Field label="Valor final" value={formatBRL(typeData.valor_final)} />}
        </dl>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Motivo" value={<span className="whitespace-pre-wrap">{request.reason}</span>} />
          <Field label="Observações / Detalhes" value={request.details ? <span className="whitespace-pre-wrap">{request.details}</span> : null} />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Anexos</h2>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-neutral-700 truncate">
                  <FileText className="h-4 w-4 text-neutral-400 shrink-0" /> {a.file_name}
                </span>
                <Download className="h-4 w-4 text-neutral-400" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent title="Confirmar alteração de status">
          <div className="flex items-start gap-3 text-sm text-neutral-600">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Tem certeza que deseja alterar o status para <strong>{pendingStatus && REQUEST_STATUS_LABELS[pendingStatus]}</strong>? Essa
              ação será registrada no histórico e pode não ser reversível.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button size="sm" variant="danger" onClick={() => pendingStatus && applyStatus(pendingStatus)} disabled={saving}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
