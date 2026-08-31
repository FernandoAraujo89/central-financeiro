"use client";

import { Avatar } from "@/components/ui/avatar";
import { CommentComposer } from "@/components/features/comment-composer";
import { formatDateTime, linkifyParts } from "@/lib/utils";
import type { AppUser, RequestComment, RequestHistory } from "@/lib/types";
import { History } from "lucide-react";

type ActivityItem =
  | { kind: "comment"; at: string; comment: RequestComment }
  | { kind: "history"; at: string; history: RequestHistory };

export function ActivityPanel({
  requestId,
  comments,
  history,
  users,
  onRefresh,
}: {
  requestId: string;
  comments: RequestComment[];
  history: RequestHistory[];
  users: AppUser[];
  onRefresh: () => void;
}) {
  const items: ActivityItem[] = [
    ...comments.map((c): ActivityItem => ({ kind: "comment", at: c.created_at, comment: c })),
    ...history.map((h): ActivityItem => ({ kind: "history", at: h.created_at, history: h })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="flex h-full flex-col border-l border-neutral-200 bg-neutral-50/50">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3.5">
        <History className="h-4 w-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-800">Atividade</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-8">Nenhuma atividade ainda.</p>}
        {items.map((item, i) =>
          item.kind === "comment" ? (
            <div key={`c-${item.comment.id}`} className="flex gap-3">
              <Avatar name={item.comment.author?.full_name || "?"} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="rounded-xl rounded-tl-sm bg-white border border-neutral-200 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-neutral-800">{item.comment.author?.full_name}</span>
                    <span className="text-[11px] text-neutral-400 shrink-0">{formatDateTime(item.comment.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">
                    {linkifyParts(item.comment.body).map((part, j) =>
                      part.type === "link" ? (
                        <a key={j} href={part.value} target="_blank" rel="noreferrer" className="text-primary-600 underline break-all">
                          {part.value}
                        </a>
                      ) : (
                        <span key={j}>{part.value}</span>
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div key={`h-${item.history.id}`} className="flex items-start gap-3 pl-1">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-neutral-300 shrink-0" />
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-600">{item.history.action}</span>{" "}
                <span className="text-neutral-400">· {formatDateTime(item.history.created_at)}</span>
              </p>
            </div>
          )
        )}
      </div>

      <CommentComposer requestId={requestId} users={users} onPosted={onRefresh} />
    </div>
  );
}
