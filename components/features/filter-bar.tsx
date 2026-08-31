"use client";

import * as React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, type Company, type AppUser } from "@/lib/types";

export interface Filters {
  status?: string;
  company_id?: string;
  requester_id?: string;
  request_type?: string;
  assignee_id?: string;
  date_from?: string;
  date_to?: string;
  client_name?: string;
  document?: string;
}

export function FilterBar({
  filters,
  onChange,
  companies,
  users,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  companies: Company[];
  users: AppUser[];
}) {
  function set<K extends keyof Filters>(key: K, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Status</label>
        <Select value={filters.status || "all"} onValueChange={(v) => set("status", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Tipo</label>
        <Select value={filters.request_type || "all"} onValueChange={(v) => set("request_type", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Empresa solicitante</label>
        <Select value={filters.company_id || "all"} onValueChange={(v) => set("company_id", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Solicitante</label>
        <Select value={filters.requester_id || "all"} onValueChange={(v) => set("requester_id", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Responsável</label>
        <Select value={filters.assignee_id || "all"} onValueChange={(v) => set("assignee_id", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Período (de)</label>
        <Input type="date" value={filters.date_from || ""} onChange={(e) => set("date_from", e.target.value)} className="w-[150px]" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Período (até)</label>
        <Input type="date" value={filters.date_to || ""} onChange={(e) => set("date_to", e.target.value)} className="w-[150px]" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Cliente</label>
        <Input value={filters.client_name || ""} onChange={(e) => set("client_name", e.target.value)} className="w-[160px]" placeholder="Nome do cliente" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">CNPJ/CPF</label>
        <Input value={filters.document || ""} onChange={(e) => set("document", e.target.value)} className="w-[160px]" placeholder="Documento" />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X className="h-3.5 w-3.5" /> Limpar filtros
        </Button>
      )}
    </div>
  );
}
