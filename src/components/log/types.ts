export type LogKind =
  | "feeding"
  | "sleep"
  | "diaper"
  | "medicine"
  | "symptom"
  | "measurement"
  | "appointment"
  | "note";

export const LOG_META: Record<
  LogKind,
  { label: string; icon: string; color: string; description: string }
> = {
  feeding: {
    label: "Alimentação",
    icon: "milk",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    description: "Peito, mamadeira ou papinha",
  },
  sleep: {
    label: "Sono",
    icon: "moon",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    description: "Soneca ou noite",
  },
  diaper: {
    label: "Fralda",
    icon: "droplets",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    description: "Xixi, cocô ou os dois",
  },
  measurement: {
    label: "Medida",
    icon: "ruler",
    color: "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300",
    description: "Peso, estatura e perímetro cefálico",
  },
  medicine: {
    label: "Remédio",
    icon: "pill",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    description: "Dose administrada",
  },
  symptom: {
    label: "Sintoma",
    icon: "thermometer",
    color: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    description: "Febre, cólica, narizinho…",
  },
  appointment: {
    label: "Consulta",
    icon: "calendar",
    color: "bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300",
    description: "Puericultura e especialistas",
  },
  note: {
    label: "Nota",
    icon: "sticky-note",
    color: "bg-bg-muted text-fg-muted",
    description: "Anotação livre com fotos",
  },
};

/** Cores da linha do tempo por tipo de evento. */
export const KIND_TONE: Record<string, "brand" | "sage" | "warning" | "info" | "danger" | "neutral"> = {
  feeding: "warning",
  sleep: "info",
  diaper: "info",
  medicine: "brand",
  symptom: "danger",
  milestone: "sage",
  vaccine: "sage",
  appointment: "brand",
  note: "neutral",
};

/** Nem todo evento tem formulário próprio (marco e vacina são marcados in loco). */
export function isLogKind(kind: string): kind is LogKind {
  return kind in LOG_META;
}
