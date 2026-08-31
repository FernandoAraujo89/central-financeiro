"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FilterBar, type Filters } from "@/components/features/filter-bar";
import { RequestTable } from "@/components/features/request-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Company, AppUser, FinancialRequest } from "@/lib/types";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function SolicitacoesPage() {
  return (
    <Suspense fallback={null}>
      <SolicitacoesContent />
    </Suspense>
  );
}

function SolicitacoesContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = React.useState<Filters>(() => ({
    status: searchParams.get("status") || undefined,
  }));
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [requests, setRequests] = React.useState<FinancialRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [count, setCount] = React.useState(0);
  const pageSize = 20;

  const mineOnly = searchParams.get("mine") === "1";
  const assignedOnly = searchParams.get("assigned") === "1";

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: c }, { data: u }] = await Promise.all([
          supabase.from("companies").select("*").order("name"),
          supabase.from("users").select("*").order("full_name"),
        ]);
        setCompanies((c as Company[]) || []);
        setUsers((u as AppUser[]) || []);
      } catch {
        /* Supabase não configurado */
      }
    })();
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      if (search) params.set("search", search);
      if (mineOnly) params.set("mine", "1");
      if (assignedOnly) params.set("assigned", "1");
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      setRequests(json.data || []);
      setCount(json.count || 0);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters, search, page, mineOnly, assignedOnly]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const title = mineOnly ? "Minhas solicitações" : assignedOnly ? "Aguardando minha análise" : "Todas as solicitações";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500 mt-1">{count} solicitação(ões) encontrada(s)</p>
        </div>
        <Link href="/solicitacoes/nova">
          <Button>
            <PlusCircle className="h-4 w-4" /> Nova solicitação
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
          placeholder="Buscar por nº, cliente, CNPJ/CPF, título…"
          className="h-9 w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button variant="outline" onClick={() => (setPage(1), load())}>
          Buscar
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
        companies={companies}
        users={users}
      />

      <RequestTable requests={requests} loading={loading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-neutral-500">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
