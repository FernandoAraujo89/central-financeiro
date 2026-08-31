"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";
import type { AppNotification } from "@/lib/types";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const load = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);
      setNotifications((data as AppNotification[]) || []);
    } catch {
      // ambiente sem Supabase configurado
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(n: AppNotification) {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: "POST" });
      } catch {
        /* noop */
      }
    }
    if (n.request_id) router.push(`/solicitacoes/${n.request_id}`);
    else router.push("/notificacoes");
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-80" align="end">
        <DropdownLabel>Notificações</DropdownLabel>
        <DropdownSeparator />
        <div className="max-h-96 overflow-y-auto">
          {loading && <p className="px-3 py-6 text-center text-sm text-neutral-400">Carregando…</p>}
          {!loading && notifications.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-400">Nenhuma notificação por aqui.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                !n.read ? "bg-primary-50/50" : ""
              }`}
            >
              <span className="font-medium text-neutral-800">{n.title}</span>
              {n.body && <span className="text-xs text-neutral-500 line-clamp-2">{n.body}</span>}
              <span className="text-[11px] text-neutral-400">{formatRelative(n.created_at)}</span>
            </button>
          ))}
        </div>
        <DropdownSeparator />
        <Link href="/notificacoes" className="block px-3 py-2 text-center text-sm font-medium text-primary-600 hover:bg-neutral-50 rounded-md">
          Ver todas
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
