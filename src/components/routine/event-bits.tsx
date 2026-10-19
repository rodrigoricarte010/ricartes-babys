"use client";

import type { ReactNode } from "react";
import {
  CalendarHeart,
  Droplets,
  Milk,
  Moon,
  Pill,
  Pencil,
  Sparkles,
  StickyNote,
  Syringe,
  Thermometer,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { AppEvent } from "@/lib/types";
import { durationLabel, fmtTime, timeAgo, toDate } from "@/lib/date";
import { MILESTONE_BY_KEY } from "@/lib/catalog/milestones";
import { VACCINE_BY_KEY } from "@/lib/catalog/vaccines";
import { REACTION_LABEL } from "@/lib/catalog/foods";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

/** Metadados visuais por tipo de evento — usados na linha do tempo e nos cards. */
export function eventIcon(kind: AppEvent["kind"]): LucideIcon {
  switch (kind) {
    case "feeding":
      return Milk;
    case "sleep":
      return Moon;
    case "diaper":
      return Droplets;
    case "medicine":
      return Pill;
    case "symptom":
      return Thermometer;
    case "milestone":
      return Sparkles;
    case "vaccine":
      return Syringe;
    case "appointment":
      return CalendarHeart;
    default:
      return StickyNote;
  }
}

export function eventBubbleClass(kind: AppEvent["kind"]): string {
  switch (kind) {
    case "feeding":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
    case "sleep":
      return "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300";
    case "diaper":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300";
    case "medicine":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300";
    case "symptom":
      return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300";
    case "milestone":
      return "bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300";
    case "vaccine":
      return "bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300";
    case "appointment":
      return "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300";
    default:
      return "bg-bg-muted text-fg-muted";
  }
}

/** Texto principal de um evento, reconstruído do payload. */
export function eventTitle(e: AppEvent): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.kind) {
    case "feeding": {
      const method = p.method as string;
      if (method === "breast") {
        const side = p.side === "left" ? "esquerdo" : p.side === "right" ? "direito" : "os dois lados";
        return `Mamou no peito (${side})`;
      }
      if (method === "bottle") return `Mamadeira${p.amountMl ? ` de ${p.amountMl} ml` : ""}`;
      if (method === "pump") return `Ordenha${p.amountMl ? ` de ${p.amountMl} ml` : ""}`;
      const food = p.food as string | undefined;
      const isNew = p.isNewFood as boolean | undefined;
      return `Comeu ${food || "papinha"}${isNew ? " (1ª vez)" : ""}`;
    }
    case "sleep":
      return p.type === "night" ? "Sono noturno" : "Soneca";
    case "diaper": {
      const t = p.type as string;
      return t === "wet" ? "Fralda de xixi" : t === "dirty" ? "Fralda de cocô" : "Fralda de xixi e cocô";
    }
    case "medicine":
      return `Remédio: ${p.name ?? ""}${p.dose ? ` (${p.dose})` : ""}`;
    case "symptom":
      return `Sintoma: ${p.symptom ?? ""}${p.temperatureC ? ` · ${p.temperatureC} °C` : ""}`;
    case "milestone": {
      const m = MILESTONE_BY_KEY.get(p.key as string);
      return m ? `Marco: ${m.text}` : "Marco conquistado";
    }
    case "vaccine": {
      const v = VACCINE_BY_KEY.get(p.key as string);
      return `Vacina: ${v?.short ?? ""} ${p.dose ?? ""}`.trim();
    }
    case "appointment":
      return `Consulta: ${p.title ?? ""}`;
    default:
      return "Nota";
  }
}

/** Detalhe secundário: duração, qualidade, reação… */
export function eventSubtitle(e: AppEvent): string | null {
  const p = e.payload as Record<string, unknown>;
  const parts: string[] = [];
  if (e.durationMin != null && e.durationMin > 0) parts.push(durationLabel(e.durationMin));
  if (e.kind === "feeding" && p.reaction && p.reaction !== "none") {
    parts.push(REACTION_LABEL[p.reaction as keyof typeof REACTION_LABEL]);
  }
  if (e.kind === "sleep" && typeof p.quality === "number") parts.push(`qualidade ${p.quality}/5`);
  if (e.kind === "diaper") {
    if (p.stoolColor) parts.push(String(p.stoolColor));
    if (p.rash) parts.push("assadura");
  }
  if (e.kind === "appointment" && p.place) parts.push(String(p.place));
  if (e.note) parts.push(e.note);
  return parts.length ? parts.join(" · ") : null;
}

export function EventRow({
  event,
  onEdit,
  onDelete,
  trailing,
  className,
}: {
  event: AppEvent;
  onEdit?: () => void;
  onDelete?: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  const { readOnly } = useStore();
  const Icon = eventIcon(event.kind);
  const isFuture = toDate(event.startedAt).getTime() > Date.now();

  return (
    <div className={cn("group flex items-start gap-3 py-2.5", className)}>
      <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", eventBubbleClass(event.kind))}>
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-fg">{eventTitle(event)}</p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          <span className="tabular font-semibold text-fg-muted">{fmtTime(event.startedAt)}</span>
          {" · "}
          {isFuture ? "agendado" : timeAgo(event.startedAt)}
          {eventSubtitle(event) && <span> · {eventSubtitle(event)}</span>}
        </p>
        {event.photos.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {event.photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`Foto ${i + 1} do registro`} className="size-14 rounded-lg object-cover ring-1 ring-line" />
            ))}
          </div>
        )}
      </div>
      {trailing}
      {!readOnly && (onEdit || onDelete) && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
          {onEdit && (
            <button type="button" onClick={onEdit} aria-label="Editar" className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-muted hover:text-fg">
              <Pencil className="size-3.5" aria-hidden />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} aria-label="Excluir" className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50">
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
