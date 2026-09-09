"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Bell,
  Users,
  Settings,
  Inbox,
  UserCheck,
  Wallet,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { permissions } from "@/lib/permissions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/solicitacoes", label: "Todas as solicitações", icon: ListChecks },
  { href: "/solicitacoes?mine=1", label: "Minhas solicitações", icon: Inbox },
  { href: "/solicitacoes?assigned=1", label: "Aguardando minha análise", icon: UserCheck },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-neutral-200 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-neutral-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Wallet className="h-4.5 w-4.5" />
        </div>
        <span className="font-semibold text-neutral-900 text-lg">Fin-Hub</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href.split("?")[0] && !item.href.includes("?");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors",
                active && "bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/solicitacoes/nova"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors mt-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nova solicitação
        </Link>

        <div className="pt-4 mt-4 border-t border-neutral-200 space-y-1">
          <Link
            href="/notificacoes"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              pathname === "/notificacoes" && "bg-primary-50 text-primary-700"
            )}
          >
            <Bell className="h-4 w-4" />
            Notificações
          </Link>
          {permissions.canManageUsers(role) && (
            <Link
              href="/usuarios"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                pathname === "/usuarios" && "bg-primary-50 text-primary-700"
              )}
            >
              <Users className="h-4 w-4" />
              Usuários
            </Link>
          )}
          {permissions.canManageSettings(role) && (
            <Link
              href="/configuracoes"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                pathname === "/configuracoes" && "bg-primary-50 text-primary-700"
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          )}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-neutral-200 text-xs text-neutral-400">
        Avante · Fin-Hub v1.0
      </div>
    </aside>
  );
}
