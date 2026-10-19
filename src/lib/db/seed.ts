import type { AppEvent, Child, DiaryEntry, Measurement } from "@/lib/types";
import { ALL_MILESTONES } from "@/lib/catalog/milestones";
import { DOSES } from "@/lib/catalog/vaccines";
import { dayKey, startOfDay } from "@/lib/date";

/**
 * Família de demonstração.
 *
 * Existe por dois motivos: (1) o app precisa abrir com conteúdo real para que
 * se entenda o valor dele em dez segundos, e (2) mostra a Rosie Grace já
 * cadastrada com a data de nascimento correta. Nada aqui é obrigatório — em
 * Configurações dá para apagar tudo e começar do zero.
 *
 * Os valores de crescimento seguem a trajetória de uma menina saudável perto
 * da mediana da OMS, com a perda fisiológica de peso na primeira semana.
 */

// ── Gerador pseudoaleatório determinístico ──────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260731);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.round(between(min, max));

/** Nascimento: 31 de julho de 2026, às 07h42. */
export const ROSIE_BIRTH_DATE = "2026-07-31";
export const ROSIE_BIRTH_TIME = "07:42";
export const ROSIE_GESTATIONAL_WEEKS = 39;

export const DEMO_CHILD_ID = "rosie-grace";

export function buildDemoChild(): Child {
  return {
    id: DEMO_CHILD_ID,
    firstName: "Rosie",
    middleName: "Grace",
    lastName: "Ricartes",
    nickname: "Rosie",
    sex: "female",
    birthDate: ROSIE_BIRTH_DATE,
    birthTime: ROSIE_BIRTH_TIME,
    birthWeightKg: 3.28,
    birthLengthCm: 49.5,
    birthHeadCm: 34.2,
    gestationalWeeks: ROSIE_GESTATIONAL_WEEKS,
    bloodType: "O+",
    color: "rose",
    photoDataUrl: null,
    notes:
      "Parto normal, 39 semanas. Apgar 9 e 10. Teste do pezinho e da orelhinha normais.",
    archived: false,
    createdAt: `${ROSIE_BIRTH_DATE}T10:00:00.000Z`,
    updatedAt: `${ROSIE_BIRTH_DATE}T10:00:00.000Z`,
  };
}

/**
 * Curva de crescimento de exemplo. Idade em dias → [peso kg, estatura cm, PC cm].
 * Alinhada à mediana da OMS para meninas, com variação natural.
 */
const GROWTH_TRACK: Array<{ ageDays: number; weightKg: number; lengthCm: number; headCm: number; source: Measurement["source"]; note?: string }> = [
  { ageDays: 0, weightKg: 3.28, lengthCm: 49.5, headCm: 34.2, source: "nascimento", note: "Maternidade" },
  { ageDays: 5, weightKg: 3.15, lengthCm: 49.8, headCm: 34.4, source: "consulta", note: "Perda fisiológica de peso, dentro do esperado" },
  { ageDays: 14, weightKg: 3.68, lengthCm: 51.2, headCm: 35.4, source: "casa" },
  { ageDays: 30, weightKg: 4.19, lengthCm: 53.4, headCm: 36.9, source: "consulta", note: "Puericultura de 1 mês" },
  { ageDays: 46, weightKg: 4.72, lengthCm: 55.1, headCm: 37.8, source: "casa" },
  { ageDays: 61, weightKg: 5.08, lengthCm: 56.4, headCm: 38.5, source: "consulta", note: "Puericultura de 2 meses" },
  { ageDays: 74, weightKg: 5.41, lengthCm: 57.6, headCm: 39.0, source: "casa" },
];

function atAgeDays(ageDays: number, hour = 9, minute = 30): Date {
  const birth = new Date(2026, 6, 31, hour, minute);
  return new Date(birth.getTime() + ageDays * 86_400_000);
}

export function buildDemoMeasurements(now: Date): Measurement[] {
  const list: Measurement[] = GROWTH_TRACK.filter((g) => atAgeDays(g.ageDays) <= now).map((g, i) => {
    const when = atAgeDays(g.ageDays, g.source === "consulta" ? 10 : 8, g.source === "casa" ? 20 : 30);
    return {
      id: `seed-m-${i}`,
      childId: DEMO_CHILD_ID,
      takenAt: when.toISOString(),
      weightKg: g.weightKg,
      lengthCm: g.lengthCm,
      headCm: g.headCm,
      source: g.source,
      note: g.note ?? null,
      createdAt: when.toISOString(),
      updatedAt: when.toISOString(),
    };
  });

  // Medida de hoje, feita em casa — é o que dá vida ao gráfico na primeira visita.
  const todayAge = Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(new Date(2026, 6, 31)).getTime()) / 86_400_000));
  if (todayAge > 0) {
    const last = GROWTH_TRACK[GROWTH_TRACK.length - 1];
    const extraDays = todayAge - last.ageDays;
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45);
    list.push({
      id: "seed-m-hoje",
      childId: DEMO_CHILD_ID,
      takenAt: when.toISOString(),
      // Ganho típico: ~25 g/dia no 2º mês.
      weightKg: Math.round((last.weightKg + (extraDays * 0.025)) * 100) / 100,
      lengthCm: Math.round((last.lengthCm + extraDays * 0.09) * 10) / 10,
      headCm: Math.round((last.headCm + extraDays * 0.04) * 10) / 10,
      source: "casa",
      note: null,
      createdAt: when.toISOString(),
      updatedAt: when.toISOString(),
    });
  }

  return list;
}

function milestoneKey(fragment: string): string | null {
  const hit = ALL_MILESTONES.find((mi) => mi.text.toLowerCase().includes(fragment.toLowerCase()));
  return hit ? hit.key : null;
}

/** Marcos já conquistados pela Rosie (ela tem ~2 meses e 3 semanas). */
const ACHIEVED_MILESTONES: Array<{ fragment: string; ageDays: number; note?: string }> = [
  { fragment: "Acompanha objetos com os olhos de perto", ageDays: 38 },
  { fragment: "Reconhece pessoas à distância", ageDays: 44 },
  { fragment: "Emite sons de arrulho e gorgolejo", ageDays: 49, note: "Principalmente de manhã, depois da mamada" },
  { fragment: "Abre e fecha as mãos", ageDays: 52 },
  { fragment: "Sorri para as pessoas", ageDays: 56, note: "Primeiro sorriso social! Filmado pela vovó." },
  { fragment: "Chora de formas diferentes para pedidos diferentes", ageDays: 61 },
  { fragment: "Segura um objeto por alguns segundos", ageDays: 66 },
  { fragment: "Sustenta a cabeça ao ficar de bruços", ageDays: 74, note: "Uns 20 segundos, ainda oscila" },
  { fragment: "Faz movimentos mais suaves com braços e pernas", ageDays: 78 },
];

/** Vacinas já aplicadas — tudo que o PNI prevê até os 2 meses. */
const APPLIED_VACCINES = [
  { id: "bcg-nasc", ageDays: 0, place: "Maternidade", lot: "BCG-2211" },
  { id: "hepb-nasc", ageDays: 0, place: "Maternidade", lot: "HB-8842" },
  { id: "penta-1", ageDays: 61, place: "UBS Messejana", lot: "PNT-4501" },
  { id: "vip-1", ageDays: 61, place: "UBS Messejana", lot: "VIP-7712" },
  { id: "pneumo10-1", ageDays: 61, place: "UBS Messejana", lot: "PNC-3390" },
  { id: "rota-1", ageDays: 61, place: "UBS Messejana", lot: "ROT-1188" },
];

/** Eventos de rotina: quantos dias para trás geramos. */
const ROUTINE_DAYS = 5;

export function buildDemoEvents(now: Date): AppEvent[] {
  const events: AppEvent[] = [];
  const today = startOfDay(now);

  // Marcos e vacinas
  for (const [i, ms] of ACHIEVED_MILESTONES.entries()) {
    const when = atAgeDays(ms.ageDays, 16, 0);
    if (when > now) continue;
    const key = milestoneKey(ms.fragment);
    if (!key) continue;
    const milestone = ALL_MILESTONES.find((x) => x.key === key)!;
    events.push({
      id: `seed-ms-${i}`,
      childId: DEMO_CHILD_ID,
      kind: "milestone",
      startedAt: when.toISOString(),
      endedAt: null,
      durationMin: null,
      payload: { key, category: milestone.category },
      note: ms.note ?? null,
      photos: [],
      createdAt: when.toISOString(),
      updatedAt: when.toISOString(),
      deletedAt: null,
    });
  }

  for (const [i, v] of APPLIED_VACCINES.entries()) {
    const dose = DOSES.find((d) => d.id === v.id);
    if (!dose) continue;
    const when = atAgeDays(v.ageDays, 9, 15);
    if (when > now) continue;
    events.push({
      id: `seed-vac-${i}`,
      childId: DEMO_CHILD_ID,
      kind: "vaccine",
      startedAt: when.toISOString(),
      endedAt: null,
      durationMin: null,
      payload: { key: dose.vaccineKey, dose: dose.dose, place: v.place, lot: v.lot },
      note: null,
      photos: [],
      createdAt: when.toISOString(),
      updatedAt: when.toISOString(),
      deletedAt: null,
    });
  }

  // Consulta de puericultura marcada para os 3 meses
  const nextCheckup = atAgeDays(92, 10, 0);
  if (nextCheckup > now) {
    events.push({
      id: "seed-apt-1",
      childId: DEMO_CHILD_ID,
      kind: "appointment",
      startedAt: nextCheckup.toISOString(),
      endedAt: null,
      durationMin: null,
      payload: {
        title: "Puericultura — 3 meses",
        doctor: "Dra. Camila Bezerra",
        place: "UBS Messejana",
        done: false,
      },
      note: "Levar a caderneta de vacinação. Peso, estatura e perímetro cefálico.",
      photos: [],
      createdAt: new Date(now.getTime() - 86_400_000).toISOString(),
      updatedAt: new Date(now.getTime() - 86_400_000).toISOString(),
      deletedAt: null,
    });
  }

  // Rotina dos últimos dias
  let counter = 0;
  for (let back = ROUTINE_DAYS - 1; back >= 0; back--) {
    const day = new Date(today.getTime() - back * 86_400_000);
    const isToday = back === 0;
    const dayEnd = isToday ? now : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59);

    // Mamadas: 8 por dia, a cada ~3 horas a partir das 05h30.
    const feedCount = intBetween(7, 9);
    const firstFeed = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 5, intBetween(0, 50));
    for (let f = 0; f < feedCount; f++) {
      const gapMin = intBetween(150, 200);
      const started = new Date(firstFeed.getTime() + f * gapMin * 60_000);
      if (started > dayEnd) break;
      const duration = intBetween(11, 26);
      const ended = new Date(started.getTime() + duration * 60_000);
      const method = rand() < 0.82 ? "breast" : "bottle";
      events.push({
        id: `seed-feed-${counter++}`,
        childId: DEMO_CHILD_ID,
        kind: "feeding",
        startedAt: started.toISOString(),
        endedAt: ended.toISOString(),
        durationMin: duration,
        payload:
          method === "breast"
            ? { method, side: pick(["left", "right", "both"] as const) }
            : { method, amountMl: intBetween(85, 130) },
        note: null,
        photos: [],
        createdAt: started.toISOString(),
        updatedAt: started.toISOString(),
        deletedAt: null,
      });

      // Fralda logo depois de boa parte das mamadas
      if (rand() < 0.85) {
        const changed = new Date(ended.getTime() + intBetween(2, 15) * 60_000);
        if (changed <= dayEnd) {
          events.push({
            id: `seed-diaper-${counter++}`,
            childId: DEMO_CHILD_ID,
            kind: "diaper",
            startedAt: changed.toISOString(),
            endedAt: null,
            durationMin: null,
            payload: { type: pick(["wet", "wet", "both", "dirty"] as const) },
            note: null,
            photos: [],
            createdAt: changed.toISOString(),
            updatedAt: changed.toISOString(),
            deletedAt: null,
          });
        }
      }

      // Soneca entre mamadas
      if (f < feedCount - 1 && rand() < 0.55) {
        const napStart = new Date(ended.getTime() + intBetween(10, 30) * 60_000);
        const napMin = intBetween(28, 95);
        const napEnd = new Date(napStart.getTime() + napMin * 60_000);
        if (napEnd <= dayEnd) {
          events.push({
            id: `seed-nap-${counter++}`,
            childId: DEMO_CHILD_ID,
            kind: "sleep",
            startedAt: napStart.toISOString(),
            endedAt: napEnd.toISOString(),
            durationMin: napMin,
            payload: { type: "nap", quality: intBetween(3, 5) },
            note: null,
            photos: [],
            createdAt: napStart.toISOString(),
            updatedAt: napStart.toISOString(),
            deletedAt: null,
          });
        }
      }
    }

    // Sono noturno do dia anterior (21h → 06h)
    const nightStart = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, 21, intBetween(0, 40));
    const nightEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, intBetween(0, 40));
    if (nightEnd <= dayEnd && !isToday) {
      const nightMin = Math.round((nightEnd.getTime() - nightStart.getTime()) / 60_000);
      events.push({
        id: `seed-night-${dayKey(nightStart)}`,
        childId: DEMO_CHILD_ID,
        kind: "sleep",
        startedAt: nightStart.toISOString(),
        endedAt: nightEnd.toISOString(),
        durationMin: nightMin,
        payload: { type: "night", quality: intBetween(3, 5) },
        note: null,
        photos: [],
        createdAt: nightStart.toISOString(),
        updatedAt: nightStart.toISOString(),
        deletedAt: null,
      });
    }
  }

  return events.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

const DIARY_ENTRIES: Array<{ ageDays: number; title: string; text: string; mood: DiaryEntry["mood"] }> = [
  {
    ageDays: 0,
    title: "O dia em que tudo começou",
    text: "Rosie Grace chegou às 07h42, com 3,280 kg e 49,5 cm. Foi um parto normal, tranquilo, e ela chorou forte na hora. Ficou no meu peito antes de qualquer exame. A família inteira está boba.",
    mood: "otimo",
  },
  {
    ageDays: 56,
    title: "O primeiro sorriso",
    text: "Hoje ela sorriu de propósito para mim. Não foi reflexo, não foi gases — foi um sorriso olhando nos meus olhos. Chorei mais do que no dia do parto. Anotando aqui para nunca esquecer.",
    mood: "otimo",
  },
  {
    ageDays: 68,
    title: "Semana difícil de sono",
    text: "Uns dias com cólica no fim da tarde, aquele choro das 18h que ninguém explica. Descobrimos que a posição de bruços no meu colo, com a mãozinha no peito, acalma em minutos. Estamos dormindo em blocos menores, mas ela está ganhando peso bem.",
    mood: "dificil",
  },
];

export function buildDemoDiary(now: Date): DiaryEntry[] {
  const out: DiaryEntry[] = [];
  DIARY_ENTRIES.forEach((entry, i) => {
    const when = atAgeDays(entry.ageDays, 20, 0);
    if (when > now) return;
    const date = `${when.getFullYear()}-${`${when.getMonth() + 1}`.padStart(2, "0")}-${`${when.getDate()}`.padStart(2, "0")}`;
    out.push({
      id: `seed-diary-${i}`,
      childId: DEMO_CHILD_ID,
      date,
      title: entry.title,
      text: entry.text,
      mood: entry.mood,
      photos: [],
      createdAt: when.toISOString(),
      updatedAt: when.toISOString(),
      deletedAt: null,
    });
  });
  return out;
}
