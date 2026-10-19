"use client";

import { useMemo } from "react";
import { Milk } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { eventMinutes, eventsOn } from "@/lib/analytics";
import { startOfDay } from "@/lib/date";

/**
 * Equilíbrio dos lados no peito hoje — ajuda a mãe a lembrar qual lado
 * oferecer primeiro e a perceber assimetrias (comum quando um lado produz
 * mais ou o bebê tem lado preferido).
 */
export function BreastBalanceCard() {
  const { events } = useStore();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const breast = eventsOn(events, today).filter((e) => {
      if (e.kind !== "feeding") return false;
      return (e.payload as { method?: string }).method === "breast";
    });
    let leftMin = 0;
    let rightMin = 0;
    let both = 0;
    for (const e of breast) {
      const side = (e.payload as { side?: string }).side ?? "left";
      const min = eventMinutes(e);
      if (side === "both") {
        both += 1;
        leftMin += min / 2;
        rightMin += min / 2;
      } else if (side === "right") rightMin += min;
      else leftMin += min;
    }
    return { sessions: breast.length, leftMin, rightMin, both };
  }, [events]);

  if (stats.sessions === 0) return null;

  const total = stats.leftMin + stats.rightMin;
  const leftPct = total > 0 ? Math.round((stats.leftMin / total) * 100) : 50;
  const imbalance = total >= 10 && Math.abs(leftPct - 50) >= 20;
  const fmt = (m: number) => `${Math.round(m)} min`;

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Milk className="size-5.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-fg-muted">
            Peito hoje · {stats.sessions} mamada{stats.sessions > 1 ? "s" : ""}
            {stats.both > 0 && ` · ${stats.both} nos dois lados`}
          </p>
          <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full" aria-hidden>
            <span className="bg-brand-500" style={{ width: `${leftPct}%` }} />
            <span className="bg-sage-500" style={{ width: `${100 - leftPct}%` }} />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-fg-subtle">
            <span className="text-brand-600 dark:text-brand-400">Esquerdo {fmt(stats.leftMin)}</span>
            {" · "}
            <span className="text-sage-700 dark:text-sage-300">Direito {fmt(stats.rightMin)}</span>
          </p>
          {imbalance && (
            <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
              💡 O lado {leftPct > 50 ? "esquerdo" : "direito"} trabalhou bem mais hoje. Para
              equilibrar a produção, ofereça o lado {leftPct > 50 ? "direito" : "esquerdo"} primeiro
              na próxima mamada.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
