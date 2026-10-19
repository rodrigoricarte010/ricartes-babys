import type { AppEvent } from "@/lib/types";
import { ageInDays, isSameDay, toDate } from "@/lib/date";

/**
 * Janelas de sono (wake windows) e previsor de soneca.
 *
 * A ideia (a mesma que torna o Huckleberry famoso) é simples: o tempo que um
 * bebê aguenta acordado é previsível por idade. Sabendo quando ele acordou por
 * último, dá para sugerir a próxima janela de soneca e o horário de dormir —
 * antes que o cansaço vire choro e o choro vire uma noite ruim.
 *
 * Faixas consolidadas de Cleveland Clinic, Sleep Foundation e guias de
 * consultores de sono. São REFERÊNCIAS, não regras: cada criança tem seu ritmo.
 */

export interface WakeWindowBand {
  /** Limite inferior da faixa, em meses decimais. */
  fromMonths: number;
  toMonths: number;
  /** Janela acordada mínima e máxima, em minutos. */
  minMin: number;
  maxMin: number;
  /** Número típico de sonecas por dia. */
  naps: number;
  napsLabel: string;
  /** Sono total típico em 24 h (informativo). */
  totalSleep: string;
}

export const WAKE_WINDOWS: WakeWindowBand[] = [
  { fromMonths: 0, toMonths: 1, minMin: 30, maxMin: 60, naps: 5, napsLabel: "4–6 (irregulares)", totalSleep: "14–17 h" },
  { fromMonths: 1, toMonths: 2, minMin: 45, maxMin: 90, naps: 4, napsLabel: "4–5", totalSleep: "14–17 h" },
  { fromMonths: 2, toMonths: 3, minMin: 60, maxMin: 105, naps: 4, napsLabel: "4", totalSleep: "14–16 h" },
  { fromMonths: 3, toMonths: 4, minMin: 75, maxMin: 120, naps: 4, napsLabel: "3–4", totalSleep: "14–15 h" },
  { fromMonths: 4, toMonths: 5, minMin: 90, maxMin: 150, naps: 3, napsLabel: "3", totalSleep: "12–16 h" },
  { fromMonths: 5, toMonths: 7, minMin: 120, maxMin: 180, naps: 3, napsLabel: "3", totalSleep: "~14 h" },
  { fromMonths: 7, toMonths: 9, minMin: 150, maxMin: 210, naps: 2, napsLabel: "2–3", totalSleep: "~14 h" },
  { fromMonths: 9, toMonths: 12, minMin: 165, maxMin: 240, naps: 2, napsLabel: "2", totalSleep: "13–14 h" },
  { fromMonths: 12, toMonths: 14, minMin: 195, maxMin: 270, naps: 2, napsLabel: "2", totalSleep: "13–14 h" },
  { fromMonths: 14, toMonths: 18, minMin: 240, maxMin: 330, naps: 1, napsLabel: "1–2 (transição)", totalSleep: "12–14 h" },
  { fromMonths: 18, toMonths: 24, minMin: 300, maxMin: 390, naps: 1, napsLabel: "1", totalSleep: "12–14 h" },
  { fromMonths: 24, toMonths: 36, minMin: 330, maxMin: 420, naps: 1, napsLabel: "0–1", totalSleep: "11–14 h" },
  { fromMonths: 36, toMonths: 60, minMin: 360, maxMin: 480, naps: 0, napsLabel: "0–1", totalSleep: "10–13 h" },
  { fromMonths: 60, toMonths: 240, minMin: 420, maxMin: 720, naps: 0, napsLabel: "0", totalSleep: "9–12 h" },
];

export function wakeWindowFor(ageMonths: number): WakeWindowBand {
  return (
    WAKE_WINDOWS.find((b) => ageMonths >= b.fromMonths && ageMonths < b.toMonths) ??
    WAKE_WINDOWS[WAKE_WINDOWS.length - 1]
  );
}

export type SleepState = "dormindo" | "acordou-ha-pouco" | "na-janela" | "quase" | "passou" | "sem-dados";

export interface SleepPrediction {
  band: WakeWindowBand;
  state: SleepState;
  /** Sono em andamento agora, se houver. */
  sleepingNow: { startedAt: string; minutesSoFar: number } | null;
  /** Quando o último sono terminou (= quando ela acordou). */
  lastWakeAt: Date | null;
  awakeMinutes: number | null;
  /** Janela sugerida para a próxima soneca. */
  napFrom: Date | null;
  napTo: Date | null;
  /** 0 = acabou de acordar, 1 = fim da janela máxima. */
  windowProgress: number | null;
  napsToday: number;
  /** Sugestão de horário de dormir (última soneca + janela final). */
  bedtimeFrom: Date | null;
  bedtimeTo: Date | null;
  message: string;
}

const MIN = 60_000;

export function predictSleep(birthDate: string, events: readonly AppEvent[], on: Date = new Date()): SleepPrediction {
  const ageMonths = ageInDays(birthDate, on) / 30.4375;
  const band = wakeWindowFor(ageMonths);

  const sleeps = events
    .filter((e) => e.kind === "sleep")
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const sleeping = sleeps.find((e) => {
    const start = toDate(e.startedAt).getTime();
    const end = e.endedAt ? toDate(e.endedAt).getTime() : Infinity;
    return start <= on.getTime() && end > on.getTime();
  });

  const ended = sleeps
    .filter((e) => e.endedAt && toDate(e.endedAt).getTime() <= on.getTime())
    .pop();

  const napsToday = sleeps.filter(
    (e) => isSameDay(e.startedAt, on) && (e.payload as { type?: string }).type !== "night",
  ).length;

  if (sleeping) {
    const startedAt = sleeping.startedAt;
    const minutesSoFar = Math.round((on.getTime() - toDate(startedAt).getTime()) / MIN);
    return {
      band,
      state: "dormindo",
      sleepingNow: { startedAt, minutesSoFar },
      lastWakeAt: null,
      awakeMinutes: null,
      napFrom: null,
      napTo: null,
      windowProgress: null,
      napsToday,
      bedtimeFrom: null,
      bedtimeTo: null,
      message: `Dormindo agora há ${Math.floor(minutesSoFar / 60)} h ${minutesSoFar % 60} min. Ao acordar, a próxima janela abre em até ${fmtH(band.maxMin)}.`,
    };
  }

  if (!ended?.endedAt) {
    return {
      band,
      state: "sem-dados",
      sleepingNow: null,
      lastWakeAt: null,
      awakeMinutes: null,
      napFrom: null,
      napTo: null,
      windowProgress: null,
      napsToday,
      bedtimeFrom: null,
      bedtimeTo: null,
      message: `Registre o fim de uma soneca para eu sugerir a próxima janela (hoje: ${fmtH(band.minMin)}–${fmtH(band.maxMin)} acordada).`,
    };
  }

  const lastWakeAt = toDate(ended.endedAt);
  const awakeMinutes = (on.getTime() - lastWakeAt.getTime()) / MIN;
  const napFrom = new Date(lastWakeAt.getTime() + band.minMin * MIN);
  const napTo = new Date(lastWakeAt.getTime() + band.maxMin * MIN);
  const windowProgress = Math.min(1.4, awakeMinutes / band.maxMin);

  let state: SleepState;
  let message: string;
  if (awakeMinutes < band.minMin * 0.75) {
    state = "acordou-ha-pouco";
    message = `Acordou há ${fmtH(awakeMinutes)}. Ainda tem chão: a janela de soneca abre por volta de ${hhmm(napFrom)}.`;
  } else if (awakeMinutes < band.minMin) {
    state = "na-janela";
    message = `Janela se aproximando: comece o ritual de soneca entre ${hhmm(napFrom)} e ${hhmm(napTo)}.`;
  } else if (awakeMinutes <= band.maxMin) {
    state = "quase";
    message = `Dentro da janela ideal (${fmtH(band.minMin)}–${fmtH(band.maxMin)} acordada). Boa hora para a soneca — até ${hhmm(napTo)}.`;
  } else {
    state = "passou";
    message = `Passou do ponto há ${fmtH(awakeMinutes - band.maxMin)} além da janela. Cansaço extra rende luta para dormir: tente um ritual mais longo e ambiente escuro.`;
  }

  // Horário de dormir: última soneca do dia + janela final acordada.
  const lastNapToday = sleeps
    .filter((e) => isSameDay(e.startedAt, on) && (e.payload as { type?: string }).type !== "night" && e.endedAt)
    .pop();
  const bedtimeBase = lastNapToday?.endedAt ? toDate(lastNapToday.endedAt) : lastWakeAt;
  const bedtimeFrom = new Date(bedtimeBase.getTime() + band.minMin * MIN);
  const bedtimeTo = new Date(bedtimeBase.getTime() + band.maxMin * MIN);

  return {
    band,
    state,
    sleepingNow: null,
    lastWakeAt,
    awakeMinutes,
    napFrom,
    napTo,
    windowProgress,
    napsToday,
    bedtimeFrom,
    bedtimeTo,
    message,
  };
}

export function fmtH(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest}`;
}

export function hhmm(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
