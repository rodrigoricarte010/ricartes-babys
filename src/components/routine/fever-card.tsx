"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { feverGuidance, FEVER_RED_FLAGS, type FeverGuidance } from "@/lib/health";
import { ageInDays } from "@/lib/date";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Leitura de febre com orientação por idade.
 * Arquivo isolado de propósito: não importa o log-provider, para não criar
 * ciclo de importação com os formulários de registro.
 */
export function FeverGuidanceCard({
  tempC,
  ageMonths,
  compact = false,
}: {
  tempC: number;
  ageMonths: number;
  compact?: boolean;
}) {
  const [showFlags, setShowFlags] = useState(false);
  const guidance: FeverGuidance | null = feverGuidance(ageMonths, tempC);
  if (!guidance) return null;

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

  const iconColor = {
    ok: "text-sage-600 dark:text-sage-300",
    info: "text-sky-600 dark:text-sky-300",
    warning: "text-amber-600 dark:text-amber-300",
    danger: "text-red-600 dark:text-red-300",
  }[guidance.tone];

  return (
    <div className={cn("rounded-2xl border p-3.5", toneClass)}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className={cn("mt-0.5 size-4.5 shrink-0", iconColor)} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className={cn("text-sm font-extrabold", titleColor)}>{guidance.title}</p>
          {!compact && <p className="text-[13px] leading-relaxed text-fg-muted">{guidance.text}</p>}
          <p className="text-[13px] font-semibold text-fg-muted">{guidance.action}</p>

          {(guidance.tone === "warning" || guidance.tone === "danger") && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFlags(!showFlags)}
                className="flex items-center gap-1 text-xs font-bold text-fg-muted hover:text-fg"
              >
                Sinais de alerta para correr agora
                <ChevronDown className={cn("size-3.5 transition-transform", showFlags && "rotate-180")} aria-hidden />
              </button>
              {showFlags && (
                <ul className="mt-1.5 space-y-1 pl-4 text-xs leading-relaxed text-fg-muted">
                  {FEVER_RED_FLAGS.map((f) => (
                    <li key={f} className="list-disc marker:text-red-500">
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Temperatura mais alta registrada em sintomas hoje. */
export function useTodayMaxTemp(): number | null {
  const { events } = useStore();
  return useMemo(() => {
    const today = new Date();
    let max: number | null = null;
    for (const e of events) {
      if (e.kind !== "symptom") continue;
      const d = new Date(e.startedAt);
      if (d.toDateString() !== today.toDateString()) continue;
      const t = (e.payload as { temperatureC?: number }).temperatureC;
      if (typeof t === "number" && (max == null || t > max)) max = t;
    }
    return max;
  }, [events]);
}

/** Cartão de febre do dia (rotina), quando há temperatura ≥ 37,3 registrada hoje. */
export function TodayFeverCard() {
  const { activeChild: child } = useStore();
  const temp = useTodayMaxTemp();
  if (!child || temp == null || temp < 37.3) return null;
  return <FeverGuidanceCard tempC={temp} ageMonths={ageInDays(child.birthDate, new Date()) / 30.4375} />;
}
