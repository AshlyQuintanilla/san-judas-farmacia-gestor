import { cn } from "@/lib/utils";

/** Logotipo: cruz farmacéutica dentro de un cuadro redondeado. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
      </svg>
    </div>
  );
}
