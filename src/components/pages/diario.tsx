"use client";

import { useMemo, useRef, useState } from "react";
import { BookHeart, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { MOOD_EMOJI, MOOD_LABEL } from "@/lib/analytics";
import { readImageAsDataUrl } from "@/components/child-form";
import type { DiaryEntry } from "@/lib/types";
import { fmtDate, toInputDate } from "@/lib/date";
import { cn } from "@/lib/utils";

const MOODS: Array<NonNullable<DiaryEntry["mood"]>> = ["otimo", "bem", "neutro", "dificil", "ruim"];

export function DiarioPage() {
  const { activeChild: child, diary, createDiary, upsertDiary, removeDiary } = useStore();
  const toast = useToast();

  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [open, setOpen] = useState(false);

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Selecione uma criança" />
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Diário"
        subtitle={`${child.nickname || child.firstName} · memórias que o tempo apaga`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Escrever
          </Button>
        }
      />

      {diary.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookHeart className="size-7" />}
            title="Ainda não há memórias escritas"
            description="O primeiro sorriso, a primeira noite inteira, aquela frase engraçada. Registre agora — no futuro, você vai agradecer."
            action={
              <Button onClick={() => { setEditing(null); setOpen(true); }}>Escrever a primeira</Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {diary.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {entry.mood && <span aria-hidden>{MOOD_EMOJI[entry.mood]}</span>}
                    {entry.title || "Sem título"}
                  </span>
                }
                subtitle={fmtDate(entry.date)}
                action={
                  <div className="flex items-center gap-0.5">
                    <button type="button" aria-label="Editar" onClick={() => { setEditing(entry); setOpen(true); }} className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-muted hover:text-fg">
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={async () => {
                        await removeDiary(entry.id);
                        toast.info("Memória removida.");
                      }}
                      className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                }
              />
              <CardBody className="pt-2">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">{entry.text}</p>
                {entry.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {entry.photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={`Foto da memória de ${fmtDate(entry.date)}`} className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <EntryDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSaved={async (draft) => {
          if (editing) {
            await upsertDiary({ ...editing, ...draft });
            toast.success("Memória atualizada.");
          } else {
            await createDiary(draft);
            toast.success("Memória guardada. 💛");
          }
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function EntryDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: DiaryEntry | null;
  onSaved: (draft: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>;
}) {
  const { activeChild } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mood, setMood] = useState<DiaryEntry["mood"]>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Carrega os valores quando abre / troca de registro.
  const targetId = editing?.id ?? "new";
  if (open && loadedFor !== targetId) {
    setLoadedFor(targetId);
    setDate(editing?.date ?? toInputDate());
    setTitle(editing?.title ?? "");
    setText(editing?.text ?? "");
    setMood(editing?.mood ?? null);
    setPhotos(editing?.photos ?? []);
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const url = await readImageAsDataUrl(file, 640);
      setPhotos((p) => [...p, url]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não consegui usar essa imagem.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar memória" : "Nova memória"}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            disabled={!text.trim()}
            onClick={() =>
              activeChild &&
              onSaved({
                childId: activeChild.id,
                date,
                title: title.trim() || null,
                text: text.trim(),
                mood,
                photos,
              })
            }
            className="flex-[2]"
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Data">
            <Input type="date" value={date} max={toInputDate()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O primeiro sorriso" />
          </Field>
        </div>

        <Field label="Como foi o dia?">
          <Segmented
            ariaLabel="Humor do dia"
            value={mood ?? "neutro"}
            onChange={(v) => setMood(mood === v ? null : (v as DiaryEntry["mood"]))}
            options={MOODS.map((m) => ({
              value: m,
              label: (
                <span className="flex items-center gap-1">
                  <span aria-hidden>{MOOD_EMOJI[m]}</span>
                  <span className="max-sm:hidden">{MOOD_LABEL[m].replace("Dia ", "")}</span>
                </span>
              ),
            }))}
          />
        </Field>

        <Field label="Texto">
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva como se fosse uma carta para ela ler um dia…" />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-fg-muted">Fotos</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Foto ${i + 1}`} className="size-20 rounded-xl object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-fg text-bg shadow-soft"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "grid size-20 place-items-center rounded-xl border border-dashed border-line-strong text-fg-subtle transition-colors hover:border-brand-400 hover:text-brand-500",
              )}
              aria-label="Adicionar foto"
            >
              <ImagePlus className="size-5" aria-hidden />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto(e.target.files?.[0])} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
