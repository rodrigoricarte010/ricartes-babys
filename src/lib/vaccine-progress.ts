import type { AppEvent, Child } from "@/lib/types";
import { DOSES, VACCINE_BY_KEY, doseStatus, type VaccineDose, type VaccineStatus } from "@/lib/catalog/vaccines";
import { addMonths, toDate } from "@/lib/date";

/**
 * Junta o calendário de referência com o que a família já registrou.
 * O resultado é uma lista pronta para renderizar: cada dose sabe se foi
 * aplicada, se está em atraso, se é a próxima, ou se ainda é futura.
 */

export interface VaccineRow {
  dose: VaccineDose;
  vaccineName: string;
  diseases: string[];
  appliedEvent: AppEvent | null;
  status: VaccineStatus;
  /** Data recomendada (nascimento + idade de referência). */
  dueDate: Date;
}

export function findAppliedEvent(events: readonly AppEvent[], dose: VaccineDose): AppEvent | null {
  const hit = events.find((e) => {
    if (e.kind !== "vaccine") return false;
    const p = e.payload as Record<string, unknown>;
    return p.key === dose.vaccineKey && p.dose === dose.dose;
  });
  return hit ?? null;
}

export function buildVaccinePlan(
  child: Child,
  events: readonly AppEvent[],
  includeSbim: boolean,
): VaccineRow[] {
  const birth = toDate(child.birthDate);
  return DOSES.filter((d) => includeSbim || !d.optional)
    .map((dose) => {
      const appliedEvent = findAppliedEvent(events, dose);
      const ageMonths = ageInMonthsOf(child, appliedEvent ? appliedEvent.startedAt : new Date());
      const status = doseStatus(ageMonths, dose.ageMonths, appliedEvent != null);
      return {
        dose,
        vaccineName: VACCINE_BY_KEY.get(dose.vaccineKey)?.name ?? dose.vaccineKey,
        diseases: VACCINE_BY_KEY.get(dose.vaccineKey)?.diseases ?? [],
        appliedEvent,
        status,
        dueDate: addMonths(birth, Math.round(dose.ageMonths)),
      };
    })
    .sort((a, b) => a.dose.ageMonths - b.dose.ageMonths);
}

/** Idade em meses decimais num dado momento. */
export function ageInMonthsOf(child: Child, on: string | Date): number {
  const birth = toDate(child.birthDate);
  const when = toDate(on);
  const days = Math.max(0, Math.round((when.getTime() - birth.getTime()) / 86_400_000));
  return days / 30.4375;
}

/** O que precisa de atenção agora: em atraso primeiro, depois as que chegaram. */
export function dueNow(plan: readonly VaccineRow[]): VaccineRow[] {
  return plan
    .filter((r) => r.status === "atrasada" || r.status === "agendada")
    .sort((a, b) => (a.status === b.status ? a.dose.ageMonths - b.dose.ageMonths : a.status === "atrasada" ? -1 : 1));
}

export function appliedCount(plan: readonly VaccineRow[]): { applied: number; total: number } {
  const upToNow = plan.filter((r) => toDate(r.dueDate).getTime() <= Date.now() + 30 * 86_400_000);
  return {
    applied: upToNow.filter((r) => r.appliedEvent).length,
    total: upToNow.length,
  };
}
