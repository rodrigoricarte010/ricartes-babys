"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Child, Measurement } from "@/lib/types";
import { useGrowthEngine } from "@/lib/growth-engine";
import {
  classificationLabel,
  formatPercentile,
  formatZScore,
  METRICS,
  METRIC_ORDER,
  percentileShift,
  type Evaluation,
  type MetricKey,
} from "@/lib/growth";
import { ageInDays } from "@/lib/date";
import { num } from "@/lib/utils";
import { Stat, Badge } from "@/components/ui/badge";

export interface MetricSnapshot {
  metric: MetricKey;
  value: number;
  takenAt: string;
  ageDays: number;
  evaluation: Evaluation | null;
  /** Percentil da medição anterior, para mostrar tendência. */
  previousPercentile: number | null;
  shift: { shift: number; direction: "up" | "down" | "stable"; notable: boolean } | null;
}

/**
 * Resumo de crescimento: para cada indicador, pega a medição mais recente que
 * tem aquele valor e o avalia contra a OMS na idade correta.
 */
export function useGrowthSummary(child: Child | null, measurements: Measurement[]) {
  const { engine } = useGrowthEngine();

  return useMemo(() => {
    if (!child || !engine) return null;
    const snapshots: Partial<Record<MetricKey, MetricSnapshot>> = {};

    for (const metric of METRIC_ORDER) {
      const field = metric === "weight" ? "weightKg" : metric === "length" ? "lengthCm" : metric === "head" ? "headCm" : null;
      const withValue = measurements
        .filter((m) => {
          if (metric === "bmi") return m.weightKg != null && m.lengthCm != null;
          return m[field as "weightKg"] != null;
        })
        .slice()
        .sort((a, b) => a.takenAt.localeCompare(b.takenAt));

      if (withValue.length === 0) continue;
      const latest = withValue[withValue.length - 1];
      const previous = withValue.length > 1 ? withValue[withValue.length - 2] : null;

      const valueOf = (m: Measurement): number | null => {
        if (metric === "weight") return m.weightKg;
        if (metric === "length") return m.lengthCm;
        if (metric === "head") return m.headCm;
        if (m.weightKg != null && m.lengthCm != null) return engine.computeBmi(m.weightKg, m.lengthCm);
        return null;
      };

      const value = valueOf(latest);
      if (value == null) continue;
      const age = ageInDays(child.birthDate, new Date(latest.takenAt));

      const evaluation = engine.evaluateMeasurement({
        metric,
        value,
        sex: child.sex,
        birthDate: child.birthDate,
        on: new Date(latest.takenAt),
        gestationalWeeks: child.gestationalWeeks,
      });

      let previousPercentile: number | null = null;
      if (previous) {
        const prevValue = valueOf(previous);
        if (prevValue != null) {
          const prevEval = engine.evaluateMeasurement({
            metric,
            value: prevValue,
            sex: child.sex,
            birthDate: child.birthDate,
            on: new Date(previous.takenAt),
            gestationalWeeks: child.gestationalWeeks,
          });
          previousPercentile = prevEval?.percentile ?? null;
        }
      }

      snapshots[metric] = {
        metric,
        value,
        takenAt: latest.takenAt,
        ageDays: age,
        evaluation,
        previousPercentile,
        shift:
          evaluation && previousPercentile != null
            ? percentileShift(previousPercentile, evaluation.percentile)
            : null,
      };
    }

    return snapshots as Record<MetricKey, MetricSnapshot | undefined>;
  }, [child, engine, measurements]);
}

function TrendIcon({ direction }: { direction: "up" | "down" | "stable" }) {
  if (direction === "up") return <TrendingUp className="size-3.5" aria-hidden />;
  if (direction === "down") return <TrendingDown className="size-3.5" aria-hidden />;
  return <Minus className="size-3.5" aria-hidden />;
}

/** Os quatro cartões de crescimento do topo do painel. */
export function GrowthStatCards({ summary }: { summary: Record<MetricKey, MetricSnapshot | undefined> | null }) {
  if (!summary) return null;

  const toneFor = (snap: MetricSnapshot | undefined) => {
    if (!snap?.evaluation) return "neutral" as const;
    const t = snap.evaluation.tone;
    if (t === "ok") return "sage" as const;
    if (t === "info") return "info" as const;
    if (t === "warning") return "warning" as const;
    return "danger" as const;
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {METRIC_ORDER.map((metric) => {
        const snap = summary[metric];
        const meta = METRICS[metric];
        if (!snap) {
          return (
            <Stat key={metric} label={meta.label} value="—" unit={meta.unit} hint="sem registro" />
          );
        }
        return (
          <Stat
            key={metric}
            label={meta.label}
            value={num(snap.value, metric === "weight" ? 3 : 1)}
            unit={meta.unit}
            tone={toneFor(snap)}
            hint={
              snap.evaluation ? (
                <span className="flex items-center gap-1">
                  <Badge tone={toneFor(snap)}>{formatPercentile(snap.evaluation.percentile)}</Badge>
                  {snap.shift && snap.shift.direction !== "stable" && (
                    <span className="flex items-center gap-0.5 text-fg-subtle">
                      <TrendIcon direction={snap.shift.direction} />
                      {snap.shift.notable && "cruzou faixa"}
                    </span>
                  )}
                </span>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

/** Linha de contexto abaixo dos cartões: o que os números querem dizer. */
export function GrowthContextLine({ summary }: { summary: Record<MetricKey, MetricSnapshot | undefined> | null }) {
  if (!summary) return null;
  const weight = summary.weight;
  if (!weight?.evaluation) return null;
  return (
    <p className="text-xs leading-relaxed text-fg-muted">
      {classificationLabel("weight", weight.evaluation.classification)}.{" "}
      <span className="text-fg-subtle">
        Percentil é posição na curva da OMS, não uma nota — a leitura que importa é a trajetória ao
        longo do tempo.
      </span>
    </p>
  );
}

export function ZScoreLine({ evaluation }: { evaluation: Evaluation | null }) {
  if (!evaluation) return null;
  return (
    <span className="tabular text-xs text-fg-subtle">
      z {formatZScore(evaluation.zScore)}
      {evaluation.corrected && " · idade corrigida"}
    </span>
  );
}
