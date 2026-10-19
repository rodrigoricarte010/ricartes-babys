/**
 * Lembretes locais (neste aparelho).
 *
 * Sem servidor de push: o app verifica os lembretes enquanto está aberto
 * (PWA instalado conta como aberto) e dispara Notificações do navegador.
 * As chaves "disparadas hoje" são persistidas para não repetir no reload.
 */

export interface ReminderSettings {
  /** "HH:mm" — lembrete diário de pesar/medir; null = desligado. */
  weighTime: string | null;
  /** Avisar de vacinas atrasadas ou vencendo em até 7 dias (1x/dia). */
  vaccineAlert: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  weighTime: null,
  vaccineAlert: true,
};

const KEY = "rb:reminders";
const FIRED_KEY = "rb:reminders-fired";

export function loadReminders(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_REMINDERS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_REMINDERS;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      weighTime: typeof parsed.weighTime === "string" ? parsed.weighTime : null,
      vaccineAlert: parsed.vaccineAlert !== false,
    };
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function saveReminders(settings: ReminderSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // armazenamento indisponível — lembretes simplesmente não persistem
  }
}

/** Chaves de lembretes já disparados no dia (sobrevivem a reload). */
export function loadFired(day: string): string[] {
  try {
    const raw = window.localStorage.getItem(FIRED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { day?: string; keys?: string[] };
    return parsed.day === day && Array.isArray(parsed.keys) ? parsed.keys : [];
  } catch {
    return [];
  }
}

export function markFired(day: string, key: string): void {
  try {
    const keys = [...new Set([...loadFired(day), key])];
    window.localStorage.setItem(FIRED_KEY, JSON.stringify({ day, keys }));
  } catch {
    // idem
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsAllowed(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}

export function notify(title: string, body: string): void {
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    // Alguns navegadores só permitem via service worker — falhou, seguiu.
  }
}
