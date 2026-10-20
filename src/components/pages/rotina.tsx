"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets, Milk, Moon, Share2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EventRow } from "@/components/routine/event-bits";
import { SleepPredictorCard } from "@/components/routine/insights";
import { TodayFeverCard } from "@/components/routine/fever-card";
import { WeekPatternCard } from "@/components/routine/week-pattern";
import { BreastBalanceCard } from "@/components/routine/breast-balance";
import { useStore } from "@/lib/store";
import { useLog } from "@/components/log/log-provider";
import { isLogKind } from "@/components/log/types";
import { useToast } from "@/components/ui/toast";
import {
  averageFeedingIntervalHours,
  dailySeries,
  eventsOn,
  summarizeDay,
  weeklyAverages,
} from "@/lib/analytics";
import { addDays, dayKey, durationLabel, isSameDay, startOfDay, fmtWeekday } from "@/lib/date";
import { num, sortBy, cn } from "@/lib/utils";
import { buildDaySummaryText, shareOrCopy } from "@/lib/share";

/** Barras simples, sem dependência — suficientes para ler padrão semanal. */
function MiniBars({
  data,
  label,
  format,
  accent = "var(--color-brand-500)",
}: {
  data: { key: string; value: number; label: string; active?: boolean }[];
  label: string;
  format: (v: number) => string;
  accent?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">{label}</p>
      {/* pt-5 reserva a altura do valor, que agora aparece fixo no celular
          (não existe hover em tela de toque). */}
      <div className="flex items-end gap-1.5 pt-5">
        {data.map((d) => (
          <div key={d.key} className="group relative flex flex-1 flex-col items-center gap-1">
            {d.value > 0 && (
              <span className="pointer-events-none absolute -top-5 whitespace-nowrap rounded-md bg-fg px-1.5 py-0.5 text-[10px] font-bold text-bg transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                {format(d.value)}
              </span>
            )}
            <div
              className={cn("w-full rounded-md transition-all", d.active ? "ring-2 ring-brand-400/60" : "")}
              style={{
                height: `${Math.max(4, (d.value / max) * 64)}px`,
                backgroundColor: d.value > 0 ? accent : "var(--color-bg-muted)",
                opacity: d.value > 0 ? (d.active ? 1 : 0.65) : 1,
              }}
            />
            <span className="text-[10px] font-semibold text-fg-subtle">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RotinaPage() {
  const { activeChild: child, events, removeEvent } = useStore();
  const log = useLog();
  const toast = useToast();
  const [day, setDay] = useState(() => startOfDay(new Date()));

  const dayEvents = useMemo(() => sortBy(eventsOn(events, day), (e) => e.startedAt).reverse(), [events, day]);
  const summary = useMemo(() => summarizeDay(events, day), [events, day]);

  async function shareDay() {
    if (!child) return;
    const text = buildDaySummaryText(child, summary, dayEvents);
    const result = await shareOrCopy(text);
    if (result === "shared") toast.success("Resumo compartilhado. 💛");
    else if (result === "copied") toast.success("Resumo copiado — é só colar no WhatsApp. 📋");
    else toast.error("Não consegui compartilhar neste navegador.");
  }
  const series = useMemo(() => dailySeries(events, 7), [events]);
  const week = useMemo(() => weeklyAverages(series), [series]);
  const interval = useMemo(() => averageFeedingIntervalHours(events, 3, day), [events, day]);

  const isToday = isSameDay(day, new Date());

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Selecione uma criança" description="Cadastre uma criança para acompanhar a rotina." />
        </Card>
      </AppShell>
    );
  }

  const barData = (fn: (d: (typeof series)[number]) => number) =>
    series.map((d) => ({
      key: d.key,
      value: fn(d),
      label: fmtWeekday(d.date).slice(0, 3),
      active: d.key === dayKey(day),
    }));

  return (
    <AppShell>
      <PageHeader
        title="Rotina"
        subtitle={`${child.nickname || child.firstName} · dia a dia`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void shareDay()} aria-label="Compartilhar resumo do dia">
              <Share2 className="size-3.5" aria-hidden />
              <span className="max-sm:hidden">Resumo</span>
            </Button>
            <Button size="sm" onClick={() => log.open("feeding")}>
              <Milk className="size-3.5" aria-hidden />
              Registrar
            </Button>
          </div>
        }
      />

      <div className="mb-4 space-y-4">
        <TodayFeverCard />
        <SleepPredictorCard />
      </div>

      {/* Navegação de dia */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, -1))} aria-label="Dia anterior">
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <button
          type="button"
          onClick={() => setDay(startOfDay(new Date()))}
          className="rounded-xl px-4 py-2 text-center transition-colors hover:bg-bg-muted"
        >
          <span className="block text-sm font-extrabold capitalize text-fg">
            {isToday ? "Hoje" : fmtWeekday(day)}
          </span>
          <span className="block text-xs text-fg-subtle">
            {day.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </span>
        </button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDay(addDays(day, 1))}
          disabled={isToday}
          aria-label="Próximo dia"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="space-y-5">
        {/* Resumo do dia */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Mamadas" value={summary.feedCount} hint={summary.feedMinutes ? durationLabel(summary.feedMinutes) : undefined} tone="warning" icon={<Milk className="size-4" />} />
          <Stat label="Sono" value={durationLabel(summary.sleepMinutes)} hint={`${summary.napCount} sonecas`} tone="info" icon={<Moon className="size-4" />} />
          <Stat label="Fraldas" value={summary.diaperCount} hint={`${summary.wetCount}·${summary.dirtyCount}`} tone="neutral" icon={<Droplets className="size-4" />} />
        </div>

        {interval != null && (
          <p className="text-xs text-fg-subtle">
            Nesse período, mamadas a cada <strong className="text-fg-muted">{durationLabel(interval * 60)}</strong> em média.
          </p>
        )}

        {/* Linha do tempo do dia */}
        <BreastBalanceCard />
        <WeekPatternCard />

        <Card>
          <CardHeader title="Linha do tempo" subtitle={`${dayEvents.length} registros neste dia`} />
          <CardBody className="pt-1">
            {dayEvents.length === 0 ? (
              <EmptyState
                title="Nenhum registro neste dia"
                description={isToday ? "Toque em Registrar para começar." : "Navegue até hoje ou registre retroativamente."}
                action={isToday ? <Button onClick={() => log.open("feeding")}>Registrar mamada</Button> : undefined}
              />
            ) : (
              <ul className="divide-y divide-line">
                {dayEvents.map((e) => {
                  const kind = e.kind;
                  return (
                    <li key={e.id}>
                      <EventRow
                        event={e}
                        onEdit={isLogKind(kind) ? () => log.open(kind, { editing: e }) : undefined}
                        onDelete={async () => {
                          await removeEvent(e.id);
                          toast.info("Registro removido.");
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Padrão da semana */}
        <Card>
          <CardHeader title="Padrão dos últimos 7 dias" subtitle="Toque numa barra para ver o dia" />
          <CardBody className="space-y-6">
            <MiniBars data={barData((d) => d.feedMinutes)} label="Minutos de mamada por dia" format={(v) => durationLabel(v)} accent="var(--color-amber-400)" />
            <MiniBars data={barData((d) => d.sleepMinutes)} label="Minutos de sono por dia" format={(v) => durationLabel(v)} accent="var(--color-violet-400)" />
            <MiniBars data={barData((d) => d.diaperCount)} label="Trocas de fralda por dia" format={(v) => `${v}`} accent="var(--color-sky-400)" />

            {week && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <Badge tone="neutral">média {num(week.feedCount, 1)} mamadas/dia</Badge>
                <Badge tone="neutral">sono {durationLabel(week.sleepMinutes)}/dia</Badge>
                <Badge tone="neutral">{num(week.diaperCount, 1)} fraldas/dia</Badge>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
