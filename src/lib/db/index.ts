"use client";

import { nanoid } from "nanoid";
import type { FamilySnapshot } from "@/lib/types";
import { SNAPSHOT_VERSION } from "@/lib/types";
import { isCloudConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { localDataSource, getLocalMeta, setLocalMeta, clearLocalData } from "./local";

export { clearLocalData };
import { createSupabaseDataSource } from "./supabase";
import type { DataSource } from "./types";
import { StorageError } from "./types";
import {
  buildDemoChild,
  buildDemoDiary,
  buildDemoEvents,
  buildDemoMeasurements,
  DEMO_CHILD_ID,
} from "./seed";

export type { DataSource } from "./types";
export { StorageError } from "./types";

export const newId = () => nanoid(12);

export const nowStamp = () => new Date().toISOString();

/** Adaptador ativo. Criado uma única vez por sessão do navegador. */
let active: DataSource | null = null;

export function getDataSource(): DataSource {
  if (active) return active;
  if (isCloudConfigured) {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      active = createSupabaseDataSource(supabase);
      return active;
    }
  }
  active = localDataSource;
  return active;
}

/** Força a recriação — chamado ao entrar/sair de uma conta. */
export function resetDataSource(): void {
  active = null;
}

export function currentMode(): "local" | "cloud" {
  return getDataSource().kind === "supabase" ? "cloud" : "local";
}

/**
 * Popula o modo local com a família de demonstração na primeira visita.
 * Em modo nuvem não semeamos nada: quem cria conta começa do zero (ou importa
 * um backup) — seria errado encher o banco compartilhado da família.
 */
export async function ensureSeeded(): Promise<boolean> {
  if (currentMode() === "cloud") return false;
  const meta = await getLocalMeta();
  if (meta?.seeded) return false;

  const now = new Date();
  const child = buildDemoChild();
  const ds = localDataSource;
  await ds.saveChild(child);
  for (const m of buildDemoMeasurements(now)) await ds.saveMeasurement(m);
  for (const e of buildDemoEvents(now)) await ds.saveEvent(e);
  for (const d of buildDemoDiary(now)) await ds.saveDiary(d);

  await setLocalMeta({
    seeded: true,
    version: SNAPSHOT_VERSION,
    installedAt: now.toISOString(),
  });
  return true;
}

/** Remove a Rosie Grace de exemplo e marca o armazenamento como não semeado. */
export async function clearDemoData(): Promise<void> {
  await localDataSource.deleteChild(DEMO_CHILD_ID);
  const meta = await getLocalMeta();
  await setLocalMeta({
    seeded: meta?.seeded ?? true,
    version: SNAPSHOT_VERSION,
    installedAt: meta?.installedAt ?? new Date().toISOString(),
    demoRemoved: true,
  });
}

// ── Backup ──────────────────────────────────────────────────────

export function snapshotToBlob(snapshot: FamilySnapshot): Blob {
  return new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
}

export function downloadSnapshot(snapshot: FamilySnapshot): void {
  const blob = snapshotToBlob(snapshot);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ricartes-babys-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Valida um arquivo de backup antes de importar — evita corromper os dados. */
export function parseSnapshot(text: string): FamilySnapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new StorageError("O arquivo não é um JSON válido.");
  }
  if (!raw || typeof raw !== "object") throw new StorageError("Formato de backup não reconhecido.");
  const data = raw as Partial<FamilySnapshot>;
  if (!Array.isArray(data.children)) throw new StorageError("Este backup não tem a lista de crianças.");
  if (typeof data.version !== "number" || data.version > SNAPSHOT_VERSION) {
    throw new StorageError(
      `Versão de backup incompatível (esperada até ${SNAPSHOT_VERSION}, recebida ${data.version}).`,
    );
  }
  return {
    version: data.version,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    familyName: data.familyName ?? "Ricartes",
    children: data.children,
    measurements: data.measurements ?? [],
    events: data.events ?? [],
    diary: data.diary ?? [],
  };
}

/**
 * Exporta em CSV — formato que o pediatra abre em qualquer planilha e que
 * sobrevive a qualquer app. Uma linha por medição, já com z-score omitido
 * (o cálculo depende das tabelas da OMS e é feito na tela).
 */
export function measurementsToCsv(
  childName: string,
  rows: Array<{
    takenAt: string;
    ageDays: number;
    weightKg: number | null;
    lengthCm: number | null;
    headCm: number | null;
    source: string;
    note: string | null;
  }>,
): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["crianca", "data", "idade_em_dias", "peso_kg", "estatura_cm", "perimetro_cefalico_cm", "origem", "observacao"];
  const lines = rows.map((r) =>
    [
      childName,
      new Date(r.takenAt).toISOString().slice(0, 10),
      r.ageDays,
      r.weightKg ?? "",
      r.lengthCm ?? "",
      r.headCm ?? "",
      r.source,
      r.note ?? "",
    ]
      .map(esc)
      .join(";"),
  );
  return [header.join(";"), ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
