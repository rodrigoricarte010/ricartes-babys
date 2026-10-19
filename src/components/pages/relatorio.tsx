"use client";

import { useMemo } from "react";
import { FileText, Printer } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store";
import { useGrowthEngine } from "@/lib/growth-engine";
import { METRICS, METRIC_ORDER, formatPercentile, formatZScore } from "@/lib/growth";
import { buildVaccinePlan, appliedCount } from "@/lib/vaccine-progress";
import { dailySeries, weeklyAverages, summarizeDay } from "@/lib/analytics";
import { ageInDays, fmtDate, fmtDateMedium, formatAge } from "@/lib/date";
import { num as fmtNum } from "@/lib/utils";
import { MILESTONE_BY_KEY } from "@/lib/catalog/milestones";

/**
 * Relatório para o pediatra.
 *
 * Uma página pensada para ser impressa ou mostrada na tela do consultório:
 * tudo que o profissional pergunta, em ordem, sem precisar navegar. A versão
 * impressa esconde navegação e botões via CSS.
 */
export function RelatorioPage() {
  const { activeChild: child, measurements, events, mode } = useStore();
  const { engine } = useGrowthEngine();

  const evaluations = useMemo(() => {
    if (!child || !engine) return [];
    return measurements
      .slice()
      .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
      .map((m) => {
        const age = ageInDays(child.birthDate, new Date(m.takenAt));
        const row: Record<string, unknown> = { measurement: m, ageDays: age };
        for (const metric of METRIC_ORDER) {
          let value: number | null = null;
          if (metric === "weight") value = m.weightKg;
          else if (metric === "length") value = m.lengthCm;
          else if (metric === "head") value = m.headCm;
          else if (m.weightKg != null && m.lengthCm != null) value = engine.computeBmi(m.weightKg, m.lengthCm);
          if (value == null) continue;
          const evaluation = engine.evaluateMeasurement({
            metric,
            value,
            sex: child.sex,
            birthDate: child.birthDate,
            on: new Date(m.takenAt),
            gestationalWeeks: child.gestationalWeeks,
          });
          row[metric] = { value, ...evaluation };
        }
        return row;
      });
  }, [child, engine, measurements]);

  const vaccinePlan = useMemo(() => (child ? buildVaccinePlan(child, events, false) : []), [child, events]);
  const vaccineProgress = useMemo(() => appliedCount(vaccinePlan), [vaccinePlan]);
  const pendingVaccines = vaccinePlan.filter((r) => r.status === "atrasada" || r.status === "agendada");

  const milestones = useMemo(
    () =>
      events
        .filter((e) => e.kind === "milestone")
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
        .map((e) => ({ event: e, milestone: MILESTONE_BY_KEY.get((e.payload as { key?: string }).key ?? "") })),
    [events],
  );

  const week = useMemo(() => weeklyAverages(dailySeries(events, 7)), [events]);
  const today = useMemo(() => summarizeDay(events, new Date()), [events]);

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Selecione uma criança" />
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Relatório para consulta"
        subtitle="Pronto para imprimir ou mostrar no celular"
        actions={
          <Button size="sm" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-3.5" aria-hidden />
            Imprimir / PDF
          </Button>
        }
      />

      <div className="space-y-5 print:space-y-4">
        {/* Cabeçalho do prontuário */}
        <Card className="print:shadow-none">
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-fg">
                  {child.firstName} {child.middleName ?? ""} {child.lastName ?? ""}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {child.sex === "female" ? "Menina" : "Menino"} · nasceu em {fmtDate(child.birthDate)}
                  {child.birthTime && ` às ${child.birthTime}`} · hoje com {formatAge(child.birthDate)} ({ageInDays(child.birthDate, new Date())} dias)
                </p>
                <p className="mt-0.5 text-xs text-fg-subtle">
                  {child.gestationalWeeks != null && `${child.gestationalWeeks} semanas de gestação · `}
                  {child.birthWeightKg != null && `PN {${child.birthWeightKg} kg} · `}
                  {child.birthLengthCm != null && `estatura ao nascer ${child.birthLengthCm} cm · `}
                  {child.bloodType && `tipo ${child.bloodType}`}
                </p>
              </div>
              <div className="text-right text-xs text-fg-subtle">
                <p className="font-bold text-fg-muted">Gerado em {fmtDate(new Date())}</p>
                <p>Ricartes Babys · modo {mode === "cloud" ? "nuvem" : "local"}</p>
              </div>
            </div>
            {child.notes && (
              <p className="mt-3 rounded-xl bg-bg-muted/60 px-3 py-2 text-xs leading-relaxed text-fg-muted">
                <strong className="text-fg">Antecedentes:</strong> {child.notes}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Antropometria */}
        <Card className="print:shadow-none">
          <CardHeader title="Antropometria" subtitle="Peso, estatura, perímetro cefálico e IMC com z-score e percentil OMS" icon={<FileText className="size-4.5" />} />
          <CardBody className="overflow-x-auto pt-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-fg-subtle">
                  <th className="py-2 pr-3 font-bold">Data</th>
                  <th className="py-2 pr-3 font-bold">Idade</th>
                  <th className="py-2 pr-3 font-bold">Peso</th>
                  <th className="py-2 pr-3 font-bold">z / p</th>
                  <th className="py-2 pr-3 font-bold">Estatura</th>
                  <th className="py-2 pr-3 font-bold">z / p</th>
                  <th className="py-2 pr-3 font-bold">PC</th>
                  <th className="py-2 font-bold">IMC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {evaluations.slice().reverse().map((row, i) => {
                  const m = row.measurement as (typeof measurements)[number];
                  const w = row.weight as { value: number; zScore: number; percentile: number } | undefined;
                  const l = row.length as { value: number; zScore: number; percentile: number } | undefined;
                  const h = row.head as { value: number; zScore: number; percentile: number } | undefined;
                  const b = row.bmi as { value: number } | undefined;
                  return (
                    <tr key={m.id} className="tabular">
                      <td className="py-2 pr-3 font-semibold text-fg">{fmtDateMedium(m.takenAt)}</td>
                      <td className="py-2 pr-3 text-fg-muted">{row.ageDays as number}d</td>
                      <td className="py-2 pr-3">{w ? `${fmtNum(w.value, 3)} kg` : "—"}</td>
                      <td className="py-2 pr-3 text-xs text-fg-subtle">{w ? `${formatZScore(w.zScore)} / ${formatPercentile(w.percentile)}` : "—"}</td>
                      <td className="py-2 pr-3">{l ? `${fmtNum(l.value, 1)} cm` : "—"}</td>
                      <td className="py-2 pr-3 text-xs text-fg-subtle">{l ? `${formatZScore(l.zScore)} / ${formatPercentile(l.percentile)}` : "—"}</td>
                      <td className="py-2 pr-3">{h ? `${fmtNum(h.value, 1)} cm` : "—"}</td>
                      <td className="py-2">{b ? `${fmtNum(b.value, 2)}` : "—"}</td>
                    </tr>
                  );
                })}
                {evaluations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-fg-subtle">
                      Nenhuma medição registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-2">
          {/* Vacinas */}
          <Card className="print:shadow-none">
            <CardHeader title="Vacinação" subtitle={`${vaccineProgress.applied}/${vaccineProgress.total} doses previstas aplicadas`} />
            <CardBody className="pt-2">
              {pendingVaccines.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {pendingVaccines.map((r) => (
                    <li key={r.dose.id} className="flex items-center justify-between gap-2">
                      <span className="text-fg-muted">{r.vaccineName} · {r.dose.dose}</span>
                      <Badge tone={r.status === "atrasada" ? "danger" : "warning"}>{r.status === "atrasada" ? "atrasada" : "agora"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-sage-700 dark:text-sage-300">Calendário em dia até o momento. ✓</p>
              )}
            </CardBody>
          </Card>

          {/* Rotina */}
          <Card className="print:shadow-none">
            <CardHeader title="Rotina (últimos 7 dias)" subtitle="Média por dia com registro" />
            <CardBody className="pt-2">
              {week ? (
                <ul className="space-y-1.5 text-sm text-fg-muted">
                  <li className="flex justify-between"><span>Mamadas</span><strong className="tabular text-fg">{fmtNum(week.feedCount, 1)}/dia</strong></li>
                  <li className="flex justify-between"><span>Tempo de sono</span><strong className="tabular text-fg">{Math.round(week.sleepMinutes / 60)} h {Math.round(week.sleepMinutes % 60)} min/dia</strong></li>
                  <li className="flex justify-between"><span>Trocas de fralda</span><strong className="tabular text-fg">{fmtNum(week.diaperCount, 1)}/dia</strong></li>
                  <li className="flex justify-between"><span>Hoje até agora</span><strong className="tabular text-fg">{today.feedCount} mamadas · {today.diaperCount} fraldas</strong></li>
                </ul>
              ) : (
                <p className="text-sm text-fg-subtle">Sem registros de rotina suficientes.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Marcos */}
        <Card className="print:shadow-none">
          <CardHeader title="Marcos do desenvolvimento" subtitle={`${milestones.length} conquistas registradas`} />
          <CardBody className="pt-2">
            {milestones.length === 0 ? (
              <p className="text-sm text-fg-subtle">Nenhum marco marcado ainda.</p>
            ) : (
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {milestones.map(({ event, milestone }) => (
                  <li key={event.id} className="flex justify-between gap-3 border-b border-line/60 py-1">
                    <span className="text-fg-muted">{milestone?.text ?? "Marco"}</span>
                    <span className="shrink-0 text-xs text-fg-subtle">{fmtDateMedium(event.startedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-[11px] text-fg-subtle print:text-[10px]">
          Documento gerado pelo Ricartes Babys a partir de registros da família. Percentis e z-scores
          calculados com as tabelas LMS oficiais da OMS (Child Growth Standards). Não substitui a
          avaliação clínica.
        </p>
      </div>
    </AppShell>
  );
}
