import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  color = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  color?: "neutral" | "blue" | "indigo" | "amber" | "green" | "red" | "purple" | "gray";
}) {
  const colors: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
