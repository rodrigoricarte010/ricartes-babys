"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Check, ShieldCheck, Syringe, Undo2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { buildVaccinePlan, appliedCount, findAppliedEvent, type VaccineRow } from "@/lib/vaccine-progress";
import { STATUS_LABEL, type VaccineStatus } from "@/lib/catalog/vaccines";
import { addMonths, fmtDateMedium, toInputDate, toDate } from "@/lib/date";
import { cn, num } from "@/lib/utils";

const STATUS_TONE: Record<VaccineStatus, "sage" | "danger" | "warning" | "neutral"> = {
  aplicada: "sage",
  atrasada: "danger",
  agendada: "warning",
  futura: "neutral",
};

function ageLabel(months: number): string {
  if (months === 0) return "Ao nascer";
  if (months < 12) return `${months} meses`;
  if (months % 12 === 0) return `${months / 12} ano${months > 12 ? "s" : ""}`;
  return `${Math.floor(months / 12)} ano${months > 24 ? "s" : ""} e ${months % 12} ${months % 12 === 1 ? "mês" : "meses"}`;
}

export function VacinasPage() {
  const { activeChild: child, events, createEvent, removeEvent } = useStore();
  const toast = useToast();
  const [includeSbim, setIncludeSbim] = useState(false);
  const [applyTarget, setApplyTarget] = useState<VaccineRow | null>(null);

  const plan = useMemo(
    () => (child ? buildVaccinePlan(child, events, includeSbim) : []),
    [child, events, includeSbim],
  );
  const progress = useMemo(() => appliedCount(plan), [plan]);

  const groups = useMemo(() => {
    const map = new Map<number, VaccineRow[]>();
    for (const row of plan) {
      const list = map.get(row.dose.ageMonths) ?? [];
      list.push(row);
      map.set(row.dose.ageMonths, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [plan]);

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Selecione uma criança" />
        </Card>
      </AppShell>
    );
  }

  const pct = progress.total ? Math.round((progress.applied / progress.total) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Carteira de vacinação"
        subtitle={`${child.nickname || child.firstName} · calendário de referência PNI/SBIm`}
      />

      <div className="space-y-5">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300">
                <ShieldCheck className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">
                  {progress.applied} de {progress.total} doses previstas até agora
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                  <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="tabular text-2xl font-extrabold text-sage-600 dark:text-sage-300">{pct}%</span>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-bg-muted/50 px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={includeSbim}
                onChange={(e) => setIncludeSbim(e.target.checked)}
                className="size-4.5 accent-[var(--color-sage-500)]"
              />
              <span className="text-sm font-semibold text-fg">
                Mostrar também as recomendações SBIm (rede privada)
              </span>
            </label>
          </CardBody>
        </Card>

        {groups.map(([months, rows]) => {
          const dueDate = addMonths(toDate(child.birthDate), Math.round(months));
          const allApplied = rows.every((r) => r.appliedEvent);
          const anyDue = rows.some((r) => r.status === "agendada" || r.status === "atrasada");
          return (
            <Card key={months} className={cn(anyDue && "ring-1 ring-amber-300/60")}>
              <CardHeader
                title={ageLabel(months)}
                subtitle={`recomendado em ${fmtDateMedium(dueDate)}`}
                action={
                  allApplied ? <Badge tone="sage">completo</Badge> : anyDue ? <Badge tone="warning">atenção</Badge> : <Badge tone="neutral">futuro</Badge>
                }
              />
              <CardBody className="pt-1">
                <ul className="divide-y divide-line">
                  {rows.map((row) => (
                    <li key={row.dose.id} className="py-2.5">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                            row.appliedEvent
                              ? "bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300"
                              : row.status === "atrasada"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                : row.status === "agendada"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-bg-muted text-fg-subtle",
                          )}
                        >
                          {row.appliedEvent ? <Check className="size-4.5" strokeWidth={3} aria-hidden /> : <Syringe className="size-4.5" aria-hidden />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug text-fg">{row.vaccineName}</p>
                          <p className="text-xs text-fg-subtle">
                            {row.dose.dose} · protege: {row.dose.protects}
                          </p>
                          {row.dose.note && <p className="mt-0.5 text-[11px] italic text-fg-subtle">{row.dose.note}</p>}
                          {row.appliedEvent && (
                            <p className="mt-0.5 text-[11px] font-semibold text-sage-700 dark:text-sage-300">
                              aplicada em {fmtDateMedium(row.appliedEvent.startedAt)}
                              {(row.appliedEvent.payload as { place?: string }).place
                                ? ` · ${(row.appliedEvent.payload as { place?: string }).place}`
                                : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                          {row.appliedEvent ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={async () => {
                                await removeEvent(row.appliedEvent!.id);
                                toast.info("Aplicação desfeita.");
                              }}
                            >
                              <Undo2 className="size-3" aria-hidden />
                              Desfazer
                            </Button>
                          ) : (
                            <Button size="xs" variant="outline" onClick={() => setApplyTarget(row)}>
                              Marcar aplicada
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardBody className="flex gap-3 text-[13px] leading-relaxed text-fg-muted">
            <CalendarCheck className="mt-0.5 size-4.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
            <p>
              Este calendário é uma <strong className="text-fg">referência organizada</strong> (PNI +
              SBIm) para você não perder prazo — mas ele muda com o tempo e varia por região. A fonte
              oficial continua sendo a caderneta da criança e a equipe de saúde. Cada dose aceita
              anotação de lote e local para bater com o papel.
            </p>
          </CardBody>
        </Card>
      </div>

      <ApplyDialog row={applyTarget} onClose={() => setApplyTarget(null)} onSaved={async (data) => {
        if (!applyTarget || !child) return;
        // Se já havia registro, substitui.
        const existing = findAppliedEvent(events, applyTarget.dose);
        if (existing) await removeEvent(existing.id);
        await createEvent({
          childId: child.id,
          kind: "vaccine",
          startedAt: new Date(data.date + "T09:00:00").toISOString(),
          endedAt: null,
          durationMin: null,
          payload: {
            key: applyTarget.dose.vaccineKey,
            dose: applyTarget.dose.dose,
            place: data.place || null,
            lot: data.lot || null,
          },
          note: null,
          photos: [],
        });
        toast.success("Dose registrada na carteira.");
        setApplyTarget(null);
      }} />
    </AppShell>
  );
}

function ApplyDialog({
  row,
  onClose,
  onSaved,
}: {
  row: VaccineRow | null;
  onClose: () => void;
  onSaved: (data: { date: string; place: string; lot: string }) => void;
}) {
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [lot, setLot] = useState("");
  const [key, setKey] = useState<string | null>(null);

  // Reseta os campos quando o alvo muda.
  const targetKey = row?.dose.id ?? null;
  if (targetKey !== key) {
    setKey(targetKey);
    setDate(toInputDate());
    setPlace("");
    setLot("");
  }

  return (
    <Dialog
      open={row != null}
      onClose={onClose}
      title="Registrar dose aplicada"
      description={row ? `${row.vaccineName} · ${row.dose.dose}` : undefined}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={() => onSaved({ date, place, lot })} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-4">
        <Field label="Data da aplicação">
          <Input type="date" value={date} max={toInputDate()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Local">
          <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="UBS, clínica…" />
        </Field>
        <Field label="Lote (opcional)">
          <Input value={lot} onChange={(e) => setLot(e.target.value)} placeholder="Como está na caderneta" />
        </Field>
      </div>
    </Dialog>
  );
}
