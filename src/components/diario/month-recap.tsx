"use client";

import { useMemo, useState } from "react";
import { Cake, ChevronDown, TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { addMonths, ageInDays, fmtDateMedium, toDate } from "@/lib/date";
import { MILESTONE_BY_KEY } from "@/lib/catalog/milestones";
import { num } from "@/lib/utils";

/**
 * Mesversários: o recap automático de cada mês completo.
 *
 * O diário guarda o subjetivo; o mesversário guarda o objetivo — quanto
 * ganhou, quanto cresceu, quantos marcos, qual foi o ritmo de mamadas. Juntos
 * viram a memória quantitativa da infância, que ninguém consegue reconstruir
 * de cabeça depois.
 */

interface MonthStat {
  month: number;
  from: Date;
  to: Date;
  weightGainG: number | null;
  lengthGainCm: number | null;
  milestones: string[];
  feedsPerDay: number | null;
  sleepPerDayMin: number | null;
}

function nearestBefore(
  measurements: { takenAt: string; weightKg: number | null; lengthCm: number | null }[],
  boundary: Date,
) {
  // Última medição até 10 dias depois do limite (para capturar a consulta do mês).
  const limit = boundary.getTime() + 10 * 86_400_000;
  let best: (typeof measurements)[number] | null = null;
  for (const m of measurements) {
    const t = toDate(m.takenAt).getTime();
    if (t <= limit && (!best || t > toDate(best.takenAt).getTime())) best = m;
  }
  return best;
}

export function MonthRecapCard() {
  const { activeChild: child, measurements, events } = useStore();
  const [showAll, setShowAll] = useState(false);

  const stats = useMemo<MonthStat[]>(() => {
    if (!child) return [];
    const birth = toDate(child.birthDate);
    const now = new Date();
    const completed = Math.floor(ageInDays(birth, now) / 30.4375);
    const out: MonthStat[] = [];

    for (let m = completed; m >= 1; m--) {
      const from = addMonths(birth, m - 1);
      const to = addMonths(birth, m);
      const startM = nearestBefore(measurements, from);
      const endM = nearestBefore(measurements, to);

      const weightGainG =
        startM?.weightKg != null && endM?.weightKg != null
          ? Math.round((endM.weightKg - startM.weightKg) * 1000)
          : null;
      const lengthGainCm =
        startM?.lengthCm != null && endM?.lengthCm != null
          ? Math.round((endM.lengthCm - startM.lengthCm) * 10) / 10
          : null;

      const inMonth = events.filter((e) => {
        const t = toDate(e.startedAt).getTime();
        return t >= from.getTime() && t < to.getTime();
      });
      const milestones = inMonth
        .filter((e) => e.kind === "milestone")
        .map((e) => MILESTONE_BY_KEY.get((e.payload as { key?: string }).key ?? "")?.text ?? "Marco")
        .slice(0, 4);

      const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
      const feeds = inMonth.filter((e) => e.kind === "feeding").length;
      const sleepMin = inMonth
        .filter((e) => e.kind === "sleep")
        .reduce((acc, e) => acc + (e.durationMin ?? 0), 0);

      out.push({
        month: m,
        from,
        to,
        weightGainG,
        lengthGainCm,
        milestones,
        feedsPerDay: feeds > 0 ? feeds / days : null,
        sleepPerDayMin: sleepMin > 0 ? sleepMin / days : null,
      });
    }
    return out;
  }, [child, measurements, events]);

  if (!child) return null;

  const nextMonth = stats.length + 1;
  const nextDate = addMonths(toDate(child.birthDate), nextMonth);
  const shown = showAll ? stats : stats.slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Mesversários"
        subtitle="O recap objetivo de cada mês completo"
        icon={<Cake className="size-4.5" />}
        action={<Badge tone="brand">próximo: {nextDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</Badge>}
      />
      <CardBody className="space-y-3 pt-2">
        {stats.length === 0 ? (
          <p className="py-3 text-sm text-fg-subtle">
            O primeiro mesversário fecha em {fmtDateMedium(addMonths(toDate(child.birthDate), 1))}. Volte depois — o
            recap monta sozinho.
          </p>
        ) : (
          <>
            {shown.map((s) => (
              <div key={s.month} className="rounded-2xl border border-line bg-bg-muted/40 p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-base font-extrabold text-fg">
                    Mês {s.month}
                    <span className="ml-2 text-xs font-semibold text-fg-subtle">
                      {fmtDateMedium(s.from)} → {fmtDateMedium(s.to)}
                    </span>
                  </p>
                  {s.weightGainG != null && (
                    <span className="flex items-center gap-1 text-sm font-extrabold tabular text-sage-600 dark:text-sage-300">
                      <TrendingUp className="size-3.5" aria-hidden />+{s.weightGainG} g
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.lengthGainCm != null && <Badge tone="neutral">+{num(s.lengthGainCm, 1)} cm</Badge>}
                  {s.feedsPerDay != null && <Badge tone="warning">{num(s.feedsPerDay, 1)} mamadas/dia</Badge>}
                  {s.sleepPerDayMin != null && (
                    <Badge tone="info">{Math.round(s.sleepPerDayMin / 60)} h {Math.round(s.sleepPerDayMin % 60)} de sono/dia</Badge>
                  )}
                  {s.milestones.length > 0 && <Badge tone="sage">{s.milestones.length} marco{s.milestones.length > 1 ? "s" : ""}</Badge>}
                </div>
                {s.milestones.length > 0 && (
                  <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                    {s.milestones.join(" · ")}
                    {s.milestones.length >= 4 ? "…" : ""}
                  </p>
                )}
              </div>
            ))}
            {stats.length > 3 && (
              <button type="button" onClick={() => setShowAll(!showAll)} className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-fg-muted hover:bg-bg-muted hover:text-fg">
                {showAll ? "Mostrar menos" : `Ver todos os ${stats.length} meses`}
                <ChevronDown className={`size-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} aria-hidden />
              </button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
