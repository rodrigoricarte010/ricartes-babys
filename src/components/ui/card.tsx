import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-bg-elevated shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold tracking-tight text-fg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4 sm:px-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 border-t border-line px-4 py-3 sm:px-5", className)}
      {...props}
    />
  );
}
