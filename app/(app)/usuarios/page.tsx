"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AppUser, Company, UserRole } from "@/lib/types";
import { Plus, ShieldAlert } from "lucide-react";

export default function UsuariosPage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();

  if (userLoading) return <div className="p-6 text-sm text-neutral-400">Carregando…</div>;

  if (currentUser && currentUser.role !== "administrador") {
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
        <h1 className="text-2xl font-semibold text-neutral-900">Gestão de usuários</h1>
        <p className="text-sm text-neutral-500 mt-1">Gerencie usuários, papéis (RBAC) e empresas solicitantes.</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="empresas" className="mt-4">
          <CompaniesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("solicitante");

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      setUsers(json.data || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível criar o usuário", description: json.error, variant: "error" });
        return;
      }
      toast({ title: "Usuário criado com sucesso.", variant: "success" });
      setOpen(false);
      setEmail("");
      setFullName("");
      setRole("solicitante");
      load();
    } catch {
      toast({ title: "Supabase não configurado", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(userId: string, newRole: UserRole) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({ title: "Papel atualizado.", variant: "success" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent title="Novo usuário">
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <Label>Nome completo</Label>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Papel</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={saving}>
                  Criar usuário
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {loading && <p className="px-4 py-8 text-center text-sm text-neutral-400">Carregando…</p>}
        {!loading &&
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={u.full_name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{u.full_name}</p>
                  <p className="text-xs text-neutral-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!u.active && <Badge color="gray">Inativo</Badge>}
                <Select value={u.role} onValueChange={(v) => updateRole(u.id, v as UserRole)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function CompaniesTab() {
  const { toast } = useToast();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from("companies").select("*").order("name");
      setCompanies((data as Company[]) || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível criar a empresa", description: json.error, variant: "error" });
        return;
      }
      setName("");
      load();
      toast({ title: "Empresa criada.", variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova empresa" className="max-w-xs" />
        <Button type="submit" size="sm" disabled={saving}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </form>

      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {loading && <p className="px-4 py-8 text-center text-sm text-neutral-400">Carregando…</p>}
        {!loading && companies.length === 0 && <p className="px-4 py-8 text-center text-sm text-neutral-400">Nenhuma empresa cadastrada.</p>}
        {companies.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-neutral-800">{c.name}</span>
            {!c.active && <Badge color="gray">Inativa</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
