/**
 * Calendário vacinal de referência para o Brasil.
 *
 * Base: Calendário Nacional de Vacinação da Criança (PNI / Ministério da
 * Saúde) + recomendações da Sociedade Brasileira de Imunizações (SBIm).
 *
 * AVISO: os calendários mudam (em 2024, por exemplo, o reforço de pólio
 * passou de oral para injetável). Este arquivo é um ponto de partida para
 * organizar a carteira — a fonte oficial continua sendo a caderneta da
 * criança e o pediatra. Todo item é editável e aceita anotação livre.
 */

export type VaccineProgram = "pni" | "sbim";

export interface VaccineDose {
  /** Chave estável — sobrevive a mudanças de texto. */
  id: string;
  /** Agrupa as doses da mesma vacina. */
  vaccineKey: string;
  dose: string;
  /** Idade recomendada em meses (fracionária aceita). */
  ageMonths: number;
  program: VaccineProgram;
  /** Fora do calendário público — só aparece se a família ativar SBIm. */
  optional: boolean;
  protects: string;
  note?: string;
}

export interface VaccineInfo {
  key: string;
  name: string;
  short: string;
  diseases: string[];
}

export const VACCINES: VaccineInfo[] = [
  {
    key: "bcg",
    name: "BCG",
    short: "BCG",
    diseases: ["Tuberculose (formas graves)"],
  },
  {
    key: "hepb",
    name: "Hepatite B",
    short: "Hep B",
    diseases: ["Hepatite B"],
  },
  {
    key: "penta",
    name: "Pentavalente (DTP + Hib + Hepatite B)",
    short: "Penta",
    diseases: ["Difteria", "Tétano", "Coqueluche", "Haemophilus influenzae b", "Hepatite B"],
  },
  {
    key: "vip",
    name: "Poliomielite inativada (VIP)",
    short: "Pólio (VIP)",
    diseases: ["Poliomielite (paralisia infantil)"],
  },
  {
    key: "pneumo10",
    name: "Pneumocócica 10-valente conjugada",
    short: "Pneumo 10V",
    diseases: ["Pneumonia", "Meningite", "Otite", "Sinusite"],
  },
  {
    key: "rota",
    name: "Rotavírus humano (VORH)",
    short: "Rotavírus",
    diseases: ["Diarreia grave por rotavírus"],
  },
  {
    key: "meningoc",
    name: "Meningocócica C conjugada",
    short: "Meningo C",
    diseases: ["Meningite meningocócica C"],
  },
  {
    key: "meningoc-acwy",
    name: "Meningocócica ACWY conjugada",
    short: "Meningo ACWY",
    diseases: ["Meningite meningocócica A, C, W e Y"],
  },
  {
    key: "influenza",
    name: "Influenza (gripe)",
    short: "Gripe",
    diseases: ["Influenza sazonal"],
  },
  {
    key: "febre-amarela",
    name: "Febre amarela",
    short: "Febre amarela",
    diseases: ["Febre amarela"],
  },
  {
    key: "hepa",
    name: "Hepatite A",
    short: "Hep A",
    diseases: ["Hepatite A"],
  },
  {
    key: "triviral",
    name: "Tríplice viral (sarampo, caxumba, rubéola)",
    short: "SCR",
    diseases: ["Sarampo", "Caxumba", "Rubéola"],
  },
  {
    key: "varicela",
    name: "Varicela (catapora)",
    short: "Varicela",
    diseases: ["Varicela"],
  },
  {
    key: "dtp",
    name: "Tríplice bacteriana (DTP) — reforço",
    short: "DTP",
    diseases: ["Difteria", "Tétano", "Coqueluche"],
  },
  {
    key: "hpv",
    name: "HPV quadrivalente",
    short: "HPV",
    diseases: ["HPV (câncer de colo do útero, verrugas genitais)"],
  },
  {
    key: "dengue",
    name: "Dengue (atenuada tetravalente)",
    short: "Dengue",
    diseases: ["Dengue"],
  },
];

export const VACCINE_BY_KEY = new Map(VACCINES.map((v) => [v.key, v]));

export const DOSES: VaccineDose[] = [
  // ── Ao nascer ────────────────────────────────────────────────
  {
    id: "bcg-nasc",
    vaccineKey: "bcg",
    dose: "Dose única",
    ageMonths: 0,
    program: "pni",
    optional: false,
    protects: "Tuberculose (formas graves)",
    note: "O quanto antes, de preferência ainda na maternidade.",
  },
  {
    id: "hepb-nasc",
    vaccineKey: "hepb",
    dose: "Dose ao nascer",
    ageMonths: 0,
    program: "pni",
    optional: false,
    protects: "Hepatite B",
    note: "Nas primeiras 12–24 horas de vida.",
  },

  // ── 2 meses ──────────────────────────────────────────────────
  {
    id: "penta-1",
    vaccineKey: "penta",
    dose: "1ª dose",
    ageMonths: 2,
    program: "pni",
    optional: false,
    protects: "Difteria, tétano, coqueluche, Hib, hepatite B",
  },
  {
    id: "vip-1",
    vaccineKey: "vip",
    dose: "1ª dose",
    ageMonths: 2,
    program: "pni",
    optional: false,
    protects: "Poliomielite",
  },
  {
    id: "pneumo10-1",
    vaccineKey: "pneumo10",
    dose: "1ª dose",
    ageMonths: 2,
    program: "pni",
    optional: false,
    protects: "Pneumonia, meningite, otite",
  },
  {
    id: "rota-1",
    vaccineKey: "rota",
    dose: "1ª dose",
    ageMonths: 2,
    program: "pni",
    optional: false,
    protects: "Diarreia grave por rotavírus",
    note: "Janela rígida: entre 1 mês e 15 dias e 3 meses e 15 dias.",
  },

  // ── 3 meses ──────────────────────────────────────────────────
  {
    id: "meningoc-1",
    vaccineKey: "meningoc",
    dose: "1ª dose",
    ageMonths: 3,
    program: "pni",
    optional: false,
    protects: "Meningite meningocócica C",
  },
  {
    id: "meningoc-acwy-1",
    vaccineKey: "meningoc-acwy",
    dose: "1ª dose (alternativa à Meningo C)",
    ageMonths: 3,
    program: "sbim",
    optional: true,
    protects: "Meningite meningocócica A, C, W e Y",
    note: "Rede privada. Substitui a Meningocócica C quando disponível.",
  },

  // ── 4 meses ──────────────────────────────────────────────────
  {
    id: "penta-2",
    vaccineKey: "penta",
    dose: "2ª dose",
    ageMonths: 4,
    program: "pni",
    optional: false,
    protects: "Difteria, tétano, coqueluche, Hib, hepatite B",
  },
  {
    id: "vip-2",
    vaccineKey: "vip",
    dose: "2ª dose",
    ageMonths: 4,
    program: "pni",
    optional: false,
    protects: "Poliomielite",
  },
  {
    id: "pneumo10-2",
    vaccineKey: "pneumo10",
    dose: "2ª dose",
    ageMonths: 4,
    program: "pni",
    optional: false,
    protects: "Pneumonia, meningite, otite",
  },
  {
    id: "rota-2",
    vaccineKey: "rota",
    dose: "2ª dose",
    ageMonths: 4,
    program: "pni",
    optional: false,
    protects: "Diarreia grave por rotavírus",
    note: "Limite: 7 meses e 29 dias.",
  },

  // ── 5 meses ──────────────────────────────────────────────────
  {
    id: "meningoc-2",
    vaccineKey: "meningoc",
    dose: "2ª dose",
    ageMonths: 5,
    program: "pni",
    optional: false,
    protects: "Meningite meningocócica C",
  },

  // ── 6 meses ──────────────────────────────────────────────────
  {
    id: "penta-3",
    vaccineKey: "penta",
    dose: "3ª dose",
    ageMonths: 6,
    program: "pni",
    optional: false,
    protects: "Difteria, tétano, coqueluche, Hib, hepatite B",
  },
  {
    id: "vip-3",
    vaccineKey: "vip",
    dose: "3ª dose",
    ageMonths: 6,
    program: "pni",
    optional: false,
    protects: "Poliomielite",
  },
  {
    id: "influenza-1",
    vaccineKey: "influenza",
    dose: "1ª dose (início)",
    ageMonths: 6,
    program: "pni",
    optional: false,
    protects: "Influenza sazonal",
    note: "Duas doses no primeiro ano, com intervalo de 30 dias. Depois, anual.",
  },
  {
    id: "influenza-2",
    vaccineKey: "influenza",
    dose: "2ª dose (início)",
    ageMonths: 7,
    program: "pni",
    optional: false,
    protects: "Influenza sazonal",
  },
  {
    id: "rota-3",
    vaccineKey: "rota",
    dose: "3ª dose (pentavalente)",
    ageMonths: 6,
    program: "sbim",
    optional: true,
    protects: "Diarreia grave por rotavírus",
    note: "Só para a vacina pentavalente da rede privada.",
  },

  // ── 9 meses ──────────────────────────────────────────────────
  {
    id: "febre-amarela-1",
    vaccineKey: "febre-amarela",
    dose: "Dose inicial",
    ageMonths: 9,
    program: "pni",
    optional: false,
    protects: "Febre amarela",
    note: "O Ceará é área com recomendação de vacinação. Confirme na UBS.",
  },

  // ── 12 meses ─────────────────────────────────────────────────
  {
    id: "hepa-1",
    vaccineKey: "hepa",
    dose: "1ª dose (única no PNI)",
    ageMonths: 12,
    program: "pni",
    optional: false,
    protects: "Hepatite A",
    note: "A SBIm recomenda 2 doses (12 e 18 meses).",
  },
  {
    id: "hepa-2",
    vaccineKey: "hepa",
    dose: "2ª dose (esquema SBIm)",
    ageMonths: 18,
    program: "sbim",
    optional: true,
    protects: "Hepatite A",
  },
  {
    id: "triviral-1",
    vaccineKey: "triviral",
    dose: "1ª dose",
    ageMonths: 12,
    program: "pni",
    optional: false,
    protects: "Sarampo, caxumba, rubéola",
  },
  {
    id: "pneumo10-r1",
    vaccineKey: "pneumo10",
    dose: "Reforço",
    ageMonths: 12,
    program: "pni",
    optional: false,
    protects: "Pneumonia, meningite, otite",
  },
  {
    id: "meningoc-r1",
    vaccineKey: "meningoc",
    dose: "Reforço",
    ageMonths: 12,
    program: "pni",
    optional: false,
    protects: "Meningite meningocócica C",
  },
  {
    id: "meningoc-acwy-r1",
    vaccineKey: "meningoc-acwy",
    dose: "Reforço (esquema SBIm)",
    ageMonths: 12,
    program: "sbim",
    optional: true,
    protects: "Meningite meningocócica A, C, W e Y",
  },

  // ── 15 meses ─────────────────────────────────────────────────
  {
    id: "dtp-r1",
    vaccineKey: "dtp",
    dose: "1º reforço",
    ageMonths: 15,
    program: "pni",
    optional: false,
    protects: "Difteria, tétano, coqueluche",
  },
  {
    id: "vip-r1",
    vaccineKey: "vip",
    dose: "Reforço",
    ageMonths: 15,
    program: "pni",
    optional: false,
    protects: "Poliomielite",
    note: "Desde 2024 o reforço é com a vacina injetável, não mais a oral.",
  },
  {
    id: "varicela-1",
    vaccineKey: "varicela",
    dose: "1ª dose",
    ageMonths: 15,
    program: "pni",
    optional: false,
    protects: "Varicela (catapora)",
    note: "A SBIm recomenda a 1ª dose já aos 12 meses.",
  },

  // ── 4 anos ───────────────────────────────────────────────────
  {
    id: "dtp-r2",
    vaccineKey: "dtp",
    dose: "2º reforço",
    ageMonths: 48,
    program: "pni",
    optional: false,
    protects: "Difteria, tétano, coqueluche",
  },
  {
    id: "triviral-2",
    vaccineKey: "triviral",
    dose: "2ª dose",
    ageMonths: 48,
    program: "pni",
    optional: false,
    protects: "Sarampo, caxumba, rubéola",
  },
  {
    id: "varicela-2",
    vaccineKey: "varicela",
    dose: "2ª dose",
    ageMonths: 48,
    program: "pni",
    optional: false,
    protects: "Varicela (catapora)",
  },
  {
    id: "febre-amarela-r1",
    vaccineKey: "febre-amarela",
    dose: "Reforço",
    ageMonths: 48,
    program: "pni",
    optional: false,
    protects: "Febre amarela",
  },
  {
    id: "meningoc-acwy-r2",
    vaccineKey: "meningoc-acwy",
    dose: "Reforço aos 5 anos (SBIm)",
    ageMonths: 60,
    program: "sbim",
    optional: true,
    protects: "Meningite meningocócica A, C, W e Y",
  },
  {
    id: "dengue-1",
    vaccineKey: "dengue",
    dose: "1ª dose (a partir dos 4 anos)",
    ageMonths: 48,
    program: "sbim",
    optional: true,
    protects: "Dengue",
    note: "Esquema de 3 doses com intervalo de 3 meses.",
  },
  {
    id: "dengue-2",
    vaccineKey: "dengue",
    dose: "2ª dose",
    ageMonths: 51,
    program: "sbim",
    optional: true,
    protects: "Dengue",
  },
  {
    id: "dengue-3",
    vaccineKey: "dengue",
    dose: "3ª dose",
    ageMonths: 54,
    program: "sbim",
    optional: true,
    protects: "Dengue",
  },

  // ── 9 anos (para os irmãos que virão) ────────────────────────
  {
    id: "hpv-1",
    vaccineKey: "hpv",
    dose: "1ª dose",
    ageMonths: 108,
    program: "pni",
    optional: false,
    protects: "HPV",
    note: "Meninas e meninos de 9 a 14 anos. Esquema de dose única no PNI.",
  },
];

/** Consultas de puericultura recomendadas (Sociedade Brasileira de Pediatria). */
export const CHECKUP_VISITS: { id: string; ageMonths: number; title: string }[] = [
  { id: "chk-nasc", ageMonths: 0, title: "Primeira consulta (7–10 dias de vida)" },
  { id: "chk-1m", ageMonths: 1, title: "Puericultura — 1 mês" },
  { id: "chk-2m", ageMonths: 2, title: "Puericultura — 2 meses" },
  { id: "chk-4m", ageMonths: 4, title: "Puericultura — 4 meses" },
  { id: "chk-6m", ageMonths: 6, title: "Puericultura — 6 meses" },
  { id: "chk-9m", ageMonths: 9, title: "Puericultura — 9 meses" },
  { id: "chk-12m", ageMonths: 12, title: "Puericultura — 1 ano" },
  { id: "chk-18m", ageMonths: 18, title: "Puericultura — 18 meses" },
  { id: "chk-24m", ageMonths: 24, title: "Puericultura — 2 anos" },
  { id: "chk-30m", ageMonths: 30, title: "Puericultura — 2 anos e meio" },
  { id: "chk-36m", ageMonths: 36, title: "Puericultura — 3 anos" },
  { id: "chk-48m", ageMonths: 48, title: "Puericultura — 4 anos" },
  { id: "chk-60m", ageMonths: 60, title: "Puericultura — 5 anos" },
];

export type VaccineStatus = "aplicada" | "atrasada" | "agendada" | "futura";

/** Tolerância: considera "em dia" até 30 dias depois da data recomendada. */
const GRACE_DAYS = 30;

export function doseStatus(
  ageMonths: number,
  recommendedAgeMonths: number,
  applied: boolean,
): VaccineStatus {
  if (applied) return "aplicada";
  const toleranceMonths = GRACE_DAYS / 30.4375;
  if (ageMonths > recommendedAgeMonths + toleranceMonths) return "atrasada";
  if (ageMonths >= recommendedAgeMonths - 1) return "agendada";
  return "futura";
}

export const STATUS_LABEL: Record<VaccineStatus, string> = {
  aplicada: "Aplicada",
  atrasada: "Em atraso",
  agendada: "É agora",
  futura: "Futura",
};
