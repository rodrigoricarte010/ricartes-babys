/**
 * Resumo do dia em texto — feito para ser colado no WhatsApp do outro
 * cuidador, da avó coruja ou do pediatra.
 */

import type { AppEvent, Child } from "@/lib/types";
import type { DaySummary } from "@/lib/analytics";
import { durationLabel, fmtTime } from "@/lib/date";

export function buildDaySummaryText(
  child: Child,
  s: DaySummary,
  dayEvents: readonly AppEvent[],
): string {
  const name = child.nickname || child.firstName;
  const dateStr = s.date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const lines: string[] = [`👶 ${name} — ${dateStr.replace(".", "")}`];

  if (s.feedCount > 0) {
    const parts = [`${s.feedCount} mamadas`];
    const detail: string[] = [];
    if (s.breastCount) detail.push(`${s.breastCount} peito`);
    if (s.bottleCount) detail.push(`${s.bottleCount} mamadeira`);
    if (s.solidsCount) detail.push(`${s.solidsCount} comida`);
    let feed = `🍼 ${parts[0]}`;
    if (detail.length) feed += ` (${detail.join(", ")})`;
    if (s.feedMl > 0) feed += ` · ${s.feedMl} ml`;
    if (s.feedMinutes > 0) feed += ` · ${durationLabel(s.feedMinutes)}`;
    if (s.lastFeedingAt) feed += ` · última ${fmtTime(s.lastFeedingAt)}`;
    lines.push(feed);
  }

  if (s.sleepMinutes > 0) {
    let sleep = `😴 ${durationLabel(s.sleepMinutes)} de sono`;
    if (s.napCount > 0) sleep += ` · ${s.napCount} soneca${s.napCount > 1 ? "s" : ""}`;
    if (s.longestSleepMinutes > 0) sleep += ` · maior bloco ${durationLabel(s.longestSleepMinutes)}`;
    lines.push(sleep);
  }

  if (s.diaperCount > 0) {
    lines.push(`🧷 ${s.diaperCount} fraldas (${s.wetCount} xixi · ${s.dirtyCount} cocô)`);
  }

  if (s.medicineCount > 0) {
    lines.push(`💊 ${s.medicineCount} medicamento${s.medicineCount > 1 ? "s" : ""}`);
  }

  const temps = dayEvents
    .filter((e) => e.kind === "symptom")
    .map((e) => (e.payload as { temperatureC?: number | null }).temperatureC)
    .filter((t): t is number => typeof t === "number");
  if (s.symptomCount > 0) {
    let sym = `🌡️ ${s.symptomCount} sintoma${s.symptomCount > 1 ? "s" : ""} registrado${s.symptomCount > 1 ? "s" : ""}`;
    if (temps.length) sym += ` · máx ${String(Math.max(...temps)).replace(".", ",")} °C`;
    lines.push(sym);
  }

  if (s.milestoneCount > 0) {
    lines.push(`🎉 ${s.milestoneCount} novo${s.milestoneCount > 1 ? "s" : ""} marco${s.milestoneCount > 1 ? "s" : ""} de desenvolvimento!`);
  }

  const notes = dayEvents.filter((e) => e.kind === "note" && e.note);
  for (const n of notes.slice(0, 3)) {
    lines.push(`📝 “${n.note}”`);
  }

  if (lines.length === 1) {
    lines.push("Nenhum registro neste dia até agora.");
  }

  lines.push("", "— Ricartes Babys 🌸");
  return lines.join("\n");
}

/** Compartilha pelo dialog nativo (Web Share) ou copia para a área de transferência. */
export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      // Usuário cancelou o compartilhamento: não insistir.
      if (err instanceof Error && err.name === "AbortError") return "failed";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
