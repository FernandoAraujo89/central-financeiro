import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  color = "neutral",
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  color?: "neutral" | "blue" | "amber" | "green" | "red" | "indigo";
  active?: boolean;
  onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    neutral: "text-neutral-500 bg-neutral-100",
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    green: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-white p-4 text-left transition-shadow hover:shadow-sm",
        active ? "border-primary-400 ring-1 ring-primary-400" : "border-neutral-200"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", colors[color])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <span className="text-2xl font-semibold text-neutral-900">{value}</span>
    </Comp>
  );
}
