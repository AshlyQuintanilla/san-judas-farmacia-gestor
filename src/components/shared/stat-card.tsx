import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-accent text-accent-foreground",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
} as const;

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary", className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-card animate-rise", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
