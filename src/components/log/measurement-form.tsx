"use client";

import { useEffect, useMemo, useState } from "react";
import { Ruler, TrendingUp } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberField, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { useGrowthEngine } from "@/lib/growth-engine";
import type { Measurement, MeasurementSource } from "@/lib/types";
import { formatPercentile, formatZScore, type MetricKey } from "@/lib/growth";
import { toInputDateTime, ageInDays, formatAge } from "@/lib/date";
import { num } from "@/lib/utils";

/** Aceita "5,2" e "5.2" — como se escreve e como se digita. */
export function parseDecimal(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const SOURCE_LABEL: Record<MeasurementSource, string> = {
  casa: "Medida em casa",
  consulta: "Consulta médica",
  nascimento: "Nascimento",
};

export interface MeasurementFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Measurement | null;
}

export function MeasurementForm({ open, onClose, editing }: MeasurementFormProps) {
  const { activeChild, createMeasurement, upsertMeasurement } = useStore();
  const { engine } = useGrowthEngine();
  const toast = useToast();

  const [takenAt, setTakenAt] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [head, setHead] = useState("");
  const [source, setSource] = useState<MeasurementSource>("casa");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTakenAt(toInputDateTime(editing ? new Date(editing.takenAt) : new Date()));
    setWeight(editing?.weightKg != null ? String(editing.weightKg).replace(".", ",") : "");
    setLength(editing?.lengthCm != null ? String(editing.lengthCm).replace(".", ",") : "");
    setHead(editing?.headCm != null ? String(editing.headCm).replace(".", ",") : "");
    setSource(editing?.source ?? "casa");
    setNote(editing?.note ?? "");
    setTouched(false);
  }, [open, editing]);

  const values = useMemo(() => {
    const w = parseDecimal(weight);
    const l = parseDecimal(length);
    const h = parseDecimal(head);
    return { w, l, h };
  }, [weight, length, head]);

  const referenceDate = useMemo(() => {
    const parsed = takenAt ? new Date(takenAt) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [takenAt]);

  /** Prévia ao vivo: enquanto digita o peso, mostra em qual curva ele cai. */
  const previews = useMemo(() => {
    if (!engine || !activeChild) return [];
    const days = ageInDays(activeChild.birthDate, referenceDate);
    const rows: Array<{ metric: MetricKey; label: string; value: number; unit: string }> = [];
    if (values.w != null && values.w > 0) rows.push({ metric: "weight", label: "Peso", value: values.w, unit: "kg" });
    if (values.l != null && values.l > 0) rows.push({ metric: "length", label: "Estatura", value: values.l, unit: "cm" });
    if (values.h != null && values.h > 0) rows.push({ metric: "head", label: "Perímetro cefálico", value: values.h, unit: "cm" });

    return rows.map((row) => {
      const result = engine.evaluateMeasurement({
        metric: row.metric,
        value: row.value,
        sex: activeChild.sex,
        birthDate: activeChild.birthDate,
        on: referenceDate,
        gestationalWeeks: activeChild.gestationalWeeks,
      });
      return { ...row, result };
    });
  }, [engine, activeChild, values, referenceDate]);

  const hasAny = values.w != null || values.l != null || values.h != null;
  const ageDays = activeChild ? ageInDays(activeChild.birthDate, referenceDate) : 0;

  async function submit() {
    if (!activeChild) return;
    setTouched(true);
    if (!hasAny) return;
    const stamp = referenceDate.toISOString();
    const base = {
      childId: activeChild.id,
      takenAt: stamp,
      weightKg: values.w,
      lengthCm: values.l,
      headCm: values.h,
      source,
      note: note.trim() || null,
    };
    try {
      if (editing) {
        await upsertMeasurement({ ...editing, ...base });
        toast.success("Medida atualizada.");
      } else {
        await createMeasurement(base);
        toast.success("Medida registrada. A curva já foi atualizada.");
      }
      onClose();
    } catch {
      toast.error("Não consegui salvar a medida. Tente de novo.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar medida" : "Nova medida"}
      description={
        activeChild ? `${activeChild.nickname || activeChild.firstName} · ${formatAge(activeChild.birthDate, referenceDate)}` : undefined
      }
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!hasAny} className="flex-[2]">
            Salvar medida
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data e hora" className="col-span-2">
            <Input
              type="datetime-local"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
            />
          </Field>

          <NumberField
            label="Peso"
            unit="kg"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="5,200"
            invalid={touched && values.w === null}
          />
          <NumberField
            label="Estatura"
            unit="cm"
            step="0.1"
            min="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="58,0"
            invalid={touched && values.l === null}
          />
          <NumberField
            label="Perímetro cefálico"
            unit="cm"
            step="0.1"
            min="0"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            placeholder="39,0"
            invalid={touched && values.h === null}
          />
          <Field label="Origem">
            <Select value={source} onChange={(e) => setSource(e.target.value as MeasurementSource)}>
              {(Object.keys(SOURCE_LABEL) as MeasurementSource[]).map((key) => (
                <option key={key} value={key}>
                  {SOURCE_LABEL[key]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observação">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Balança da farmácia, depois do banho…"
          />
        </Field>

        {/* Prévia de curva — o motivo de existir deste formulário */}
        {previews.length > 0 && (
          <div className="rounded-2xl border border-line bg-bg-muted/60 p-3.5">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-subtle">
              <TrendingUp className="size-3.5" aria-hidden />
              Na curva da OMS, aos {ageDays} dias
            </div>
            <div className="space-y-2">
              {previews.map((p) => (
                <div key={p.metric} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg-muted">
                    {p.label}: <strong className="tabular text-fg">{num(p.value, 3)}</strong> {p.unit}
                  </span>
                  {p.result ? (
                    <span className="flex items-center gap-1.5">
                      <Badge tone={p.result.tone === "ok" ? "sage" : p.result.tone === "info" ? "info" : p.result.tone === "warning" ? "warning" : "danger"}>
                        {formatPercentile(p.result.percentile)}
                      </Badge>
                      <Badge tone="neutral" className="tabular">
                        z {formatZScore(p.result.zScore)}
                      </Badge>
                    </span>
                  ) : (
                    <Badge tone="neutral">fora da faixa etária</Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-fg-subtle">
              Percentil é posição na curva, não nota. O que importa é a trajetória — e ela quem
              interpreta é o pediatra.
            </p>
          </div>
        )}

        {!engine && (
          <div className="flex items-center gap-2 rounded-xl bg-bg-muted px-3 py-2 text-xs text-fg-subtle">
            <Ruler className="size-3.5" aria-hidden />
            Carregando as tabelas da OMS para a prévia…
          </div>
        )}
      </div>
    </Dialog>
  );
}
