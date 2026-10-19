/**
 * Modelo de domínio.
 *
 * Decisão de projeto: rotina diária (mamada, sono, fralda, remédio…) vive em
 * uma única tabela `events` com `kind` + `payload`. Isso deixa a sincronização
 * trivial (uma tabela, um `updated_at`, delete lógico) e permite acrescentar
 * tipos de registro sem migração. Medição de crescimento fica em tabela própria
 * porque alimenta cálculo estatístico e precisa de colunas tipadas.
 */

export type Sex = "female" | "male";

export const SEX_LABEL: Record<Sex, string> = {
  female: "Menina",
  male: "Menino",
};

export type BloodType = "O+" | "O−" | "A+" | "A−" | "B+" | "B−" | "AB+" | "AB−";
export const BLOOD_TYPES: BloodType[] = ["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"];

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Child {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  nickname: string | null;
  sex: Sex;
  /** yyyy-MM-dd */
  birthDate: string;
  /** HH:mm, opcional */
  birthTime: string | null;
  birthWeightKg: number | null;
  birthLengthCm: number | null;
  birthHeadCm: number | null;
  /** Semanas de gestação ao nascer. < 37 habilita idade corrigida. */
  gestationalWeeks: number | null;
  bloodType: string | null;
  color: string | null;
  photoDataUrl: string | null;
  notes: string | null;
  /** Alturas dos pais (cm) — alvo genético de estatura (Tanner). */
  fatherHeightCm?: number | null;
  motherHeightCm?: number | null;
  /** Cartão de emergência. */
  pediatricianName?: string | null;
  pediatricianPhone?: string | null;
  healthPlan?: string | null;
  emergencyContacts?: EmergencyContact[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MeasurementSource = "nascimento" | "casa" | "consulta";

export interface Measurement {
  id: string;
  childId: string;
  /** ISO 8601 */
  takenAt: string;
  weightKg: number | null;
  lengthCm: number | null;
  headCm: number | null;
  source: MeasurementSource;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EventKind =
  | "feeding"
  | "sleep"
  | "diaper"
  | "medicine"
  | "symptom"
  | "milestone"
  | "vaccine"
  | "appointment"
  | "note";

export type FeedingMethod = "breast" | "bottle" | "solids" | "pump";
export type BreastSide = "left" | "right" | "both";
export type FoodReaction = "none" | "mild" | "strong";

export interface FeedingPayload {
  method: FeedingMethod;
  side?: BreastSide | null;
  amountMl?: number | null;
  food?: string | null;
  isNewFood?: boolean;
  reaction?: FoodReaction | null;
}

export type SleepType = "nap" | "night";

export interface SleepPayload {
  type: SleepType;
  /** 1 = péssimo, 5 = ótimo */
  quality?: number | null;
}

export type DiaperType = "wet" | "dirty" | "both";

export interface DiaperPayload {
  type: DiaperType;
  stoolColor?: string | null;
  stoolTexture?: string | null;
  rash?: boolean;
}

export interface MedicinePayload {
  name: string;
  dose?: string | null;
  route?: string | null;
}

export interface SymptomPayload {
  symptom: string;
  temperatureC?: number | null;
  /** 1 = leve, 2 = moderado, 3 = intenso */
  severity?: number | null;
}

export interface MilestonePayload {
  key: string;
  category: string;
}

export interface VaccinePayload {
  key: string;
  dose: string;
  place?: string | null;
  lot?: string | null;
}

export interface AppointmentPayload {
  title: string;
  doctor?: string | null;
  place?: string | null;
  done?: boolean;
}

export type EventPayload =
  | FeedingPayload
  | SleepPayload
  | DiaperPayload
  | MedicinePayload
  | SymptomPayload
  | MilestonePayload
  | VaccinePayload
  | AppointmentPayload
  | Record<string, never>;

export interface AppEvent {
  id: string;
  childId: string;
  kind: EventKind;
  /** Início do evento, ou data/hora de um registro pontual. */
  startedAt: string;
  endedAt: string | null;
  durationMin: number | null;
  payload: Record<string, unknown>;
  note: string | null;
  /** Data URLs (local) ou caminhos públicos (nuvem). */
  photos: string[];
  createdAt: string;
  updatedAt: string;
  /** Delete lógico — essencial para sincronizar sem ressuscitar registros. */
  deletedAt: string | null;
}

export interface DiaryEntry {
  id: string;
  childId: string;
  /** yyyy-MM-dd */
  date: string;
  title: string | null;
  text: string;
  mood: "otimo" | "bem" | "neutro" | "dificil" | "ruim" | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface GrowthReminder {
  id: string;
  childId: string;
  type: "measurement" | "vaccine" | "appointment";
  dueAt: string;
  done: boolean;
}

/** Papel de um adulto dentro da família. */
export type MemberRole = "admin" | "responsavel" | "cuidador" | "visualizador";

export const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Administrador",
  responsavel: "Responsável",
  cuidador: "Cuidador",
  visualizador: "Somente leitura",
};

export interface Household {
  id: string;
  name: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export type StorageMode = "local" | "cloud";

export interface SyncState {
  mode: StorageMode;
  online: boolean;
  lastSyncedAt: string | null;
  pending: number;
  error: string | null;
}

/** Um bundle completo — é o que exportamos em JSON e o que o modo local guarda. */
export interface FamilySnapshot {
  version: number;
  exportedAt: string;
  familyName: string;
  children: Child[];
  measurements: Measurement[];
  events: AppEvent[];
  diary: DiaryEntry[];
}

export const SNAPSHOT_VERSION = 1;
