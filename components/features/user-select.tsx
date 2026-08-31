"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { AppUser } from "@/lib/types";

export function UserSelect({
  users,
  value,
  onChange,
  placeholder = "Selecione…",
  allowNone = true,
  filterRole,
}: {
  users: AppUser[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
  filterRole?: AppUser["role"][];
}) {
  const list = filterRole ? users.filter((u) => filterRole.includes(u.role)) : users;
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">Não atribuído</SelectItem>}
        {list.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
