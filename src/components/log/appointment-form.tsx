"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import type { AppEvent } from "@/lib/types";
import { toInputDateTime } from "@/lib/date";

export interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  editing?: AppEvent | null;
}

export function AppointmentForm({ open, onClose, editing }: AppointmentFormProps) {
  const { activeChild, createEvent, upsertEvent } = useStore();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [place, setPlace] = useState("");
  const [when, setWhen] = useState("");
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    const payload = (editing?.payload ?? {}) as Record<string, unknown>;
    setTitle((payload.title as string) ?? "");
    setDoctor((payload.doctor as string) ?? "");
    setPlace((payload.place as string) ?? "");
    setWhen(toInputDateTime(editing ? new Date(editing.startedAt) : new Date()));
    setDone(Boolean(payload.done));
    setNote(editing?.note ?? "");
  }, [open, editing]);

  async function submit() {
    if (!activeChild || !title.trim()) return;
    const draft = {
      childId: activeChild.id,
      kind: "appointment" as const,
      startedAt: new Date(when).toISOString(),
      endedAt: null,
      durationMin: null,
      payload: { title: title.trim(), doctor: doctor.trim() || null, place: place.trim() || null, done },
      note: note.trim() || null,
      photos: editing?.photos ?? [],
    };
    try {
      if (editing) await upsertEvent({ ...editing, ...draft });
      else await createEvent(draft);
      toast.success(done ? "Consulta marcada como realizada." : "Consulta agendada.");
      onClose();
    } catch {
      toast.error("Não consegui salvar a consulta.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar consulta" : "Agendar consulta"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!title.trim()} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <Field label="Motivo" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Puericultura, pediatra, fono…" />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Profissional">
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Dra. Camila" />
          </Field>
          <Field label="Local">
            <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="UBS, clínica…" />
          </Field>
        </div>

        <Field label="Data e hora">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-bg-muted/50 px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => setDone(e.target.checked)}
            className="size-4.5 accent-[var(--color-brand-500)]"
          />
          <span className="text-sm font-semibold text-fg">Já realizada</span>
        </label>

        <Field label="Observação">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="O que levar, o que perguntar…" />
        </Field>
      </div>
    </Dialog>
  );
}
