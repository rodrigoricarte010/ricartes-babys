"use client";

import { AlertTriangle, Droplets, Info, ThumbsUp } from "lucide-react";
import { stoolGuidance, stoolPhase, type StoolGuidance } from "@/lib/catalog/stool-guide";
import { cn } from "@/lib/utils";

/**
 * Leitura do cocô registrado, no próprio formulário de fralda.
 * Arquivo isolado (como o fever-card) para não criar ciclo com o log-provider.
 */
export function StoolGuidanceCard({
  ageDays,
  color,
  texture,
}: {
  ageDays: number;
  color: string;
  texture: string;
}) {
  const guidance: StoolGuidance | null = stoolGuidance(ageDays, color, texture);

  if (!guidance) {
    const phase = stoolPhase(ageDays);
    return (
      <div className="rounded-2xl border border-line bg-bg-muted/40 p-3.5">
        <div className="flex items-start gap-2.5">
          <Droplets className="mt-0.5 size-4.5 shrink-0 text-fg-subtle" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-extrabold text-fg">O que é normal agora: fase “{phase.name}”</p>
            <p className="text-[13px] leading-relaxed text-fg-muted">{phase.text}</p>
          </div>
        </div>
      </div>
    );
  }

  const toneClass = {
    ok: "border-sage-300/70 bg-sage-50/50 dark:border-sage-800 dark:bg-sage-950/20",
    info: "border-sky-300/70 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/20",
    warning: "border-amber-300/70 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
    danger: "border-red-300/70 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30",
  }[guidance.tone];

  const titleColor = {
    ok: "text-sage-800 dark:text-sage-200",
    info: "text-sky-800 dark:text-sky-200",
    warning: "text-amber-900 dark:text-amber-200",
    danger: "text-red-800 dark:text-red-200",
  }[guidance.tone];

  const Icon = guidance.tone === "danger" || guidance.tone === "warning" ? AlertTriangle : guidance.tone === "ok" ? ThumbsUp : Info;
  const iconColor = {
    ok: "text-sage-600 dark:text-sage-300",
    info: "text-sky-600 dark:text-sky-300",
    warning: "text-amber-600 dark:text-amber-300",
    danger: "text-red-600 dark:text-red-300",
  }[guidance.tone];

  return (
    <div className={cn("rounded-2xl border p-3.5", toneClass)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 size-4.5 shrink-0", iconColor)} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className={cn("text-sm font-extrabold", titleColor)}>{guidance.title}</p>
          <p className="text-[13px] leading-relaxed text-fg-muted">{guidance.text}</p>
          {guidance.action && <p className="text-[13px] font-semibold text-fg-muted">{guidance.action}</p>}
        </div>
      </div>
    </div>
  );
}
