"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberField, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { BLOOD_TYPES, type Child, type Sex } from "@/lib/types";
import { KID_COLOR_HEX, type KidColor, cn } from "@/lib/utils";
import { ChildAvatar } from "@/components/ui/avatar";
import { toInputDate } from "@/lib/date";

/** Reduz a foto antes de guardar: 320 px é o bastante para avatar e cabe no IndexedDB. */
export async function readImageAsDataUrl(file: File, maxSize = 320): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Este arquivo não parece uma imagem."));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export interface ChildFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  sex: Sex;
  birthDate: string;
  birthTime: string;
  birthWeightKg: string;
  birthLengthCm: string;
  birthHeadCm: string;
  gestationalWeeks: string;
  bloodType: string;
  color: KidColor;
  notes: string;
  photoDataUrl: string | null;
}

const EMPTY: ChildFormValues = {
  firstName: "",
  middleName: "",
  lastName: "Ricartes",
  nickname: "",
  sex: "female",
  birthDate: "",
  birthTime: "",
  birthWeightKg: "",
  birthLengthCm: "",
  birthHeadCm: "",
  gestationalWeeks: "",
  bloodType: "",
  color: "rose",
  notes: "",
  photoDataUrl: null,
};

function fromChild(child: Child): ChildFormValues {
  return {
    firstName: child.firstName,
    middleName: child.middleName ?? "",
    lastName: child.lastName ?? "",
    nickname: child.nickname ?? "",
    sex: child.sex,
    birthDate: child.birthDate,
    birthTime: child.birthTime ?? "",
    birthWeightKg: child.birthWeightKg != null ? String(child.birthWeightKg).replace(".", ",") : "",
    birthLengthCm: child.birthLengthCm != null ? String(child.birthLengthCm).replace(".", ",") : "",
    birthHeadCm: child.birthHeadCm != null ? String(child.birthHeadCm).replace(".", ",") : "",
    gestationalWeeks: child.gestationalWeeks != null ? String(child.gestationalWeeks) : "",
    bloodType: child.bloodType ?? "",
    color: (child.color as KidColor) ?? "rose",
    notes: child.notes ?? "",
    photoDataUrl: child.photoDataUrl,
  };
}

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
const intOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function ChildForm({
  child,
  onSaved,
  onCancel,
}: {
  child?: Child | null;
  onSaved?: (child: Child) => void;
  onCancel?: () => void;
}) {
  const { createChild, upsertChild, removeChild } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ChildFormValues>(child ? fromChild(child) : EMPTY);
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (child) setValues(fromChild(child));
  }, [child]);

  const set = <K extends keyof ChildFormValues>(key: K, value: ChildFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const nameError = touched && !values.firstName.trim() ? "Diga o nome da criança." : null;
  const dateError = touched && !values.birthDate ? "A data de nascimento é essencial para as curvas." : null;

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    try {
      const url = await readImageAsDataUrl(file);
      set("photoDataUrl", url);
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não consegui usar essa imagem.");
    }
  }

  async function submit() {
    setTouched(true);
    if (!values.firstName.trim() || !values.birthDate) return;

    const payload = {
      firstName: values.firstName.trim(),
      middleName: values.middleName.trim() || null,
      lastName: values.lastName.trim() || null,
      nickname: values.nickname.trim() || null,
      sex: values.sex,
      birthDate: values.birthDate,
      birthTime: values.birthTime || null,
      birthWeightKg: numOrNull(values.birthWeightKg),
      birthLengthCm: numOrNull(values.birthLengthCm),
      birthHeadCm: numOrNull(values.birthHeadCm),
      gestationalWeeks: intOrNull(values.gestationalWeeks),
      bloodType: values.bloodType || null,
      color: values.color,
      photoDataUrl: values.photoDataUrl,
      notes: values.notes.trim() || null,
      archived: child?.archived ?? false,
    };

    try {
      if (child) {
        const next: Child = { ...child, ...payload };
        await upsertChild(next);
        toast.success("Dados atualizados.");
        onSaved?.(next);
      } else {
        const created = await createChild(payload);
        toast.success(`${created.firstName} agora faz parte do acompanhamento. 💛`);
        onSaved?.(created);
      }
    } catch {
      toast.error("Não consegui salvar. Verifique os campos e tente de novo.");
    }
  }

  async function handleDelete() {
    if (!child) return;
    try {
      await removeChild(child.id);
      toast.success("Registro removido.");
      onSaved?.(child);
    } catch {
      toast.error("Não consegui remover.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Identidade */}
      <section className="flex items-center gap-4">
        <div className="relative">
          <ChildAvatar
            child={{
              id: child?.id ?? values.firstName,
              firstName: values.firstName || "Nova",
              lastName: values.lastName,
              nickname: values.nickname,
              color: values.color,
              photoDataUrl: values.photoDataUrl,
            }}
            size="xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Trocar foto"
            className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-2 border-bg-elevated bg-brand-500 text-white shadow-soft transition-colors hover:bg-brand-600"
          >
            <Camera className="size-4" aria-hidden />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Cor da criança</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(KID_COLOR_HEX) as KidColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                aria-label={`Cor ${c}`}
                className={cn(
                  "size-8 rounded-full transition-all",
                  values.color === c ? "ring-2 ring-fg ring-offset-2 ring-offset-bg-elevated" : "hover:scale-110",
                )}
                style={{ backgroundColor: KID_COLOR_HEX[c] }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Nome */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome" required error={nameError}>
          <Input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Rosie" />
        </Field>
        <Field label="Apelido" hint="Como aparece no app">
          <Input value={values.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="Rosie" />
        </Field>
        <Field label="Nome do meio">
          <Input value={values.middleName} onChange={(e) => set("middleName", e.target.value)} placeholder="Grace" />
        </Field>
        <Field label="Sobrenome">
          <Input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Ricartes" />
        </Field>
      </section>

      {/* Nascimento */}
      <section className="space-y-3">
        <Field label="Sexo ao nascer" hint="Usado para escolher a curva certa da OMS">
          <Segmented
            ariaLabel="Sexo"
            value={values.sex}
            onChange={(v) => set("sex", v)}
            options={[
              { value: "female", label: "Menina" },
              { value: "male", label: "Menino" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de nascimento" required error={dateError}>
            <Input type="date" max={toInputDate()} value={values.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
          </Field>
          <Field label="Hora do nascimento">
            <Input type="time" value={values.birthTime} onChange={(e) => set("birthTime", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Peso ao nascer" unit="kg" value={values.birthWeightKg} onChange={(e) => set("birthWeightKg", e.target.value)} placeholder="3,280" />
          <NumberField label="Estatura" unit="cm" value={values.birthLengthCm} onChange={(e) => set("birthLengthCm", e.target.value)} placeholder="49,5" />
          <NumberField label="PC" unit="cm" value={values.birthHeadCm} onChange={(e) => set("birthHeadCm", e.target.value)} placeholder="34,2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Semanas de gestação"
            unit="sem"
            value={values.gestationalWeeks}
            onChange={(e) => set("gestationalWeeks", e.target.value)}
            placeholder="39"
            hint={intOrNull(values.gestationalWeeks) != null && intOrNull(values.gestationalWeeks)! < 37 ? "Prematuro: usamos idade corrigida até 2 anos." : undefined}
          />
          <Field label="Tipo sanguíneo">
            <Select value={values.bloodType} onChange={(e) => set("bloodType", e.target.value)}>
              <option value="">Não sei</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <Field label="Observações do nascimento" hint="Parto, Apgar, exames do pezinho…">
        <Textarea rows={3} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={submit} className="flex-1 sm:flex-none">
          {child ? "Salvar alterações" : "Adicionar criança"}
        </Button>

        {child && (
          <div className="ml-auto">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-600">Apagar tudo desta criança?</span>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Apagar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                <Trash2 className="size-4" aria-hidden />
                Remover
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
