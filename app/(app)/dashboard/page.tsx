"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KpiCard } from "@/components/features/kpi-card";
import { RequestTable } from "@/components/features/request-table";
import { REQUEST_STATUS_LABELS, type FinancialRequest, type RequestStatus } from "@/lib/types";
import { ListChecks, Clock, ShieldCheck, MessageCircleQuestion, CheckCircle2, XCircle, Flag } from "lucide-react";

const KPI_DEFS: { key: RequestStatus | "total"; label: string; icon: any; color: any }[] = [
  { key: "total", label: "Total", icon: ListChecks, color: "indigo" },
  { key: "em_analise", label: REQUEST_STATUS_LABELS.em_analise, icon: Clock, color: "blue" },
  { key: "em_validacao", label: REQUEST_STATUS_LABELS.em_validacao, icon: ShieldCheck, color: "blue" },
  { key: "aguardando_informacoes", label: "Aguardando retorno", icon: MessageCircleQuestion, color: "amber" },
  { key: "aprovada", label: REQUEST_STATUS_LABELS.aprovada, icon: CheckCircle2, color: "green" },
  { key: "reprovada", label: REQUEST_STATUS_LABELS.reprovada, icon: XCircle, color: "red" },
  { key: "concluida", label: REQUEST_STATUS_LABELS.concluida, icon: Flag, color: "green" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = React.useState<FinancialRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("financial_requests")
          .select("*, company:companies(*), requester:users!financial_requests_requester_id_fkey(*), assignee:users!financial_requests_assignee_id_fkey(*)")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        setRequests((data as FinancialRequest[]) || []);
      } catch (err) {
        setError("Não foi possível carregar os dados (Supabase não configurado neste ambiente).");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts: Record<string, number> = { total: requests.length };
  for (const r of requests) counts[r.status] = (counts[r.status] || 0) + 1;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Visão geral das solicitações financeiras da Avante.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {KPI_DEFS.map((kpi) => (
          <KpiCard
            key={kpi.key}
            label={kpi.label}
            value={loading ? "…" : counts[kpi.key] || 0}
            icon={kpi.icon}
            color={kpi.color}
            onClick={() => router.push(kpi.key === "total" ? "/solicitacoes" : `/solicitacoes?status=${kpi.key}`)}
          />
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Solicitações recentes</h2>
          <a href="/solicitacoes" className="text-sm font-medium text-primary-600 hover:underline">
            Ver todas
          </a>
        </div>
        <RequestTable requests={requests.slice(0, 8)} loading={loading} />
      </div>
    </div>
  );
}
