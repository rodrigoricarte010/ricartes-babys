"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useStore } from "@/lib/store";
import { eventMinutes } from "@/lib/analytics";
import { addDays, fmtWeekday, startOfDay, toDate } from "@/lib/date";

/**
 * Padrões da semana — mapa de calor hora × dia (a ideia do "sweet spot" do
 * Huckleberry): em que horas o bebê dorme/mama de verdade. Padrões que a
 * cabeça não percebe na linha do tempo viram desenho aqui.
 */

type PatternMetric = "sleep" | "feeding";

/** RGB da cor da marca (#f04478) para as células do mapa. */
const BRAND_RGB = "240, 68, 120";
const CAP: Record<PatternMetric, number> = { sleep: 55, feeding: 35 };

export function WeekPatternCard() {
  const { activeChild, events } = useStore();
  const [metric, setMetric] = useState<PatternMetric>("sleep");

  const { days, grid, insight } = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const grid: number[][] = days.map(() => new Array<number>(24).fill(0));
    let insight: string | null = null;

    if (!activeChild) return { days, grid, insight };

    const first = days[0].getTime();
    const dayIndexOf = (d: Date) => days.findIndex((x) => x.getTime() === startOfDay(d).getTime());

    for (const e of events) {
      const from = toDate(e.startedAt);
      if (from.getTime() + 86_400_000 < first) continue;

      if (metric === "feeding") {
        if (e.kind !== "feeding" || from.getTime() < first) continue;
        const idx = dayIndexOf(from);
        if (idx >= 0) grid[idx][from.getHours()] += Math.max(eventMinutes(e), 1);
      } else if (e.kind === "sleep") {
        const minutes = eventMinutes(e);
        if (minutes <= 0) continue;
        const to = new Date(from.getTime() + minutes * 60_000);
        if (to.getTime() < first) continue;
        // Distribui o sono pelas horas tocadas — inclusive viradas de noite.
        for (let i = 0; i < days.length; i++) {
          const dayStart = days[i].getTime();
          const dayEnd = dayStart + 86_400_000;
          const overlapFrom = Math.max(from.getTime(), dayStart);
          const overlapTo = Math.min(to.getTime(), dayEnd);
          if (overlapTo <= overlapFrom) continue;
          for (let h = 0; h < 24; h++) {
            const hStart = dayStart + h * 3_600_000;
            const hEnd = hStart + 3_600_000;
            const mins = (Math.min(overlapTo, hEnd) - Math.max(overlapFrom, hStart)) / 60_000;
            if (mins > 0) grid[i][h] += mins;
          }
        }
      }
    }

    const hourTotals = new Array<number>(24).fill(0);
    for (const row of grid) row.forEach((v, h) => (hourTotals[h] += v));
    const peakMinutes = Math.max(...hourTotals);
    if (peakMinutes > 0) {
      const peak = hourTotals.indexOf(peakMinutes);
      if (metric === "sleep") {
        const night = hourTotals.slice(0, 6).reduce((a, b) => a + b, 0);
        const nightHours = Math.round(night / 60);
        insight = `O sono costuma se concentrar por volta das ${peak}h. Madrugada (0h–5h): ~${nightHours}h nos últimos 7 dias.`;
      } else {
        insight = `Pico de mamadas por volta das ${peak}h — bom horário para planejar os passeios fora dele.`;
      }
    }

    return { days, grid, insight };
  }, [activeChild, events, metric]);

  if (!activeChild) return null;

  const cap = CAP[metric];
  const hasData = grid.some((row) => row.some((v) => v > 0));

  return (
    <Card>
      <CardHeader
        title="Padrões da semana"
        subtitle="últimos 7 dias · cada quadradinho é 1 hora"
        action={
          <Segmented
            ariaLabel="Métrica do mapa"
            size="sm"
            value={metric}
            onChange={(v) => setMetric(v as PatternMetric)}
            options={[
              { value: "sleep", label: "Sono" },
              { value: "feeding", label: "Mamadas" },
            ]}
          />
        }
      />
      <CardBody>
        {!hasData ? (
          <p className="text-[13px] leading-relaxed text-fg-muted">
            Registre {metric === "sleep" ? "sonos" : "mamadas"} por alguns dias e o desenho dos
            horários aparece aqui — é onde os padrões (e as janelas de passeio) se revelam.
          </p>
        ) : (
          <>
            <div className="space-y-[3px]">
              {days.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-11 shrink-0 text-right text-[10px] font-bold capitalize text-fg-subtle">
                    {fmtWeekday(d).slice(0, 3)} {d.getDate()}
                  </span>
                  <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
                    {grid[i].map((mins, h) => {
                      const t = Math.min(1, mins / cap);
                      return (
                        <span
                          key={h}
                          title={`${fmtWeekday(d)} ${h}h — ${Math.round(mins)} min`}
                          className="h-4 rounded-[3px]"
                          style={{
                            backgroundColor:
                              t <= 0
                                ? "var(--color-bg-muted)"
                                : `rgba(${BRAND_RGB}, ${(0.12 + 0.88 * t).toFixed(2)})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between pl-[50px] text-[10px] font-semibold text-fg-subtle">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
            {insight && (
              <p className="mt-3 rounded-xl bg-bg-muted/50 px-3 py-2 text-xs leading-relaxed text-fg-muted">
                💡 {insight}
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
