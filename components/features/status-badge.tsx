import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS, type RequestStatus, type RequestPriority } from "@/lib/types";

const STATUS_COLORS: Record<RequestStatus, Parameters<typeof Badge>[0]["color"]> = {
  nova: "blue",
  em_analise: "indigo",
  em_validacao: "purple",
  aguardando_informacoes: "amber",
  aguardando_responsavel: "amber",
  aprovada: "green",
  reprovada: "red",
  cancelada: "gray",
  concluida: "green",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge color={STATUS_COLORS[status]} className={className}>
      {REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}

const PRIORITY_COLORS: Record<RequestPriority, Parameters<typeof Badge>[0]["color"]> = {
  baixa: "gray",
  normal: "blue",
  alta: "amber",
  urgente: "red",
};

export function PriorityBadge({ priority, className }: { priority: RequestPriority; className?: string }) {
  return (
    <Badge color={PRIORITY_COLORS[priority]} className={className}>
      {REQUEST_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
