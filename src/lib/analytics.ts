import type { AppEvent, DiaryEntry, Measurement } from "@/lib/types";
import { dayKey, toDate, startOfDay, addDays, durationLabel } from "@/lib/date";

/**
 * Leitura da rotina.
 *
 * Tudo aqui é função pura sobre a lista de eventos — fácil de testar e de
 * reutilizar no resumo do dia, nos gráficos e no relatório do pediatra.
 */

/** Duração em minutos, mesmo quando só as pontas foram gravadas. */
export function eventMinutes(e: AppEvent): number {
  if (e.durationMin != null && Number.isFinite(e.durationMin)) return e.durationMin;
  if (!e.endedAt) return 0;
  return Math.max(0, (toDate(e.endedAt).getTime() - toDate(e.startedAt).getTime()) / 60_000);
}

export function byKind(events: readonly AppEvent[], kind: AppEvent["kind"]): AppEvent[] {
  return events.filter((e) => e.kind === kind);
}

export function eventsOn(events: readonly AppEvent[], date: Date | string): AppEvent[] {
  const key = dayKey(date);
  return events.filter((e) => dayKey(e.startedAt) === key);
}

export function eventsBetween(
  events: readonly AppEvent[],
  from: Date,
  to: Date,
): AppEvent[] {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime() + 86_399_999;
  return events.filter((e) => {
    const t = toDate(e.startedAt).getTime();
    return t >= a && t <= b;
  });
}

export function lastEvent(events: readonly AppEvent[], kind: AppEvent["kind"]): AppEvent | null {
  const list = byKind(events, kind);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (toDate(b.startedAt) > toDate(a.startedAt) ? b : a));
}

export function hoursSince(iso: string | null | undefined, on = new Date()): number | null {
  if (!iso) return null;
  return (on.getTime() - toDate(iso).getTime()) / 3_600_000;
}

/** "há 2 h 15 min" — o número que os pais mais olham na madrugada. */
export function sinceLabel(iso: string | null | undefined, on = new Date()): string | null {
  const h = hoursSince(iso, on);
  if (h == null) return null;
  if (h < 1 / 60) return "agora mesmo";
  return `há ${durationLabel(h * 60)}`;
}

export interface DaySummary {
  date: Date;
  key: string;
  feedCount: number;
  feedMinutes: number;
  feedMl: number;
  breastCount: number;
  bottleCount: number;
  solidsCount: number;
  sleepMinutes: number;
  napMinutes: number;
  nightMinutes: number;
  napCount: number;
  diaperCount: number;
  wetCount: number;
  dirtyCount: number;
  medicineCount: number;
  symptomCount: number;
  milestoneCount: number;
  firstFeedingAt: string | null;
  lastFeedingAt: string | null;
  longestSleepMinutes: number;
}

export function emptyDay(date: Date): DaySummary {
  return {
    date,
    key: dayKey(date),
    feedCount: 0,
    feedMinutes: 0,
    feedMl: 0,
    breastCount: 0,
    bottleCount: 0,
    solidsCount: 0,
    sleepMinutes: 0,
    napMinutes: 0,
    nightMinutes: 0,
    napCount: 0,
    diaperCount: 0,
    wetCount: 0,
    dirtyCount: 0,
    medicineCount: 0,
    symptomCount: 0,
    milestoneCount: 0,
    firstFeedingAt: null,
    lastFeedingAt: null,
    longestSleepMinutes: 0,
  };
}

export function summarizeDay(events: readonly AppEvent[], date: Date | string): DaySummary {
  const day = startOfDay(date);
  const s = emptyDay(day);
  const list = eventsOn(events, day);

  const feedings = list.filter((e) => e.kind === "feeding");
  s.feedCount = feedings.length;
  for (const f of feedings) {
    const min = eventMinutes(f);
    s.feedMinutes += min;
    const amount = (f.payload as { amountMl?: number }).amountMl;
    if (typeof amount === "number") s.feedMl += amount;
    const method = (f.payload as { method?: string }).method;
    if (method === "breast") s.breastCount++;
    else if (method === "bottle" || method === "pump") s.bottleCount++;
    else if (method === "solids") s.solidsCount++;
    if (!s.firstFeedingAt || toDate(f.startedAt) < toDate(s.firstFeedingAt)) s.firstFeedingAt = f.startedAt;
    if (!s.lastFeedingAt || toDate(f.startedAt) > toDate(s.lastFeedingAt)) s.lastFeedingAt = f.startedAt;
  }

  const sleeps = list.filter((e) => e.kind === "sleep");
  for (const sl of sleeps) {
    const min = eventMinutes(sl);
    s.sleepMinutes += min;
    s.longestSleepMinutes = Math.max(s.longestSleepMinutes, min);
    if ((sl.payload as { type?: string }).type === "night") s.nightMinutes += min;
    else {
      s.napMinutes += min;
      s.napCount++;
    }
  }

  const diapers = list.filter((e) => e.kind === "diaper");
  s.diaperCount = diapers.length;
  for (const d of diapers) {
    const type = (d.payload as { type?: string }).type;
    if (type === "wet") s.wetCount++;
    else if (type === "dirty") s.dirtyCount++;
    else if (type === "both") {
      s.wetCount++;
      s.dirtyCount++;
    }
  }

  s.medicineCount = list.filter((e) => e.kind === "medicine").length;
  s.symptomCount = list.filter((e) => e.kind === "symptom").length;
  s.milestoneCount = list.filter((e) => e.kind === "milestone").length;

  return s;
}

/** Série diária para gráficos, do mais antigo para o mais recente. */
export function dailySeries(events: readonly AppEvent[], days: number, on = new Date()): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = startOfDay(addDays(on, -i));
    out.push(summarizeDay(events, date));
  }
  return out;
}

/** Médias dos últimos N dias — para o card "padrão da semana". */
export function weeklyAverages(series: readonly DaySummary[]) {
  const withData = series.filter((d) => d.feedCount > 0 || d.sleepMinutes > 0);
  if (withData.length === 0) return null;
  const avg = (fn: (d: DaySummary) => number) =>
    withData.reduce((acc, d) => acc + fn(d), 0) / withData.length;
  return {
    days: withData.length,
    feedCount: avg((d) => d.feedCount),
    feedMinutes: avg((d) => d.feedMinutes),
    feedMl: avg((d) => d.feedMl),
    sleepMinutes: avg((d) => d.sleepMinutes),
    diaperCount: avg((d) => d.diaperCount),
  };
}

/** Intervalo médio entre mamadas (horas), no período informado. */
export function averageFeedingIntervalHours(events: readonly AppEvent[], days = 3, on = new Date()): number | null {
  const from = startOfDay(addDays(on, -(days - 1)));
  const feedings = eventsBetween(events, from, on)
    .filter((e) => e.kind === "feeding")
    .map((e) => toDate(e.startedAt).getTime())
    .sort((a, b) => a - b);
  if (feedings.length < 2) return null;
  let total = 0;
  let count = 0;
  for (let i = 1; i < feedings.length; i++) {
    const gapH = (feedings[i] - feedings[i - 1]) / 3_600_000;
    // Ignora intervalos absurdos (> 8h) que atravessam a madrugada.
    if (gapH > 0.2 && gapH < 8) {
      total += gapH;
      count++;
    }
  }
  return count === 0 ? null : total / count;
}

// ── Crescimento ─────────────────────────────────────────────────

export interface MeasurementPoint {
  measurement: Measurement;
  ageDays: number;
}

export function lastMeasurementWith(
  measurements: readonly Measurement[],
  field: "weightKg" | "lengthCm" | "headCm",
): Measurement | null {
  const list = measurements.filter((m) => m[field] != null);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (toDate(b.takenAt) > toDate(a.takenAt) ? b : a));
}

/**
 * Ganho de peso médio em g/dia.
 *
 * Compara a última medição com a mais recente que esteja a pelo menos 7 dias
 * de distância — janela curta demais só mede ruído da balança, e janela longa
 * demais mistura fases de crescimento diferentes.
 */
export function weightGainPerDay(
  points: readonly MeasurementPoint[],
  windowDays = 45,
): { perDay: number; daysBetween: number; grams: number } | null {
  const withWeight = points.filter((p) => p.measurement.weightKg != null);
  if (withWeight.length < 2) return null;
  const last = withWeight[withWeight.length - 1];
  const base = [...withWeight]
    .reverse()
    .find((p) => {
      const gap = last.ageDays - p.ageDays;
      return gap >= 7 && gap <= windowDays;
    });
  if (!base) return null;
  const days = last.ageDays - base.ageDays;
  const grams = ((last.measurement.weightKg as number) - (base.measurement.weightKg as number)) * 1000;
  return { perDay: grams / days, daysBetween: days, grams };
}

/**
 * Referência de ganho de peso por idade (OMS/Ministério da Saúde), em g/dia.
 * Serve só para dar contexto — nunca como meta rígida.
 */
export function expectedWeightGainPerDay(ageDays: number): { min: number; typical: number } {
  if (ageDays <= 90) return { min: 20, typical: 28 };
  if (ageDays <= 180) return { min: 13, typical: 18 };
  if (ageDays <= 365) return { min: 7, typical: 11 };
  if (ageDays <= 730) return { min: 4, typical: 7 };
  return { min: 2, typical: 5 };
}

/** Nome da fase, para contextualizar o ganho de peso esperado. */
export function expectedWeightGainPerDayLabel(ageDays: number): string {
  if (ageDays <= 90) return "0 a 3 meses";
  if (ageDays <= 180) return "3 a 6 meses";
  if (ageDays <= 365) return "6 a 12 meses";
  if (ageDays <= 730) return "1 a 2 anos";
  return "2 anos ou mais";
}

// ── Diário ──────────────────────────────────────────────────────

export const MOOD_LABEL: Record<NonNullable<DiaryEntry["mood"]>, string> = {
  otimo: "Dia ótimo",
  bem: "Dia bom",
  neutro: "Dia tranquilo",
  dificil: "Dia difícil",
  ruim: "Dia ruim",
};

export const MOOD_EMOJI: Record<NonNullable<DiaryEntry["mood"]>, string> = {
  otimo: "🌟",
  bem: "😊",
  neutro: "🙂",
  dificil: "😮‍💨",
  ruim: "😢",
};

export function diaryOn(diary: readonly DiaryEntry[], date: Date | string): DiaryEntry[] {
  const key = dayKey(date);
  return diary.filter((d) => d.date === key);
}
