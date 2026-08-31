"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { RequestForm } from "@/components/features/request-form";
import type { Company, AppUser } from "@/lib/types";

export default function NovaSolicitacaoPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: c }, { data: u }] = await Promise.all([
          supabase.from("companies").select("*").eq("active", true).order("name"),
          supabase.from("users").select("*").eq("active", true).order("full_name"),
        ]);
        setCompanies((c as Company[]) || []);
        setUsers((u as AppUser[]) || []);
      } catch {
        /* Supabase não configurado neste ambiente */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Solicitação de alteração financeira</h1>
        <p className="text-sm text-neutral-500 mt-1">Preencha os dados abaixo para registrar uma nova solicitação.</p>
      </div>

      {(loading || userLoading) && <p className="text-sm text-neutral-400">Carregando formulário…</p>}
      {!loading && !userLoading && user && <RequestForm companies={companies} users={users} currentUser={user} />}
      {!loading && !userLoading && !user && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível identificar o usuário logado (Supabase não configurado neste ambiente).
        </div>
      )}
    </div>
  );
}
