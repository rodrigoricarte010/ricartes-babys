"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberField, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import type { AppEvent, FeedingMethod, SleepType, DiaperType, FoodReaction } from "@/lib/types";
import { toInputDateTime, durationLabel, addDays } from "@/lib/date";
import { ALLERGENS, FOOD_GROUPS, REACTION_LABEL } from "@/lib/catalog/foods";
import { FeverGuidanceCard } from "@/components/routine/fever-card";
import { PhotoPicker } from "@/components/ui/photo-picker";
import { ageInDays } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Base comum dos diálogos de rotina: monta e salva o evento. */
function useSaveEvent() {
  const { createEvent, upsertEvent } = useStore();
  const toast = useToast();
  return async function save(
    draft: Omit<AppEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    editing: AppEvent | null | undefined,
    success: string,
  ) {
    try {
      if (editing) {
        await upsertEvent({ ...editing, ...draft });
      } else {
        await createEvent(draft);
      }
      toast.success(success);
      return true;
    } catch {
      toast.error("Não consegui salvar. Tente de novo.");
      return false;
    }
  };
}

function startedFrom(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function QuickDuration({
  value,
  onChange,
  options = [5, 10, 15, 20, 30, 45, 60, 90],
}: {
  value: number | null;
  onChange: (v: number) => void;
  options?: number[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
            value === o
              ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
              : "border-line-strong text-fg-muted hover:bg-bg-muted",
          )}
        >
          {durationLabel(o)}
        </button>
      ))}
    </div>
  );
}

// ── Alimentação ─────────────────────────────────────────────────

export interface FeedingFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
  /** Pré-seleção vinda do cronômetro ou de um atalho. */
  presetMethod?: FeedingMethod;
  presetDurationMin?: number | null;
}

const METHOD_LABEL: Record<FeedingMethod, string> = {
  breast: "Peito",
  bottle: "Mamadeira",
  solids: "Papinha",
  pump: "Ordenha",
};

export function FeedingForm({ open, onClose, editing, presetMethod, presetDurationMin }: FeedingFormProps) {
  const { activeChild } = useStore();
  const save = useSaveEvent();
  const [photos, setPhotos] = useState<string[]>([]);

  const [method, setMethod] = useState<FeedingMethod>("breast");
  const [side, setSide] = useState<"left" | "right" | "both">("left");
  const [amount, setAmount] = useState("");
  const [food, setFood] = useState("");
  const [isNewFood, setIsNewFood] = useState(false);
  const [reaction, setReaction] = useState<FoodReaction>("none");
  const [startedAt, setStartedAt] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setMethod((editing ? (payload.method as FeedingMethod) : presetMethod) ?? "breast");
    setSide((payload.side as "left" | "right" | "both") ?? "left");
    setAmount(payload.amountMl != null ? String(payload.amountMl) : "");
    setFood((payload.food as string) ?? "");
    setIsNewFood(Boolean(payload.isNewFood));
    setReaction((payload.reaction as FoodReaction) ?? "none");
    setStartedAt(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setDuration(editing?.durationMin ?? presetDurationMin ?? (method === "breast" ? 15 : null));
    setNote(editing?.note ?? "");
  }, [open, editing, presetMethod, presetDurationMin, method]);

  const amountNum = amount === "" ? null : Number(amount.replace(",", "."));

  async function submit() {
    if (!activeChild) return;
    const started = startedFrom(startedAt);
    const durationMin = method === "breast" || method === "pump" ? duration : duration;
    const ok = await save(
      {
        childId: activeChild.id,
        kind: "feeding",
        startedAt: started.toISOString(),
        endedAt: durationMin != null ? new Date(started.getTime() + durationMin * 60_000).toISOString() : null,
        durationMin,
        payload:
          method === "breast"
            ? { method, side }
            : method === "solids"
              ? { method, food: food.trim() || null, isNewFood, reaction }
              : { method, amountMl: amountNum },
        note: note.trim() || null,
        photos,
      },
      editing,
      "Alimentação registrada.",
    );
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar alimentação" : "Registrar alimentação"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Segmented
          ariaLabel="Tipo de alimentação"
          value={method}
          onChange={(v) => setMethod(v)}
          options={[
            { value: "breast", label: "Peito" },
            { value: "bottle", label: "Mamadeira" },
            { value: "solids", label: "Papinha" },
            { value: "pump", label: "Ordenha" },
          ]}
        />

        {method === "breast" && (
          <>
            <Segmented
              ariaLabel="Lado"
              value={side}
              onChange={(v) => setSide(v)}
              options={[
                { value: "left", label: "Esquerdo" },
                { value: "right", label: "Direito" },
                { value: "both", label: "Os dois" },
              ]}
            />
            <Field label="Duração">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setDuration(Math.max(0, (duration ?? 0) - 1))} aria-label="Diminuir um minuto">
                  <Minus className="size-4" />
                </Button>
                <NumberField
                  unit="min"
                  className="flex-1"
                  value={duration == null ? "" : String(duration)}
                  onChange={(e) => setDuration(e.target.value === "" ? null : Number(e.target.value))}
                />
                <Button variant="outline" size="icon" onClick={() => setDuration((duration ?? 0) + 1)} aria-label="Aumentar um minuto">
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="mt-2">
                <QuickDuration value={duration} onChange={setDuration} options={[5, 10, 12, 15, 20, 25, 30]} />
              </div>
            </Field>
          </>
        )}

        {(method === "bottle" || method === "pump") && (
          <NumberField
            label="Quantidade"
            unit="ml"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="90"
          />
        )}

        {method === "solids" && (
          <>
            <Field label="Alimento" hint="Ex.: purê de abóbora, banana amassada">
              <Input value={food} onChange={(e) => setFood(e.target.value)} placeholder="Qual comida?" list="rb-foods" />
            </Field>
            <datalist id="rb-foods">
              {[...FOOD_GROUPS.flatMap((g) => g.examples), ...ALLERGENS.map((a) => a.label)].map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-bg-muted/50 px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={isNewFood}
                onChange={(e) => setIsNewFood(e.target.checked)}
                className="size-4.5 accent-[var(--color-brand-500)]"
              />
              <span className="text-sm font-semibold text-fg">Primeira vez com este alimento</span>
            </label>
            {isNewFood && (
              <Field label="Teve reação?" hint="Observe por 3 dias antes de outro alimento novo.">
                <Select value={reaction} onChange={(e) => setReaction(e.target.value as FoodReaction)}>
                  {(Object.keys(REACTION_LABEL) as FoodReaction[]).map((k) => (
                    <option key={k} value={k}>
                      {REACTION_LABEL[k]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </>
        )}

        <Field label="Horário">
          <Input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </Field>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Aceitou bem? Regurgitou?" />
        </Field>

        <PhotoPicker photos={photos} onChange={setPhotos} />
     </div>
    </Dialog>
  );
}

// ── Sono ────────────────────────────────────────────────────────

export interface SleepFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
  presetType?: SleepType;
}

export function SleepForm({ open, onClose, editing, presetType }: SleepFormProps) {
  const { activeChild } = useStore();
  const save = useSaveEvent();
  const [photos, setPhotos] = useState<string[]>([]);

  const [type, setType] = useState<SleepType>("nap");
  const [startedAt, setStartedAt] = useState("");
  const [duration, setDuration] = useState<number | null>(60);
  const [quality, setQuality] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setType((editing ? (payload.type as SleepType) : presetType) ?? "nap");
    setStartedAt(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setDuration(editing?.durationMin ?? (type === "night" ? 600 : 60));
    setQuality((payload.quality as number) ?? null);
    setNote(editing?.note ?? "");
  }, [open, editing, presetType, type]);

  const ended = duration != null ? new Date(startedFrom(startedAt).getTime() + duration * 60_000) : null;

  async function submit() {
    if (!activeChild) return;
    const started = startedFrom(startedAt);
    const ok = await save(
      {
        childId: activeChild.id,
        kind: "sleep",
        startedAt: started.toISOString(),
        endedAt: ended ? ended.toISOString() : null,
        durationMin: duration,
        payload: { type, quality },
        note: note.trim() || null,
        photos,
      },
      editing,
      "Sono registrado.",
    );
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar sono" : "Registrar sono"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Segmented
          ariaLabel="Tipo de sono"
          value={type}
          onChange={(v) => setType(v)}
          options={[
            { value: "nap", label: "Soneca" },
            { value: "night", label: "Noite" },
          ]}
        />

        <Field label="Começou em">
          <Input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </Field>

        <Field label="Duração">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDuration(Math.max(0, (duration ?? 0) - 5))} aria-label="Diminuir 5 minutos">
              <Minus className="size-4" />
            </Button>
            <NumberField
              unit="min"
              className="flex-1"
              value={duration == null ? "" : String(duration)}
              onChange={(e) => setDuration(e.target.value === "" ? null : Number(e.target.value))}
            />
            <Button variant="outline" size="icon" onClick={() => setDuration((duration ?? 0) + 5)} aria-label="Aumentar 5 minutos">
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="mt-2">
            <QuickDuration
              value={duration}
              onChange={setDuration}
              options={type === "night" ? [300, 420, 480, 540, 600, 660] : [20, 30, 45, 60, 90, 120]}
            />
          </div>
          {ended && (
            <p className="mt-2 text-xs text-fg-subtle">
              Acordou por volta de{" "}
              <strong className="text-fg">
                {ended.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </strong>
              .
            </p>
          )}
        </Field>

        <Field label="Como foi?">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(quality === q ? null : q)}
                aria-label={`Qualidade ${q} de 5`}
                className={cn(
                  "grid size-10 place-items-center rounded-xl transition-colors",
                  quality != null && q <= quality
                    ? "text-amber-500"
                    : "text-fg-subtle hover:bg-bg-muted",
                )}
              >
                <Star className={cn("size-5", quality != null && q <= quality && "fill-current")} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Acordou quantas vezes? Chorou?" />
        </Field>

        <PhotoPicker photos={photos} onChange={setPhotos} />
     </div>
    </Dialog>
  );
}

// ── Fralda ──────────────────────────────────────────────────────

const STOOL_COLORS = ["amarelo-mostarda", "amarelo-claro", "marrom-claro", "marrom", "esverdeado", "com pontinhos brancos"];
const STOOL_TEXTURES = ["líquida", "pastosa", "com gruminhos", "formada", "com muco"];

export interface DiaperFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
}

export function DiaperForm({ open, onClose, editing }: DiaperFormProps) {
  const { activeChild } = useStore();
  const save = useSaveEvent();
  const [photos, setPhotos] = useState<string[]>([]);

  const [type, setType] = useState<DiaperType>("wet");
  const [changedAt, setChangedAt] = useState("");
  const [stoolColor, setStoolColor] = useState("");
  const [stoolTexture, setStoolTexture] = useState("");
  const [rash, setRash] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setType((payload.type as DiaperType) ?? "wet");
    setChangedAt(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setStoolColor((payload.stoolColor as string) ?? "");
    setStoolTexture((payload.stoolTexture as string) ?? "");
    setRash(Boolean(payload.rash));
    setNote(editing?.note ?? "");
  }, [open, editing]);

  async function submit() {
    if (!activeChild) return;
    const ok = await save(
      {
        childId: activeChild.id,
        kind: "diaper",
        startedAt: startedFrom(changedAt).toISOString(),
        endedAt: null,
        durationMin: null,
        payload: {
          type,
          stoolColor: type === "wet" ? null : stoolColor || null,
          stoolTexture: type === "wet" ? null : stoolTexture || null,
          rash,
        },
        note: note.trim() || null,
        photos,
      },
      editing,
      "Fralda registrada.",
    );
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar fralda" : "Registrar fralda"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Segmented
          ariaLabel="Tipo de fralda"
          value={type}
          onChange={(v) => setType(v)}
          options={[
            { value: "wet", label: "Xixi" },
            { value: "dirty", label: "Cocô" },
            { value: "both", label: "Os dois" },
          ]}
        />

        <Field label="Horário da troca">
          <Input type="datetime-local" value={changedAt} onChange={(e) => setChangedAt(e.target.value)} />
        </Field>

        {type !== "wet" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor">
              <Select value={stoolColor} onChange={(e) => setStoolColor(e.target.value)}>
                <option value="">Não sei dizer</option>
                {STOOL_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Consistência">
              <Select value={stoolTexture} onChange={(e) => setStoolTexture(e.target.value)}>
                <option value="">Não sei dizer</option>
                {STOOL_TEXTURES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-bg-muted/50 px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={rash}
            onChange={(e) => setRash(e.target.checked)}
            className="size-4.5 accent-[var(--color-brand-500)]"
          />
          <span className="text-sm font-semibold text-fg">Assadura / pele irritada</span>
        </label>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <PhotoPicker photos={photos} onChange={setPhotos} />
     </div>
    </Dialog>
  );
}

// ── Remédio ─────────────────────────────────────────────────────

export interface MedicineFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
}

const COMMON_MEDICINES = ["Paracetamol", "Dipirona", "Ibuprofeno", "Soro fisiológico nasal", "Simeticona", "Vitamina D", "Ferro"];

export function MedicineForm({ open, onClose, editing }: MedicineFormProps) {
  const { activeChild } = useStore();
  const save = useSaveEvent();
  const [photos, setPhotos] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("oral");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setName((payload.name as string) ?? "");
    setDose((payload.dose as string) ?? "");
    setRoute((payload.route as string) ?? "oral");
    setWhen(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setNote(editing?.note ?? "");
  }, [open, editing]);

  async function submit() {
    if (!activeChild || !name.trim()) return;
    const ok = await save(
      {
        childId: activeChild.id,
        kind: "medicine",
        startedAt: startedFrom(when).toISOString(),
        endedAt: null,
        durationMin: null,
        payload: { name: name.trim(), dose: dose.trim() || null, route },
        note: note.trim() || null,
        photos,
      },
      editing,
      "Remédio registrado.",
    );
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar remédio" : "Registrar remédio"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!name.trim()} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Field label="Medicamento" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} list="rb-meds" placeholder="Nome do remédio" />
        </Field>
        <datalist id="rb-meds">
          {COMMON_MEDICINES.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dose">
            <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="2,5 ml" />
          </Field>
          <Field label="Via">
            <Select value={route} onChange={(e) => setRoute(e.target.value)}>
              <option value="oral">Oral</option>
              <option value="nasal">Nasal</option>
              <option value="topica">Tópica (pele)</option>
              <option value="retal">Retal</option>
              <option value="inalatoria">Inalatória</option>
            </Select>
          </Field>
        </div>

        <Field label="Horário">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Prescrito por quem? De quanto em quanto tempo?" />
        </Field>

        <PhotoPicker photos={photos} onChange={setPhotos} />
     </div>
    </Dialog>
  );
}

// ── Sintoma / saúde ─────────────────────────────────────────────

export interface SymptomFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
}

const COMMON_SYMPTOMS = ["Febre", "Cólica", "Nariz escorrendo", "Tosse", "Vômito", "Diarreia", "Brotoeja", "Irritação", "Recusa alimentar"];

export function SymptomForm({ open, onClose, editing }: SymptomFormProps) {
  const { activeChild } = useStore();
  const save = useSaveEvent();
  const [photos, setPhotos] = useState<string[]>([]);

  const [symptom, setSymptom] = useState("");
  const [temperature, setTemperature] = useState("");
  const [severity, setSeverity] = useState<number | null>(null);
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setSymptom((payload.symptom as string) ?? "");
    setTemperature(payload.temperatureC != null ? String(payload.temperatureC).replace(".", ",") : "");
    setSeverity((payload.severity as number) ?? null);
    setWhen(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setNote(editing?.note ?? "");
  }, [open, editing]);

  const temp = temperature === "" ? null : Number(temperature.replace(",", "."));

  async function submit() {
    if (!activeChild || !symptom.trim()) return;
    const ok = await save(
      {
        childId: activeChild.id,
        kind: "symptom",
        startedAt: startedFrom(when).toISOString(),
        endedAt: null,
        durationMin: null,
        payload: { symptom: symptom.trim(), temperatureC: temp, severity },
        note: note.trim() || null,
        photos,
      },
      editing,
      "Sintoma registrado.",
    );
    if (ok) onClose();
  }

  const feverish = temp != null && temp >= 37.8;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar sintoma" : "Registrar sintoma"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!symptom.trim()} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Field label="Sintoma" required>
          <Input value={symptom} onChange={(e) => setSymptom(e.target.value)} list="rb-symptoms" placeholder="O que você observou?" />
        </Field>
        <datalist id="rb-symptoms">
          {COMMON_SYMPTOMS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Temperatura"
            unit="°C"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="36,8"
            hint={feverish ? "37,8 °C ou mais merece atenção do pediatra." : undefined}
          />
          <Field label="Intensidade">
            <Segmented
              ariaLabel="Intensidade"
              size="sm"
              value={severity == null ? "none" : String(severity)}
              onChange={(v) => setSeverity(v === "none" ? null : Number(v))}
              options={[
                { value: "none", label: "—" },
                { value: "1", label: "Leve" },
                { value: "2", label: "Médio" },
                { value: "3", label: "Forte" },
              ]}
            />
          </Field>
        </div>

        {temp != null && activeChild && (
          <FeverGuidanceCard tempC={temp} ageMonths={ageInDays(activeChild.birthDate, new Date()) / 30.4375} />
        )}

        <Field label="Horário">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <PhotoPicker photos={photos} onChange={setPhotos} />
     </div>
    </Dialog>
  );
}

/** Utilitário exportado para outros módulos: data de N dias atrás em input. */
export function inputDaysAgo(n: number): string {
  return toInputDateTime(addDays(new Date(), -n));
}
