"use client";

import { useMemo, useRef, useState } from "react";
import { useGrowthEngine } from "@/lib/growth-engine";
import {
  buildReferenceCurves,
  CHART_PERCENTILES,
  formatPercentile,
  formatZScore,
  METRICS,
  pickRange,
  type MetricKey,
  type ReferenceCurve,
} from "@/lib/growth";
import type { Sex } from "@/lib/types";
import { ageInDays, fmtDateMedium } from "@/lib/date";
import { num } from "@/lib/utils";
import { kidColorHex } from "@/lib/utils";

/** Um ponto medido da criança. */
export interface MeasuredPoint {
  ageDays: number;
  value: number;
  takenAt: string;
  zScore?: number | null;
  percentile?: number | null;
  source?: string | null;
}

/** Série extra desenhada por cima (ex.: um irmão, para comparar trajetórias). */
export interface OverlaySeries {
  label: string;
  color: string;
  points: MeasuredPoint[];
}

const VB_W = 760;
const VB_H = 420;
const PAD = { top: 18, right: 18, bottom: 40, left: 46 };

/** Ticks "bonitos" para o eixo Y. */
function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const rawStep = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1) * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

const CURVE_STROKE: Record<number, string> = {
  3: "var(--color-brand-300)",
  15: "var(--color-brand-300)",
  50: "var(--color-sage-500)",
  85: "var(--color-brand-300)",
  97: "var(--color-brand-300)",
};

export function GrowthChart({
  metric,
  sex,
  birthDate,
  gestationalWeeks,
  points,
  color,
  maxMonths,
  overlay = [],
  heightClass = "h-[300px] sm:h-[360px]",
}: {
  metric: MetricKey;
  sex: Sex;
  birthDate: string;
  gestationalWeeks?: number | null;
  points: MeasuredPoint[];
  color?: string;
  maxMonths?: number;
  /** Trajetórias extras (ex.: irmãos) desenhadas em traço fino. */
  overlay?: OverlaySeries[];
  heightClass?: string;
}) {
  const { engine } = useGrowthEngine();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const meta = METRICS[metric];
  const childColor = color ?? kidColorHex(undefined, birthDate);

  const currentAgeMonths = useMemo(
    () => ageInDays(birthDate, new Date()) / 30.4375,
    [birthDate],
  );
  const range = useMemo(() => {
    const r = pickRange(currentAgeMonths);
    return maxMonths ? { ...r, maxMonths } : r;
  }, [currentAgeMonths, maxMonths]);

  const curves = useMemo<ReferenceCurve[]>(() => {
    if (!engine) return [];
    return engine.buildReferenceCurves(metric, sex, range);
  }, [engine, metric, sex, range]);

  const visiblePoints = useMemo(
    () => points.filter((p) => p.ageDays / 30.4375 <= range.maxMonths + 0.5),
    [points, range.maxMonths],
  );

  // Domínio do eixo Y a partir das curvas e dos pontos visíveis.
  const yDomain = useMemo<[number, number]>(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const curve of curves) {
      for (const pt of curve.points) {
        if (pt.value < min) min = pt.value;
        if (pt.value > max) max = pt.value;
      }
    }
    for (const p of visiblePoints) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }
    for (const series of overlay) {
      for (const p of series.points) {
        if (p.ageDays / 30.4375 > range.maxMonths + 0.5) continue;
        if (p.value < min) min = p.value;
        if (p.value > max) max = p.value;
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
    const span = Math.max(max - min, meta.step * 4);
    return [Math.max(0, min - span * 0.08), max + span * 0.1];
  }, [curves, visiblePoints, overlay, range.maxMonths, meta.step]);

  const xOf = (months: number) =>
    PAD.left + (months / range.maxMonths) * (VB_W - PAD.left - PAD.right);
  const yOf = (value: number) => {
    const [lo, hi] = yDomain;
    const t = (value - lo) / (hi - lo || 1);
    return PAD.top + (1 - t) * (VB_H - PAD.top - PAD.bottom);
  };

  const pathFor = (curvePoints: { months: number; value: number }[]) =>
    curvePoints
      .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.months).toFixed(2)},${yOf(p.value).toFixed(2)}`)
      .join(" ");

  const bandPath = useMemo(() => {
    const low = curves.find((c) => c.percentile === CHART_PERCENTILES[0]);
    const high = curves.find((c) => c.percentile === CHART_PERCENTILES[CHART_PERCENTILES.length - 1]);
    if (!low || !high) return "";
    const forward = high.points.map((p) => `${xOf(p.months).toFixed(2)},${yOf(p.value).toFixed(2)}`);
    const backward = [...low.points].reverse().map((p) => `${xOf(p.months).toFixed(2)},${yOf(p.value).toFixed(2)}`);
    return `M${forward.join(" L")} L${backward.join(" L")} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curves, yDomain, range.maxMonths]);

  const innerBandPath = useMemo(() => {
    const low = curves.find((c) => c.percentile === 15);
    const high = curves.find((c) => c.percentile === 85);
    if (!low || !high) return "";
    const forward = high.points.map((p) => `${xOf(p.months).toFixed(2)},${yOf(p.value).toFixed(2)}`);
    const backward = [...low.points].reverse().map((p) => `${xOf(p.months).toFixed(2)},${yOf(p.value).toFixed(2)}`);
    return `M${forward.join(" L")} L${backward.join(" L")} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curves, yDomain, range.maxMonths]);

  const childPath = useMemo(
    () =>
      visiblePoints
        .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.ageDays / 30.4375).toFixed(2)},${yOf(p.value).toFixed(2)}`)
        .join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visiblePoints, yDomain, range.maxMonths],
  );

  const yTicks = useMemo(() => niceTicks(yDomain[0], yDomain[1], 5), [yDomain]);
  const xTicks = useMemo(() => {
    const step = range.maxMonths <= 6 ? 1 : range.maxMonths <= 12 ? 2 : range.maxMonths <= 24 ? 3 : 6;
    const out: number[] = [];
    for (let m = 0; m <= range.maxMonths; m += step) out.push(m);
    return out;
  }, [range.maxMonths]);

  function handleMove(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || visiblePoints.length === 0) return;
    // Converte o ponteiro para coordenadas do viewBox.
    const vx = ((clientX - rect.left) / rect.width) * VB_W;
    const vy = ((clientY - rect.top) / rect.height) * VB_H;
    let best = -1;
    let bestDist = Infinity;
    visiblePoints.forEach((p, i) => {
      const dx = xOf(p.ageDays / 30.4375) - vx;
      const dy = yOf(p.value) - vy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(bestDist < 40 * 40 ? best : null);
  }

  const hovered = hover != null ? visiblePoints[hover] : null;

  return (
    <div className="relative select-none" ref={wrapRef}>
      <div
        className={heightClass}
        role="img"
        aria-label={`Curva de ${meta.label.toLowerCase()} com padrões da OMS`}
        onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <clipPath id={`clip-${metric}`}>
              <rect x={PAD.left} y={PAD.top} width={VB_W - PAD.left - PAD.right} height={VB_H - PAD.top - PAD.bottom} />
            </clipPath>
          </defs>

          {/* Grade horizontal */}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={PAD.left} x2={VB_W - PAD.right} y1={yOf(t)} y2={yOf(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 8} y={yOf(t) + 4} textAnchor="end" fontSize="12" fill="var(--color-fg-subtle)" className="tabular">
                {num(t, 1)}
              </text>
            </g>
          ))}

          {/* Grade vertical + rótulos de mês */}
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={xOf(t)} x2={xOf(t)} y1={PAD.top} y2={VB_H - PAD.bottom} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
              <text x={xOf(t)} y={VB_H - PAD.bottom + 20} textAnchor="middle" fontSize="12" fill="var(--color-fg-subtle)" className="tabular">
                {t}m
              </text>
            </g>
          ))}

          <g clipPath={`url(#clip-${metric})`}>
            {/* Faixas de referência */}
            {bandPath && <path d={bandPath} fill="var(--color-brand-400)" opacity="0.10" className="who-band" />}
            {innerBandPath && <path d={innerBandPath} fill="var(--color-brand-400)" opacity="0.10" className="who-band" />}

            {/* Curvas de percentil */}
            {curves.map((curve) => (
              <path
                key={curve.percentile}
                d={pathFor(curve.points)}
                fill="none"
                stroke={CURVE_STROKE[curve.percentile]}
                strokeWidth={curve.percentile === 50 ? 2.4 : 1.4}
                strokeDasharray={curve.percentile === 50 ? undefined : "5 4"}
                opacity={curve.percentile === 50 ? 0.95 : 0.8}
              />
            ))}

            {/* Trajetória da criança */}
            {visiblePoints.length > 1 && (
              <path d={childPath} fill="none" stroke={childColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            )}
            {visiblePoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={xOf(p.ageDays / 30.4375)}
                  cy={yOf(p.value)}
                  r={hover === i ? 7 : 5}
                  fill={childColor}
                  stroke="var(--color-bg-elevated)"
                  strokeWidth="2.5"
                />
              </g>
            ))}

            {/* Trajetórias sobrepostas (irmãos) */}
            {overlay.map((series) => {
              const pts = series.points.filter((p) => p.ageDays / 30.4375 <= range.maxMonths + 0.5);
              if (pts.length === 0) return null;
              const d = pts
                .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.ageDays / 30.4375).toFixed(2)},${yOf(p.value).toFixed(2)}`)
                .join(" ");
              return (
                <g key={series.label} opacity="0.75">
                  {pts.length > 1 && (
                    <path d={d} fill="none" stroke={series.color} strokeWidth="1.8" strokeDasharray="6 4" strokeLinecap="round" />
                  )}
                  {pts.map((p, i) => (
                    <circle key={i} cx={xOf(p.ageDays / 30.4375)} cy={yOf(p.value)} r="3" fill={series.color} opacity="0.8" />
                  ))}
                </g>
              );
            })}

            {/* Linha vertical do ponto em foco */}
            {hovered && (
              <line
                x1={xOf(hovered.ageDays / 30.4375)}
                x2={xOf(hovered.ageDays / 30.4375)}
                y1={PAD.top}
                y2={VB_H - PAD.bottom}
                stroke={childColor}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            )}
          </g>

          {/* Rótulo do eixo Y */}
          <text x={PAD.left - 34} y={PAD.top - 4} fontSize="12" fontWeight="700" fill="var(--color-fg-subtle)">
            {meta.unit}
          </text>
        </svg>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          // `clamp` mantém o balão dentro do gráfico: com translate de -50%,
          // um ponto perto da borda jogaria metade dele para fora da tela em
          // telas estreitas. O --tip-half acompanha a largura máxima abaixo.
          className="pointer-events-none absolute z-10 max-w-[11.5rem] -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-bg-elevated px-3 py-2 shadow-lift [--tip-half:5.75rem]"
          style={{
            left: `clamp(var(--tip-half), ${(xOf(hovered.ageDays / 30.4375) / VB_W) * 100}%, calc(100% - var(--tip-half)))`,
            top: `${(yOf(hovered.value) / VB_H) * 100}%`,
          }}
        >
          <p className="tabular whitespace-nowrap text-sm font-extrabold text-fg">
            {num(hovered.value, meta.precision)} {meta.unit}
          </p>
          <p className="whitespace-nowrap text-[11px] text-fg-muted">{fmtDateMedium(hovered.takenAt)}</p>
          {hovered.percentile != null && (
            <p className="whitespace-nowrap text-[11px] font-semibold text-brand-600 dark:text-brand-300">
              {formatPercentile(hovered.percentile)} · z {hovered.zScore != null ? formatZScore(hovered.zScore) : "—"}
            </p>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: childColor }} />
          {`Medições`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded bg-sage-500" />
          Mediana (p50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-5 rounded bg-brand-400/20" />
          Faixa p3–p97 (OMS)
        </span>
        {overlay.map((series) => (
          <span key={series.label} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: series.color, opacity: 0.8 }} />
            {series.label}
          </span>
        ))}
      </div>

      {!engine && (
        <p className="mt-2 text-xs text-fg-subtle">Carregando as curvas de referência da OMS…</p>
      )}
    </div>
  );
}
