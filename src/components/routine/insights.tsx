"use client";

import { useMemo, useState } from "react";
import { BedDouble, ChevronDown, CloudSun, Moon, Sparkles, Waves } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useLog } from "@/components/log/log-provider";
import { predictSleep, fmtH, hhmm } from "@/lib/catalog/sleep";
import { leapStatus, LEAPS } from "@/lib/catalog/leaps";
import { fmtDateMedium } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Camada de "insights": lê o que já foi registrado e devolve orientação
 * acionável — próxima soneca, fase de salto, leitura de febre. É o que
 * transforma um diário de dados em um companheiro de cuidados.
 */

// ── Previsor de sono ────────────────────────────────────────────

export function SleepPredictorCard() {
  const { activeChild: child, events } = useStore();
  const log = useLog();

  const prediction = useMemo(
    () => (child ? predictSleep(child.birthDate, events, new Date()) : null),
    [child, events],
  );

  if (!child || !prediction) return null;
  const { band } = prediction;

  const stateTone = {
    dormindo: "info",
    "acordou-ha-pouco": "neutral",
    "na-janela": "brand",
    quase: "warning",
    passou: "danger",
    "sem-dados": "neutral",
  }[prediction.state] as "info" | "neutral" | "brand" | "warning" | "danger";

  const progress = prediction.windowProgress != null ? Math.min(1, prediction.windowProgress) : 0;

  return (
    <Card>
      <CardHeader
        title="Ritmo de sono"
        subtitle={`Janela acordada para a idade: ${fmtH(band.minMin)}–${fmtH(band.maxMin)} · ${band.napsLabel} sonecas`}
        icon={<Moon className="size-4.5" />}
        action={<Badge tone={stateTone}>{prediction.napsToday} soneca{prediction.napsToday === 1 ? "" : "s"} hoje</Badge>}
      />
      <CardBody className="space-y-3 pt-2">
        {prediction.sleepingNow ? (
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-3.5 py-3 dark:bg-violet-950/40">
            <BedDouble className="size-5 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
              Dormindo há {fmtH(prediction.sleepingNow.minutesSoFar)}
            </p>
          </div>
        ) : prediction.lastWakeAt ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Acordada há</p>
              <p className="tabular text-3xl font-extrabold text-fg">{fmtH(prediction.awakeMinutes ?? 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Próxima soneca</p>
              <p className="tabular text-lg font-extrabold text-brand-600 dark:text-brand-300">
                {prediction.napFrom && prediction.napTo ? `${hhmm(prediction.napFrom)}–${hhmm(prediction.napTo)}` : "—"}
              </p>
            </div>
          </div>
        ) : null}

        {/* Barra da janela acordada */}
        {prediction.windowProgress != null && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  prediction.state === "passou"
                    ? "bg-red-500"
                    : prediction.state === "quase"
                      ? "bg-amber-500"
                      : "bg-sage-500",
                )}
                style={{ width: `${Math.max(4, progress * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-fg-subtle">
              <span>acordou</span>
              <span>janela ideal</span>
              <span>limite ({fmtH(band.maxMin)})</span>
            </div>
          </div>
        )}

        <p className="text-[13px] leading-relaxed text-fg-muted">{prediction.message}</p>

        {prediction.bedtimeFrom && prediction.bedtimeTo && (
          <p className="text-xs text-fg-subtle">
            Sugestão de horário de dormir hoje:{" "}
            <strong className="tabular text-fg-muted">
              {hhmm(prediction.bedtimeFrom)}–{hhmm(prediction.bedtimeTo)}
            </strong>
            .
          </p>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => log.open("sleep")}>
            <BedDouble className="size-3.5" aria-hidden />
            Registrar soneca
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-fg-subtle">
          Janelas de sono são referências médias por idade (Cleveland Clinic, Sleep Foundation). O
          relógio real é o comportamento: bocejo, olhar parado e esfregar de olho valem mais que o
          minuto exato.
        </p>
      </CardBody>
    </Card>
  );
}

// ── Saltos mentais ──────────────────────────────────────────────

export function LeapCard() {
  const { activeChild: child } = useStore();
  const [expanded, setExpanded] = useState(false);

  const status = useMemo(
    () => (child ? leapStatus(child.birthDate, child.gestationalWeeks, new Date()) : null),
    [child],
  );

  if (!child || !status) return null;

  const weekLabel = `${Math.floor(status.weekNow)}ª semana de vida`;

  const header =
    status.phase === "tempestuosa"
      ? { icon: Waves, tone: "warning" as const, title: `Salto ${status.current?.n}: ${status.current?.theme}` }
      : status.phase === "ensolarada"
        ? { icon: CloudSun, tone: "sage" as const, title: `Pós-salto ${status.current?.n}: ${status.current?.theme}` }
        : { icon: Sparkles, tone: "neutral" as const, title: "Semana de calmaria" };

  const Icon = header.icon;

  return (
    <Card
      className={cn(
        status.phase === "tempestuosa" && "border-amber-300/70 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20",
        status.phase === "ensolarada" && "border-sage-300/70 bg-sage-50/40 dark:border-sage-800 dark:bg-sage-950/20",
      )}
    >
      <CardHeader
        title={header.title}
        subtitle={`${weekLabel}${status.fromDueDate ? " · contada da data prevista" : ""}`}
        icon={<Icon className="size-4.5" />}
        action={<Badge tone={header.tone}>{status.phase}</Badge>}
      />
      <CardBody className="space-y-3 pt-2">
        {status.phase === "tempestuosa" && status.current && (
          <>
            <p className="text-[13px] leading-relaxed text-fg-muted">
              Período sensível previsto até{" "}
              <strong className="text-fg">{status.phaseEndsAt ? fmtDateMedium(status.phaseEndsAt) : "—"}</strong>. São os
              famosos 3 Cs: <strong>choro</strong>, <strong>grudência</strong> e <strong>irritação</strong> — não é
              regressão nem “manha”: o cérebro está reorganizando percepções e isso cansa.
            </p>
            <p className="rounded-xl bg-bg-elevated/70 px-3 py-2 text-[13px] text-fg-muted">
              <strong className="text-sage-700 dark:text-sage-300">Do outro lado:</strong> {status.current.gift}
            </p>
          </>
        )}

        {status.phase === "ensolarada" && status.current && (
          <p className="text-[13px] leading-relaxed text-fg-muted">
            {status.current.gift} Aproveite a fase boa: é agora que ela treina a novidade. Próximo salto por volta da{" "}
            <strong className="text-fg">{status.next ? `${status.next.stormyFrom}ª semana` : "—"}</strong>
            {status.nextStartsAt ? ` (~${fmtDateMedium(status.nextStartsAt)})` : ""}.
          </p>
        )}

        {status.phase === "calmaria" && status.next && (
          <p className="text-[13px] leading-relaxed text-fg-muted">
            Boa fase até o próximo salto: <strong className="text-fg">Salto {status.next.n} — {status.next.theme}</strong>,
            previsto para a {status.next.stormyFrom}ª semana
            {status.nextStartsAt ? ` (~${fmtDateMedium(status.nextStartsAt)})` : ""}.
          </p>
        )}

        {/* Linha do tempo dos 10 saltos */}
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 text-xs font-bold text-fg-muted hover:text-fg">
          <span className="flex flex-1 gap-1">
            {LEAPS.map((l) => {
              const active = status.current?.n === l.n;
              const past = l.stormyTo < status.weekNow;
              return (
                <span
                  key={l.n}
                  title={`Salto ${l.n} · ${l.theme}`}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    active ? "bg-amber-500" : past ? "bg-sage-400" : "bg-bg-muted",
                  )}
                />
              );
            })}
          </span>
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>

        {expanded && (
          <ul className="grid gap-1.5 text-xs text-fg-muted sm:grid-cols-2">
            {LEAPS.map((l) => (
              <li key={l.n} className={cn("flex gap-2 rounded-lg px-2 py-1", status.current?.n === l.n && "bg-amber-100/70 font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200")}>
                <span className="tabular w-12 shrink-0 font-bold">{l.stormyFrom}–{l.stormyTo}ª</span>
                <span className="min-w-0">
                  {l.n}. {l.theme}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[11px] leading-relaxed text-fg-subtle">
          Baseado em “The Wonder Weeks” (Plooij & van de Rijt). As janelas são previsões populacionais —
          servem para acolher e explicar fases difíceis, não para rotular.
        </p>
      </CardBody>
    </Card>
  );
}
