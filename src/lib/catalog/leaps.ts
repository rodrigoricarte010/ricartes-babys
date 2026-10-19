import { ageInDays, addDays, toDate } from "@/lib/date";

/**
 * Saltos mentais ("The Wonder Weeks", Plooij & van de Rijt).
 *
 * Dez períodos previsíveis de reorganização perceptiva nos primeiros ~20
 * meses. Cada salto começa com uma fase "tempestuosa" (os 3 Cs: choro,
 * clingy/grudenta, cranky/irritada) e desemboca numa fase "ensolarada", quando
 * a nova habilidade aparece e o humor volta.
 *
 * Saber disso não muda o bebê — muda a expectativa dos pais: "não é regressão,
 * é construção". Por isso o tom aqui é acolhedor, nunca de diagnóstico.
 *
 * O livro conta as semanas a partir da DATA PREVISTA do parto. Quando sabemos
 * as semanas de gestação, corrigimos; senão, usamos o nascimento e avisamos.
 */

export interface Leap {
  n: number;
  /** Semana central do salto. */
  week: number;
  /** Janela "tempestuosa" (início, fim) em semanas. */
  stormyFrom: number;
  stormyTo: number;
  theme: string;
  /** O que costuma surgir depois do salto. */
  gift: string;
}

export const LEAPS: Leap[] = [
  { n: 1, week: 5, stormyFrom: 4, stormyTo: 6, theme: "Mundo das sensações", gift: "Mais alerta: percebe mudanças de luz, som e toque com nitidez nova." },
  { n: 2, week: 8, stormyFrom: 7, stormyTo: 10, theme: "Mundo dos padrões", gift: "Reconhece padrões: rostos, texturas, o próprio corpo mexendo." },
  { n: 3, week: 12, stormyFrom: 11, stormyTo: 13, theme: "Mundo das transições suaves", gift: "Movimentos ficam fluidos; acompanha objetos e sons em gradação." },
  { n: 4, week: 19, stormyFrom: 14, stormyTo: 19, theme: "Mundo dos eventos", gift: "Causa e efeito: aperta, sacode, observa o que acontece. Balbucio intencional." },
  { n: 5, week: 26, stormyFrom: 22, stormyTo: 27, theme: "Mundo das relações", gift: "Distância e permanência: entende que você existe mesmo longe. Ansiedade de separação começa." },
  { n: 6, week: 37, stormyFrom: 33, stormyTo: 38, theme: "Mundo das categorias", gift: "Agrupa: “cachorro é cachorro”, “copo é copo”. Nomear ganha sentido." },
  { n: 7, week: 46, stormyFrom: 41, stormyTo: 47, theme: "Mundo das sequências", gift: "Ordem e passos: empilha, encaixa, faz pequenas tarefas em sequência." },
  { n: 8, week: 55, stormyFrom: 50, stormyTo: 56, theme: "Mundo dos programas", gift: "Planeja: rotinas inteiras (pegar sapato = passear) e faz-de-conta simples." },
  { n: 9, week: 64, stormyFrom: 59, stormyTo: 65, theme: "Mundo dos princípios", gift: "Testa limites e regras: entende “agora não”, negocia, imita papéis." },
  { n: 10, week: 75, stormyFrom: 70, stormyTo: 77, theme: "Mundo dos sistemas", gift: "Sistemas conectados: família, certo/errado, o próprio lugar no mundo." },
];

export type LeapPhase = "tempestuosa" | "ensolarada" | "calmaria";

export interface LeapStatus {
  /** Semanas de vida (da data prevista, quando conhecida). */
  weekNow: number;
  phase: LeapPhase;
  current: Leap | null;
  next: Leap | null;
  /** Data prevista do fim da fase atual (se tempestuosa). */
  phaseEndsAt: Date | null;
  nextStartsAt: Date | null;
  /** Verdadeiro se a semana é contada da data prevista. */
  fromDueDate: boolean;
}

/**
 * Converte idade em "semanas de salto".
 * Prematuros e termos tardios: o livro ancora na data prevista (40 semanas),
 * então somamos a diferença quando conhecemos a gestação.
 */
export function leapWeeks(birthDate: string, gestationalWeeks: number | null, on: Date = new Date()): {
  weeks: number;
  fromDueDate: boolean;
} {
  const days = ageInDays(birthDate, on);
  if (gestationalWeeks != null && gestationalWeeks > 0 && gestationalWeeks < 42) {
    const offsetDays = Math.max(0, Math.round((40 - gestationalWeeks) * 7));
    return { weeks: (days + offsetDays) / 7, fromDueDate: true };
  }
  return { weeks: days / 7, fromDueDate: false };
}

export function leapStatus(
  birthDate: string,
  gestationalWeeks: number | null,
  on: Date = new Date(),
): LeapStatus {
  const { weeks, fromDueDate } = leapWeeks(birthDate, gestationalWeeks, on);
  const birth = toDate(birthDate);

  const dateAtWeek = (w: number) => {
    const offsetDays = fromDueDate && gestationalWeeks != null ? Math.max(0, Math.round((40 - gestationalWeeks) * 7)) : 0;
    return addDays(birth, Math.round(w * 7) - offsetDays);
  };

  const current = LEAPS.find((l) => weeks >= l.stormyFrom && weeks <= l.stormyTo) ?? null;

  if (current) {
    return {
      weekNow: weeks,
      phase: "tempestuosa",
      current,
      next: LEAPS.find((l) => l.n === current.n + 1) ?? null,
      phaseEndsAt: dateAtWeek(current.stormyTo),
      nextStartsAt: null,
      fromDueDate,
    };
  }

  // Fase "ensolarada": logo após o fim da tempestade de um salto.
  const justPassed = [...LEAPS].reverse().find((l) => weeks > l.stormyTo && weeks <= l.stormyTo + 3);
  if (justPassed) {
    return {
      weekNow: weeks,
      phase: "ensolarada",
      current: justPassed,
      next: LEAPS.find((l) => l.n === justPassed.n + 1) ?? null,
      phaseEndsAt: dateAtWeek(justPassed.stormyTo + 3),
      nextStartsAt: justPassed.n < LEAPS.length ? dateAtWeek(LEAPS[justPassed.n].stormyFrom) : null,
      fromDueDate,
    };
  }

  const next = LEAPS.find((l) => l.stormyFrom > weeks) ?? null;
  return {
    weekNow: weeks,
    phase: "calmaria",
    current: null,
    next,
    phaseEndsAt: null,
    nextStartsAt: next ? dateAtWeek(next.stormyFrom) : null,
    fromDueDate,
  };
}
