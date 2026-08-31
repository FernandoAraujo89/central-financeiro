"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import type { AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Textarea com suporte a @menções: ao digitar "@", abre um dropdown com
 * usuários filtrados pelo texto digitado após o "@". Selecionar um usuário
 * insere "@Nome Completo " no texto e registra o id em `mentionedIds`.
 */
export function MentionTextarea({
  users,
  value,
  onChange,
  mentionedIds,
  onMentionedIdsChange,
  placeholder,
}: {
  users: AppUser[];
  value: string;
  onChange: (v: string) => void;
  mentionedIds: string[];
  onMentionedIdsChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [triggerIndex, setTriggerIndex] = React.useState<number | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filtered = users.filter((u) => u.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    const cursor = e.target.selectionStart;
    const uptoCursor = newValue.slice(0, cursor);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(uptoCursor);
    if (match) {
      setOpen(true);
      setQuery(match[1]);
      setTriggerIndex(cursor - match[1].length - 1);
      setActiveIndex(0);
    } else {
      setOpen(false);
    }
  }

  function selectUser(u: AppUser) {
    if (triggerIndex === null || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const before = value.slice(0, triggerIndex);
    const after = value.slice(cursor);
    const insertion = `@${u.full_name} `;
    const newValue = `${before}${insertion}${after}`;
    onChange(newValue);
    if (!mentionedIds.includes(u.id)) onMentionedIdsChange([...mentionedIds, u.id]);
    setOpen(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const pos = before.length + insertion.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectUser(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      {open && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {filtered.map((u, i) => (
            <button
              type="button"
              key={u.id}
              onClick={() => selectUser(u)}
              className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50", i === activeIndex && "bg-primary-50")}
            >
              <Avatar name={u.full_name} size="xs" />
              <span className="truncate">{u.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
