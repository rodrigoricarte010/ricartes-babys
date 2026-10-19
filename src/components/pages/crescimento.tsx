"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Info, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, Stat } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Field, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { GrowthChart, type MeasuredPoint, type OverlaySeries } from "@/components/growth/growth-chart";
import { useGrowthEngine } from "@/lib/growth-engine";
import { useStore } from "@/lib/store";
import { useLog } from "@/components/log/log-provider";
import { useToast } from "@/components/ui/toast";
import { METRICS, METRIC_ORDER, formatPercentile, formatZScore, type MetricKey } from "@/lib/growth";
import { ageInDays, fmtDateMedium } from "@/lib/date";
import { downloadCsv, measurementsToCsv, getDataSource } from "@/lib/db";
import { weightGainPerDay, expectedWeightGainPerDay, expectedWeightGainPerDayLabel } from "@/lib/analytics";
import { num as fmtNum, kidColorHex } from "@/lib/utils";
import type { Measurement } from "@/lib/types";

export function CrescimentoPage() {
  const { activeChild: child, measurements, removeMeasurement, children } = useStore();
  const log = useLog();
  const { engine } = useGrowthEngine();
  const toast = useToast();
  const [metric, setMetric] = useState<MetricKey>("weight");
  const [compareId, setCompareId] = useState("");
  const [compareMeasurements, setCompareMeasurements] = useState<Measurement[]>([]);

  const otherKids = children.filter((c) => c.id !== child?.id);

  useEffect(() => {
    let alive = true;
    if (!compareId) {
      setCompareMeasurements([]);
      return;
    }
    getDataSource()
      .listMeasurements(compareId)
      .then((list) => {
        if (alive) setCompareMeasurements(list);
      })
      .catch(() => {
        if (alive) setCompareMeasurements([]);
      });
    return () => {
      alive = false;
    };
  }, [compareId]);

  const points = useMemo<MeasuredPoint[]>(() => {
    if (!child || !engine) return [];
    const out: MeasuredPoint[] = [];
    for (const m of measurements) {
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
      out.push({
        ageDays: ageInDays(child.birthDate, new Date(m.takenAt)),
        value,
        takenAt: m.takenAt,
        zScore: evaluation?.zScore ?? null,
        percentile: evaluation?.percentile ?? null,
        source: m.source,
      });
    }
    return out;
  }, [child, engine, measurements, metric]);

  const overlay = useMemo<OverlaySeries[]>(() => {
    if (!compareId || !engine || !child) return [];
    const other = children.find((c) => c.id === compareId);
    if (!other) return [];
    const pts: MeasuredPoint[] = [];
    for (const m of compareMeasurements) {
      let value: number | null = null;
      if (metric === "weight") value = m.weightKg;
      else if (metric === "length") value = m.lengthCm;
      else if (metric === "head") value = m.headCm;
      else if (m.weightKg != null && m.lengthCm != null) value = engine.computeBmi(m.weightKg, m.lengthCm);
      if (value == null) continue;
      pts.push({ ageDays: ageInDays(other.birthDate, new Date(m.takenAt)), value, takenAt: m.takenAt });
    }
    if (pts.length === 0) return [];
    return [{ label: other.nickname || other.firstName, color: kidColorHex(other.color, other.id), points: pts }];
  }, [compareId, engine, child, children, compareMeasurements, metric]);

  const gain = useMemo(() => {
    const withAge = measurements
      .filter((m) => m.weightKg != null && child)
      .map((m) => ({ measurement: m, ageDays: ageInDays(child!.birthDate, new Date(m.takenAt)) }));
    return weightGainPerDay(withAge);
  }, [measurements, child]);

  const expected = child ? expectedWeightGainPerDay(ageInDays(child.birthDate, new Date())) : null;

  const latest = points.length ? points[points.length - 1] : null;

  function exportCsv() {
    if (!child) return;
    const rows = measurements
      .filter((m) => m.weightKg != null || m.lengthCm != null || m.headCm != null)
      .map((m) => ({
        takenAt: m.takenAt,
        ageDays: ageInDays(child.birthDate, new Date(m.takenAt)),
        weightKg: m.weightKg,
        lengthCm: m.lengthCm,
        headCm: m.headCm,
        source: m.source,
        note: m.note,
      }));
    downloadCsv(
      `crescimento-${child.firstName.toLowerCase()}.csv`,
      measurementsToCsv(`${child.firstName} ${child.lastName ?? ""}`.trim(), rows),
    );
    toast.success("CSV exportado — o pediatra abre em qualquer planilha.");
  }

  if (!child) return <AppShell><Card><EmptyState title="Nenhuma criança selecionada" /></Card></AppShell>;

  const meta = METRICS[metric];

  return (
    <AppShell>
      <PageHeader
        title="Crescimento"
        subtitle={`${child.nickname || child.firstName} · curvas oficiais da OMS`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-3.5" aria-hidden />
              CSV
            </Button>
            <Button size="sm" onClick={() => log.open("measurement")}>
              <Plus className="size-3.5" aria-hidden />
              Medida
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <Segmented
          ariaLabel="Indicador de crescimento"
          value={metric}
          onChange={setMetric}
          options={METRIC_ORDER.map((k) => ({ value: k, label: METRICS[k].label }))}
        />

        {otherKids.length > 0 && (
          <Field label="Comparar trajetória com" hint="Cada criança mantém sua própria curva de referência (sexo e idade); a sobreposição é só visual.">
            <Select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
              <option value="">Ninguém — só {child?.nickname || child?.firstName}</option>
              {otherKids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nickname || k.firstName}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Card>
          <CardHeader
            title={`${meta.label} para idade`}
            subtitle={meta.description}
            action={
              latest ? (
                <Badge tone="brand">
                  {formatPercentile(latest.percentile ?? 0)} · {fmtNum(latest.value, meta.precision)} {meta.unit}
                </Badge>
              ) : undefined
            }
          />
          <CardBody>
            {points.length === 0 ? (
              <EmptyState
                title={`Sem medições de ${meta.label.toLowerCase()} ainda`}
                description="Registre a primeira medida para ver a trajetória sobre a curva da OMS."
                action={<Button onClick={() => log.open("measurement")}>Registrar medida</Button>}
              />
            ) : (
              <GrowthChart
                metric={metric}
                sex={child.sex}
                birthDate={child.birthDate}
                gestationalWeeks={child.gestationalWeeks}
                points={points}
                overlay={overlay}
              />
            )}
          </CardBody>
        </Card>

        {metric === "weight" && gain && expected && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Ganho de peso"
              value={fmtNum(gain.perDay, 1)}
              unit="g/dia"
              tone={gain.perDay >= expected.min ? "sage" : "warning"}
              hint={`últimos ${gain.daysBetween} dias`}
              icon={<TrendingUp className="size-4" />}
            />
            <Stat
              label="Referência para a idade"
              value={`${expected.min}–${expected.typical}`}
              unit="g/dia"
              tone="neutral"
              hint={expectedWeightGainPerDayLabel(ageInDays(child.birthDate, new Date()))}
            />
          </div>
        )}

        <Card>
          <CardHeader title="Histórico de medições" subtitle={`${points.length} registros de ${meta.label.toLowerCase()}`} />
          <CardBody className="pt-1">
            {points.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-subtle">Nada por aqui ainda.</p>
            ) : (
              <ul className="divide-y divide-line">
                {[...points].reverse().map((p, idx) => {
                  const original = [...measurements].reverse()[idx];
                  return (
                    <li key={p.takenAt + idx} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="tabular text-sm font-bold text-fg">
                          {fmtNum(p.value, meta.precision)} {meta.unit}
                        </p>
                        <p className="text-xs text-fg-subtle">
                          {fmtDateMedium(p.takenAt)} · {p.ageDays} dias · {p.source === "consulta" ? "consulta" : p.source === "nascimento" ? "nascimento" : "casa"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge tone="neutral" className="tabular">z {formatZScore(p.zScore ?? 0)}</Badge>
                        <Badge tone="brand" className="tabular">{formatPercentile(p.percentile ?? 0)}</Badge>
                        <button
                          type="button"
                          aria-label="Editar medição"
                          onClick={() => log.open("measurement", { editing: original })}
                          className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-muted hover:text-fg"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir medição"
                          onClick={async () => {
                            await removeMeasurement(original.id);
                            toast.info("Medição removida.");
                          }}
                          className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="border-info/30 bg-sky-50/40 dark:bg-sky-950/20">
          <CardBody className="flex gap-3">
            <Info className="mt-0.5 size-4.5 shrink-0 text-sky-600 dark:text-sky-300" aria-hidden />
            <div className="space-y-1.5 text-[13px] leading-relaxed text-fg-muted">
              <p>
                <strong className="text-fg">Como ler a curva:</strong> cada linha tracejada é um
                percentil da população de referência da OMS. A linha colorida é a trajetória da{" "}
                {child.nickname || child.firstName}. Crianças saudáveis seguem um “corredor” — o que
                preocupa não é estar no p15 ou no p85, e sim <em>cruzar vários percentis</em> em pouco
                tempo.
              </p>
              <p>
                Prematuros (menos de 37 semanas) são avaliados pela <strong>idade corrigida</strong> até
                os 2 anos, que é a convenção da puericultura. Este gráfico é uma ferramenta de
                acompanhamento, não um diagnóstico: quem interpreta é o pediatra.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
