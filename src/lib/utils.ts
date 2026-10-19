import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes Tailwind sem conflitos de especificidade. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata um número com no máximo `max` casas, sem zeros à direita. */
export function num(value: number, max = 2, min = 0): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/** Arredonda mantendo precisão suficiente para exibição. */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Cor por criança, estável a partir do id (para avatar, gráfico, agenda). */
const KID_COLORS = ["rose", "sky", "amber", "violet", "sage", "coral"] as const;
export type KidColor = (typeof KID_COLORS)[number];

export const KID_COLOR_HEX: Record<KidColor, string> = {
  rose: "#f04478",
  sky: "#3b8fd4",
  amber: "#e39a24",
  violet: "#8b6bd9",
  sage: "#568f53",
  coral: "#ef7353",
};

export function pickKidColor(seed: string): KidColor {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return KID_COLORS[h % KID_COLORS.length];
}

export function kidColorHex(color?: string | null, seed = ""): string {
  if (color && color in KID_COLOR_HEX) return KID_COLOR_HEX[color as KidColor];
  return KID_COLOR_HEX[pickKidColor(seed)];
}

/** Iniciais para o avatar (até 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Ordena uma lista por uma chave derivada, sem mutar o original. */
export function sortBy<T>(items: readonly T[], key: (item: T) => number | string) {
  return [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });
}

export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K) {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = out.get(k);
    if (list) list.push(item);
    else out.set(k, [item]);
  }
  return out;
}

export function sum(values: readonly number[]): number {
  return values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/** Única fonte de verdade para "agora" em código que roda no cliente. */
export function nowIso(): string {
  return new Date().toISOString();
}
