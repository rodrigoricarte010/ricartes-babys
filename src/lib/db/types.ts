/**
 * Camada de persistência.
 *
 * Dois adaptadores implementam a mesma interface `DataSource`:
 *
 *   • `local`    — IndexedDB no navegador. Sem conta, sem servidor, sem custo.
 *                  É o padrão quando não há variáveis do Supabase configuradas.
 *   • `supabase` — Postgres com autenticação e Row Level Security, para
 *                  sincronizar entre aparelhos e compartilhar com a família.
 *
 * Como a troca é por interface, nada na interface conhece o backend. Para
 * migrar de local para nuvem, existe `exportSnapshot` / `importSnapshot`.
 */
import type {
  AppEvent,
  Child,
  DiaryEntry,
  FamilySnapshot,
  Measurement,
} from "@/lib/types";

export interface DataSource {
  readonly kind: "local" | "supabase";

  // ── leitura ──────────────────────────────────────────────────
  listChildren(): Promise<Child[]>;
  listMeasurements(childId: string): Promise<Measurement[]>;
  listEvents(childId: string): Promise<AppEvent[]>;
  listDiary(childId: string): Promise<DiaryEntry[]>;
  getSnapshot(): Promise<FamilySnapshot>;

  // ── escrita ──────────────────────────────────────────────────
  saveChild(child: Child): Promise<Child>;
  deleteChild(id: string): Promise<void>;

  saveMeasurement(measurement: Measurement): Promise<Measurement>;
  deleteMeasurement(id: string): Promise<void>;

  saveEvent(event: AppEvent): Promise<AppEvent>;
  deleteEvent(id: string): Promise<void>;

  saveDiary(entry: DiaryEntry): Promise<DiaryEntry>;
  deleteDiary(id: string): Promise<void>;

  /** Substitui tudo — usado na importação de backup. */
  replaceSnapshot(snapshot: FamilySnapshot): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
