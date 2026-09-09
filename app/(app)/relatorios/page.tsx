"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDuration } from "@/lib/utils";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  OPEN_REQUEST_STATUSES,
  CLOSED_REQUEST_STATUSES,
  type Company,
  type AppUser,
  type RequestStatus,
  type RequestType,
} from "@/lib/types";
import { KpiCard } from "@/components/features/kpi-card";
import { ListChecks, Timer, CheckCircle2, Clock, Building2, UserCheck } from "lucide-react";

interface ReportRequest {
  id: string;
  status: RequestStatus;
  request_type: RequestType;
  created_at: string;
  updated_at: string;
  company: Company | null;
  assignee: AppUser | null;
}

interface HistoryRow {
  request_id: string;
  created_at: string;
}

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function BarList({ items, colorClass = "bg-primary-500" }: { items: { label: string; value: number }[]; colorClass?: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">Sem dados suficientes.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-neutral-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-neutral-900">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100">
            <div className={cn("h-2 rounded-full", colorClass)} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MonthlyTrend({ months }: { months: { label: string; value: number }[] }) {
  const max = Math.max(1, ...months.map((m) => m.value));
  return (
    <div className="flex h-40 items-end gap-3">
      {months.map((m) => (
        <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-[36px] rounded-t-md bg-primary-500/80"
              style={{ height: `${(m.value / max) * 100}%`, minHeight: m.value > 0 ? "4px" : "0" }}
              title={`${m.value} solicitação(ões)`}
            />
          </div>
          <span className="text-xs text-neutral-500">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RelatoriosPage() {
  const [requests, setRequests] = React.useState<ReportRequest[]>([]);
  const [history, setHistory] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error: reqError } = await supabase
          .from("financial_requests")
          .select(
            "id, status, request_type, created_at, updated_at, company:companies(*), assignee:users!financial_requests_assignee_id_fkey(*)"
          )
          .order("created_at", { ascending: false })
          .limit(1000);
        if (reqError) throw reqError;
        const list = (data as unknown as ReportRequest[]) || [];
        setRequests(list);

        const ids = list.map((r) => r.id);
        const batches = await Promise.all(
          chunk(ids, 200).map((batch) =>
            supabase.from("request_history").select("request_id, created_at").in("request_id", batch).order("created_at", { ascending: true })
          )
        );
        const rows: HistoryRow[] = [];
        for (const b of batches) {
          if (b.data) rows.push(...(b.data as HistoryRow[]));
        }
        setHistory(rows);
      } catch {
        setError("Não foi possível carregar os dados (Supabase não configurado neste ambiente).");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = requests.length;
  const openCount = requests.filter((r) => OPEN_REQUEST_STATUSES.includes(r.status)).length;
  const closedCount = total - openCount;

  const byStatus = Object.entries(REQUEST_STATUS_LABELS)
    .map(([key, label]) => ({ label, value: requests.filter((r) => r.status === key).length }))
    .filter((s) => s.value > 0);

  const byType = Object.entries(REQUEST_TYPE_LABELS)
    .map(([key, label]) => ({ label, value: requests.filter((r) => r.request_type === key).length }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value);

  const companyCounts = new Map<string, number>();
  for (const r of requests) {
    const name = r.company?.name || "Sem empresa";
    companyCounts.set(name, (companyCounts.get(name) || 0) + 1);
  }
  const byCompany = Array.from(companyCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const assigneeCounts = new Map<string, number>();
  for (const r of requests) {
    if (!r.assignee) continue;
    assigneeCounts.set(r.assignee.full_name, (assigneeCounts.get(r.assignee.full_name) || 0) + 1);
  }
  const byAssignee = Array.from(assigneeCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Tendência mensal — últimos 6 meses
  const now = new Date();
  const months: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, value: 0 });
  }
  for (const r of requests) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((mm) => mm.key === key);
    if (m) m.value += 1;
  }

  // Tempo médio de 1ª resposta: intervalo entre a criação e o segundo evento
  // registrado no histórico (o primeiro é sempre "criou a solicitação").
  const historyByRequest = new Map<string, string[]>();
  for (const h of history) {
    const arr = historyByRequest.get(h.request_id) || [];
    arr.push(h.created_at);
    historyByRequest.set(h.request_id, arr);
  }
  const firstResponseDiffs: number[] = [];
  for (const r of requests) {
    const times = historyByRequest.get(r.id);
    if (times && times.length >= 2) {
      const diff = new Date(times[1]).getTime() - new Date(r.created_at).getTime();
      if (diff >= 0) firstResponseDiffs.push(diff);
    }
  }
  const avgFirstResponse =
    firstResponseDiffs.length > 0 ? firstResponseDiffs.reduce((a, b) => a + b, 0) / firstResponseDiffs.length : null;

  // Tempo médio de resolução: criação -> última atualização, só para chamados finalizados.
  const resolutionDiffs: number[] = [];
  for (const r of requests) {
    if (CLOSED_REQUEST_STATUSES.includes(r.status)) {
      const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
      if (diff >= 0) resolutionDiffs.push(diff);
    }
  }
  const avgResolution = resolutionDiffs.length > 0 ? resolutionDiffs.reduce((a, b) => a + b, 0) / resolutionDiffs.length : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Relatórios</h1>
        <p className="text-sm text-neutral-500 mt-1">Indicadores de atendimento das solicitações financeiras.</p>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total de chamados" value={loading ? "…" : total} icon={ListChecks} color="indigo" />
        <KpiCard label="Chamados em aberto" value={loading ? "…" : openCount} icon={Clock} color="amber" />
        <KpiCard label="Chamados finalizados" value={loading ? "…" : closedCount} icon={CheckCircle2} color="green" />
        <KpiCard
          label="Tempo médio de 1ª resposta"
          value={loading ? "…" : avgFirstResponse !== null ? formatDuration(avgFirstResponse) : "-"}
          icon={Timer}
          color="blue"
        />
        <KpiCard
          label="Tempo médio de resolução"
          value={loading ? "…" : avgResolution !== null ? formatDuration(avgResolution) : "-"}
          icon={Timer}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-800">
            <Building2 className="h-4 w-4 text-neutral-400" /> Empresas com mais chamados
          </h2>
          <BarList items={byCompany} />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-800">
            <UserCheck className="h-4 w-4 text-neutral-400" /> Responsáveis com mais atendimentos
          </h2>
          <BarList items={byAssignee} colorClass="bg-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Chamados por status</h2>
          <BarList items={byStatus} colorClass="bg-indigo-500" />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Chamados por tipo de solicitação</h2>
          <BarList items={byType} />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Solicitações criadas por mês (últimos 6 meses)</h2>
        <MonthlyTrend months={months} />
      </div>
    </div>
  );
}
