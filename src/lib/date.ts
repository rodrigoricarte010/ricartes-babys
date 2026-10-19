import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Datas e idades.
 *
 * Regra da casa: tudo que envolve idade usa UTC à meia-noite, para que o
 * horário de verão (ou viajar entre fusos) nunca desloque o aniversário da
 * criança em um dia.
 */

export const MS_DAY = 86_400_000;

/** Meia-noite UTC de uma data local. */
function utcMidnight(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toDate(value: string | Date | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  // "2026-07-31" precisa ser tratado como data local, não UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
}

/** Dias inteiros entre o nascimento e a data de referência. */
export function ageInDays(birth: string | Date, on: string | Date = new Date()): number {
  return Math.max(0, Math.floor((utcMidnight(toDate(on)) - utcMidnight(toDate(birth))) / MS_DAY));
}

export interface AgeParts {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
}

/** Idade quebrada em anos/meses/dias, do jeito que se fala no consultório. */
export function ageParts(birth: string | Date, on: string | Date = new Date()): AgeParts {
  const b = toDate(birth);
  const o = toDate(on);
  let years = o.getFullYear() - b.getFullYear();
  let months = o.getMonth() - b.getMonth();
  let days = o.getDate() - b.getDate();

  if (days < 0) {
    months -= 1;
    // Dias do mês anterior ao mês de referência.
    days += new Date(o.getFullYear(), o.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  const totalDays = ageInDays(b, o);
  return {
    years,
    months,
    days,
    totalDays,
    totalMonths: years * 12 + months + (days >= 15 ? 0.5 : 0),
  };
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "2 meses e 19 dias", "1 ano e 3 meses", "3 anos". */
export function formatAge(birth: string | Date, on: string | Date = new Date()): string {
  const { years, months, days } = ageParts(birth, on);
  if (years === 0 && months === 0) return days <= 1 ? "recém-nascida" : plural(days, "dia", "dias");
  if (years === 0) {
    return days > 0 && months < 12
      ? `${plural(months, "mês", "meses")} e ${plural(days, "dia", "dias")}`
      : plural(months, "mês", "meses");
  }
  if (months === 0) return plural(years, "ano", "anos");
  return `${plural(years, "ano", "anos")} e ${plural(months, "mês", "meses")}`;
}

/** Versão curta para cards: "2m 19d" · "1a 3m" · "12d". */
export function shortAge(birth: string | Date, on: string | Date = new Date()): string {
  const { years, months, days } = ageParts(birth, on);
  if (years === 0 && months === 0) return `${days}d`;
  if (years === 0) return days > 0 ? `${months}m ${days}d` : `${months}m`;
  return months > 0 ? `${years}a ${months}m` : `${years}a`;
}

/**
 * Idade corrigida para prematuros.
 * Só corrige nascimentos antes de 37 semanas; a OMS constrói as curvas com
 * bebês a termo, então aplicar sem correção exagera qualquer déficit.
 * Vacinas seguem a idade cronológica — nunca use isto para o calendário vacinal.
 */
export function correctedAgeInDays(
  birth: string | Date,
  gestationalWeeks: number | null | undefined,
  on: string | Date = new Date(),
): number {
  const chrono = ageInDays(birth, on);
  if (gestationalWeeks == null || gestationalWeeks >= 37) return chrono;
  return Math.max(0, chrono - Math.round((40 - gestationalWeeks) * 7));
}

export function isPreterm(gestationalWeeks: number | null | undefined): boolean {
  return gestationalWeeks != null && gestationalWeeks < 37;
}

// ── Formatação pt-BR ────────────────────────────────────────────

export const fmtDate = (d: string | Date) => format(toDate(d), "d 'de' MMM 'de' yyyy", { locale: ptBR });
export const fmtDateShort = (d: string | Date) => format(toDate(d), "dd/MM/yyyy", { locale: ptBR });
export const fmtDateMedium = (d: string | Date) => format(toDate(d), "d MMM yyyy", { locale: ptBR });
export const fmtTime = (d: string | Date) => format(toDate(d), "HH:mm", { locale: ptBR });
export const fmtDateTime = (d: string | Date) => format(toDate(d), "d MMM, HH:mm", { locale: ptBR });
export const fmtWeekday = (d: string | Date) => format(toDate(d), "EEEE", { locale: ptBR });
export const fmtWeekdayShort = (d: string | Date) => format(toDate(d), "EEE", { locale: ptBR });
export const fmtMonthYear = (d: string | Date) => format(toDate(d), "MMMM 'de' yyyy", { locale: ptBR });

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return differenceInCalendarDays(toDate(a), toDate(b)) === 0;
}

export function isToday(d: string | Date): boolean {
  return isSameDay(d, new Date());
}

export function isFuture(d: string | Date): boolean {
  return toDate(d).getTime() > Date.now();
}

export function startOfDay(d: string | Date = new Date()): Date {
  const x = toDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export function endOfDay(d: string | Date = new Date()): Date {
  const x = toDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999);
}

export function addDays(d: string | Date, n: number): Date {
  const x = toDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n, x.getHours(), x.getMinutes());
}

export function addMonths(d: string | Date, n: number): Date {
  const x = toDate(d);
  const day = x.getDate();
  const target = new Date(x.getFullYear(), x.getMonth() + n, 1, x.getHours(), x.getMinutes());
  // Evita 31/jan + 1 mês virar 3/mar.
  target.setDate(Math.min(day, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return target;
}

/** Chave estável "yyyy-MM-dd" no fuso local — usada para agrupar por dia. */
export function dayKey(d: string | Date): string {
  const x = toDate(d);
  const m = `${x.getMonth() + 1}`.padStart(2, "0");
  const day = `${x.getDate()}`.padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

/** "há 12 min", "há 2 h", "ontem", "há 3 dias". */
export function timeAgo(d: string | Date, on: Date = new Date()): string {
  const diff = on.getTime() - toDate(d).getTime();
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "atrás" : "à frente";
  const min = Math.round(abs / 60_000);
  if (min < 1) return diff >= 0 ? "agora" : "em instantes";
  if (min < 60) return `${plural(min, "min", "min")} ${suffix}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${plural(h, "hora", "horas")} ${suffix}`;
  const days = Math.floor(h / 24);
  if (days === 1) return diff >= 0 ? "ontem" : "amanhã";
  if (days < 30) return `${plural(days, "dia", "dias")} ${suffix}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${plural(months, "mês", "meses")} ${suffix}`;
  return `${plural(Math.floor(months / 12), "ano", "anos")} ${suffix}`;
}

/** Duração legível a partir de minutos: "1 h 23 min". */
export function durationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
}

/** mm:ss para cronômetros. */
export function stopwatchLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// ── Valores para <input> ────────────────────────────────────────

export function toInputDate(d: string | Date = new Date()): string {
  const x = toDate(d);
  return `${x.getFullYear()}-${`${x.getMonth() + 1}`.padStart(2, "0")}-${`${x.getDate()}`.padStart(2, "0")}`;
}

export function toInputDateTime(d: string | Date = new Date()): string {
  const x = toDate(d);
  return `${toInputDate(x)}T${`${x.getHours()}`.padStart(2, "0")}:${`${x.getMinutes()}`.padStart(2, "0")}`;
}

export function toInputTime(d: string | Date = new Date()): string {
  const x = toDate(d);
  return `${`${x.getHours()}`.padStart(2, "0")}:${`${x.getMinutes()}`.padStart(2, "0")}`;
}

/** Últimos N dias (inclusive hoje), do mais antigo para o mais recente. */
export function lastNDays(n: number, on: Date = new Date()): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(startOfDay(addDays(on, -i)));
  return out;
}

/** Semana corrente, começando no domingo. */
export function weekDays(on: Date = new Date()): Date[] {
  const s = startOfDay(on);
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) out.push(addDays(s, i - s.getDay()));
  return out;
}

/**
 * Idade em meses decimais a partir do nascimento — é o eixo X das curvas
 * de crescimento (a OMS indexa por dias, então convertemos por 30.4375).
 */
export function ageInMonths(birth: string | Date, on: string | Date = new Date()): number {
  return ageInDays(birth, on) / 30.4375;
}

export function daysToMonths(days: number): number {
  return days / 30.4375;
}

export function monthsToDays(months: number): number {
  return Math.round(months * 30.4375);
}
