/**
 * Camada de crescimento — envolve o pacote `who-growth-standards`, que traz
 * as tabelas LMS oficiais da OMS (Child Growth Standards, 0–5 anos).
 *
 * Fonte dos dados: https://www.who.int/tools/child-growth-standards
 * O pacote é MIT; os dados de referência pertencem à OMS.
 *
 * Este módulo é o ÚNICO lugar do app que conhece os números da OMS, para que
 * uma revisão das tabelas não se espalhe pela interface.
 */
import {
  bmi as computeBmi,
  classify as whoClassify,
  correctedAgeInDays,
  evaluate,
  percentileToZScore,
  valueAtPercentile,
  valueAtZScore,
  zScoreToPercentile,
  type Indicator,
  type Sex,
} from "who-growth-standards";
import { ageInDays } from "@/lib/date";

export type { Indicator, Sex };
export { computeBmi, zScoreToPercentile, percentileToZScore };

/** Percentis que desenhamos nas curvas, no padrão dos cadernos da OMS. */
export const CHART_PERCENTILES = [3, 15, 50, 85, 97] as const;
/** Z-scores equivalentes, usados na leitura clínica. */
export const CHART_ZSCORES = [-2, -1, 0, 1, 2] as const;

export type MetricKey = "weight" | "length" | "head" | "bmi";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: string;
  indicator: Indicator;
  /** Quantas casas decimais fazem sentido para a medição. */
  precision: number;
  step: number;
  min: number;
  max: number;
  description: string;
}

export const METRICS: Record<MetricKey, MetricMeta> = {
  weight: {
    key: "weight",
    label: "Peso",
    unit: "kg",
    indicator: "wfa",
    precision: 3,
    step: 0.01,
    min: 0.5,
    max: 60,
    description: "Peso-para-idade (OMS, 0 a 5 anos)",
  },
  length: {
    key: "length",
    label: "Estatura",
    unit: "cm",
    indicator: "lhfa",
    precision: 1,
    step: 0.1,
    min: 30,
    max: 130,
    description: "Comprimento/estatura-para-idade (OMS, 0 a 5 anos)",
  },
  head: {
    key: "head",
    label: "Perímetro cefálico",
    unit: "cm",
    indicator: "hcfa",
    precision: 1,
    step: 0.1,
    min: 20,
    max: 70,
    description: "Perímetro cefálico-para-idade (OMS, 0 a 5 anos)",
  },
  bmi: {
    key: "bmi",
    label: "IMC",
    unit: "kg/m²",
    indicator: "bfa",
    precision: 2,
    step: 0.1,
    min: 8,
    max: 30,
    description: "IMC-para-idade (OMS, 0 a 5 anos)",
  },
};

export const METRIC_ORDER: MetricKey[] = ["weight", "length", "head", "bmi"];

export interface Evaluation {
  zScore: number;
  percentile: number;
  median: number;
  /** Faixa etária usada no cálculo (pode ser a corrigida, em prematuros). */
  ageDays: number;
  chronologicalAgeDays: number;
  corrected: boolean;
  clamped: boolean;
  classification: Classification;
  label: string;
  tone: "danger" | "warning" | "ok" | "info";
}

export type Classification = "severamente baixo" | "baixo" | "adequado" | "elevado" | "severamente elevado";

const CLASSIFICATION_PT: Record<ReturnType<typeof whoClassify>, Classification> = {
  "severely low": "severamente baixo",
  low: "baixo",
  normal: "adequado",
  high: "elevado",
  "severely high": "severamente elevado",
};

/** Tom de cor para a classificação — só "adequado" é verde; o resto é aviso. */
function toneFor(z: number, metric: MetricKey): Evaluation["tone"] {
  const abs = Math.abs(z);
  if (abs > 3) return "danger";
  if (abs > 2) return "warning";
  // Para estatura e PC, acima da média não é "alerta": é só informação.
  if (z > 2 && (metric === "length" || metric === "head")) return "info";
  return "ok";
}

export interface EvaluateInput {
  metric: MetricKey;
  value: number;
  sex: Sex;
  birthDate: string | Date;
  on?: string | Date;
  /** Semanas de gestação ao nascer — habilita idade corrigida. */
  gestationalWeeks?: number | null;
}

/**
 * Avalia uma medição contra o padrão da OMS.
 * Prematuros (<37 semanas) são avaliados pela idade corrigida até 24 meses,
 * que é a convenção usada em puericultura.
 */
export function evaluateMeasurement({
  metric,
  value,
  sex,
  birthDate,
  on = new Date(),
  gestationalWeeks = null,
}: EvaluateInput): Evaluation | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const meta = METRICS[metric];
  const reference = on instanceof Date ? on : new Date(on as string);
  const chronological = ageInDays(birthDate, reference);

  // Idade corrigida só vale enquanto faz diferença clínica (até 2 anos).
  const useCorrection = gestationalWeeks != null && gestationalWeeks < 37 && chronological <= 730;
  const age = useCorrection
    ? correctedAgeInDays(chronological, gestationalWeeks)
    : chronological;

  try {
    const result = evaluate(meta.indicator, sex, value, age, { clamp: true });
    const classification = CLASSIFICATION_PT[whoClassify(result.zScore)];
    return {
      zScore: result.zScore,
      percentile: result.percentile,
      median: result.median,
      ageDays: age,
      chronologicalAgeDays: chronological,
      corrected: useCorrection && age !== chronological,
      clamped: result.clamped,
      classification,
      tone: toneFor(result.zScore, metric),
      label: classificationLabel(metric, classification),
    };
  } catch {
    return null;
  }
}

/** Frase curta e honesta: descreve posição na curva, não dá diagnóstico. */
export function classificationLabel(metric: MetricKey, c: Classification): string {
  const what = METRICS[metric].label.toLowerCase();
  switch (c) {
    case "severamente baixo":
      return `${what} muito abaixo da faixa da OMS`;
    case "baixo":
      return `${what} abaixo da faixa da OMS`;
    case "elevado":
      return `${what} acima da faixa da OMS`;
    case "severamente elevado":
      return `${what} muito acima da faixa da OMS`;
    default:
      return `${what} dentro da faixa esperada`;
  }
}

/** Ponto de uma curva de referência. */
export interface CurvePoint {
  /** Idade em meses decimais (eixo X do gráfico). */
  months: number;
  value: number;
}

export interface ReferenceCurve {
  percentile: number;
  points: CurvePoint[];
}

export interface ChartRange {
  /** Limite superior do eixo X em meses. */
  maxMonths: number;
  /** Passo de amostragem em meses. */
  stepMonths: number;
}

/**
 * Escolhe o recorte do eixo X: a curva sempre cobre a idade atual da criança
 * com folga, sem desperdiçar tela mostrando os 5 anos inteiros para um bebê.
 */
export function pickRange(currentAgeMonths: number): ChartRange {
  const age = Math.max(0, currentAgeMonths);
  if (age <= 3) return { maxMonths: 6, stepMonths: 0.25 };
  if (age <= 6) return { maxMonths: 12, stepMonths: 0.5 };
  if (age <= 12) return { maxMonths: 24, stepMonths: 1 };
  if (age <= 24) return { maxMonths: 36, stepMonths: 1.5 };
  if (age <= 36) return { maxMonths: 48, stepMonths: 2 };
  return { maxMonths: 60, stepMonths: 2.5 };
}

const MONTHS_TO_DAYS = 30.4375;

/**
 * Gera as curvas de referência (percentis 3/15/50/85/97) para um indicador.
 * Custo: ~25 pontos × 5 percentis — barato o bastante para rodar no cliente.
 */
export function buildReferenceCurves(
  metric: MetricKey,
  sex: Sex,
  range: ChartRange,
): ReferenceCurve[] {
  const indicator = METRICS[metric].indicator;
  const curves: ReferenceCurve[] = [];
  for (const percentile of CHART_PERCENTILES) {
    const points: CurvePoint[] = [];
    for (let months = 0; months <= range.maxMonths + 1e-9; months += range.stepMonths) {
      const days = Math.round(months * MONTHS_TO_DAYS);
      try {
        points.push({
          months,
          value: valueAtPercentile(indicator, sex, percentile, days, { clamp: true }),
        });
      } catch {
        // fora do intervalo publicado — ignora o ponto
      }
    }
    curves.push({ percentile, points });
  }
  return curves;
}

/** Valor esperado (mediana) para uma idade, em qualquer indicador. */
export function medianAt(metric: MetricKey, sex: Sex, ageDays: number): number {
  return valueAtZScore(METRICS[metric].indicator, sex, 0, ageDays, { clamp: true });
}

/** Valor que corresponde a um percentil específico naquela idade. */
export function valueAt(metric: MetricKey, sex: Sex, percentile: number, ageDays: number): number {
  return valueAtPercentile(METRICS[metric].indicator, sex, percentile, ageDays, { clamp: true });
}

/** Faixa "normal" (p3–p97) para uma idade — usada em resumos e alertas. */
export function expectedRange(
  metric: MetricKey,
  sex: Sex,
  ageDays: number,
): { low: number; median: number; high: number } {
  return {
    low: valueAt(metric, sex, 3, ageDays),
    median: valueAt(metric, sex, 50, ageDays),
    high: valueAt(metric, sex, 97, ageDays),
  };
}

/**
 * Velocidade de crescimento entre duas medições.
 * É o número que mais importa em puericultura: uma criança pode estar no
 * percentil 25 e saudável, mas cruzar percentis para baixo é sinal de alerta.
 */
export function velocity(
  metric: MetricKey,
  first: { ageDays: number; value: number },
  last: { ageDays: number; value: number },
): { delta: number; perMonth: number; daysBetween: number } | null {
  const days = last.ageDays - first.ageDays;
  if (days < 7) return null; // janela curta demais para dizer algo útil
  const delta = last.value - first.value;
  const months = days / MONTHS_TO_DAYS;
  return { delta, perMonth: delta / months, daysBetween: days };
}

/**
 * Cruza percentis? Compara o percentil da primeira e da última medição.
 * Uma mudança de mais de 2 faixas (≈ 30 percentis) merece atenção.
 */
export function percentileShift(first: number, last: number): {
  shift: number;
  direction: "up" | "down" | "stable";
  notable: boolean;
} {
  const shift = last - first;
  const direction = shift > 5 ? "up" : shift < -5 ? "down" : "stable";
  return { shift, direction, notable: Math.abs(shift) >= 25 };
}

/** Formata um percentil do jeito que se escreve no Brasil: "percentil 62". */
export function formatPercentile(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 1) return `p${p.toFixed(1)}`;
  return `p${Math.round(p)}`;
}

/** Z-score com sinal e 1 decimal: "+0,8" / "−1,2". */
export function formatZScore(z: number): string {
  if (!Number.isFinite(z)) return "—";
  const rounded = Math.round(z * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(1).replace(".", ",")}`;
}
