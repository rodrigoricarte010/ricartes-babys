"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Baby,
  CalendarHeart,
  ChevronRight,
  Droplets,
  Milk,
  Moon,
  Pencil,
  Pill,
  Ruler,
  Sparkles,
  StickyNote,
  Syringe,
  Thermometer,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonCard } from "@/components/ui/empty-state";
import { ChildAvatar } from "@/components/ui/avatar";
import { EventRow } from "@/components/routine/event-bits";
import { GrowthStatCards, GrowthContextLine, useGrowthSummary } from "@/components/growth/growth-summary";
import { GrowthChart } from "@/components/growth/growth-chart";
import { useLog } from "@/components/log/log-provider";
import { useStore } from "@/lib/store";
import {
  averageFeedingIntervalHours,
  dailySeries,
  lastEvent,
  sinceLabel,
  summarizeDay,
  weeklyAverages,
} from "@/lib/analytics";
import { buildVaccinePlan, dueNow } from "@/lib/vaccine-progress";
import { CHECKUP_VISITS } from "@/lib/catalog/vaccines";
import { ageInDays, durationLabel, fmtDate, fmtTime, formatAge, toDate } from "@/lib/date";
import { num, sortBy } from "@/lib/utils";
import { isLogKind, type LogKind } from "@/components/log/types";

const QUICK_ACTIONS: Array<{ kind: LogKind; label: string; icon: typeof Milk }> = [
  { kind: "feeding", label: "Mamada", icon: Milk },
  { kind: "sleep", label: "Sono", icon: Moon },
  { kind: "diaper", label: "Fralda", icon: Droplets },
  { kind: "measurement", label: "Medida", icon: Ruler },
  { kind: "medicine", label: "Remédio", icon: Pill },
  { kind: "symptom", label: "Sintoma", icon: Thermometer },
  { kind: "appointment", label: "Consulta", icon: CalendarHeart },
  { kind: "note", label: "Nota", icon: StickyNote },
];

export function Dashboard() {
  const { ready, activeChild: child, measurements, events, restoreDemo } = useStore();
  const log = useLog();
  const summary = useGrowthSummary(child, measurements);
  const [showDemoPrompt, setShowDemoPrompt] = useState(true);

  const today = useMemo(() => summarizeDay(events, new Date()), [events]);
  const week = useMemo(() => weeklyAverages(dailySeries(events, 7)), [events]);
  const feedInterval = useMemo(() => averageFeedingIntervalHours(events, 3), [events]);

  const lastFeeding = lastEvent(events, "feeding");
  const lastSleep = lastEvent(events, "sleep");
  const lastDiaper = lastEvent(events, "diaper");

  const vaccinePlan = useMemo(
    () => (child ? buildVaccinePlan(child, events, false) : []),
    [child, events],
  );
  const due = useMemo(() => dueNow(vaccinePlan).slice(0, 2), [vaccinePlan]);

  const upcomingAppointments = useMemo(
    () =>
      sortBy(
        events.filter(
          (e) => e.kind === "appointment" && !(e.payload as { done?: boolean }).done && toDate(e.startedAt).getTime() > Date.now(),
        ),
        (e) => e.startedAt,
      ).slice(0, 2),
    [events],
  );

  const recent = useMemo(() => sortBy(events, (e) => e.startedAt).reverse().slice(0, 7), [events]);

  const weightPoints = useMemo(
    () =>
      measurements
        .filter((m) => m.weightKg != null)
        .map((m) => ({
          ageDays: child ? ageInDays(child.birthDate, new Date(m.takenAt)) : 0,
          value: m.weightKg as number,
          takenAt: m.takenAt,
          source: m.source,
        })),
    [measurements, child],
  );

  if (!ready) {
    return (
      <AppShell>
        <div className="space-y-4">
          <SkeletonCard lines={2} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
          <SkeletonCard lines={4} />
        </div>
      </AppShell>
    );
  }

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState
            icon={<Baby className="size-7" />}
            title="Bem-vindo ao Ricartes Babys"
            description="Cadastre a primeira criança para começar a acompanhar crescimento, rotina, marcos e vacinas num só lugar."
            action={
              <div className="flex flex-col items-center gap-3">
                <Link href="/filhos/nova">
                  <Button size="lg">Adicionar criança</Button>
                </Link>
                {showDemoPrompt && (
                  <button
                    type="button"
                    onClick={async () => {
                      await restoreDemo();
                      setShowDemoPrompt(false);
                    }}
                    className="text-xs font-semibold text-fg-subtle underline underline-offset-2 hover:text-fg"
                  >
                    Ou recarregar a família de exemplo (Rosie Grace)
                  </button>
                )}
              </div>
            }
          />
        </Card>
      </AppShell>
    );
  }

  const name = child.nickname || child.firstName;

  return (
    <AppShell>
      <PageHeader
        title={`Olá, ${name} 💗`}
        subtitle={`${formatAge(child.birthDate)} · nasceu em ${fmtDate(child.birthDate)}`}
        actions={
          <Link href={`/filhos/${child.id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="size-3.5" aria-hidden />
              Dados
            </Button>
          </Link>
        }
      />

      <div className="space-y-5">
        {/* Crescimento */}
        <section className="space-y-2.5">
          <GrowthStatCards summary={summary} />
          <GrowthContextLine summary={summary} />
        </section>

        {/* Hoje */}
        <Card>
          <CardHeader
            title="Hoje"
            subtitle={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            action={
              <Link href={`/filhos/${child.id}/rotina`} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline dark:text-brand-300">
                Ver rotina <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <CardBody className="pt-3">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Mamadas" value={today.feedCount} hint={today.feedMinutes ? durationLabel(today.feedMinutes) : undefined} tone="warning" />
              <Stat label="Sono" value={durationLabel(today.sleepMinutes)} hint={today.napCount ? `${today.napCount} sonecas` : undefined} tone="info" />
              <Stat label="Fraldas" value={today.diaperCount} hint={`${today.wetCount} xixi · ${today.dirtyCount} cocô`} tone="neutral" />
            </div>

            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
              <SinceLine icon={<Milk className="size-3.5" />} label="Última mamada" value={sinceLabel(lastFeeding?.startedAt)} extra={feedInterval ? `média a cada ${durationLabel(feedInterval * 60)}` : undefined} />
              <SinceLine icon={<Moon className="size-3.5" />} label="Último sono" value={sinceLabel(lastSleep?.startedAt)} extra={lastSleep ? fmtTime(lastSleep.startedAt) : undefined} />
              <SinceLine icon={<Droplets className="size-3.5" />} label="Última fralda" value={sinceLabel(lastDiaper?.startedAt)} extra={lastDiaper ? fmtTime(lastDiaper.startedAt) : undefined} />
            </div>

            {week && (
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-fg-subtle">
                Média dos últimos {week.days} dias com registro:{" "}
                <strong className="text-fg-muted">{num(week.feedCount, 1)} mamadas</strong> e{" "}
                <strong className="text-fg-muted">{durationLabel(week.sleepMinutes)} de sono</strong> por dia.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Registro rápido */}
        <section>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.kind}
                  type="button"
                  onClick={() => log.open(action.kind)}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 text-sm font-bold text-fg shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300"
                >
                  <Icon className="size-4 text-brand-500" aria-hidden />
                  {action.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => log.startTimer()}
              disabled={log.timerActive}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-600 disabled:opacity-50"
            >
              <Activity className="size-4" aria-hidden />
              Cronometrar peito
            </button>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Curva rápida */}
          <Card>
            <CardHeader
              title="Curva de peso"
              subtitle="Padrão OMS, meninas e meninos separados"
              icon={<Ruler className="size-4.5" />}
              action={
                <Link href={`/filhos/${child.id}/crescimento`} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline dark:text-brand-300">
                  Abrir <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            <CardBody>
              <GrowthChart
                metric="weight"
                sex={child.sex}
                birthDate={child.birthDate}
                gestationalWeeks={child.gestationalWeeks}
                points={weightPoints}
                heightClass="h-[220px]"
              />
            </CardBody>
          </Card>

          {/* Próximos compromissos */}
          <Card>
            <CardHeader title="Próximos passos" subtitle="Vacinas e consultas que pedem atenção" icon={<Syringe className="size-4.5" />} />
            <CardBody className="pt-2">
              {due.length === 0 && upcomingAppointments.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-subtle">Tudo em dia por aqui. 🎉</p>
              ) : (
                <ul className="divide-y divide-line">
                  {due.map((row) => (
                    <li key={row.dose.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300">
                        <Syringe className="size-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{row.vaccineName}</p>
                        <p className="text-xs text-fg-subtle">{row.dose.dose} · recomendada aos {fmtAgeMonths(row.dose.ageMonths)}</p>
                      </div>
                      <Badge tone={row.status === "atrasada" ? "danger" : "warning"}>
                        {row.status === "atrasada" ? "em atraso" : "é agora"}
                      </Badge>
                    </li>
                  ))}
                  {upcomingAppointments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        <CalendarHeart className="size-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{(a.payload as { title?: string }).title}</p>
                        <p className="text-xs text-fg-subtle">{fmtDate(a.startedAt)} às {fmtTime(a.startedAt)}</p>
                      </div>
                      <Badge tone="brand">agenda</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/filhos/${child.id}/vacinas`} className="mt-2 block text-xs font-bold text-brand-600 hover:underline dark:text-brand-300">
                Ver carteira de vacinação completa
              </Link>
            </CardBody>
          </Card>
        </div>

        {/* Linha do tempo */}
        <Card>
          <CardHeader title="Agora há pouco" subtitle="Últimos registros" icon={<Sparkles className="size-4.5" />} />
          <CardBody className="pt-1">
            {recent.length === 0 ? (
              <EmptyState title="Nada registrado ainda" description="Use os botões acima para começar a linha do tempo." />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((e) => {
                  const kind = e.kind;
                  return (
                    <li key={e.id}>
                      <EventRow
                        event={e}
                        onEdit={isLogKind(kind) ? () => log.open(kind, { editing: e }) : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function SinceLine({ icon, label, value, extra }: { icon: React.ReactNode; label: string; value: string | null; extra?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-bg-muted/60 px-3 py-2">
      <span className="mt-0.5 text-fg-subtle">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-fg-subtle">{label}</span>
        <span className="block truncate text-xs font-bold text-fg">{value ?? "—"}</span>
        {extra && <span className="block truncate text-[10px] text-fg-subtle">{extra}</span>}
      </span>
    </div>
  );
}

function fmtAgeMonths(months: number): string {
  if (months === 0) return "nascer";
  if (months < 1) return `${Math.round(months * 30)} dias`;
  if (months < 24) return `${months} meses`;
  return `${Math.round(months / 12)} anos`;
}
