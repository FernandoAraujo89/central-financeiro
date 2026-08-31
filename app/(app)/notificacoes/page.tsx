"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export default function NotificacoesPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      setNotifications(json.data || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markRead(n: AppNotification) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "POST" });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.request_id) router.push(`/solicitacoes/${n.request_id}`);
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Central de notificações</h1>
          <p className="text-sm text-neutral-500 mt-1">{unreadCount} não lida(s)</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {loading && <p className="px-4 py-8 text-center text-sm text-neutral-400">Carregando…</p>}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <Bell className="h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-400">Você não tem notificações.</p>
          </div>
        )}
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n)}
            className={`flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-neutral-50 ${!n.read ? "bg-primary-50/40" : ""}`}
          >
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
            <div className={n.read ? "pl-5" : ""}>
              <p className="text-sm font-medium text-neutral-800">{n.title}</p>
              {n.body && <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>}
              <p className="text-xs text-neutral-400 mt-1">{formatDateTime(n.created_at)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
