"use client";

import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/features/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { formatBRL } from "@/lib/masks";
import { REQUEST_TYPE_LABELS, type FinancialRequest } from "@/lib/types";
import { Inbox } from "lucide-react";

export function RequestTable({ requests, loading }: { requests: FinancialRequest[]; loading?: boolean }) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-neutral-100 px-4 py-4 last:border-0 animate-pulse">
            <div className="h-4 w-16 rounded bg-neutral-100" />
            <div className="h-4 flex-1 rounded bg-neutral-100" />
            <div className="h-4 w-24 rounded bg-neutral-100" />
            <div className="h-4 w-20 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <Inbox className="h-10 w-10 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-600">Nenhuma solicitação encontrada</p>
        <p className="text-sm text-neutral-400">Ajuste os filtros ou crie uma nova solicitação.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Solicitante</th>
            <th className="px-4 py-3">Responsável</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Criada em</th>
            <th className="px-4 py-3">Atualizada em</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              onClick={() => router.push(`/solicitacoes/${r.id}`)}
              className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-3 font-mono text-xs text-primary-700 font-semibold whitespace-nowrap">{r.request_number}</td>
              <td className="px-4 py-3 max-w-[220px] truncate font-medium text-neutral-800">{r.title}</td>
              <td className="px-4 py-3 max-w-[160px] truncate text-neutral-600">{r.client_name}</td>
              <td className="px-4 py-3 max-w-[140px] truncate text-neutral-600">{r.company?.name || "-"}</td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{REQUEST_TYPE_LABELS[r.request_type]}</td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{r.total_amount ? formatBRL(r.total_amount) : "-"}</td>
              <td className="px-4 py-3">
                {r.requester ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={r.requester.full_name} size="xs" />
                    <span className="truncate max-w-[100px] text-neutral-600">{r.requester.full_name}</span>
                  </div>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">
                {r.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={r.assignee.full_name} size="xs" />
                    <span className="truncate max-w-[100px] text-neutral-600">{r.assignee.full_name}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400">Não atribuído</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={r.priority} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{formatDate(r.created_at)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{formatDate(r.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
