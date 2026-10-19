import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Estado vazio que explica e oferece a próxima ação — nunca só um "nada aqui".
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon && (
        <span className="mb-3.5 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-400 dark:bg-brand-950/50 dark:text-brand-300">
          {icon}
        </span>
      )}
      <h3 className="text-[15px] font-bold tracking-tight text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse-soft rounded-xl bg-bg-muted", className)}
      aria-hidden
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elevated p-4 shadow-soft">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}
