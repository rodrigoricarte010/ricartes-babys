import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-bg-muted text-fg-muted",
        brand: "bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300",
        sage: "bg-sage-100 text-sage-700 dark:bg-sage-950/70 dark:text-sage-300",
        ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300",
        info: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
      },
      outline: {
        true: "border border-current/25 bg-transparent",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", outline: false },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, outline, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, outline }), className)} {...props} />;
}

export type Tone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Dot({ tone = "neutral", className }: { tone?: Tone; className?: string }) {
  const map: Record<string, string> = {
    neutral: "bg-fg-subtle",
    brand: "bg-brand-500",
    sage: "bg-sage-500",
    ok: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-sky-500",
  };
  return <span className={cn("size-2 shrink-0 rounded-full", map[tone], className)} />;
}

/** Cartão de estatística: número grande + rótulo + tendência opcional. */
export function Stat({
  label,
  value,
  unit,
  hint,
  trend,
  tone = "neutral",
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  trend?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  const accent: Record<string, string> = {
    neutral: "text-fg",
    brand: "text-brand-600 dark:text-brand-300",
    sage: "text-sage-600 dark:text-sage-300",
    ok: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-sky-600 dark:text-sky-400",
  };
  return (
    <div
      // Mesmo motivo do Card: como item de grid, `min-width: auto` faria a
      // coluna crescer até o rótulo mais longo em vez de deixá-lo truncar.
      className={cn(
        "min-w-0 rounded-2xl border border-line bg-bg-elevated p-3.5 shadow-soft sm:p-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-fg-subtle">{label}</span>
        {icon && <span className={cn("shrink-0", accent[tone])}>{icon}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("tabular text-2xl font-extrabold tracking-tight sm:text-[28px]", accent[tone])}>
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-fg-subtle">{unit}</span>}
      </div>
      {(hint || trend) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
          {trend}
          {hint}
        </div>
      )}
    </div>
  );
}
