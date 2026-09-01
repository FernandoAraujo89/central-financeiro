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
import { Plus, ShieldAlert, Pencil, Trash2, AlertTriangle } from "lucide-react";

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

  // Editar usuário existente
  const [editingUser, setEditingUser] = React.useState<AppUser | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRole, setEditRole] = React.useState<UserRole>("solicitante");
  const [editSaving, setEditSaving] = React.useState(false);

  // Excluir usuário (confirmação)
  const [deletingUser, setDeletingUser] = React.useState<AppUser | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  function openEdit(u: AppUser) {
    setEditingUser(u);
    setEditName(u.full_name);
    setEditRole(u.role);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editName, role: editRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível salvar", description: json.error, variant: "error" });
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, full_name: editName, role: editRole } : u)));
      toast({ title: "Usuário atualizado.", variant: "success" });
      setEditingUser(null);
    } catch {
      toast({ title: "Supabase não configurado", variant: "error" });
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível excluir", description: json.error, variant: "error" });
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === deletingUser.id ? { ...u, active: false } : u)));
      toast({ title: "Usuário excluído.", description: deletingUser.full_name, variant: "success" });
      setDeletingUser(null);
    } catch {
      toast({ title: "Supabase não configurado", variant: "error" });
    } finally {
      setDeleting(false);
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
                <Badge color="indigo">{ROLE_LABELS[u.role]}</Badge>
                <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeletingUser(u)}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Editar usuário */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent title="Editar usuário">
          <form onSubmit={handleEditSave} className="space-y-4 mt-2">
            <div>
              <Label>Nome completo</Label>
              <Input required value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={editingUser?.email || ""} disabled />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
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
              <Button type="submit" size="sm" disabled={editSaving}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão de usuário */}
      <Dialog open={deletingUser !== null} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent title="Excluir usuário">
          <div className="flex items-start gap-3 text-sm text-neutral-600">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Tem certeza que deseja excluir <strong>{deletingUser?.full_name}</strong>? O usuário perde o acesso ao sistema;
              solicitações, comentários e histórico já registrados por ele são preservados. Essa ação não pode ser desfeita.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompaniesTab() {
  const { toast } = useToast();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [deletingCompany, setDeletingCompany] = React.useState<Company | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  async function handleDelete() {
    if (!deletingCompany) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/companies/${deletingCompany.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível excluir", description: json.error, variant: "error" });
        return;
      }
      setCompanies((prev) => prev.map((c) => (c.id === deletingCompany.id ? { ...c, active: false } : c)));
      toast({ title: "Empresa excluída.", description: deletingCompany.name, variant: "success" });
      setDeletingCompany(null);
    } catch {
      toast({ title: "Supabase não configurado", variant: "error" });
    } finally {
      setDeleting(false);
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
            <div className="flex items-center gap-2">
              {!c.active && <Badge color="gray">Inativa</Badge>}
              {c.active && (
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeletingCompany(c)}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmar exclusão de empresa */}
      <Dialog open={deletingCompany !== null} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <DialogContent title="Excluir empresa">
          <div className="flex items-start gap-3 text-sm text-neutral-600">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Tem certeza que deseja excluir <strong>{deletingCompany?.name}</strong>? Ela deixa de aparecer nos formulários e
              filtros; solicitações já registradas continuam com o histórico intacto. Essa ação não pode ser desfeita.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
