import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "America/Sao_Paulo";

/** Formata uma data ISO como DD/MM/AAAA (fuso America/Sao_Paulo). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return formatInTimeZone(new Date(iso), TZ, "dd/MM/yyyy");
  } catch {
    return "-";
  }
}

/** Formata uma data ISO como DD/MM/AAAA HH:mm (fuso America/Sao_Paulo). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return formatInTimeZone(new Date(iso), TZ, "dd/MM/yyyy 'às' HH:mm");
  } catch {
    return "-";
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `há ${diffD} d`;
  return formatDate(iso);
}

/** Formata uma duração em milissegundos como "2 d 4 h", "3 h 20 min" ou "45 min". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours} h ${remMinutes} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} d ${remHours} h` : `${days} d`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Detecta URLs num texto simples e retorna partes de texto/link para renderização. */
export function linkifyParts(text: string): Array<{ type: "text" | "link"; value: string }> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts;
}
