"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { RequestDetail } from "@/components/features/request-detail";
import { ActivityPanel } from "@/components/features/activity-panel";
import type { AppUser, FinancialRequest, RequestComment, RequestHistory, RequestAttachment } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface DetailData extends FinancialRequest {
  comments: RequestComment[];
  attachments: RequestAttachment[];
  history: RequestHistory[];
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [data, setData] = React.useState<DetailData | null>(null);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${params.id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Não foi possível carregar a solicitação.");
        return;
      }
      setData(json.data);
    } catch {
      setError("Supabase não configurado neste ambiente.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    load();
    (async () => {
      try {
        const supabase = createClient();
        const { data: u } = await supabase.from("users").select("*").order("full_name");
        setUsers((u as AppUser[]) || []);
      } catch {
        /* noop */
      }
    })();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 max-w-lg">
          {error || "Solicitação não encontrada."}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] lg:min-h-0">
      <div className="flex-1 min-w-0 lg:overflow-y-auto lg:w-[70%]">
        <RequestDetail request={data} attachments={data.attachments} users={users} currentUser={user} onUpdated={load} />
      </div>
      <div className="flex flex-col border-t border-neutral-200 lg:border-t-0 lg:w-[30%] lg:min-w-[340px] lg:max-w-[420px] lg:h-full">
        <ActivityPanel requestId={data.id} comments={data.comments} history={data.history} users={users} onRefresh={load} />
      </div>
    </div>
  );
}
