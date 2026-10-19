"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, PartyPopper, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import {
  CATEGORY_LABEL,
  CHECKPOINTS,
  isExpectedNow,
  type AgeCheckpoint,
  type Milestone,
} from "@/lib/catalog/milestones";
import { ageInDays, fmtDateMedium } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Marcos do desenvolvimento.
 *
 * Marcar um marco não é um teste de aprovação: é um diário de conquistas. Por
 * isso a interface celebra o que já aconteceu e mostra o que vem a seguir sem
 * alarmismo. Os "sinais de alerta" ficam recolhidos e com a frase certa:
 * "converse com o pediatra", nunca "está atrasado".
 */

const CATEGORY_ORDER: Array<keyof typeof CATEGORY_LABEL> = [
  "motor",
  "fino",
  "linguagem",
  "social",
  "cognitivo",
  "autocuidado",
];

export function MarcosPage() {
  const { activeChild: child, events, createEvent, removeEvent } = useStore();
  const toast = useToast();
  const [openAge, setOpenAge] = useState<number | null>(null);
  const [showFlags, setShowFlags] = useState(false);

  const achieved = useMemo(() => {
    const map = new Map<string, { id: string; at: string }>();
    for (const e of events) {
      if (e.kind !== "milestone") continue;
      const key = (e.payload as { key?: string }).key;
      if (key) map.set(key, { id: e.id, at: e.startedAt });
    }
    return map;
  }, [events]);

  const ageMonths = child ? ageInDays(child.birthDate, new Date()) / 30.4375 : 0;
  const currentCheckpoint = useMemo(() => {
    // O checkpoint "atual" é o mais recente cuja idade de referência já passou.
    const passed = CHECKPOINTS.filter((c) => c.ageMonths <= ageMonths + 1);
    return passed.length ? passed[passed.length - 1] : CHECKPOINTS[0];
  }, [ageMonths]);

  const effectiveOpen = openAge ?? currentCheckpoint.ageMonths;

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Selecione uma criança" />
        </Card>
      </AppShell>
    );
  }

  const totalAchieved = achieved.size;

  function toggle(milestone: Milestone) {
    const existing = achieved.get(milestone.key);
    if (existing) {
      void removeEvent(existing.id).then(() => toast.info("Marco desmarcado."));
    } else {
      void createEvent({
        childId: child!.id,
        kind: "milestone",
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationMin: null,
        payload: { key: milestone.key, category: milestone.category },
        note: null,
        photos: [],
      }).then(() => toast.success(`Que conquista: ${milestone.text.toLowerCase()}.`));
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Marcos do desenvolvimento"
        subtitle={`${child.nickname || child.firstName} · ${Math.floor(ageMonths)} meses`}
      />

      <div className="space-y-5">
        {/* Visão geral */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300">
                <PartyPopper className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-extrabold tabular text-fg">{totalAchieved}</p>
                <p className="text-sm text-fg-muted">marcos registrados até hoje</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {CATEGORY_ORDER.map((cat) => {
                const all = CHECKPOINTS.flatMap((c) => c.milestones).filter((m) => m.category === cat);
                const done = all.filter((m) => achieved.has(m.key)).length;
                const pct = all.length ? Math.round((done / all.length) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-baseline justify-between text-[11px] font-semibold">
                      <span className="text-fg-muted">{CATEGORY_LABEL[cat]}</span>
                      <span className="tabular text-fg-subtle">
                        {done}/{all.length}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-muted">
                      <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Acordeão por idade */}
        <div className="space-y-3">
          {CHECKPOINTS.map((checkpoint) => (
            <CheckpointCard
              key={checkpoint.ageMonths}
              checkpoint={checkpoint}
              achieved={achieved}
              open={effectiveOpen === checkpoint.ageMonths}
              isCurrent={currentCheckpoint.ageMonths === checkpoint.ageMonths}
              expected={isExpectedNow(checkpoint.ageMonths, ageMonths)}
              onToggleOpen={() =>
                setOpenAge(effectiveOpen === checkpoint.ageMonths ? -1 : checkpoint.ageMonths)
              }
              onToggleMilestone={toggle}
              showFlags={showFlags}
              onToggleFlags={setShowFlags}
            />
          ))}
        </div>

        <Card className="border-sage-200 bg-sage-50/50 dark:border-sage-900 dark:bg-sage-950/20">
          <CardBody className="flex gap-3 text-[13px] leading-relaxed text-fg-muted">
            <Sparkles className="mt-0.5 size-4.5 shrink-0 text-sage-600 dark:text-sage-300" aria-hidden />
            <p>
              Marcos têm <strong className="text-fg">janela, não data</strong>. Cada criança chega lá no
              seu ritmo, e pequenas diferenças são normais. Marque quando acontecer — sem pressa e sem
              comparação. Se algo desta lista ainda não aconteceu muito depois da janela, o caminho é
              conversar com o pediatra, não se preocupar sozinho(a).
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function CheckpointCard({
  checkpoint,
  achieved,
  open,
  isCurrent,
  expected,
  onToggleOpen,
  onToggleMilestone,
  showFlags,
  onToggleFlags,
}: {
  checkpoint: AgeCheckpoint;
  achieved: Map<string, { id: string; at: string }>;
  open: boolean;
  isCurrent: boolean;
  expected: boolean;
  onToggleOpen: () => void;
  onToggleMilestone: (m: Milestone) => void;
  showFlags: boolean;
  onToggleFlags: (v: boolean) => void;
}) {
  const done = checkpoint.milestones.filter((m) => achieved.has(m.key)).length;
  const pct = Math.round((done / checkpoint.milestones.length) * 100);
  const complete = done === checkpoint.milestones.length;

  return (
    <Card className={cn(open && "ring-1 ring-brand-300/60")}>
      <button type="button" onClick={onToggleOpen} className="w-full text-left">
        <CardHeader
          className="pb-3"
          title={
            <span className="flex items-center gap-2">
              {checkpoint.label}
              {isCurrent && <Badge tone="brand">agora</Badge>}
              {expected && !isCurrent && <Badge tone="neutral">nesta fase</Badge>}
            </span>
          }
          subtitle={`${done} de ${checkpoint.milestones.length} conquistados`}
          action={
            <span className="flex items-center gap-2">
              {complete && <Badge tone="sage">completo</Badge>}
              <ChevronDown className={cn("size-4 text-fg-subtle transition-transform", open && "rotate-180")} aria-hidden />
            </span>
          }
        />
        <div className="px-4 pb-4 sm:px-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", complete ? "bg-sage-500" : "bg-brand-500")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>

      {open && (
        <CardBody className="border-t border-line pt-3">
          <ul className="grid gap-1 sm:grid-cols-2">
            {checkpoint.milestones.map((m) => {
              const hit = achieved.get(m.key);
              return (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => onToggleMilestone(m)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                      hit ? "bg-sage-50 dark:bg-sage-950/40" : "hover:bg-bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                        hit
                          ? "border-sage-500 bg-sage-500 text-white"
                          : "border-line-strong bg-bg-elevated",
                      )}
                    >
                      {hit && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-sm font-semibold leading-snug", hit ? "text-sage-800 dark:text-sage-200" : "text-fg")}>
                        {m.text}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-fg-subtle">
                        {CATEGORY_LABEL[m.category]}
                        {hit && ` · ${fmtDateMedium(hit.at)}`}
                      </span>
                      {m.tip && !hit && (
                        <span className="mt-1 block text-[11px] italic leading-snug text-fg-subtle">💡 {m.tip}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Sinais de alerta — recolhidos por padrão e com o tom certo */}
          <div className="mt-4 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => onToggleFlags(!showFlags)}
              className="flex w-full items-center gap-2 text-left text-xs font-bold text-fg-muted transition-colors hover:text-fg"
            >
              <AlertTriangle className="size-3.5 text-amber-500" aria-hidden />
              Sinais para conversar com o pediatra ({checkpoint.redFlags.length})
              <ChevronDown className={cn("ml-auto size-3.5 transition-transform", showFlags && "rotate-180")} aria-hidden />
            </button>
            {showFlags && (
              <ul className="mt-2 space-y-1.5 pl-6 text-xs leading-relaxed text-fg-muted">
                {checkpoint.redFlags.map((flag) => (
                  <li key={flag} className="list-disc marker:text-amber-500">
                    {flag}
                  </li>
                ))}
                <li className="list-none pt-1 italic text-fg-subtle">
                  Um item isolado raramente significa algo. O pediatra avalia o conjunto, o ritmo e o
                  exame físico.
                </li>
              </ul>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  );
}
