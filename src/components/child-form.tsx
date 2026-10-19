"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberField, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { BLOOD_TYPES, type Child, type EmergencyContact, type Sex } from "@/lib/types";
import { KID_COLOR_HEX, type KidColor, cn } from "@/lib/utils";
import { ChildAvatar } from "@/components/ui/avatar";
import { toInputDate } from "@/lib/date";
import { readImageAsDataUrl } from "@/lib/photo";

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
  fatherHeightCm: string;
  motherHeightCm: string;
  pediatricianName: string;
  pediatricianPhone: string;
  healthPlan: string;
  contacts: EmergencyContact[];
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
  fatherHeightCm: "",
  motherHeightCm: "",
  pediatricianName: "",
  pediatricianPhone: "",
  healthPlan: "",
  contacts: [],
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
    fatherHeightCm: child.fatherHeightCm != null ? String(child.fatherHeightCm).replace(".", ",") : "",
    motherHeightCm: child.motherHeightCm != null ? String(child.motherHeightCm).replace(".", ",") : "",
    pediatricianName: child.pediatricianName ?? "",
    pediatricianPhone: child.pediatricianPhone ?? "",
    healthPlan: child.healthPlan ?? "",
    contacts: child.emergencyContacts ?? [],
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

  const updateContact = (index: number, key: keyof EmergencyContact, value: string) =>
    setValues((v) => ({
      ...v,
      contacts: v.contacts.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));

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
      fatherHeightCm: numOrNull(values.fatherHeightCm),
      motherHeightCm: numOrNull(values.motherHeightCm),
      pediatricianName: values.pediatricianName.trim() || null,
      pediatricianPhone: values.pediatricianPhone.trim() || null,
      healthPlan: values.healthPlan.trim() || null,
      emergencyContacts: values.contacts
        .filter((c) => c.name.trim() || c.phone.trim())
        .map((c) => ({ name: c.name.trim(), relation: c.relation.trim(), phone: c.phone.trim() })),
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

      {/* Saúde, genética e contatos */}
      <details className="rounded-2xl border border-line bg-bg-muted/30 px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-fg">
          Saúde e contatos <span className="font-medium text-fg-subtle">(opcional)</span>
        </summary>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Altura do pai"
              unit="cm"
              value={values.fatherHeightCm}
              onChange={(e) => set("fatherHeightCm", e.target.value)}
              placeholder="175"
              hint="Para a previsão de altura (Tanner)"
            />
            <NumberField
              label="Altura da mãe"
              unit="cm"
              value={values.motherHeightCm}
              onChange={(e) => set("motherHeightCm", e.target.value)}
              placeholder="162"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Pediatra">
              <Input value={values.pediatricianName} onChange={(e) => set("pediatricianName", e.target.value)} placeholder="Dra. Camila" />
            </Field>
            <Field label="Telefone do pediatra">
              <Input type="tel" value={values.pediatricianPhone} onChange={(e) => set("pediatricianPhone", e.target.value)} placeholder="(85) 99999-0000" />
            </Field>
          </div>

          <Field label="Plano de saúde / referência" hint="Carteirinha, hospital ou UBS de referência">
            <Input value={values.healthPlan} onChange={(e) => set("healthPlan", e.target.value)} placeholder="Unimed, SUS — UBS do bairro…" />
          </Field>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-fg-muted">Contatos de emergência (até 3)</p>
            <div className="space-y-2">
              {values.contacts.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    aria-label={`Nome do contato ${i + 1}`}
                    placeholder="Nome"
                    value={c.name}
                    onChange={(e) => updateContact(i, "name", e.target.value)}
                  />
                  <Input
                    aria-label={`Parentesco do contato ${i + 1}`}
                    placeholder="Vó, tio…"
                    className="w-28 shrink-0"
                    value={c.relation}
                    onChange={(e) => updateContact(i, "relation", e.target.value)}
                  />
                  <Input
                    aria-label={`Telefone do contato ${i + 1}`}
                    type="tel"
                    placeholder="(85) 9…"
                    className="w-36 shrink-0"
                    value={c.phone}
                    onChange={(e) => updateContact(i, "phone", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover contato ${i + 1}`}
                    onClick={() => set("contacts", values.contacts.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
              {values.contacts.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("contacts", [...values.contacts, { name: "", relation: "", phone: "" }])}
                >
                  + Adicionar contato
                </Button>
              )}
            </div>
          </div>
        </div>
      </details>

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
